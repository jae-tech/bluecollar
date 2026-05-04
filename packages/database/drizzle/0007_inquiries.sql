-- 의뢰 상태 열거형 생성
CREATE TYPE "public"."inquiry_status" AS ENUM('PENDING', 'READ', 'REPLIED', 'ACCEPTED', 'DECLINED', 'CANCELLED');

-- inquiries 테이블 생성
CREATE TABLE "inquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"worker_profile_id" uuid NOT NULL,
	"client_user_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"phone" varchar(30) NOT NULL,
	"location" varchar(200) NOT NULL,
	"work_type" varchar(100) NOT NULL,
	"budget" varchar(100),
	"message" text,
	"project_title" varchar(200),
	"status" "inquiry_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- 외래키 제약 조건
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_worker_profile_id_worker_profiles_id_fk" FOREIGN KEY ("worker_profile_id") REFERENCES "public"."worker_profiles"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_client_user_id_users_id_fk" FOREIGN KEY ("client_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

-- 성능 인덱스
CREATE INDEX "idx_inquiries_worker_created" ON "inquiries" USING btree ("worker_profile_id","created_at");
CREATE INDEX "idx_inquiries_client_created" ON "inquiries" USING btree ("client_user_id","created_at");
CREATE INDEX "idx_inquiries_rate_limit" ON "inquiries" USING btree ("client_user_id","worker_profile_id","created_at");
