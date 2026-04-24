import { z } from 'zod';

/**
 * 환경 변수 Zod 스키마
 * 앱 시작 시 검증 — 필수값 누락이면 즉시 crash
 */

// boolean string → boolean 변환 헬퍼
const boolStr = (defaultVal: string) =>
  z
    .string()
    .default(defaultVal)
    .transform((v) => v === 'true');

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'staging', 'production', 'test'])
    .default('development'),

  // ── 데이터베이스 ──────────────────────────────────────────
  DATABASE_URL: z.string().url(),

  // ── JWT ──────────────────────────────────────────────────
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('30d'),

  // ── 이메일 ───────────────────────────────────────────────
  EMAIL_SERVICE: z.enum(['mock', 'nodemailer']).default('mock'),
  EMAIL_HOST: z.string().default('smtp.zoho.com'),
  EMAIL_PORT: z.coerce.number().default(587),
  EMAIL_SECURE: boolStr('false'),
  EMAIL_USER: z.string().default(''),
  EMAIL_PASSWORD: z.string().default(''),
  EMAIL_FROM: z.string().default(''),
  EMAIL_REPLY_TO: z.string().default(''),

  // ── 개발용 코드 노출 (staging/dev 전용) ──────────────────
  EXPOSE_EMAIL_CODE: boolStr('false'),
  EXPOSE_SMS_CODE: boolStr('false'),

  // ── SMS ──────────────────────────────────────────────────
  SMS_PROVIDER: z.enum(['mock', 'coolsms', 'twilio']).default('mock'),
  COOLSMS_FROM_NUMBER: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),

  // ── Google OAuth (선택) ───────────────────────────────────
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z
    .string()
    .url()
    .default('http://localhost:4000/auth/callback/google'),

  // ── Kakao OAuth (선택) ────────────────────────────────────
  KAKAO_CLIENT_ID: z.string().optional(),
  KAKAO_CLIENT_SECRET: z.string().optional(),
  KAKAO_CALLBACK_URL: z
    .string()
    .url()
    .default('http://localhost:4000/auth/callback/kakao'),

  // ── 파일 업로드 ──────────────────────────────────────────
  STORAGE_PATH: z.string().default('./uploads'),
  MEDIA_BASE_URL: z.string().url().default('http://localhost:4000'),

  // ── URL ──────────────────────────────────────────────────
  API_URL: z.string().url().default('http://localhost:4000'),
  APP_URL: z.string().url().default('http://localhost:3000'),

  // ── IMAP 수신함 (선택) ───────────────────────────────────
  IMAP_HOST: z.string().default('imappro.zoho.com'),
  IMAP_PORT: z.coerce.number().default(993),
  IMAP_USER: z.string().default(''),
  IMAP_PASS: z.string().default(''),

  // ── Slack 알림 (선택) ─────────────────────────────────────
  SLACK_WEBHOOK_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;
