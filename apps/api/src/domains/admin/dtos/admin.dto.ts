import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// ─── 유저 관리 DTOs ──────────────────────────────────────

export const UpdateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'DELETED']),
});
export class UpdateUserStatusDto extends createZodDto(UpdateUserStatusSchema) {}

export const UpdateUserRoleSchema = z.object({
  role: z.enum(['ADMIN', 'WORKER', 'CLIENT']),
});
export class UpdateUserRoleDto extends createZodDto(UpdateUserRoleSchema) {}

export const UserListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(), // 이메일 또는 이름 검색
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED']).optional(),
  role: z.enum(['ADMIN', 'WORKER', 'CLIENT']).optional(),
});
export class UserListQueryDto extends createZodDto(UserListQuerySchema) {}

// ─── 사업자 서류 심사 DTOs ────────────────────────────────

export const DocumentListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
});
export class DocumentListQueryDto extends createZodDto(
  DocumentListQuerySchema,
) {}

export const RejectDocumentSchema = z.object({
  reason: z.string().min(1, '거절 사유를 입력해주세요'),
});
export class RejectDocumentDto extends createZodDto(RejectDocumentSchema) {}

// ─── 감사 로그 조회 DTOs ──────────────────────────────────

export const AuditLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  action: z
    .enum([
      'CODE_CREATE',
      'CODE_UPDATE',
      'CODE_DELETE',
      'USER_STATUS_CHANGE',
      'USER_ROLE_CHANGE',
      'DOCUMENT_APPROVE',
      'DOCUMENT_REJECT',
    ])
    .optional(),
  adminId: z.string().uuid().optional(),
});
export class AuditLogQueryDto extends createZodDto(AuditLogQuerySchema) {}

// ─── 코드 관리 DTOs ──────────────────────────────────────

export const CreateCodeSchema = z.object({
  code: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[A-Z0-9_]+$/, '코드는 대문자, 숫자, 언더스코어만 허용됩니다'),
  group: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  sortOrder: z.number().int().min(0).default(0),
});
export class CreateCodeDto extends createZodDto(CreateCodeSchema) {}

export const UpdateCodeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  sortOrder: z.number().int().min(0).optional(),
});
export class UpdateCodeDto extends createZodDto(UpdateCodeSchema) {}

export const ReorderCodesSchema = z.object({
  // code → sortOrder 매핑 배열
  items: z.array(
    z.object({
      code: z.string(),
      sortOrder: z.number().int().min(0),
    }),
  ),
});
export class ReorderCodesDto extends createZodDto(ReorderCodesSchema) {}
