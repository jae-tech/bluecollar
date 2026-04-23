-- 이용약관 동의 기록 컬럼 추가
-- 사용자가 회원가입 시 동의한 약관 버전과 동의 시각을 저장합니다.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "terms_agreed_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "terms_version" varchar(20);
