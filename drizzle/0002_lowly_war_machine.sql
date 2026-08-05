ALTER TABLE "orders" ADD COLUMN "seen_at" timestamp with time zone;--> statement-breakpoint
-- 이미 처리한 지난 결제까지 "새 결제" 로 뜨면 알림이 첫날부터 무의미해진다.
-- 기존 주문은 접수 시각에 확인한 것으로 본다.
UPDATE "orders" SET "seen_at" = "created_at" WHERE "seen_at" IS NULL;
