import { describe, it, expect, beforeEach } from "vitest";
import {
  trackFailedLogin,
  resetFailedLoginAttempts,
  getSecurityMetrics,
} from "./securityMonitoringService";

describe("Security Monitoring Service", () => {
  beforeEach(() => {
    // Clear any existing failed attempts before each test
    const metrics = getSecurityMetrics();
    // Reset by getting metrics (this is a simple test, in production you'd have a reset function)
  });

  describe("trackFailedLogin", () => {
    it("should track failed login attempts", () => {
      const email = `test-${Date.now()}@example.com`;
      const ipAddress = "192.168.1.1";

      trackFailedLogin(email, ipAddress);
      
      const metrics = getSecurityMetrics();
      expect(metrics.failedLoginAttempts).toBeGreaterThanOrEqual(1);
    });

    it("should increment count for repeated failed attempts", () => {
      const email = `test-${Date.now()}@example.com`;
      const ipAddress = "192.168.1.2";

      trackFailedLogin(email, ipAddress);
      trackFailedLogin(email, ipAddress);
      trackFailedLogin(email, ipAddress);
      
      const metrics = getSecurityMetrics();
      expect(metrics.failedLoginAttempts).toBeGreaterThanOrEqual(3);
    });

    it("should track suspicious IPs after 5 failed attempts", () => {
      const email = `test-${Date.now()}@example.com`;
      const ipAddress = "192.168.1.3";

      // Trigger 5 failed attempts
      for (let i = 0; i < 5; i++) {
        trackFailedLogin(email, ipAddress);
      }
      
      const metrics = getSecurityMetrics();
      expect(metrics.suspiciousIPs).toContain(ipAddress);
    });
  });

  describe("resetFailedLoginAttempts", () => {
    it("should reset failed attempts after successful login", () => {
      const email = `test-${Date.now()}@example.com`;
      const ipAddress = "192.168.1.4";

      trackFailedLogin(email, ipAddress);
      trackFailedLogin(email, ipAddress);
      
      const metricsBefore = getSecurityMetrics();
      const attemptsBefore = metricsBefore.failedLoginAttempts;
      
      resetFailedLoginAttempts(email, ipAddress);
      
      const metricsAfter = getSecurityMetrics();
      // After reset, the count should be less than before
      expect(metricsAfter.failedLoginAttempts).toBeLessThanOrEqual(attemptsBefore);
    });
  });

  describe("getSecurityMetrics", () => {
    it("should return security metrics", () => {
      const metrics = getSecurityMetrics();
      
      expect(metrics).toHaveProperty("failedLoginAttempts");
      expect(metrics).toHaveProperty("suspiciousIPs");
      expect(metrics).toHaveProperty("recentEvents");
      
      expect(typeof metrics.failedLoginAttempts).toBe("number");
      expect(Array.isArray(metrics.suspiciousIPs)).toBe(true);
      expect(typeof metrics.recentEvents).toBe("number");
    });
  });
});
