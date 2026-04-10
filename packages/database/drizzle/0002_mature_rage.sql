CREATE TYPE "public"."room_type" AS ENUM('LIVING', 'BATHROOM', 'KITCHEN', 'BEDROOM', 'BALCONY', 'ENTRANCE', 'UTILITY', 'STUDY', 'OTHER');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "materials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"brand_name" text,
	"slug" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "materials_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "portfolio_rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"portfolio_id" uuid NOT NULL,
	"room_type" "room_type" NOT NULL,
	"room_label" varchar(100),
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "portfolio_details" ADD COLUMN "building_age" integer;--> statement-breakpoint
ALTER TABLE "portfolio_details" ADD COLUMN "bathroom_count" integer;--> statement-breakpoint
ALTER TABLE "portfolio_details" ADD COLUMN "bedroom_count" integer;--> statement-breakpoint
ALTER TABLE "portfolio_media" ADD COLUMN "room_id" uuid;--> statement-breakpoint
ALTER TABLE "portfolio_media" ADD COLUMN "taken_at" timestamp;--> statement-breakpoint
ALTER TABLE "portfolio_tags" ADD COLUMN "material_id" uuid;--> statement-breakpoint
ALTER TABLE "portfolio_tags" ADD COLUMN "room_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "portfolio_rooms" ADD CONSTRAINT "portfolio_rooms_portfolio_id_portfolios_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_materials_category" ON "materials" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_materials_active" ON "materials" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_portfolio_rooms_portfolio_order" ON "portfolio_rooms" USING btree ("portfolio_id","display_order");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "portfolio_media" ADD CONSTRAINT "portfolio_media_room_id_portfolio_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."portfolio_rooms"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "portfolio_tags" ADD CONSTRAINT "portfolio_tags_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "portfolio_tags" ADD CONSTRAINT "portfolio_tags_room_id_portfolio_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."portfolio_rooms"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
