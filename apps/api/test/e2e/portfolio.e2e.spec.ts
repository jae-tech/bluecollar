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
 * Portfolio E2E 테스트
 *
 * 포트폴리오 생성, 조회, 미디어 저장 등의 전체 흐름을 테스트합니다.
 */
describe('Portfolio Module - Portfolio Management (E2E)', () => {
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

  describe('POST /portfolios - 포트폴리오 생성', () => {
    let testWorkerProfileId: string;

    beforeAll(async () => {
      // 테스트용 워커 프로필 생성
      await withTransaction(async (tx) => {
        const [user] = await tx
          .insert(users)
          .values({
            phoneNumber: '01055555555',
            password: null,
            role: 'WORKER',
            isVerified: false,
          })
          .returning();

        const [workerProfile] = await tx
          .insert(workerProfiles)
          .values({
            userId: user.id,
            slug: 'portfolio-test-worker',
            businessName: '포트폴리오 테스트 사업자',
          })
          .returning();

        testWorkerProfileId = workerProfile.id;
      });
    });

    it('필수 필드 누락 시 400 에러를 반환해야 한다', async () => {
      const { statusCode } = await sendRequest('POST', '/portfolios', {
        workerProfileId: testWorkerProfileId,
        // title 누락
        // content 누락
        media: [
          {
            mediaUrl: 'https://example.com/image.jpg',
            mediaType: 'IMAGE',
            imageType: 'BEFORE',
          },
        ],
      });

      expect(statusCode).toBe(400);
    });

    it('유효하지 않은 워커 프로필 ID로 요청 시 400 에러를 반환해야 한다', async () => {
      const { statusCode } = await sendRequest('POST', '/portfolios', {
        workerProfileId: 'invalid-uuid',
        title: '테스트 포트폴리오',
        content: '이것은 테스트 포트폴리오입니다.',
        media: [
          {
            mediaUrl: 'https://example.com/image.jpg',
            mediaType: 'IMAGE',
            imageType: 'BEFORE',
          },
        ],
      });

      expect(statusCode).toBe(400);
    });

    it('유효하지 않은 URL 형식으로 요청 시 400 에러를 반환해야 한다', async () => {
      const { statusCode } = await sendRequest('POST', '/portfolios', {
        workerProfileId: testWorkerProfileId,
        title: '테스트 포트폴리오',
        content: '이것은 테스트 포트폴리오입니다.',
        media: [
          {
            mediaUrl: 'invalid-url',
            mediaType: 'IMAGE',
            imageType: 'BEFORE',
          },
        ],
      });

      expect(statusCode).toBe(400);
    });

    it('미디어가 없으면 400 에러를 반환해야 한다', async () => {
      const { statusCode } = await sendRequest('POST', '/portfolios', {
        workerProfileId: testWorkerProfileId,
        title: '테스트 포트폴리오',
        content: '이것은 테스트 포트폴리오입니다.',
        media: [],
      });

      expect(statusCode).toBe(400);
    });

    it('성공적으로 포트폴리오를 생성하고 201 상태를 반환해야 한다', async () => {
      const testPayload = {
        workerProfileId: testWorkerProfileId,
        title: '강남 아파트 타일 공사',
        content:
          '강남 래미안 아파트의 욕실 및 주방 타일 공사를 진행했습니다. 고급 도자기 타일을 사용하여 고급스러운 분위기를 연출했습니다.',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        difficulty: 'MEDIUM',
        estimatedCost: 5000000,
        actualCost: 4800000,
        costVisibility: 'PRIVATE',
        media: [
          {
            mediaUrl: 'https://example.com/before.jpg',
            mediaType: 'IMAGE',
            imageType: 'BEFORE',
            description: '시공 전 사진',
          },
          {
            mediaUrl: 'https://example.com/after.jpg',
            mediaType: 'IMAGE',
            imageType: 'AFTER',
            description: '시공 후 사진',
          },
          {
            mediaUrl: 'https://example.com/detail.jpg',
            mediaType: 'IMAGE',
            imageType: 'DETAIL',
            description: '상세 샷',
          },
        ],
      };

      const { statusCode, body } = await sendRequest(
        'POST',
        '/portfolios',
        testPayload,
      );

      expect(statusCode).toBe(201);
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('title', testPayload.title);
      expect(body).toHaveProperty('content', testPayload.content);
      expect(body).toHaveProperty('difficulty', 'MEDIUM');
      expect(body).toHaveProperty('costVisibility', 'PRIVATE');
      expect(body).toHaveProperty('media');
      expect(body.media).toHaveLength(3);

      // 미디어 displayOrder 검증 (1부터 시작)
      expect(body.media[0]).toHaveProperty('displayOrder', 1);
      expect(body.media[1]).toHaveProperty('displayOrder', 2);
      expect(body.media[2]).toHaveProperty('displayOrder', 3);

      // 데이터베이스에 저장되었는지 검증
      const portfolioId = body.id;
      const savedPortfolio = await testDb
        .select()
        .from(portfolios)
        .where(eq(portfolios.id, portfolioId));

      expect(savedPortfolio).toHaveLength(1);
      expect(savedPortfolio[0].title).toBe(testPayload.title);
      expect(savedPortfolio[0].workerProfileId).toBe(testWorkerProfileId);

      // 미디어 데이터 저장 검증
      const savedMedia = await testDb
        .select()
        .from(portfolioMedia)
        .where(eq(portfolioMedia.portfolioId, portfolioId));

      expect(savedMedia).toHaveLength(3);
      expect(savedMedia[0].mediaType).toBe('IMAGE');
      expect(savedMedia[0].imageType).toBe('BEFORE');
      expect(savedMedia[1].imageType).toBe('AFTER');
      expect(savedMedia[2].imageType).toBe('DETAIL');
    });

    it('최소 필드로 포트폴리오를 생성할 수 있어야 한다', async () => {
      const { statusCode, body } = await sendRequest('POST', '/portfolios', {
        workerProfileId: testWorkerProfileId,
        title: '최소 정보 포트폴리오',
        content: '최소 필드로 생성한 포트폴리오입니다.',
        media: [
          {
            mediaUrl: 'https://example.com/minimal.jpg',
            mediaType: 'IMAGE',
          },
        ],
      });

      expect(statusCode).toBe(201);
      expect(body.id).toBeDefined();
      expect(body.title).toBe('최소 정보 포트폴리오');
      expect(body.difficulty).toBeUndefined();
      expect(body.costVisibility).toBe('PRIVATE'); // 기본값
    });

    it('여러 개의 미디어(이미지, 비디오, PDF)를 함께 저장할 수 있어야 한다', async () => {
      const { statusCode, body } = await sendRequest('POST', '/portfolios', {
        workerProfileId: testWorkerProfileId,
        title: '멀티미디어 포트폴리오',
        content: '이미지, 비디오, PDF를 모두 포함한 포트폴리오입니다.',
        media: [
          {
            mediaUrl: 'https://example.com/image.jpg',
            mediaType: 'IMAGE',
            imageType: 'BEFORE',
          },
          {
            mediaUrl: 'https://example.com/video.mp4',
            mediaType: 'VIDEO',
            videoDuration: 120,
            thumbnailUrl: 'https://example.com/thumb.jpg',
          },
          {
            mediaUrl: 'https://example.com/spec.pdf',
            mediaType: 'PDF',
            description: '시공 명세서',
          },
        ],
      });

      expect(statusCode).toBe(201);
      expect(body.media).toHaveLength(3);

      const videoMedia = body.media.find((m: any) => m.mediaType === 'VIDEO');
      expect(videoMedia).toBeDefined();

      const pdfMedia = body.media.find((m: any) => m.mediaType === 'PDF');
      expect(pdfMedia).toBeDefined();
    });
  });

  describe('GET /portfolios/:id - 포트폴리오 상세 조회', () => {
    let testPortfolioId: string;
    let testWorkerProfileId: string;

    beforeAll(async () => {
      // 테스트용 워커 및 포트폴리오 생성
      await withTransaction(async (tx) => {
        const [user] = await tx
          .insert(users)
          .values({
            phoneNumber: '01066666666',
            password: null,
            role: 'WORKER',
            isVerified: false,
          })
          .returning();

        const [workerProfile] = await tx
          .insert(workerProfiles)
          .values({
            userId: user.id,
            slug: 'portfolio-detail-test',
            businessName: '포트폴리오 상세 테스트 사업자',
          })
          .returning();

        testWorkerProfileId = workerProfile.id;

        const [portfolio] = await tx
          .insert(portfolios)
          .values({
            workerProfileId,
            title: '상세 조회 테스트 포트폴리오',
            content: '이 포트폴리오는 상세 조회 테스트용입니다.',
          })
          .returning();

        testPortfolioId = portfolio.id;

        // 미디어 추가
        await tx.insert(portfolioMedia).values([
          {
            portfolioId,
            mediaUrl: 'https://example.com/image1.jpg',
            mediaType: 'IMAGE',
            imageType: 'BEFORE',
            displayOrder: 1,
          },
          {
            portfolioId,
            mediaUrl: 'https://example.com/image2.jpg',
            mediaType: 'IMAGE',
            imageType: 'AFTER',
            displayOrder: 2,
          },
        ]);
      });
    });

    it('포트폴리오 ID로 상세 정보를 조회할 수 있어야 한다', async () => {
      const { statusCode, body } = await sendRequest(
        'GET',
        `/portfolios/${testPortfolioId}`,
      );

      expect(statusCode).toBe(200);
      expect(body).toHaveProperty('id', testPortfolioId);
      expect(body).toHaveProperty('title', '상세 조회 테스트 포트폴리오');
      expect(body).toHaveProperty('media');
      expect(body.media).toHaveLength(2);

      // 미디어 순서 확인 (displayOrder 기준)
      expect(body.media[0].displayOrder).toBe(1);
      expect(body.media[1].displayOrder).toBe(2);
    });

    it('존재하지 않는 포트폴리오 ID로 조회 시 에러를 반환해야 한다', async () => {
      const { statusCode, body } = await sendRequest(
        'GET',
        '/portfolios/invalid-id',
      );

      expect(statusCode).toBe(404);
      expect(body).toHaveProperty('error');
    });
  });

  describe('GET /portfolios/worker/:workerProfileId - 워커 포트폴리오 목록 조회', () => {
    let testWorkerProfileId: string;

    beforeAll(async () => {
      // 테스트용 워커 및 여러 포트폴리오 생성
      await withTransaction(async (tx) => {
        const [user] = await tx
          .insert(users)
          .values({
            phoneNumber: '01077777777',
            password: null,
            role: 'WORKER',
            isVerified: false,
          })
          .returning();

        const [workerProfile] = await tx
          .insert(workerProfiles)
          .values({
            userId: user.id,
            slug: 'portfolio-list-test',
            businessName: '포트폴리오 목록 테스트 사업자',
          })
          .returning();

        testWorkerProfileId = workerProfile.id;

        // 여러 포트폴리오 생성
        for (let i = 0; i < 3; i++) {
          await tx.insert(portfolios).values({
            workerProfileId,
            title: `테스트 포트폴리오 ${i + 1}`,
            content: `포트폴리오 ${i + 1}의 설명입니다.`,
          });
        }
      });
    });

    it('워커의 모든 포트폴리오를 조회할 수 있어야 한다', async () => {
      const { statusCode, body } = await sendRequest(
        'GET',
        `/portfolios/worker/${testWorkerProfileId}`,
      );

      expect(statusCode).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(3);

      // 포트폴리오들이 최신순으로 정렬되어 있는지 확인 (createdAt 역순)
      for (let i = 0; i < body.length - 1; i++) {
        const currentDate = new Date(body[i].createdAt);
        const nextDate = new Date(body[i + 1].createdAt);
        expect(currentDate.getTime()).toBeGreaterThanOrEqual(
          nextDate.getTime(),
        );
      }
    });

    it('각 포트폴리오마다 미디어 정보가 포함되어야 한다', async () => {
      const { statusCode, body } = await sendRequest(
        'GET',
        `/portfolios/worker/${testWorkerProfileId}`,
      );

      expect(statusCode).toBe(200);
      body.forEach((portfolio: any) => {
        expect(portfolio).toHaveProperty('media');
        expect(Array.isArray(portfolio.media)).toBe(true);
      });
    });
  });
});
