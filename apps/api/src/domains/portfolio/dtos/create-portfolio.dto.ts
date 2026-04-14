import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * 포트폴리오 생성 요청 DTO
 *
 * 워커가 시공 사례를 등록할 때 사용합니다.
 * - 프로젝트 제목, 상세 설명, 시공 기간 필수
 * - 이미지 배열은 순서(displayOrder)가 자동으로 부여됩니다.
 * - 미디어 정보: URL, 타입(BEFORE/AFTER/DETAIL)이 필수
 */
export const CreatePortfolioSchema = z.object({
  // 기본 정보
  workerProfileId: z
    .string()
    .uuid({ message: 'Invalid worker profile ID' })
    .describe('워커 프로필 ID (UUID)'),

  title: z
    .string()
    .min(5, '제목은 최소 5자 이상이어야 합니다')
    .max(200, '제목은 최대 200자입니다')
    .describe('포트폴리오 제목'),

  content: z
    .string()
    .max(5000, '설명은 최대 5000자입니다')
    .optional()
    .describe('포트폴리오 상세 설명 (선택)'),

  location: z
    .string()
    .trim()
    .max(200)
    .optional()
    .describe('시공 위치 (자유텍스트)'),

  spaceType: z
    .enum(['RESIDENTIAL', 'COMMERCIAL', 'OTHER'])
    .optional()
    .describe('공간 유형: 주거/상업/기타'),

  constructionScope: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .describe('시공 범위 상세 설명'),

  // 상세 정보 (선택사항)
  details: z
    .object({
      area: z
        .number()
        .positive()
        .max(9999.99)
        .optional()
        .describe('평수 (서비스에서 문자열로 변환)'),
      areaUnit: z
        .enum(['PYEONG', 'SQMETER'])
        .optional()
        .describe('면적 단위: 평/m²'),
      roomType: z.string().max(50).optional().describe('룸 타입'),
      warrantyMonths: z
        .number()
        .int()
        .min(0)
        .max(120)
        .optional()
        .describe('A/S 보증기간 (개월, 최대 10년)'),
      buildingAge: z
        .number()
        .int()
        .min(0)
        .max(100)
        .optional()
        .describe('건물 연식 (경과 연도, 예: 15 = 15년 된 건물)'),
      bathroomCount: z
        .number()
        .int()
        .min(0)
        .max(20)
        .optional()
        .describe('욕실 수'),
      bedroomCount: z
        .number()
        .int()
        .min(0)
        .max(20)
        .optional()
        .describe('침실 수'),
    })
    .optional()
    .describe('시공 상세 정보'),

  // 공간(방) 배열 (선택사항)
  rooms: z
    .array(
      z.object({
        roomType: z
          .enum([
            'LIVING',
            'BATHROOM',
            'KITCHEN',
            'BEDROOM',
            'BALCONY',
            'ENTRANCE',
            'UTILITY',
            'STUDY',
            'OTHER',
          ])
          .describe('방 유형 enum'),

        roomLabel: z
          .string()
          .max(100)
          .optional()
          .describe('방 레이블 (예: 안방, 작은방)'),

        displayOrder: z.number().int().min(0).optional().describe('표시 순서'),
      }),
    )
    .max(20)
    .optional()
    .describe('공간(방) 배열'),

  // 자재/기술 태그 (선택사항) — 구조화된 객체 배열
  tags: z
    .array(
      z.object({
        tagName: z.string().max(50).describe('태그 이름'),

        materialId: z
          .string()
          .uuid()
          .optional()
          .describe('자재 ID (materials 테이블 FK, 선택)'),

        roomId: z
          .string()
          .uuid()
          .optional()
          .describe(
            '공간 ID (portfolioRooms FK, 선택 — rooms 배열 기반 바인딩)',
          ),
      }),
    )
    .max(20)
    .optional()
    .describe('자재/기술 태그 배열'),

  // 시공 기간 (선택사항)
  startDate: z.string().date().optional().describe('시공 시작일 (YYYY-MM-DD)'),

  endDate: z.string().date().optional().describe('시공 완료일 (YYYY-MM-DD)'),

  // 난이도 및 비용 (선택사항)
  difficulty: z
    .enum(['EASY', 'MEDIUM', 'HARD'])
    .optional()
    .describe('난이도: EASY/MEDIUM/HARD'),

  estimatedCost: z.number().positive().optional().describe('예상 비용 (숫자)'),

  actualCost: z.number().positive().optional().describe('실제 비용 (숫자)'),

  costVisibility: z
    .enum(['PUBLIC', 'PRIVATE'])
    .default('PRIVATE')
    .describe('비용 공개 여부: PUBLIC/PRIVATE'),

  // 건물 정보 (선택사항)
  buildingId: z
    .string()
    .uuid()
    .optional()
    .describe('시공 건물 ID (공공 데이터베이스)'),

  // 미디어 배열 (필수) - 최소 1개 이상의 이미지/미디어 필요
  media: z
    .array(
      z.object({
        mediaUrl: z
          .string()
          .url('유효한 URL을 입력하세요')
          .describe('미디어 URL (S3 등)'),

        mediaType: z
          .enum(['IMAGE', 'VIDEO', 'PDF'])
          .describe('미디어 타입: IMAGE/VIDEO/PDF'),

        imageType: z
          .enum(['BEFORE', 'AFTER', 'DETAIL', 'BLUEPRINT'])
          .optional()
          .describe(
            '이미지 타입: BEFORE/AFTER/DETAIL/BLUEPRINT (이미지인 경우만)',
          ),

        description: z.string().max(500).optional().describe('미디어 설명'),

        videoDuration: z
          .number()
          .int()
          .positive()
          .optional()
          .describe('비디오 길이 (초, 비디오인 경우만)'),

        thumbnailUrl: z
          .string()
          .url()
          .optional()
          .describe('비디오 썸네일 URL (비디오인 경우만)'),

        roomId: z
          .string()
          .uuid()
          .optional()
          .describe(
            '공간 ID (portfolioRooms FK, 선택 — rooms 배열 기반 바인딩)',
          ),

        // roomIndex: 프론트에서 rooms 배열 인덱스를 전달, 백엔드가 삽입된 room ID로 변환
        roomIndex: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe('rooms 배열 인덱스 (0-based). roomId 대신 사용 가능.'),
      }),
    )
    .min(1, '최소 1개 이상의 미디어가 필요합니다')
    .max(50, '최대 50개의 미디어까지 추가 가능합니다')
    .describe('포트폴리오 미디어 배열'),
});

export class CreatePortfolioDto extends createZodDto(CreatePortfolioSchema) {}
