import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import {
  couponDefs,
  couponKinds,
  getPlan,
  isEventCouponActive,
  plans,
  type CouponDef,
} from "@/lib/data";
import CheckoutClient, { type CheckoutCoupon } from "@/components/CheckoutClient";
import { auth } from "@/lib/auth";
import { getUnusedCoupons } from "@/lib/account";

export const metadata: Metadata = { title: "결제" };

// 세션에 따라 보유 쿠폰이 달라지므로 정적 생성 대상이 아니다.
export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: { plan?: string };
}) {
  const plan = getPlan(searchParams.plan);
  const payablePlans = plans.filter((p) => p.payable);

  /**
   * 적용 가능한 쿠폰은 서버에서 뽑아 넘긴다. 클라이언트가 코드를 지어내도
   * 결제 검증(lib/portone.ts)에서 걸리지만, 화면에는 쓸 수 있는 것만 보여야 한다.
   *
   * 두 쿠폰 모두 "받아 둔 것" 만 노출한다 — 팝업에서 쿠폰을 받지 않은 사람에게
   * 할인이 미리 적용된 화면을 보여주지 않기 위함. 발급받지 않은 쿠폰은 여기서
   * 빠지고, 아래 CheckoutClient 가 받으러 가는 경로를 안내한다.
   */
  const session = await auth();
  const myCoupons = session?.user?.id ? await getUnusedCoupons(session.user.id) : [];

  const applicableCoupons: CheckoutCoupon[] = [];
  // 아직 안 받았지만 지금 받을 수 있는 쿠폰 — 화면에서 받으러 가는 길을 안내한다.
  const missingCoupons: CouponDef[] = [];

  for (const kind of couponKinds) {
    // 기간이 끝난 이벤트 쿠폰은 이미 발급받았어도 쓸 수 없고, 권할 수도 없다
    // (resolveCoupons 와 같은 기준).
    if (kind === "event" && !isEventCouponActive()) continue;

    const owned = myCoupons.find((c) => c.kind === kind);
    if (!owned) {
      missingCoupons.push(couponDefs[kind]);
      continue;
    }

    applicableCoupons.push({
      ...couponDefs[kind],
      code: owned.code,
      amount: owned.amount,
    });
  }

  return (
    <main className="min-h-[100dvh] bg-mist">
      <div className="container-page section-x py-8">
        <Link
          href="/#plans"
          className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft size={16} weight="bold" />
          플랜으로 돌아가기
        </Link>
      </div>

      {plan && plan.payable ? (
        <CheckoutClient
          plan={plan}
          impCode={process.env.NEXT_PUBLIC_PORTONE_IMP_CODE ?? ""}
          channelKey={process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY ?? ""}
          pg={process.env.NEXT_PUBLIC_PORTONE_PG ?? ""}
          loggedIn={Boolean(session?.user)}
          coupons={applicableCoupons}
          missingCoupons={missingCoupons}
          defaultEmail={session?.user?.email ?? ""}
          defaultName={session?.user?.name ?? ""}
        />
      ) : (
        <section className="container-page section-x py-24 text-center">
          <p className="eyebrow justify-center">
            {plan ? "상담 후 견적 확정" : "결제할 항목이 없어요"}
          </p>
          <h1 className="mt-4 h-display text-3xl sm:text-4xl">
            {plan
              ? `${plan.name}은 상담으로 진행됩니다`
              : "선택된 플랜이 없습니다"}
          </h1>
          <p className="mx-auto mt-5 max-w-[44ch] text-[15px] leading-relaxed text-muted">
            {plan
              ? "이 플랜은 범위에 따라 금액이 달라져 상담으로 견적을 먼저 확정합니다. 아래에서 고정가 플랜을 결제하거나 상담을 신청해 주세요."
              : "먼저 함께할 플랜을 골라 주세요."}
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            {payablePlans.map((p) => (
              <Link
                key={p.id}
                href={`/checkout?plan=${p.id}`}
                className="rounded-full border border-line bg-paper px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-ink/40"
              >
                {p.name} 결제
              </Link>
            ))}
            <Link
              href="/#contact"
              className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-accent"
            >
              상담 신청
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
