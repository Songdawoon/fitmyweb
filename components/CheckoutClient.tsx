"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle,
  WarningCircle,
  SpinnerGap,
  ShieldCheck,
  Lock,
  Hourglass,
} from "@phosphor-icons/react";
import type { CouponDef, CouponKind, Plan } from "@/lib/data";
import { formatKRW, formatWon, brand, couponDefs } from "@/lib/data";

/**
 * 결제에 쓸 수 있는 쿠폰 — 서버가 세션과 이벤트 기간을 확인해 넘긴다.
 * 이벤트 쿠폰은 비회원에게도 내려가고, 회원가입 쿠폰은 발급받은 계정에만 내려간다.
 */
export type CheckoutCoupon = CouponDef & { code: string };

type Props = {
  plan: Plan;
  impCode: string;
  channelKey: string;
  pg: string;
  loggedIn: boolean;
  coupons: CheckoutCoupon[];
  defaultEmail: string;
  defaultName: string;
};
type Status = "idle" | "loading" | "verifying" | "success" | "pending" | "error";
type Form = { name: string; email: string; phone: string; agree: boolean };
type Errors = Partial<Record<keyof Form, string>>;

/** PortOne V1 결제 결과 (PC 환경 콜백) */
type PayResponse = {
  success?: boolean;
  imp_uid?: string | null;
  merchant_uid?: string;
  error_code?: string | null;
  error_msg?: string | null;
};

declare global {
  interface Window {
    IMP?: {
      init: (impCode: string) => void;
      request_pay: (params: Record<string, unknown>, cb: (rsp: PayResponse) => void) => void;
    };
  }
}

const spring = { type: "spring", stiffness: 120, damping: 20 } as const;

/** V1 결제 SDK. npm 패키지는 V2 전용이라 CDN 스크립트를 직접 로드한다. */
const V1_SDK_URL = "https://cdn.iamport.kr/v1/iamport.js";

let sdkPromise: Promise<void> | null = null;

function loadPortOneV1(): Promise<void> {
  if (window.IMP) return Promise.resolve();
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${V1_SDK_URL}"]`);
    const script = existing ?? document.createElement("script");
    script.addEventListener("load", () => (window.IMP ? resolve() : reject(new Error("IMP 로드 실패"))));
    script.addEventListener("error", () => reject(new Error("결제 모듈을 불러오지 못했습니다.")));
    if (!existing) {
      script.src = V1_SDK_URL;
      document.head.appendChild(script);
    }
  }).catch((err) => {
    sdkPromise = null; // 다음 시도에서 재로드할 수 있도록 캐시를 비운다.
    throw err;
  });

  return sdkPromise;
}

/**
 * 주문번호(merchant_uid) 생성.
 *
 * KCP 는 주문번호를 40자 이하로 제한하므로 UUID 를 그대로 쓸 수 없습니다
 * (`pay-startfit-{uuid}` 는 49자). 타임스탬프(base36) + 난수 조합으로 줄이되,
 * 서버가 접두사에서 플랜을 역추적할 수 있도록 `pay-{planId}-` 형태는 유지합니다.
 */
function createMerchantUid(planId: string): string {
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
  return `pay-${planId}-${Date.now().toString(36)}-${rand}`;
}

export default function CheckoutClient({
  plan,
  impCode,
  channelKey,
  pg,
  loggedIn,
  coupons,
  defaultEmail,
  defaultName,
}: Props) {
  const [form, setForm] = useState<Form>({
    name: defaultName,
    email: defaultEmail,
    phone: "",
    agree: false,
  });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [receipt, setReceipt] = useState<{ impUid: string } | null>(null);
  // 쓸 수 있는 쿠폰은 기본으로 모두 적용해 둔다 — 두 쿠폰은 함께 쓸 수 있고,
  // 있는 할인을 굳이 찾아 누르게 하지 않는다.
  const [offKinds, setOffKinds] = useState<CouponKind[]>([]);

  const applied = coupons.filter((c) => !offKinds.includes(c.kind));
  // 합산 할인이 플랜 금액을 넘기면 결제 금액이 음수가 되므로 여기서 자른다.
  // 서버도 같은 방식으로 다시 계산한다(lib/portone.ts).
  const discount = Math.min(
    applied.reduce((sum, c) => sum + c.amount, 0),
    plan.price,
  );
  const payAmount = plan.price - discount;

  function toggleCoupon(kind: CouponKind, on: boolean) {
    setOffKinds((prev) => (on ? prev.filter((k) => k !== kind) : [...prev, kind]));
  }

  // 채널키 또는 pg 코드 중 하나만 있으면 결제 가능하다.
  const configured = Boolean(impCode && !impCode.includes("00000000") && (channelKey || pg));

  /** 서버에 결제 확인을 요청하고 결과에 따라 화면 상태를 정리한다. */
  const confirmPayment = useCallback(async (impUid: string) => {
    setStatus("verifying");
    setMessage("");
    try {
      const res = await fetch("/api/payment/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ impUid }),
      });
      const data = await res.json();

      if (!res.ok || data.status === "failed") {
        setStatus("error");
        setMessage(data?.message ?? "결제 검증에 실패했습니다. 고객센터로 문의해 주세요.");
        return;
      }

      setReceipt({ impUid });

      if (data.status === "pending") {
        setStatus("pending");
        setMessage(data.message ?? "결제가 아직 완료되지 않았습니다.");
        return;
      }

      setStatus("success");
    } catch {
      setStatus("error");
      setMessage("결제 결과를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }, []);

  /**
   * 모바일 결제창은 팝업이 아니라 페이지 이동으로 동작하므로, 결제가 끝나면
   * m_redirect_url 로 되돌아오면서 결과가 쿼리스트링에 실려 옵니다. 이때는
   * request_pay 의 콜백이 실행되지 않으므로 여기서 이어받아 처리합니다.
   */
  const handledRedirect = useRef(false);
  useEffect(() => {
    if (handledRedirect.current) return;

    const params = new URLSearchParams(window.location.search);
    const impUid = params.get("imp_uid");
    const impSuccess = params.get("imp_success") ?? params.get("success");
    if (!impUid && !impSuccess) return;

    handledRedirect.current = true;

    // 결과 파라미터를 URL 에서 지워 새로고침 시 중복 처리를 막는다.
    const clean = new URLSearchParams();
    clean.set("plan", plan.id);
    window.history.replaceState({}, "", `${window.location.pathname}?${clean}`);

    if (impSuccess === "false" || !impUid) {
      setStatus("error");
      setMessage(params.get("error_msg") ?? "결제가 취소되었거나 실패했습니다.");
      return;
    }

    void confirmPayment(impUid);
  }, [plan.id, confirmPayment]);

  function validate(): boolean {
    const e: Errors = {};
    if (form.name.trim().length < 2) e.name = "이름 또는 담당자명을 입력해 주세요.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "올바른 이메일 형식이 아닙니다.";
    if (form.phone.replace(/\D/g, "").length < 9) e.phone = "연락 가능한 번호를 입력해 주세요.";
    if (!form.agree) e.agree = "결제 진행을 위해 동의가 필요합니다.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handlePay() {
    if (!configured) {
      setStatus("error");
      setMessage("결제 설정이 완료되지 않았습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    if (!validate()) return;
    setStatus("loading");
    setMessage("");
    try {
      await loadPortOneV1();
      const IMP = window.IMP;
      if (!IMP) throw new Error("결제 모듈을 불러오지 못했습니다.");

      IMP.init(impCode);

      const response = await new Promise<PayResponse>((resolve) => {
        IMP.request_pay(
          {
            // 포트원이 pg 를 deprecated 처리했으므로 채널키를 우선 사용하고,
            // 채널키가 없을 때만 레거시 pg 코드(`kcp.{사이트코드}`)로 지정한다.
            ...(channelKey ? { channelKey } : { pg }),
            pay_method: "card",
            merchant_uid: createMerchantUid(plan.id),
            name: `${brand.name} · ${plan.name}`,
            amount: payAmount,
            buyer_name: form.name,
            buyer_email: form.email,
            buyer_tel: form.phone,
            // 서버가 결제 건만 보고 어떤 플랜인지 판별할 수 있도록 함께 기록한다.
            // V1 의 custom_data 는 문자열이라 JSON 으로 직렬화해서 넘긴다.
            //
            // couponCodes 도 여기에 실어 보낸다. 클라이언트가 보낸 값이지만
            // 서버가 코드마다 유효성과 금액을 다시 확인해 할인액을 직접 계산하므로
            // (lib/portone.ts), 금액을 깎아 보내는 조작은 통하지 않는다.
            custom_data: JSON.stringify({
              planId: plan.id,
              name: form.name,
              email: form.email,
              phone: form.phone,
              ...(applied.length > 0
                ? { couponCodes: applied.map((c) => c.code) }
                : {}),
            }),
            // 모바일에서는 이 주소로 되돌아오며, 위 useEffect 가 결과를 이어받는다.
            m_redirect_url: `${window.location.origin}/checkout?plan=${plan.id}`,
          },
          resolve,
        );
      });

      // 모바일 리다이렉트로 진행된 경우 콜백이 실행되지 않아 여기까지 오지 않는다.
      if (response.success === false || response.error_code || !response.imp_uid) {
        setStatus("error");
        setMessage(response.error_msg ?? "결제가 취소되었거나 실패했습니다.");
        return;
      }

      await confirmPayment(response.imp_uid);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "예기치 못한 오류가 발생했습니다.");
    }
  }

  return (
    <section className="container-page section-x pb-32 pt-2">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
        {/* Left — payer form */}
        <div className="lg:col-span-7">
          <p className="eyebrow">Checkout</p>
          <h1 className="mt-4 h-display text-3xl sm:text-4xl">홈페이지 제작 결제</h1>
          <p className="mt-4 max-w-[48ch] text-[15px] leading-relaxed text-muted">
            아래 정보를 확인하고 결제를 진행하면, 담당자가 영업일 기준 1일 내에
            연락해 제작 킥오프 일정을 잡아드립니다.
          </p>

          {!configured && (
            <div className="mt-8 flex items-start gap-3 rounded-xl border border-accent/40 bg-accent/[0.06] p-4 text-sm">
              <WarningCircle size={18} className="mt-0.5 shrink-0 text-accent" />
              <p className="text-ink">
                결제 설정이 아직 완료되지 않았습니다.{" "}
                <code className="rounded bg-mist px-1.5 py-0.5 font-mono text-xs">.env.local</code>
                에 PortOne 상점 ID와 채널 키를 넣어 주세요.
              </p>
            </div>
          )}

          <div className="mt-9 grid gap-6 rounded-3xl border border-line bg-paper p-7 sm:p-8">
            <Field label="이름 / 담당자명" error={errors.name} hint="계약서에 기재될 담당자명">
              <input
                className="field"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="홍길동"
              />
            </Field>
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="이메일" error={errors.email}>
                <input
                  className="field"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@company.com"
                />
              </Field>
              <Field label="휴대폰" error={errors.phone}>
                <input
                  className="field"
                  inputMode="numeric"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="010 0000 0000"
                />
              </Field>
            </div>
            <div className="grid gap-2">
              <label className="flex cursor-pointer items-start gap-3 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={form.agree}
                  onChange={(e) => setForm({ ...form, agree: e.target.checked })}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
                />
                <span>
                  주문 내용을 확인했으며, 결제 진행 및 개인정보 수집·이용에 동의합니다.
                </span>
              </label>
              {errors.agree && <p className="pl-7 text-[13px] text-accent">{errors.agree}</p>}
            </div>
          </div>
        </div>

        {/* Right — sticky order summary */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-8">
            <div className="rounded-3xl border border-line bg-paper p-8">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
                주문 요약
              </p>
              <h2 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-ink">
                {plan.name}
              </h2>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">{plan.summary}</p>

              <ul className="mt-6 flex flex-col gap-2.5 border-t border-line pt-6 text-[14px] text-ink">
                {plan.scope.slice(0, 4).map((s) => (
                  <li key={s} className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-accent" />
                    {s}
                  </li>
                ))}
                {plan.scope.length > 4 && (
                  <li className="text-muted">외 {plan.scope.length - 4}개 항목</li>
                )}
              </ul>

              {/*
                쓸 수 있는 쿠폰. 두 종류를 함께 적용할 수 있으므로 각각 켜고 끈다.
                체크박스 아래에는 그 쿠폰으로 실제 무엇을 받는지(제공 항목과 정가)를
                펼쳐 둔다 — 금액만 보고는 무엇이 포함되는지 알 수 없기 때문.
              */}
              {coupons.length > 0 && (
                <div className="mt-6 grid gap-3">
                  {coupons.map((c) => {
                    const on = !offKinds.includes(c.kind);
                    return (
                      <div
                        key={c.kind}
                        className={`rounded-2xl border px-4 py-3.5 transition-colors ${
                          on ? "border-ink/15 bg-mist" : "border-line"
                        }`}
                      >
                        <label className="flex cursor-pointer items-start gap-3">
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={(e) => toggleCoupon(c.kind, e.target.checked)}
                            className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-baseline justify-between gap-2">
                              <span className="text-[14px] font-bold text-ink">{c.name}</span>
                              <span className="whitespace-nowrap text-[14px] font-bold text-accent">
                                −{formatKRW(c.amount)}
                              </span>
                            </span>
                            <span className="mt-0.5 block truncate font-mono text-[12px] text-muted">
                              {c.code}
                            </span>
                          </span>
                        </label>

                        <ul className="mt-3 grid gap-1.5 border-t border-line pt-3">
                          {c.includes.map((item) => (
                            <li
                              key={item.label}
                              className="flex items-start justify-between gap-3 text-[13px]"
                            >
                              <span className="flex items-start gap-2 text-ink">
                                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-accent" />
                                {item.label}
                              </span>
                              {item.value !== undefined && (
                                <span className="whitespace-nowrap text-muted">
                                  {formatWon(item.value)}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                        <p className="mt-2.5 break-keep text-[12px] leading-relaxed text-faint">
                          {c.note}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/*
                회원가입 쿠폰을 아직 못 받은 방문자에게 받는 경로를 안내한다.
                비로그인이면 로그인부터, 로그인했는데 없으면 발급 팝업으로 보낸다.
              */}
              {!coupons.some((c) => c.kind === "signup") && (
                <p className="mt-3 rounded-2xl border border-dashed border-line px-4 py-3.5 text-[13px] leading-relaxed text-muted">
                  <Link
                    href={loggedIn ? "/?coupon=1" : "/login?callbackUrl=/checkout"}
                    className="font-semibold text-ink underline underline-offset-4"
                  >
                    {loggedIn ? "쿠폰 받기" : "로그인"}
                  </Link>
                  {loggedIn ? "를 누르고 " : "하고 "}
                  {couponDefs.signup.name}({formatWon(couponDefs.signup.amount)})을 받으면
                  이벤트 쿠폰과 함께 적용됩니다.
                </p>
              )}

              <div className="mt-6 border-t border-line pt-6">
                {discount > 0 && (
                  <div className="mb-3 grid gap-1.5 text-[13px]">
                    <div className="flex items-baseline justify-between">
                      <span className="text-muted">플랜 금액</span>
                      <span className="text-ink">{formatKRW(plan.price)}</span>
                    </div>
                    {applied.map((c) => (
                      <div key={c.kind} className="flex items-baseline justify-between">
                        <span className="text-muted">{c.name}</span>
                        <span className="font-semibold text-accent">
                          −{formatKRW(c.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-muted">결제 금액</span>
                  <span className="font-display text-3xl font-extrabold tracking-tightest text-ink">
                    {formatKRW(payAmount)}
                  </span>
                </div>
              </div>

              <button
                onClick={handlePay}
                disabled={
                  !configured ||
                  status === "loading" ||
                  status === "verifying" ||
                  status === "success" ||
                  status === "pending"
                }
                className="group mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-4 text-sm font-semibold text-paper transition-all duration-200 hover:bg-accent-ink disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
              >
                {status === "loading" || status === "verifying" ? (
                  <>
                    <SpinnerGap size={18} weight="bold" className="animate-spin" />
                    {status === "loading" ? "결제창 여는 중…" : "결제 확인 중…"}
                  </>
                ) : (
                  <>
                    <Lock size={16} weight="bold" />
                    {formatKRW(payAmount)} 결제하기
                  </>
                )}
              </button>

              {/*
                KCP 결제창을 사용자가 닫거나 취소하면 request_pay 의 콜백이
                호출되지 않는 경우가 있습니다. 그대로 두면 버튼이 "결제창 여는 중…"
                에서 영구히 멈춰 새로고침 외에는 빠져나갈 방법이 없으므로,
                직접 초기화할 수 있는 출구를 열어 둡니다.

                결제가 실제로 진행 중이었더라도 주문 확정은 웹훅이 보증하므로
                여기서 초기화해도 결제 건이 유실되지 않습니다.
              */}
              {status === "loading" && (
                <button
                  onClick={() => {
                    setStatus("idle");
                    setMessage("");
                  }}
                  className="mt-3 w-full text-center text-xs text-muted underline underline-offset-4 transition-colors hover:text-ink"
                >
                  결제창이 닫혔나요? 다시 시도하기
                </button>
              )}

              <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-muted">
                <ShieldCheck size={14} className="text-accent" />
                PortOne 보안 결제 · 카드 · 간편결제
              </p>

              {status === "error" && (
                <p className="mt-4 rounded-lg border border-accent/40 bg-accent/[0.06] px-4 py-3 text-center text-xs text-accent-ink">
                  {message}
                </p>
              )}
            </div>
            <p className="mt-4 px-1 text-[13px] leading-relaxed text-faint">
              결제 후에도 상담을 통해 제작 범위를 함께 확정합니다. 범위 밖 작업은
              임의로 청구하지 않습니다.
            </p>
          </div>
        </div>
      </div>

      {/* Result overlay — 결제 완료 / 입금 대기 */}
      <AnimatePresence>
        {(status === "success" || status === "pending") && receipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] grid place-items-center bg-ink/40 p-6 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              transition={spring}
              className="w-full max-w-md rounded-3xl border border-line bg-paper p-9 text-center shadow-2xl"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ ...spring, delay: 0.1 }}
                className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-accent/12"
              >
                {status === "success" ? (
                  <CheckCircle size={36} weight="fill" className="text-accent" />
                ) : (
                  <Hourglass size={32} weight="fill" className="text-accent" />
                )}
              </motion.div>
              <h2 className="mt-6 font-display text-2xl font-bold tracking-tight text-ink">
                {status === "success" ? "결제가 완료되었어요" : "입금을 기다리고 있어요"}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {status === "success"
                  ? `${plan.name} 결제가 확인되었습니다. 곧 담당자가 이메일로 제작 킥오프 일정을 보내 드릴게요.`
                  : message}
              </p>
              <p className="mt-5 break-all font-mono text-[11px] text-faint">
                {receipt.impUid}
              </p>
              <Link
                href="/"
                className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-paper transition-colors hover:bg-accent"
              >
                홈으로 돌아가기
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-ink">{label}</label>
      {children}
      {error ? (
        <p className="text-[13px] text-accent">{error}</p>
      ) : hint ? (
        <p className="text-[13px] text-faint">{hint}</p>
      ) : null}
    </div>
  );
}
