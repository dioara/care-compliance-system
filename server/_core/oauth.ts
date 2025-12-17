import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

// Manus OAuth removed - using traditional email/password authentication
export function registerOAuthRoutes(app: Express) {
  // OAuth callback disabled - redirect to login page
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    res.redirect(302, "/login");
  });
}
