CREATE TABLE "quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ref" text NOT NULL,
	"token" text NOT NULL,
	"title" text NOT NULL,
	"note" text,
	"customer_name" text,
	"customer_email" text,
	"customer_phone" text,
	"user_id" uuid,
	"base_label" text DEFAULT '기본 제작비' NOT NULL,
	"base_amount" bigint NOT NULL,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"total" bigint NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"coupons_enabled" boolean DEFAULT false NOT NULL,
	"last_merchant_uid" text,
	"paid_imp_uid" text,
	"paid_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"sent_count" integer DEFAULT 0 NOT NULL,
	"created_by_email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "quote_id" uuid;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "quotes_token_idx" ON "quotes" USING btree ("token");--> statement-breakpoint
CREATE UNIQUE INDEX "quotes_ref_idx" ON "quotes" USING btree ("ref");--> statement-breakpoint
CREATE INDEX "quotes_status_idx" ON "quotes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "quotes_email_idx" ON "quotes" USING btree ("customer_email");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "orders_quote_idx" ON "orders" USING btree ("quote_id") WHERE "orders"."quote_id" is not null;