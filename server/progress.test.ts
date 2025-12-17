import { describe, it, expect, beforeAll } from 'vitest';
import * as db from './db';

describe('Compliance Progress Indicators', () => {
  let tenantId: number;
  let locationId: number;
  let staffMemberId: number;
  let serviceUserId: number;

  beforeAll(async () => {
    // Create test tenant
    const tenant = await db.createTenant({
      name: 'Test Progress Care Home',
      slug: 'test-progress-care-home',
      address: '123 Test St',
      telephone: '01234567890',
      email: 'progress@test.com',
    });
    tenantId = tenant.id;

    // Create test location
    const location = await db.createLocation({
      name: 'Test Location',
      address: '123 Test St',
      tenantId,
    });
    locationId = location.id;

    // Create test staff member
    const staff = await db.createStaffMember({
      name: 'Test Staff',
      tenantId,
      locationId,
      role: 'Care Assistant',
      isActive: 1,
    });
    staffMemberId = staff.id;

    // Create test service user
    const serviceUser = await db.createServiceUser({
      name: 'Test Service User',
      tenantId,
      locationId,
      carePackageType: 'Residential Care',
    });
    serviceUserId = serviceUser.id;
  });

  it('should calculate staff compliance progress correctly', async () => {
    const progress = await db.getStaffComplianceProgress(staffMemberId);
    
    expect(progress).toBeDefined();
    expect(progress.total).toBeGreaterThan(0); // Should have staff sections
    expect(progress.completed).toBe(0); // No assessments yet
    expect(progress.percentage).toBe(0);
  });

  it('should calculate service user compliance progress correctly', async () => {
    const progress = await db.getServiceUserComplianceProgress(serviceUserId);
    
    expect(progress).toBeDefined();
    expect(progress.total).toBeGreaterThan(0); // Should have service user sections
    expect(progress.completed).toBe(0); // No assessments yet
    expect(progress.percentage).toBe(0);
  });

  it('should calculate dashboard stats correctly', async () => {
    const stats = await db.getDashboardStats(tenantId);
    
    expect(stats).toBeDefined();
    expect(stats?.overallCompliance).toBe(0); // No assessments yet
    expect(stats?.totalSections).toBeGreaterThan(0);
    expect(stats?.overdueActions).toBe(0);
    expect(stats?.ragStatus).toBeDefined();
    expect(stats?.ragStatus.green).toBe(0);
    expect(stats?.ragStatus.amber).toBe(0);
    expect(stats?.ragStatus.red).toBe(0);
  });

  it('should return correct section counts', async () => {
    const staffProgress = await db.getStaffComplianceProgress(staffMemberId);
    const serviceUserProgress = await db.getServiceUserComplianceProgress(serviceUserId);
    
    // Staff should have 7 sections
    expect(staffProgress.total).toBe(7);
    
    // Service users should have 19 sections
    expect(serviceUserProgress.total).toBe(19);
  });
});
