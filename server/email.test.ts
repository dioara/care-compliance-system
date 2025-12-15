import { describe, it, expect } from "vitest";
import { validateSendGridConfig } from "./_core/email";

describe("SendGrid Email Configuration", () => {
  it("should have valid SendGrid configuration", () => {
    const result = validateSendGridConfig();
    
    expect(result.valid).toBe(true);
    if (!result.valid) {
      console.error("SendGrid configuration error:", result.error);
    }
  });

  it("should have SENDGRID_API_KEY set", () => {
    const apiKey = process.env.SENDGRID_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).not.toBe("");
  });

  it("should have SENDGRID_API_KEY starting with SG.", () => {
    const apiKey = process.env.SENDGRID_API_KEY;
    expect(apiKey?.startsWith("SG.")).toBe(true);
  });

  it("should have SENDGRID_FROM_EMAIL set", () => {
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;
    expect(fromEmail).toBeDefined();
    expect(fromEmail).not.toBe("");
  });

  it("should have valid email format for SENDGRID_FROM_EMAIL", () => {
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;
    expect(fromEmail?.includes("@")).toBe(true);
  });
});
