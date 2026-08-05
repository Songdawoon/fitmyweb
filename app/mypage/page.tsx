import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { auth, authEnabled } from "@/lib/auth";
import { getMyPageData } from "@/lib/account";
import { couponDefs, formatWon, type CouponKind } from "@/lib/data";

export const metadata: Metadata = {
  title: "마이페이지",
  robots: { index: false, follow: false },
};

// 세션과 DB 를 읽으므로 정적 생성 대상이 아니다.
export const dynamic = "force-dynamic";

function formatDate(value: Date | string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const inquiryStatusLabel: Record<string, string> = {
  received: "접수됨",
  contacted: "상담 중",
  done: "완료",
};

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-14">
      <div className="flex items-baseline gap-2">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">
          {title}
        </h2>
        <span className="text-[13px] text-faint">{count}</span>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-line px-5 py-8 text-center text-[14px] text-faint">
      {children}
    </p>
  );
}

export default async function MyPage() {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/mypage");

  const data = await getMyPageData(session.user.id, session.user.email ?? null);

  return (
    <>
      <Nav authEnabled={authEnabled()} />
      <main className="container-page section-x py-32">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
          My Page
        </p>
        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tightest text-ink">
          {session.user.name ?? "고객"}님
        </h1>
        <p className="mt-3 text-[15px] text-muted">{session.user.email}</p>

        {session.user.isAdmin && (
          <Link
            href="/admin"
            className="mt-5 inline-flex rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-accent"
          >
            관리자 페이지
          </Link>
        )}

        {!data ? (
          <p className="mt-14 rounded-2xl border border-line px-5 py-8 text-[14px] leading-relaxed text-muted">
            데이터베이스가 연결되지 않아 내역을 불러올 수 없습니다. 로그인 자체는
            정상이며, `DATABASE_URL` 을 설정하면 쿠폰·결제·상담 내역이 표시됩니다.
          </p>
        ) : (
          <>
            <Section title="보유 쿠폰" count={data.coupons.length}>
              {data.coupons.length === 0 ? (
                <Empty>
                  발급된 쿠폰이 없습니다.{" "}
                  <Link href="/?coupon=1" className="font-semibold text-ink underline">
                    쿠폰 받기
                  </Link>
                </Empty>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {data.coupons.map((c) => (
                    <li
                      key={c.id}
                      className={`rounded-2xl border px-5 py-4 ${
                        c.usedAt ? "border-line opacity-55" : "border-ink"
                      }`}
                    >
                      <p className="text-[13px] font-semibold text-muted">
                        {couponDefs[c.kind as CouponKind]?.name ?? "쿠폰"}
                      </p>
                      <p className="mt-1 font-display text-2xl font-extrabold tracking-tightest text-ink">
                        {formatWon(c.amount)}
                      </p>
                      <p className="mt-1 font-mono text-[13px] tracking-wide text-muted">
                        {c.code}
                      </p>
                      <p className="mt-2 text-[12px] text-faint">
                        {c.usedAt
                          ? `${formatDate(c.usedAt)} 사용`
                          : `${formatDate(c.issuedAt)} 발급 · 결제 화면에서 자동 적용`}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title="결제 내역" count={data.orders.length}>
              {data.orders.length === 0 ? (
                <Empty>결제 내역이 없습니다.</Empty>
              ) : (
                <ul className="divide-y divide-line rounded-2xl border border-line">
                  {data.orders.map((o) => (
                    <li
                      key={o.id}
                      className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-4"
                    >
                      <div>
                        <p className="text-[15px] font-semibold text-ink">
                          {o.planName}
                          {/* 견적 결제는 플랜명이 견적 제목이라, 무엇인지 밝혀 준다. */}
                          {o.planId === "quote" && (
                            <span className="ml-2 rounded-full bg-mist px-2 py-0.5 text-[11px] font-medium text-muted">
                              주문제작
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 font-mono text-[12px] text-faint">
                          {o.merchantUid}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[15px] font-bold text-ink">
                          {formatWon(o.amount)}
                        </p>
                        <p className="mt-0.5 text-[12px] text-faint">
                          {formatDate(o.createdAt)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title="상담 내역" count={data.inquiries.length}>
              {data.inquiries.length === 0 ? (
                <Empty>
                  아직 상담 신청이 없습니다.{" "}
                  <Link href="/#contact" className="font-semibold text-ink underline">
                    상담 신청하기
                  </Link>
                </Empty>
              ) : (
                <ul className="divide-y divide-line rounded-2xl border border-line">
                  {data.inquiries.map((q) => (
                    <li key={q.id} className="px-5 py-4">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-[15px] font-semibold text-ink">
                          {q.industry || "상담 신청"}
                        </p>
                        <span className="rounded-full bg-ink px-3 py-1 text-[11px] font-semibold text-paper">
                          {inquiryStatusLabel[q.status] ?? q.status}
                        </span>
                      </div>
                      {q.message && (
                        <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-muted">
                          {q.message}
                        </p>
                      )}
                      <p className="mt-2 text-[12px] text-faint">
                        {formatDate(q.createdAt)} 접수
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
