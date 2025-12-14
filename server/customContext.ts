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
    // Try to get token from Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    console.log("[AUTH] Checking authentication - Token present:", !!token);
    console.log("[AUTH] Authorization header:", authHeader ? 'present' : 'missing');

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
      console.log("[AUTH] No token found in Authorization header");
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
