import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createTestApp, closeTestApp } from '../utils/app';
import {
  initializeTestDatabase,
  getTestDatabase,
  closeTestDatabase,
  withTransaction,
} from '../utils/database';
import { eq } from 'drizzle-orm';
import {
  users,
  workerProfiles,
  workerFields,
  workerAreas,
} from '@repo/database';

describe('Auth Module - Worker Registration (E2E)', () => {
  let app: NestFastifyApplication;
  let testDb: any;

  beforeAll(async () => {
    // Initialize test database
    testDb = await initializeTestDatabase();

    // Create NestJS app
    app = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(app);
    await closeTestDatabase();
  });

  const sendRequest = async (
    method: string,
    url: string,
    payload?: Record<string, any>,
  ) => {
    const response = await app.inject({
      method,
      url,
      payload: payload ? JSON.stringify(payload) : undefined,
      headers: {
        'content-type': 'application/json',
      },
    });

    return {
      statusCode: response.statusCode,
      body: response.body ? JSON.parse(response.body) : null,
    };
  };

  describe('POST /auth/workers/register', () => {
    it('should return 400 when required fields are missing', async () => {
      const { statusCode, body } = await sendRequest(
        'POST',
        '/auth/workers/register',
        {
          // Missing phoneNumber, businessName, slug, etc.
          businessName: '일부만 입력',
        },
      );

      expect(statusCode).toBe(400);
      expect(body).toHaveProperty('message');
    });

    it('should return 400 when phoneNumber format is invalid', async () => {
      const { statusCode } = await sendRequest(
        'POST',
        '/auth/workers/register',
        {
          phoneNumber: 'invalid-number', // Not digits
          businessName: '테스트',
          slug: 'test-slug',
          fieldCodes: ['FLD_TILE'],
          areaCodes: ['AREA_SEOUL_GN'],
        },
      );

      expect(statusCode).toBe(400);
    });

    it('should return 400 when slug format is invalid', async () => {
      const { statusCode } = await sendRequest(
        'POST',
        '/auth/workers/register',
        {
          phoneNumber: '01012345678',
          businessName: '테스트',
          slug: 'Invalid_Slug', // Contains uppercase
          fieldCodes: ['FLD_TILE'],
          areaCodes: ['AREA_SEOUL_GN'],
        },
      );

      expect(statusCode).toBe(400);
    });

    it('should return 400 when fieldCodes is empty', async () => {
      const { statusCode } = await sendRequest(
        'POST',
        '/auth/workers/register',
        {
          phoneNumber: '01012345678',
          businessName: '테스트',
          slug: 'test-slug',
          fieldCodes: [], // Empty array
          areaCodes: ['AREA_SEOUL_GN'],
        },
      );

      expect(statusCode).toBe(400);
    });

    it('should return 409 when phoneNumber already exists', async () => {
      const testPhoneNumber = '01011111111';

      // First registration should succeed
      await withTransaction(async (tx) => {
        await tx.insert(users).values({
          phoneNumber: testPhoneNumber,
          role: 'WORKER',
          isVerified: false,
        });
      });

      // Second registration with same phoneNumber should fail
      const { statusCode, body } = await sendRequest(
        'POST',
        '/auth/workers/register',
        {
          phoneNumber: testPhoneNumber,
          businessName: '테스트',
          slug: 'test-slug-new',
          fieldCodes: ['FLD_TILE'],
          areaCodes: ['AREA_SEOUL_GN'],
        },
      );

      expect(statusCode).toBe(409);
      expect(body).toHaveProperty('message');
    });

    it('should return 409 when slug already exists', async () => {
      const testSlug = 'existing-slug';

      // First worker registration
      await withTransaction(async (tx) => {
        const [user] = await tx
          .insert(users)
          .values({
            phoneNumber: '01022222222',
            role: 'WORKER',
            isVerified: false,
          })
          .returning();

        await tx.insert(workerProfiles).values({
          userId: user.id,
          slug: testSlug,
          businessName: '테스트',
          isApproved: false,
        });
      });

      // Second registration with same slug should fail
      const { statusCode, body } = await sendRequest(
        'POST',
        '/auth/workers/register',
        {
          phoneNumber: '01033333333',
          businessName: '테스트2',
          slug: testSlug, // Duplicate slug
          fieldCodes: ['FLD_TILE'],
          areaCodes: ['AREA_SEOUL_GN'],
        },
      );

      expect(statusCode).toBe(409);
      expect(body).toHaveProperty('message');
    });

    it('should successfully register a new worker and create all related records', async () => {
      const testPayload = {
        phoneNumber: '01099999999',
        businessName: '김타일 전문공사',
        slug: 'kim-tile-expert',
        fieldCodes: ['FLD_TILE', 'FLD_PAINTING'],
        areaCodes: ['AREA_SEOUL_GN', 'AREA_SEOUL_SC'],
        realName: '김철수',
        email: 'kim@example.com',
      };

      const { statusCode, body } = await sendRequest(
        'POST',
        '/auth/workers/register',
        testPayload,
      );

      expect(statusCode).toBe(201);
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('phoneNumber', testPayload.phoneNumber);
      expect(body).toHaveProperty('role', 'WORKER');
      expect(body.workerProfile).toHaveProperty('id');
      expect(body.workerProfile).toHaveProperty('slug', testPayload.slug);
      expect(body.workerProfile).toHaveProperty(
        'businessName',
        testPayload.businessName,
      );

      // Verify user record in database
      const userId = body.id;
      const userRecords = await testDb
        .select()
        .from(users)
        .where(eq(users.id, userId));
      expect(userRecords).toHaveLength(1);
      expect(userRecords[0].phoneNumber).toBe(testPayload.phoneNumber);
      expect(userRecords[0].email).toBe(testPayload.email);
      expect(userRecords[0].realName).toBe(testPayload.realName);
      expect(userRecords[0].role).toBe('WORKER');

      // Verify worker_profiles record
      const workerProfileId = body.workerProfile.id;
      const profileRecords = await testDb
        .select()
        .from(workerProfiles)
        .where(eq(workerProfiles.id, workerProfileId));
      expect(profileRecords).toHaveLength(1);
      expect(profileRecords[0].slug).toBe(testPayload.slug);
      expect(profileRecords[0].businessName).toBe(testPayload.businessName);
      expect(profileRecords[0].userId).toBe(userId);

      // Verify worker_fields records
      const fieldRecords = await testDb
        .select()
        .from(workerFields)
        .where(eq(workerFields.workerProfileId, workerProfileId));
      expect(fieldRecords).toHaveLength(2);
      const fieldCodes = fieldRecords.map((r) => r.fieldCode).sort();
      expect(fieldCodes).toEqual(['FLD_PAINTING', 'FLD_TILE']);

      // Verify worker_areas records
      const areaRecords = await testDb
        .select()
        .from(workerAreas)
        .where(eq(workerAreas.workerProfileId, workerProfileId));
      expect(areaRecords).toHaveLength(2);
      const areaCodes = areaRecords.map((r) => r.areaCode).sort();
      expect(areaCodes).toEqual(['AREA_SEOUL_GN', 'AREA_SEOUL_SC']);
    });

    it('should successfully register with minimal required fields', async () => {
      const testPayload = {
        phoneNumber: '01077777777',
        businessName: '최소정보등록',
        slug: 'minimal-info',
        fieldCodes: ['FLD_ELECTRIC'],
        areaCodes: ['AREA_SEOUL_GN'],
      };

      const { statusCode, body } = await sendRequest(
        'POST',
        '/auth/workers/register',
        testPayload,
      );

      expect(statusCode).toBe(201);
      expect(body.phoneNumber).toBe(testPayload.phoneNumber);
      expect(body.workerProfile.slug).toBe(testPayload.slug);

      // Verify user record
      const userRecords = await testDb
        .select()
        .from(users)
        .where(eq(users.id, body.id));
      expect(userRecords[0].email).toBeNull();
      expect(userRecords[0].realName).toBeNull();
    });

    it('should allow multiple field codes and area codes', async () => {
      const testPayload = {
        phoneNumber: '01088888888',
        businessName: '다중분야전문가',
        slug: 'multi-field-expert',
        fieldCodes: ['FLD_TILE', 'FLD_PAINTING', 'FLD_PLUMBING'],
        areaCodes: ['AREA_SEOUL_GN', 'AREA_SEOUL_SC', 'AREA_SEOUL_SP'],
        realName: '박다중',
      };

      const { statusCode, body } = await sendRequest(
        'POST',
        '/auth/workers/register',
        testPayload,
      );

      expect(statusCode).toBe(201);
      const workerProfileId = body.workerProfile.id;

      // Verify 3 field codes
      const fieldRecords = await testDb
        .select()
        .from(workerFields)
        .where(eq(workerFields.workerProfileId, workerProfileId));
      expect(fieldRecords).toHaveLength(3);

      // Verify 3 area codes
      const areaRecords = await testDb
        .select()
        .from(workerAreas)
        .where(eq(workerAreas.workerProfileId, workerProfileId));
      expect(areaRecords).toHaveLength(3);
    });
  });
});
