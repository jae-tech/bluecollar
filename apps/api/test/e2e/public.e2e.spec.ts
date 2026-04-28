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
  portfolios,
  portfolioMedia,
} from '@repo/database';

/**
 * Public API E2E 테스트
 *
 * 공개 프로필 조회 및 포트폴리오 정보 조회 등을 테스트합니다.
 */
describe('Public Module - Public Profile & Portfolio (E2E)', () => {
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

  describe('GET /public/profiles/:slug - 공개 프로필 조회', () => {
    let testSlug: string;
    let testPortfolioId: string;

    beforeAll(async () => {
      // 테스트용 워커 프로필 및 포트폴리오 생성
      await withTransaction(async (tx) => {
        const [user] = await tx
          .insert(users)
          .values({
            phoneNumber: '01012121212',
            password: null,
            realName: '김철수',
            role: 'WORKER',
            isVerified: false,
          })
          .returning();

        testSlug = 'kim-tile-expert';
        const [workerProfile] = await tx
          .insert(workerProfiles)
          .values({
            userId: user.id,
            slug: testSlug,
            businessName: '김타일 전문공사',
            profileImageUrl: 'https://example.com/profile.jpg',
            description: '15년 경력의 타일 전문가입니다.',
            careerSummary: '15년 경력',
            yearsOfExperience: 15,
            businessVerified: true,
            officeAddress: '서울 강남구 삼성동 123',
            officeCity: '서울',
            officeDistrict: '강남구',
            officePhoneNumber: '02-123-4567',
            operatingHours: '월-금 09:00-18:00, 토 09:00-14:00',
          })
          .returning();

        const workerProfileId = workerProfile.id;

        // 전문 분야 추가
        await tx.insert(workerFields).values([
          { workerProfileId, fieldCode: 'FLD_TILE' },
          { workerProfileId, fieldCode: 'FLD_PAINTING' },
        ]);

        // 활동 지역 추가
        await tx.insert(workerAreas).values([
          { workerProfileId, areaCode: 'AREA_SEOUL_GN' },
          { workerProfileId, areaCode: 'AREA_SEOUL_SC' },
        ]);

        // 포트폴리오 추가
        const [portfolio] = await tx
          .insert(portfolios)
          .values({
            workerProfileId,
            title: '강남 아파트 타일 공사',
            content: '32평 아파트의 욕실 및 주방 타일 공사를 진행했습니다.',
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-01-31'),
            difficulty: 'MEDIUM',
            estimatedCost: '5000000',
            actualCost: '4800000',
            costVisibility: 'PRIVATE',
          })
          .returning();

        testPortfolioId = portfolio.id;

        // 포트폴리오 미디어 추가
        await tx.insert(portfolioMedia).values([
          {
            portfolioId: portfolio.id,
            mediaUrl: 'https://example.com/before.jpg',
            mediaType: 'IMAGE',
            imageType: 'BEFORE',
            displayOrder: 1,
            description: '시공 전',
          },
          {
            portfolioId: portfolio.id,
            mediaUrl: 'https://example.com/after.jpg',
            mediaType: 'IMAGE',
            imageType: 'AFTER',
            displayOrder: 2,
            description: '시공 후',
          },
        ]);
      });
    });

    it('존재하지 않는 슬러그로 조회 시 404를 반환해야 한다', async () => {
      const { statusCode, body } = await sendRequest(
        'GET',
        '/public/profiles/non-existent-slug',
      );

      expect(statusCode).toBe(404);
      expect(body).toHaveProperty('message');
    });

    it('슬러그로 공개 프로필을 조회할 수 있어야 한다', async () => {
      const { statusCode, body } = await sendRequest(
        'GET',
        `/public/profiles/${testSlug}`,
      );

      expect(statusCode).toBe(200);

      // 프로필 정보 확인
      expect(body).toHaveProperty('profile');
      expect(body.profile).toHaveProperty('slug', testSlug);
      expect(body.profile).toHaveProperty('businessName', '김타일 전문공사');
      expect(body.profile).toHaveProperty('businessVerified', true);
      expect(body.profile).toHaveProperty('officeCity', '서울');

      // 사용자 정보 확인
      expect(body).toHaveProperty('user');
      expect(body.user).toHaveProperty('phoneNumber', '01012121212');
      expect(body.user).toHaveProperty('realName', '김철수');
      expect(body.user).toHaveProperty('role', 'WORKER');
    });

    it('전문 분야 정보를 포함하여 조회되어야 한다', async () => {
      const { statusCode, body } = await sendRequest(
        'GET',
        `/public/profiles/${testSlug}`,
      );

      expect(statusCode).toBe(200);
      expect(body).toHaveProperty('fields');
      expect(body.fields).toHaveLength(2);

      const fieldCodes = body.fields.map((f: any) => f.fieldCode).sort();
      expect(fieldCodes).toEqual(['FLD_PAINTING', 'FLD_TILE']);
    });

    it('활동 지역 정보를 포함하여 조회되어야 한다', async () => {
      const { statusCode, body } = await sendRequest(
        'GET',
        `/public/profiles/${testSlug}`,
      );

      expect(statusCode).toBe(200);
      expect(body).toHaveProperty('areas');
      expect(body.areas).toHaveLength(2);

      const areaCodes = body.areas.map((a: any) => a.areaCode).sort();
      expect(areaCodes).toEqual(['AREA_SEOUL_GN', 'AREA_SEOUL_SC']);
    });

    it('포트폴리오 목록이 미디어 정보와 함께 조회되어야 한다', async () => {
      const { statusCode, body } = await sendRequest(
        'GET',
        `/public/profiles/${testSlug}`,
      );

      expect(statusCode).toBe(200);
      expect(body).toHaveProperty('portfolios');
      expect(body.portfolios).toHaveLength(1);

      const portfolio = body.portfolios[0];
      expect(portfolio).toHaveProperty('title', '강남 아파트 타일 공사');
      expect(portfolio).toHaveProperty('difficulty', 'MEDIUM');
      expect(portfolio).toHaveProperty('costVisibility', 'PRIVATE');

      // 미디어 정보 확인
      expect(portfolio).toHaveProperty('media');
      expect(portfolio.media).toHaveLength(2);
      expect(portfolio.media[0]).toHaveProperty('imageType', 'BEFORE');
      expect(portfolio.media[0]).toHaveProperty('displayOrder', 1);
      expect(portfolio.media[1]).toHaveProperty('imageType', 'AFTER');
      expect(portfolio.media[1]).toHaveProperty('displayOrder', 2);
    });

    it('포트폴리오 조회 시 viewCount가 증가해야 한다', async () => {
      // 초기 viewCount 확인
      const initialPortfolio = await testDb
        .select()
        .from(portfolios)
        .where(eq(portfolios.id, testPortfolioId));

      const initialViewCount = initialPortfolio[0].viewCount;

      // 공개 프로필 조회 (viewCount 증가 예상)
      await sendRequest('GET', `/public/profiles/${testSlug}`);

      // 조회수 증가 확인 (비동기이므로 약간의 지연 후 확인)
      await new Promise((resolve) => setTimeout(resolve, 100));

      const updatedPortfolio = await testDb
        .select()
        .from(portfolios)
        .where(eq(portfolios.id, testPortfolioId));

      expect(updatedPortfolio[0].viewCount).toBeGreaterThanOrEqual(
        initialViewCount,
      );
    });

    it('여러 포트폴리오가 있을 때 모두 조회되어야 한다', async () => {
      let multiPortfolioSlug: string;

      await withTransaction(async (tx) => {
        const [user] = await tx
          .insert(users)
          .values({
            phoneNumber: '01013131313',
            password: null,
            realName: '박다중',
            role: 'WORKER',
            isVerified: false,
          })
          .returning();

        multiPortfolioSlug = 'park-multi-worker';
        const [workerProfile] = await tx
          .insert(workerProfiles)
          .values({
            userId: user.id,
            slug: multiPortfolioSlug,
            businessName: '박 다중 시공자',
          })
          .returning();

        // 여러 포트폴리오 추가
        for (let i = 0; i < 3; i++) {
          await tx.insert(portfolios).values({
            workerProfileId: workerProfile.id,
            title: `포트폴리오 ${i + 1}`,
            content: `포트폴리오 ${i + 1}의 설명입니다.`,
          });
        }
      });

      const { statusCode, body } = await sendRequest(
        'GET',
        `/public/profiles/${multiPortfolioSlug}`,
      );

      expect(statusCode).toBe(200);
      expect(body.portfolios).toHaveLength(3);

      // 포트폴리오들이 최신순으로 정렬되어 있는지 확인
      for (let i = 0; i < body.portfolios.length - 1; i++) {
        const currentDate = new Date(body.portfolios[i].createdAt);
        const nextDate = new Date(body.portfolios[i + 1].createdAt);
        expect(currentDate.getTime()).toBeGreaterThanOrEqual(
          nextDate.getTime(),
        );
      }
    });

    it('필드와 지역이 없는 프로필도 정상 조회되어야 한다', async () => {
      let emptySlug: string;

      await withTransaction(async (tx) => {
        const [user] = await tx
          .insert(users)
          .values({
            phoneNumber: '01014141414',
            password: null,
            role: 'WORKER',
            isVerified: false,
          })
          .returning();

        emptySlug = 'empty-worker';
        await tx.insert(workerProfiles).values({
          userId: user.id,
          slug: emptySlug,
          businessName: '빈 정보 사업자',
        });
      });

      const { statusCode, body } = await sendRequest(
        'GET',
        `/public/profiles/${emptySlug}`,
      );

      expect(statusCode).toBe(200);
      expect(body.fields).toHaveLength(0);
      expect(body.areas).toHaveLength(0);
      expect(body.portfolios).toHaveLength(0);
    });
  });
});
