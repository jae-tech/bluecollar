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
    .min(10, '설명은 최소 10자 이상이어야 합니다')
    .max(5000, '설명은 최대 5000자입니다')
    .describe('포트폴리오 상세 설명'),

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
      }),
    )
    .min(1, '최소 1개 이상의 미디어가 필요합니다')
    .max(50, '최대 50개의 미디어까지 추가 가능합니다')
    .describe('포트폴리오 미디어 배열'),
});

export class CreatePortfolioDto extends createZodDto(CreatePortfolioSchema) {}
