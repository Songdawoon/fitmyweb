import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
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
 * 할인은 전부 이 테이블을 거친다 — 여기에 행이 없으면 결제 화면에 뜨지도 않고
 * 검증도 통과하지 않는다.
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
 * 견적 항목 한 줄.
 *
 * 프리셋에서 골랐어도 라벨과 금액을 통째로 복사해 둔다 — 견적은 "그때 합의한
 * 내용"이므로, lib/data.ts 의 프리셋 가격을 나중에 고쳐도 이미 보낸 견적의
 * 금액이 따라 움직이면 안 된다. presetId 는 관리자 화면에서 체크 상태를
 * 되살리기 위한 표식일 뿐이고, 금액의 근거가 아니다.
 */
export type QuoteItem = {
  /** 프리셋에서 온 항목이면 프리셋 id, 자유입력이면 null */
  presetId: string | null;
  label: string;
  /** 원 단위 정수. 음수(할인 줄)도 허용하되 총액은 양수여야 한다. */
  amount: number;
};

/**
 * 주문제작 견적.
 *
 * 관리자가 협의한 금액으로 만들고, token 이 박힌 링크를 고객에게 보낸다.
 * 링크에는 만료가 없고, 결제가 끝나면 status 가 paid 로 넘어가 종료된다.
 *
 * 금액의 단일 진실 공급원은 total 이다. 결제창에는 브라우저가 금액을 넣지만
 * 서버는 언제나 이 컬럼을 다시 읽어 대조한다(lib/portone.ts 의 resolveBillable).
 * items 와 total 이 어긋나지 않도록 total 은 저장할 때마다 서버가
 * computeQuoteTotal 로 다시 계산한다 — 클라이언트가 보낸 총액은 쓰지 않는다.
 */
export const quotes = pgTable(
  "quotes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /**
     * 사람이 부를 수 있는 짧은 식별자. merchant_uid 에 실려 나가므로 비밀이
     * 아니다. custom_data 가 유실돼도 주문번호만으로 견적을 되찾기 위한
     * 보조 경로다(planIdFromMerchantUid 와 같은 역할).
     */
    ref: text("ref").notNull(),
    /** 결제 링크의 비밀 열쇠. 32자 base64url(192비트) — 추측 불가. */
    token: text("token").notNull(),

    title: text("title").notNull(),
    /** 고객 화면과 메일에 함께 보여줄 안내 한 단락. */
    note: text("note"),

    customerName: text("customer_name"),
    customerEmail: text("customer_email"),
    customerPhone: text("customer_phone"),
    /** 링크를 열어 본 로그인 계정. 최초 열람 때 한 번만 채운다. */
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),

    baseLabel: text("base_label").notNull().default("기본 제작비"),
    baseAmount: bigint("base_amount", { mode: "number" }).notNull(),
    items: jsonb("items").$type<QuoteItem[]>().notNull().default(sql`'[]'::jsonb`),
    /** baseAmount + items 합계. 서버 계산값만 들어간다. */
    total: bigint("total", { mode: "number" }).notNull(),

    /** open(결제 가능) | paid(결제 완료·종료) | closed(관리자 수동 종료) */
    status: text("status").notNull().default("open"),
    /**
     * 쿠폰 적용 스위치. 지금은 항상 false 다(관리자가 이미 협의한 금액이므로).
     * 켜면 verifyPayment 가 고정 플랜과 똑같은 쿠폰 경로를 그대로 탄다.
     */
    couponsEnabled: boolean("coupons_enabled").notNull().default(false),

    /** 결제 직전 서버가 발급한 주문번호. 웹훅 역추적과 대사(對査)용. */
    lastMerchantUid: text("last_merchant_uid"),
    paidImpUid: text("paid_imp_uid"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    closedAt: timestamp("closed_at", { withTimezone: true }),

    sentAt: timestamp("sent_at", { withTimezone: true }),
    sentCount: integer("sent_count").notNull().default(0),

    createdByEmail: text("created_by_email"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tokenIdx: uniqueIndex("quotes_token_idx").on(t.token),
    refIdx: uniqueIndex("quotes_ref_idx").on(t.ref),
    statusIdx: index("quotes_status_idx").on(t.status),
    emailIdx: index("quotes_email_idx").on(t.customerEmail),
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
    // 주문제작 견적 결제면 그 견적 행. 고정 플랜 결제는 null.
    quoteId: uuid("quote_id").references(() => quotes.id, { onDelete: "set null" }),
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
    /**
     * 견적 하나에 주문은 하나. 두 탭에서 결제창을 동시에 띄워 둘 다 승인되는
     * 경우, 두 번째 주문 행은 여기서 막힌다(recordOrderRow 의
     * onConflictDoNothing 이 조용히 흡수하고, markQuotePaid 가 충돌을
     * 에러 로그로 남긴다).
     */
    quoteIdx: uniqueIndex("orders_quote_idx")
      .on(t.quoteId)
      .where(sql`${t.quoteId} is not null`),
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
export type QuoteRow = typeof quotes.$inferSelect;
export type OrderRow = typeof orders.$inferSelect;
export type InquiryRow = typeof inquiries.$inferSelect;
