// CCMS v1.0.1 - Production deployment
import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createCustomContext } from "../customContext";
import { sanitizeError } from "./errorHandler";
import { serveStatic, setupVite } from "./vite";
import { stripeWebhookRouter } from "../stripe/webhook";
// Removed uploadRouter - using tRPC instead

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Trust proxy to get real IP addresses behind reverse proxies
  app.set('trust proxy', 1);
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Cookie parser for auth tokens
  app.use(cookieParser());
  
  // Stripe webhook endpoint (must be before body parser middleware)
  app.use("/api/webhooks/stripe", stripeWebhookRouter);
  
  // File upload endpoints moved to tRPC (aiAuditJobs.submitCarePlanAudit)
  
  // Rate limiting middleware - 100 requests per 15 minutes per IP
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
      error: "Too many requests from this IP, please try again later.",
      retryAfter: "15 minutes"
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // Skip rate limiting for health check endpoint
    skip: (req) => req.path === "/api/trpc/system.health",
  });
  
  // Apply rate limiter to all API routes
  app.use("/api", limiter);
  
  console.log("[SECURITY] Rate limiting enabled: 100 requests per 15 minutes per IP");
  // Staff invitation validation endpoint
  app.get("/api/auth/validate-invitation", async (req, res) => {
    try {
      const token = req.query.token as string;
      if (!token) {
        return res.json({ valid: false, message: "No token provided" });
      }

      const { getStaffInvitationByToken, getTenantById } = await import("../db");
      const invitation = await getStaffInvitationByToken(token);

      if (!invitation) {
        return res.json({ valid: false, message: "Invalid invitation" });
      }

      if (invitation.usedAt) {
        return res.json({ valid: false, message: "This invitation has already been used" });
      }

      if (new Date(invitation.expiresAt) < new Date()) {
        return res.json({ valid: false, message: "This invitation has expired" });
      }

      const tenant = await getTenantById(invitation.tenantId);

      return res.json({
        valid: true,
        invitation: {
          email: invitation.email,
          name: invitation.name,
          companyName: tenant?.name || "Unknown Company",
        },
      });
    } catch (error) {
      console.error("Error validating invitation:", error);
      return res.json({ valid: false, message: "Failed to validate invitation" });
    }
  });

  // Staff invitation acceptance endpoint
  app.post("/api/auth/accept-invitation", async (req, res) => {
    try {
      const { token, name, password } = req.body;

      if (!token || !name || !password) {
        return res.json({ success: false, message: "Missing required fields" });
      }

      const { getStaffInvitationByToken, markInvitationUsed, createUser, setUserRoles } = await import("../db");
      const invitation = await getStaffInvitationByToken(token);

      if (!invitation) {
        return res.json({ success: false, message: "Invalid invitation" });
      }

      if (invitation.usedAt) {
        return res.json({ success: false, message: "This invitation has already been used" });
      }

      if (new Date(invitation.expiresAt) < new Date()) {
        return res.json({ success: false, message: "This invitation has expired" });
      }

      // Create the user account
      const result = await createUser({
        tenantId: invitation.tenantId,
        email: invitation.email,
        name,
        password,
        superAdmin: 0,
      });

      const userId = (result as any).insertId;

      // Assign roles if specified
      if (invitation.roleIds) {
        try {
          const roleIds = JSON.parse(invitation.roleIds);
          if (Array.isArray(roleIds) && roleIds.length > 0) {
            await setUserRoles(userId, roleIds);
          }
        } catch (e) {
          console.error("Error parsing role IDs:", e);
        }
      }

      // Mark invitation as used
      await markInvitationUsed(token);

      return res.json({ success: true, message: "Account created successfully" });
    } catch (error: any) {
      console.error("Error accepting invitation:", error);
      return res.json({ success: false, message: error.message || "Failed to create account" });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext: createCustomContext,
      onError: ({ error, type, path }) => {
        // Log error server-side
        console.error(`[tRPC Error] ${type} at ${path}:`, error);
        
        // Error sanitization is handled by returning sanitized error
        // The error formatter will use this
      },
      // Sanitize all errors before sending to client
      responseMeta: () => {
        return {
          headers: {
            // Security headers
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
          },
        };
      },
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    
    // Initialize cron job scheduler
    import("../jobs/scheduler").then(({ initializeScheduler }) => {
      initializeScheduler();
    }).catch(error => {
      console.error("Failed to initialize scheduler:", error);
    });
    
    // Start background job worker for AI audits
    import("../job-worker").then(({ startJobWorker }) => {
      startJobWorker();
    }).catch(error => {
      console.error("Failed to start job worker:", error);
    });
  });
}

startServer().catch(console.error);
