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

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: number;
        email: string;
        tenantId: number;
        role: string;
      };

      // Get user from database
      user = await db.getUserById(decoded.userId);
    }
  } catch (error) {
    // Token invalid or expired, user stays null
    console.log("[Auth] Token verification failed:", error);
  }

  return {
    req,
    res,
    user,
  };
}
