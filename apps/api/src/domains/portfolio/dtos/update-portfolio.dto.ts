import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * 포트폴리오 수정 요청 DTO
 *
 * 기존 포트폴리오의 제목, 설명, 미디어 등을 부분 업데이트합니다.
 * - 모든 필드는 선택사항 (partial update)
 * - 미디어 업데이트 시 기존 미디어는 모두 교체됩니다
 */
export const UpdatePortfolioSchema = z
  .object({
    // 기본 정보 (선택사항)
    title: z
      .string()
      .min(5, '제목은 최소 5자 이상이어야 합니다')
      .max(200, '제목은 최대 200자입니다')
      .optional()
      .describe('포트폴리오 제목'),

    content: z
      .string()
      .max(5000, '설명은 최대 5000자입니다')
      .optional()
      .describe('포트폴리오 상세 설명'),

    location: z.string().trim().max(200).optional().describe('시공 위치'),

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

    details: z
      .object({
        area: z.number().positive().max(9999.99).optional(),
        areaUnit: z.enum(['PYEONG', 'SQMETER']).optional(),
        roomType: z.string().max(50).optional(),
        warrantyMonths: z.number().int().min(0).max(120).optional(),
      })
      .optional()
      .describe('시공 상세 정보'),

    // tags: undefined = 변경없음, [] = 전체삭제, [...] = 교체
    tags: z
      .array(z.string().max(50))
      .max(20)
      .optional()
      .describe('자재/기술 태그 배열 (제공 시 전체 교체)'),

    // 시공 기간 (선택사항)
    startDate: z
      .string()
      .date()
      .optional()
      .describe('시공 시작일 (YYYY-MM-DD)'),

    endDate: z.string().date().optional().describe('시공 완료일 (YYYY-MM-DD)'),

    // 난이도 및 비용 (선택사항)
    difficulty: z
      .enum(['EASY', 'MEDIUM', 'HARD'])
      .optional()
      .describe('난이도: EASY/MEDIUM/HARD'),

    estimatedCost: z
      .number()
      .positive()
      .optional()
      .describe('예상 비용 (숫자)'),

    actualCost: z.number().positive().optional().describe('실제 비용 (숫자)'),

    costVisibility: z
      .enum(['PUBLIC', 'PRIVATE'])
      .optional()
      .describe('비용 공개 여부: PUBLIC/PRIVATE'),

    // 건물 정보 (선택사항)
    buildingId: z
      .string()
      .uuid()
      .optional()
      .describe('시공 건물 ID (공공 데이터베이스)'),

    // 미디어 배열 (선택사항) - 제공 시 기존 미디어 전체 교체
    media: z
      .array(
        z.object({
          mediaUrl: z
            .string()
            .url('유효한 URL을 입력하세요')
            .describe('미디어 URL'),

          mediaType: z
            .enum(['IMAGE', 'VIDEO', 'PDF'])
            .describe('미디어 타입: IMAGE/VIDEO/PDF'),

          imageType: z
            .enum(['BEFORE', 'AFTER', 'DETAIL', 'BLUEPRINT'])
            .optional()
            .describe('이미지 타입 (이미지인 경우만)'),

          description: z.string().max(500).optional().describe('미디어 설명'),

          videoDuration: z
            .number()
            .int()
            .positive()
            .optional()
            .describe('비디오 길이 (초)'),

          thumbnailUrl: z
            .string()
            .url()
            .optional()
            .describe('비디오 썸네일 URL'),
        }),
      )
      .min(1, '미디어를 업데이트할 경우 최소 1개 이상이어야 합니다')
      .max(50, '최대 50개의 미디어까지 가능합니다')
      .optional()
      .describe('포트폴리오 미디어 배열 (제공 시 기존 미디어 전체 교체)'),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: '적어도 하나의 필드를 제공해야 합니다',
  });

export class UpdatePortfolioDto extends createZodDto(UpdatePortfolioSchema) {}
