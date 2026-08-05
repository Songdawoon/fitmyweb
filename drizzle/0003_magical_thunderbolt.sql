CREATE TABLE "briefs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"token" text NOT NULL,
	"company_name" text,
	"industry" text,
	"phone" text,
	"email" text,
	"purpose" text,
	"pages" text,
	"reference" text,
	"mood" text,
	"logo" text,
	"materials" text,
	"domain" text,
	"launch_date" text,
	"message" text,
	"submitted_at" timestamp with time zone,
	"seen_at" timestamp with time zone,
	"invited_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "briefs" ADD CONSTRAINT "briefs_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "briefs_token_idx" ON "briefs" USING btree ("token");--> statement-breakpoint
CREATE UNIQUE INDEX "briefs_order_idx" ON "briefs" USING btree ("order_id");