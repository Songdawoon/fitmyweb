import Link from "next/link";
import { Check, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { plans, formatManwon } from "@/lib/data";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";

export default function Plans() {
  return (
    <section id="plans" className="border-t border-line bg-mist">
      <div className="container-page section-x py-24 sm:py-32">
        <SectionHeading
          eyebrow="Plans"
          title={["사업의 규모와 목적에 맞는", "커스텀 제작 플랜"]}
          desc="선택 후 상담으로 제작 범위를 확정하거나, 고정가 플랜은 카드·간편결제로 바로 시작할 수 있습니다."
        />

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-5">
          {plans.map((plan, i) => (
            <Reveal key={plan.id} delay={i * 0.08}>
              <div
                className={`flex h-full flex-col rounded-3xl border bg-paper p-8 transition-shadow duration-300 ${
                  plan.featured
                    ? "border-ink shadow-[0_30px_70px_-40px_rgba(16,23,51,0.5)] lg:-mt-4"
                    : "border-line hover:shadow-[0_24px_60px_-45px_rgba(16,23,51,0.35)]"
                }`}
              >
                <div className="flex h-6 items-center">
                  {plan.featured && (
                    <span className="rounded-full bg-accent px-3 py-1 text-[11px] font-semibold text-paper">
                      가장 많이 선택하는 플랜
                    </span>
                  )}
                </div>

                <h3 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-ink">
                  {plan.name}
                </h3>
                <p className="mt-2 min-h-[42px] text-[14px] leading-relaxed text-muted">
                  {plan.summary}
                </p>

                <div className="mt-5 flex items-baseline gap-1.5">
                  {plan.fromPrice && (
                    <span className="text-[15px] font-medium text-muted">부터</span>
                  )}
                  <span className="font-display text-4xl font-extrabold tracking-tightest text-ink">
                    {formatManwon(plan.price)}
                  </span>
                  {plan.fromPrice && (
                    <span className="text-[15px] font-medium text-muted">~</span>
                  )}
                </div>

                {/* 추천 대상 */}
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {plan.audience.map((a) => (
                    <span
                      key={a}
                      className="rounded-full bg-mist px-2.5 py-1 text-[12px] text-muted"
                    >
                      {a}
                    </span>
                  ))}
                </div>

                <ul className="mt-6 flex flex-1 flex-col gap-2.5 border-t border-line pt-6">
                  {plan.scope.map((s) => (
                    <li key={s} className="flex items-start gap-2.5 text-[14px] text-ink">
                      <Check size={16} weight="bold" className="mt-0.5 shrink-0 text-accent" />
                      {s}
                    </li>
                  ))}
                </ul>

                <div className="mt-8 flex flex-col gap-2.5">
                  {plan.payable ? (
                    <>
                      <Link
                        href={`/checkout?plan=${plan.id}`}
                        className={`group inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${
                          plan.featured
                            ? "bg-accent text-paper hover:bg-accent-ink"
                            : "bg-ink text-paper hover:bg-accent"
                        }`}
                      >
                        {formatManwon(plan.price)} 결제로 시작
                        <ArrowRight
                          size={15}
                          weight="bold"
                          className="transition-transform duration-200 group-hover:translate-x-0.5"
                        />
                      </Link>
                      <Link
                        href="/#contact"
                        className="inline-flex items-center justify-center rounded-full border border-line px-6 py-3 text-sm font-semibold text-ink transition-colors duration-200 hover:border-ink/40"
                      >
                        상담 먼저 하기
                      </Link>
                    </>
                  ) : (
                    <Link
                      href="/#contact"
                      className="group inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-paper transition-colors duration-200 hover:bg-accent"
                    >
                      상담으로 견적 확정
                      <ArrowRight
                        size={15}
                        weight="bold"
                        className="transition-transform duration-200 group-hover:translate-x-0.5"
                      />
                    </Link>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.05}>
          <p className="mt-8 text-center text-[14px] text-muted">
            플랜별 페이지 수·수정 횟수·포함 범위는 상담 시 계약 조건으로 확정됩니다.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
