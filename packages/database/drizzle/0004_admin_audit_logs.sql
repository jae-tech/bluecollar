-- 관리자 감사 로그 테이블 생성
-- 코드값 변경, 유저 상태/역할 변경 이력을 기록합니다.
CREATE TABLE IF NOT EXISTS "admin_audit_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "admin_id" uuid NOT NULL REFERENCES "users"("id"),
  "action" varchar(50) NOT NULL,
  "target_type" varchar(50) NOT NULL,
  "target_id" varchar(100) NOT NULL,
  "before" text,
  "after" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_audit_logs_admin" ON "admin_audit_logs" ("admin_id");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_target" ON "admin_audit_logs" ("target_type", "target_id");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_created_at" ON "admin_audit_logs" ("created_at");
