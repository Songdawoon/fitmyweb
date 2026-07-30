import {
  bigint,
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * 소셜 로그인 사용자.
 *
 * 세션은 JWT 라 별도의 sessions 테이블이 없다. provider + providerAccountId
 * 조합이 계정의 진짜 식별자이고, 이메일은 같은 사람이 구글·카카오를 각각
 * 쓰면 중복될 수 있어 유니크로 걸지 않는다.
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: text("provider").notNull(), // "google" | "kakao"
    providerAccountId: text("provider_account_id").notNull(),
    email: text("email"),
    name: text("name"),
    image: text("image"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    providerAccountIdx: uniqueIndex("users_provider_account_idx").on(
      t.provider,
      t.providerAccountId,
    ),
    emailIdx: index("users_email_idx").on(t.email),
  }),
);

/**
 * 계정에 저장되는 쿠폰. kind 는 "event"(이벤트 쿠폰)와 "signup"(회원가입 쿠폰)
 * 두 가지이며, 계정당 종류별 1장만 발급되도록 유니크 인덱스가 막는다.
 * 두 쿠폰은 한 결제에 함께 적용할 수 있고, 사용 처리는 결제 확정 시 자동으로 된다.
 *
 * 이벤트 쿠폰은 비회원도 공개 코드(EVENT_COUPON_CODE)로 쓸 수 있어, 여기에
 * 행이 없는 결제 건도 존재한다.
 */
export const coupons = pgTable(
  "coupons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    kind: text("kind").notNull(), // "event" | "signup"
    amount: integer("amount").notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    codeIdx: uniqueIndex("coupons_code_idx").on(t.code),
    // 같은 종류의 쿠폰은 한 사람에게 한 번만 — 종류별 중복 발급 방지.
    userKindIdx: uniqueIndex("coupons_user_kind_idx").on(t.userId, t.kind),
  }),
);

/**
 * 결제 주문. 포트원에서 검증된 건만 기록한다.
 * 브라우저 콜백과 웹훅이 같은 결제를 두 번 보고할 수 있어 impUid 가 유니크다.
 */
export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // 비로그인 결제도 허용하므로 nullable — 이메일로 나중에 이어붙일 수 있다.
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    impUid: text("imp_uid").notNull(),
    merchantUid: text("merchant_uid").notNull(),
    planId: text("plan_id").notNull(),
    planName: text("plan_name").notNull(),
    amount: bigint("amount", { mode: "number" }).notNull(),
    source: text("source").notNull(), // "client" | "webhook"
    customerName: text("customer_name"),
    customerEmail: text("customer_email"),
    customerPhone: text("customer_phone"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    impUidIdx: uniqueIndex("orders_imp_uid_idx").on(t.impUid),
    userIdx: index("orders_user_idx").on(t.userId),
    emailIdx: index("orders_email_idx").on(t.customerEmail),
  }),
);

/**
 * 상담 신청. 기존에는 메일만 남겼으나, 고객이 마이페이지에서 진행 상황을
 * 확인할 수 있도록 함께 저장한다. mailed 는 알림 메일 발송 성공 여부.
 */
export const inquiries = pgTable(
  "inquiries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    email: text("email").notNull(),
    industry: text("industry"),
    purpose: text("purpose"),
    needs: text("needs"),
    reference: text("reference"),
    budget: text("budget"),
    timeline: text("timeline"),
    message: text("message"),
    mailed: boolean("mailed").notNull().default(false),
    status: text("status").notNull().default("received"), // received | contacted | done
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("inquiries_user_idx").on(t.userId),
    emailIdx: index("inquiries_email_idx").on(t.email),
  }),
);

export type UserRow = typeof users.$inferSelect;
export type CouponRow = typeof coupons.$inferSelect;
export type OrderRow = typeof orders.$inferSelect;
export type InquiryRow = typeof inquiries.$inferSelect;
