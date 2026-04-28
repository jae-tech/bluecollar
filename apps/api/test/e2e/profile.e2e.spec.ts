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

/**
 * Profile E2E 테스트
 *
 * 워커 프로필의 전문 분야 및 활동 지역 업데이트, 조회 등을 테스트합니다.
 */
describe('Profile Module - Worker Profile Management (E2E)', () => {
  let app: NestFastifyApplication;
  let testDb: any;

  beforeAll(async () => {
    // 테스트 데이터베이스 초기화
    testDb = await initializeTestDatabase();

    // NestJS 앱 생성
    app = await createTestApp();
  }, 120_000);

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

  describe('PATCH /workers/profile/:workerProfileId - 워커 프로필 업데이트', () => {
    let testWorkerProfileId: string;

    beforeAll(async () => {
      // 테스트용 워커 프로필 생성 (초기 필드 및 지역 포함)
      await withTransaction(async (tx) => {
        const [user] = await tx
          .insert(users)
          .values({
            phoneNumber: '01088888888',
            password: null,
            role: 'WORKER',
            isVerified: false,
          })
          .returning();

        const [workerProfile] = await tx
          .insert(workerProfiles)
          .values({
            userId: user.id,
            slug: 'profile-update-test',
            businessName: '프로필 업데이트 테스트 사업자',
          })
          .returning();

        testWorkerProfileId = workerProfile.id;

        // 초기 필드 및 지역 추가
        await tx.insert(workerFields).values([
          { workerProfileId, fieldCode: 'FLD_TILE' },
          { workerProfileId, fieldCode: 'FLD_PAINTING' },
        ]);

        await tx
          .insert(workerAreas)
          .values([{ workerProfileId, areaCode: 'AREA_SEOUL_GN' }]);
      });
    });

    it('필수 필드가 없으면 400 에러를 반환해야 한다', async () => {
      const { statusCode } = await sendRequest(
        'PATCH',
        `/workers/profile/${testWorkerProfileId}`,
        {
          // fieldCodes와 areaCodes 모두 없음
        },
      );

      expect(statusCode).toBe(400);
    });

    it('전문 분야를 성공적으로 업데이트할 수 있어야 한다', async () => {
      const { statusCode, body } = await sendRequest(
        'PATCH',
        `/workers/profile/${testWorkerProfileId}`,
        {
          fieldCodes: ['FLD_ELECTRIC', 'FLD_PLUMBING'],
          // areaCodes는 제공하지 않음
        },
      );

      expect(statusCode).toBe(200);
      expect(body).toHaveProperty('workerProfileId', testWorkerProfileId);
      expect(body).toHaveProperty('fields');
      expect(body.fields).toHaveLength(2);

      const fieldCodes = body.fields.map((f: any) => f.fieldCode).sort();
      expect(fieldCodes).toEqual(['FLD_ELECTRIC', 'FLD_PLUMBING']);

      // 데이터베이스에서 확인
      const savedFields = await testDb
        .select()
        .from(workerFields)
        .where(eq(workerFields.workerProfileId, testWorkerProfileId));

      expect(savedFields).toHaveLength(2);
      expect(savedFields.map((f) => f.fieldCode).sort()).toEqual([
        'FLD_ELECTRIC',
        'FLD_PLUMBING',
      ]);
    });

    it('활동 지역을 성공적으로 업데이트할 수 있어야 한다', async () => {
      const { statusCode, body } = await sendRequest(
        'PATCH',
        `/workers/profile/${testWorkerProfileId}`,
        {
          areaCodes: ['AREA_SEOUL_SC', 'AREA_SEOUL_SP'],
          // fieldCodes는 제공하지 않음 (기존 데이터 유지)
        },
      );

      expect(statusCode).toBe(200);
      expect(body).toHaveProperty('areas');
      expect(body.areas).toHaveLength(2);

      const areaCodes = body.areas.map((a: any) => a.areaCode).sort();
      expect(areaCodes).toEqual(['AREA_SEOUL_SC', 'AREA_SEOUL_SP']);

      // 데이터베이스에서 확인
      const savedAreas = await testDb
        .select()
        .from(workerAreas)
        .where(eq(workerAreas.workerProfileId, testWorkerProfileId));

      expect(savedAreas).toHaveLength(2);
      expect(savedAreas.map((a) => a.areaCode).sort()).toEqual([
        'AREA_SEOUL_SC',
        'AREA_SEOUL_SP',
      ]);
    });

    it('전문 분야와 활동 지역을 함께 업데이트할 수 있어야 한다', async () => {
      const { statusCode, body } = await sendRequest(
        'PATCH',
        `/workers/profile/${testWorkerProfileId}`,
        {
          fieldCodes: ['FLD_TILE', 'FLD_PAINTING', 'FLD_ELECTRIC'],
          areaCodes: ['AREA_SEOUL_GN', 'AREA_SEOUL_SC'],
        },
      );

      expect(statusCode).toBe(200);
      expect(body.fields).toHaveLength(3);
      expect(body.areas).toHaveLength(2);

      // 데이터베이스에서 확인
      const savedFields = await testDb
        .select()
        .from(workerFields)
        .where(eq(workerFields.workerProfileId, testWorkerProfileId));

      const savedAreas = await testDb
        .select()
        .from(workerAreas)
        .where(eq(workerAreas.workerProfileId, testWorkerProfileId));

      expect(savedFields).toHaveLength(3);
      expect(savedAreas).toHaveLength(2);
    });

    it('빈 배열로 업데이트하면 기존 데이터가 삭제되어야 한다', async () => {
      const { statusCode, body } = await sendRequest(
        'PATCH',
        `/workers/profile/${testWorkerProfileId}`,
        {
          fieldCodes: [],
          // areaCodes는 유지
        },
      );

      expect(statusCode).toBe(200);
      expect(body.fields).toHaveLength(0);

      // 데이터베이스에서 확인 - 필드는 없어야 함
      const savedFields = await testDb
        .select()
        .from(workerFields)
        .where(eq(workerFields.workerProfileId, testWorkerProfileId));

      expect(savedFields).toHaveLength(0);
    });

    it('유효하지 않은 워커 프로필 ID로 요청 시 400 에러를 반환해야 한다', async () => {
      const { statusCode } = await sendRequest(
        'PATCH',
        '/workers/profile/invalid-uuid',
        {
          fieldCodes: ['FLD_TILE'],
        },
      );

      expect(statusCode).toBe(400);
    });

    it('존재하지 않는 워커 프로필 ID로 요청 시 400 에러를 반환해야 한다', async () => {
      const { statusCode, body } = await sendRequest(
        'PATCH',
        '/workers/profile/00000000-0000-0000-0000-000000000000',
        {
          fieldCodes: ['FLD_TILE'],
        },
      );

      expect(statusCode).toBe(400);
      expect(body).toHaveProperty('message');
    });
  });

  describe('GET /workers/profile/:workerProfileId - 워커 프로필 조회', () => {
    let testWorkerProfileId: string;

    beforeAll(async () => {
      // 테스트용 워커 프로필 생성
      await withTransaction(async (tx) => {
        const [user] = await tx
          .insert(users)
          .values({
            phoneNumber: '01099999999',
            password: null,
            role: 'WORKER',
            isVerified: false,
          })
          .returning();

        const [workerProfile] = await tx
          .insert(workerProfiles)
          .values({
            userId: user.id,
            slug: 'profile-get-test',
            businessName: '프로필 조회 테스트 사업자',
            careerSummary: '10년 경력의 타일 전문가',
            yearsOfExperience: 10,
          })
          .returning();

        testWorkerProfileId = workerProfile.id;

        // 필드 및 지역 추가
        await tx.insert(workerFields).values([
          { workerProfileId, fieldCode: 'FLD_TILE' },
          { workerProfileId, fieldCode: 'FLD_PAINTING' },
        ]);

        await tx.insert(workerAreas).values([
          { workerProfileId, areaCode: 'AREA_SEOUL_GN' },
          { workerProfileId, areaCode: 'AREA_SEOUL_SC' },
        ]);
      });
    });

    it('워커 프로필을 전문 분야 및 활동 지역과 함께 조회할 수 있어야 한다', async () => {
      const { statusCode, body } = await sendRequest(
        'GET',
        `/workers/profile/${testWorkerProfileId}`,
      );

      expect(statusCode).toBe(200);
      expect(body).toHaveProperty('id', testWorkerProfileId);
      expect(body).toHaveProperty('slug', 'profile-get-test');
      expect(body).toHaveProperty('businessName', '프로필 조회 테스트 사업자');
      expect(body).toHaveProperty('careerSummary', '10년 경력의 타일 전문가');
      expect(body).toHaveProperty('yearsOfExperience', 10);

      // 필드 확인
      expect(body).toHaveProperty('fields');
      expect(body.fields).toHaveLength(2);
      const fieldCodes = body.fields.map((f: any) => f.fieldCode).sort();
      expect(fieldCodes).toEqual(['FLD_PAINTING', 'FLD_TILE']);

      // 지역 확인
      expect(body).toHaveProperty('areas');
      expect(body.areas).toHaveLength(2);
      const areaCodes = body.areas.map((a: any) => a.areaCode).sort();
      expect(areaCodes).toEqual(['AREA_SEOUL_GN', 'AREA_SEOUL_SC']);
    });

    it('존재하지 않는 워커 프로필 ID로 조회 시 404를 반환해야 한다', async () => {
      const { statusCode, body } = await sendRequest(
        'GET',
        '/workers/profile/00000000-0000-0000-0000-000000000000',
      );

      expect(statusCode).toBe(404);
      expect(body).toHaveProperty('error');
    });

    it('필드 또는 지역이 없는 프로필도 정상적으로 조회되어야 한다', async () => {
      // 필드와 지역이 없는 프로필 생성
      let emptyProfileId: string;
      await withTransaction(async (tx) => {
        const [user] = await tx
          .insert(users)
          .values({
            phoneNumber: '01011112222',
            password: null,
            role: 'WORKER',
            isVerified: false,
          })
          .returning();

        const [workerProfile] = await tx
          .insert(workerProfiles)
          .values({
            userId: user.id,
            slug: 'empty-profile',
            businessName: '필드 없는 사업자',
          })
          .returning();

        emptyProfileId = workerProfile.id;
      });

      const { statusCode, body } = await sendRequest(
        'GET',
        `/workers/profile/${emptyProfileId}`,
      );

      expect(statusCode).toBe(200);
      expect(body.fields).toHaveLength(0);
      expect(body.areas).toHaveLength(0);
    });
  });
});
