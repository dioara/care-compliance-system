import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import * as db from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export type CustomContext = {
  req: Request;
  res: Response;
  user: Awaited<ReturnType<typeof db.getUserById>> | null;
};

export async function createCustomContext({
  req,
  res,
}: {
  req: Request;
  res: Response;
}): Promise<CustomContext> {
  let user = null;

  try {
    // Try to get token from cookie
    const token = req.cookies?.auth_token;
    console.log("[AUTH] Checking authentication - Cookie present:", !!token);
    console.log("[AUTH] All cookies:", Object.keys(req.cookies || {}));

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: number;
        email: string;
        tenantId: number;
        role: string;
      };

      console.log("[AUTH] Token decoded successfully for user:", decoded.email);

      // Get user from database
      user = await db.getUserById(decoded.userId);
      
      if (user) {
        console.log("[AUTH] User authenticated:", user.email);
      } else {
        console.log("[AUTH] User not found in database for ID:", decoded.userId);
      }
    } else {
      console.log("[AUTH] No auth_token cookie found");
    }
  } catch (error) {
    // Token invalid or expired, user stays null
    console.log("[AUTH] Token verification failed:", error);
  }

  return {
    req,
    res,
    user,
  };
}
