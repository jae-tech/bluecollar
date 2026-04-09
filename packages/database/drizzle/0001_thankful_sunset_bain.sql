ALTER TABLE "portfolio_details" ALTER COLUMN "room_type" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "portfolios" ALTER COLUMN "content" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "portfolio_details" ADD COLUMN "warranty_months" integer;--> statement-breakpoint
ALTER TABLE "portfolios" ADD COLUMN "location" varchar(200);--> statement-breakpoint
ALTER TABLE "portfolios" ADD COLUMN "space_type" varchar(50);--> statement-breakpoint
ALTER TABLE "portfolios" ADD COLUMN "construction_scope" text;--> statement-breakpoint
ALTER TABLE "portfolio_details" ADD CONSTRAINT "portfolio_details_portfolio_id_unique" UNIQUE("portfolio_id");