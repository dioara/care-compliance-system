import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { CustomContext } from "./customContext";
import * as db from "./db";

function createMockContext(): CustomContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
      cookies: {},
    } as any,
    res: {
      cookie: () => {},
      clearCookie: () => {},
    } as any,
  };
}

describe("Custom Authentication", () => {
  it("should register a new user and company", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.register({
      email: `test-${Date.now()}@example.com`,
      password: "password123",
      name: "Test User",
      companyName: "Test Company",
      companyAddress: "123 Test St",
      companyTelephone: "123-456-7890",
    });

    expect(result.success).toBe(true);
    expect(result.userId).toBeDefined();
    expect(result.tenantId).toBeDefined();
  });

  it("should not allow duplicate email registration", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const email = `duplicate-${Date.now()}@example.com`;

    // First registration
    await caller.auth.register({
      email,
      password: "password123",
      name: "Test User",
      companyName: "Test Company",
    });

    // Second registration with same email should fail
    await expect(
      caller.auth.register({
        email,
        password: "password456",
        name: "Another User",
        companyName: "Another Company",
      })
    ).rejects.toThrow("User with this email already exists");
  });

  it("should return null for unauthenticated user", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("should verify password correctly", async () => {
    const plainPassword = "testpassword123";
    const user = await db.createUser({
      email: `verify-${Date.now()}@example.com`,
      password: plainPassword,
      name: "Test User",
    });

    const dbUser = await db.getUserById(user.id);
    expect(dbUser).toBeDefined();

    const isValid = await db.verifyPassword(plainPassword, dbUser!.password);
    expect(isValid).toBe(true);

    const isInvalid = await db.verifyPassword("wrongpassword", dbUser!.password);
    expect(isInvalid).toBe(false);
  });
});
