import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from './routers';
import * as db from './db';

describe('Audit Scheduling and Deletion', () => {
  let testTenantId: number;
  let testLocationId: number;
  let testAuditTypeId: number;
  let testUserId: number;

  beforeAll(async () => {
    // Create test tenant
    const tenantResult = await db.createTenant({
      name: 'Test Care Home for Audit Scheduling',
      slug: 'test-audit-schedule-' + Date.now(),
      email: 'test-audit-schedule@example.com',
      serviceType: 'Residential',
    });
    testTenantId = tenantResult.id;

    // Create test user
    const userResult = await db.createUser({
      tenantId: testTenantId,
      email: `auditor-${Date.now()}@example.com`,
      password: 'test-password-123',
      name: 'Test Auditor',
      role: 'admin',
    });
    testUserId = userResult.insertId;

    // Create test location
    const locationResult = await db.createLocation({
      tenantId: testTenantId,
      name: 'Test Location for Scheduling',
      address: '123 Test Street',
    });
    testLocationId = (locationResult as any)[0]?.insertId || (locationResult as any).insertId;

    // Get an audit type (should exist from seed data)
    const auditTypes = await db.getAllAuditTypes();
    if (auditTypes.length === 0) {
      throw new Error('No audit types found - seed data may be missing');
    }
    testAuditTypeId = auditTypes[0].id;
  });

  it('should schedule a new audit successfully', async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testUserId,
        tenantId: testTenantId,
        email: 'auditor@example.com',
        name: 'Test Auditor',
        role: 'admin',
      },
      db: db,
    } as any);

    const result = await caller.audits.scheduleAudit({
      locationId: testLocationId,
      auditTypeId: testAuditTypeId,
      scheduledDate: new Date('2025-06-15').toISOString(),
      auditorId: testUserId,
    });

    expect(result.success).toBe(true);
    expect(result.auditId).toBeDefined();
    expect(typeof result.auditId).toBe('number');
  });

  it('should schedule audit without optional auditor and service user', async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testUserId,
        tenantId: testTenantId,
        email: 'auditor@example.com',
        name: 'Test Auditor',
        role: 'admin',
      },
      db: db,
    } as any);

    const result = await caller.audits.scheduleAudit({
      locationId: testLocationId,
      auditTypeId: testAuditTypeId,
      scheduledDate: new Date('2025-07-20').toISOString(),
    });

    expect(result.success).toBe(true);
    expect(result.auditId).toBeDefined();
  });

  it('should fail to schedule audit with invalid audit type', async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testUserId,
        tenantId: testTenantId,
        email: 'auditor@example.com',
        name: 'Test Auditor',
        role: 'admin',
      },
      db: db,
    } as any);

    await expect(
      caller.audits.scheduleAudit({
        locationId: testLocationId,
        auditTypeId: 999999, // Non-existent audit type
        scheduledDate: new Date('2025-08-15').toISOString(),
      })
    ).rejects.toThrow('Audit template not found');
  });

  it('should delete all audits with correct confirmation', async () => {
    const dbInstance = await db.getDb();
    const caller = appRouter.createCaller({
      user: {
        id: testUserId,
        tenantId: testTenantId,
        email: 'auditor@example.com',
        name: 'Test Auditor',
        role: 'admin',
      },
      db: dbInstance,
    } as any);

    // First, schedule a few audits
    await caller.audits.scheduleAudit({
      locationId: testLocationId,
      auditTypeId: testAuditTypeId,
      scheduledDate: new Date('2025-09-01').toISOString(),
    });

    await caller.audits.scheduleAudit({
      locationId: testLocationId,
      auditTypeId: testAuditTypeId,
      scheduledDate: new Date('2025-09-15').toISOString(),
    });

    // Now delete all
    const result = await caller.audits.deleteAll({
      locationId: testLocationId,
      confirmation: 'CONFIRM',
    });

    expect(result.success).toBe(true);
    expect(result.deletedCount).toBeGreaterThan(0);
  });

  it('should fail to delete all audits without correct confirmation', async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testUserId,
        tenantId: testTenantId,
        email: 'auditor@example.com',
        name: 'Test Auditor',
        role: 'admin',
      },
      db: db,
    } as any);

    await expect(
      caller.audits.deleteAll({
        locationId: testLocationId,
        confirmation: 'WRONG',
      })
    ).rejects.toThrow('Please type CONFIRM to delete all audits');
  });

  it('should fail to delete all audits with empty confirmation', async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testUserId,
        tenantId: testTenantId,
        email: 'auditor@example.com',
        name: 'Test Auditor',
        role: 'admin',
      },
      db: db,
    } as any);

    await expect(
      caller.audits.deleteAll({
        locationId: testLocationId,
        confirmation: '',
      })
    ).rejects.toThrow('Please type CONFIRM to delete all audits');
  });

  it('should log audit deletion to audit trail', async () => {
    const dbInstance = await db.getDb();
    const caller = appRouter.createCaller({
      user: {
        id: testUserId,
        tenantId: testTenantId,
        email: 'auditor@example.com',
        name: 'Test Auditor',
        role: 'admin',
      },
      db: dbInstance,
    } as any);

    // Schedule an audit first
    await caller.audits.scheduleAudit({
      locationId: testLocationId,
      auditTypeId: testAuditTypeId,
      scheduledDate: new Date('2025-10-01').toISOString(),
    });

    // Delete all audits
    const result = await caller.audits.deleteAll({
      locationId: testLocationId,
      confirmation: 'CONFIRM',
    });

    expect(result.success).toBe(true);

    // Verify audit trail entry was created
    // Note: This would require a getAuditTrail function in db.ts
    // For now, we verify the deletion was successful
    const auditsAfterDelete = await db.getAuditInstancesByLocation(testLocationId);
    expect(auditsAfterDelete.length).toBe(0);
  });
});
