"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle,
  WarningCircle,
  SpinnerGap,
  ShieldCheck,
  Lock,
} from "@phosphor-icons/react";
import type { Plan } from "@/lib/data";
import { formatKRW, brand } from "@/lib/data";

type Props = { plan: Plan; storeId: string; channelKey: string };
type Status = "idle" | "loading" | "success" | "error";
type Form = { name: string; email: string; phone: string; agree: boolean };
type Errors = Partial<Record<keyof Form, string>>;

const spring = { type: "spring", stiffness: 120, damping: 20 } as const;

export default function CheckoutClient({ plan, storeId, channelKey }: Props) {
  const [form, setForm] = useState<Form>({ name: "", email: "", phone: "", agree: false });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [receipt, setReceipt] = useState<{ paymentId: string; verified: boolean } | null>(null);

  const configured = Boolean(storeId && channelKey && !storeId.includes("00000000"));

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
    if (!validate()) return;
    setStatus("loading");
    setMessage("");
    try {
      const PortOne = await import("@portone/browser-sdk/v2");
      const paymentId = `pay-${plan.id}-${crypto.randomUUID()}`;

      const response = await PortOne.requestPayment({
        storeId,
        channelKey,
        paymentId,
        orderName: `${brand.name} · ${plan.name}`,
        totalAmount: plan.price,
        currency: "CURRENCY_KRW",
        payMethod: "CARD",
        customer: {
          fullName: form.name,
          email: form.email,
          phoneNumber: form.phone,
        },
        redirectUrl: `${window.location.origin}/checkout?plan=${plan.id}`,
      });

      if (response?.code !== undefined) {
        setStatus("error");
        setMessage(response.message ?? "결제가 취소되었거나 실패했습니다.");
        return;
      }

      const verifyRes = await fetch("/api/payment/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: response?.paymentId ?? paymentId, planId: plan.id }),
      });
      const data = await verifyRes.json();

      if (!verifyRes.ok || data.status === "failed") {
        setStatus("error");
        setMessage(data.message ?? "결제 검증에 실패했습니다. 고객센터로 문의해 주세요.");
        return;
      }

      setReceipt({ paymentId: response?.paymentId ?? paymentId, verified: !!data.verified });
      setStatus("success");
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
                테스트 모드입니다. 실제 결제창을 띄우려면{" "}
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

              <div className="mt-6 flex items-baseline justify-between border-t border-line pt-6">
                <span className="text-sm text-muted">결제 금액</span>
                <span className="font-display text-3xl font-extrabold tracking-tightest text-ink">
                  {formatKRW(plan.price)}
                </span>
              </div>

              <button
                onClick={handlePay}
                disabled={status === "loading" || status === "success"}
                className="group mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-4 text-sm font-semibold text-paper transition-all duration-200 hover:bg-accent-ink disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
              >
                {status === "loading" ? (
                  <>
                    <SpinnerGap size={18} weight="bold" className="animate-spin" />
                    결제창 여는 중…
                  </>
                ) : (
                  <>
                    <Lock size={16} weight="bold" />
                    {formatKRW(plan.price)} 결제하기
                  </>
                )}
              </button>

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

      {/* Success overlay */}
      <AnimatePresence>
        {status === "success" && receipt && (
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
                <CheckCircle size={36} weight="fill" className="text-accent" />
              </motion.div>
              <h2 className="mt-6 font-display text-2xl font-bold tracking-tight text-ink">
                결제가 접수되었어요
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {plan.name} 결제가 완료되었습니다. 곧 담당자가 이메일로 제작
                킥오프 일정을 보내 드릴게요.
              </p>
              {!receipt.verified && (
                <p className="mt-4 rounded-lg bg-mist px-3 py-2 text-xs text-muted">
                  테스트 모드 — 서버 금액 검증은 실제 키 연결 시 활성화됩니다.
                </p>
              )}
              <p className="mt-5 break-all font-mono text-[11px] text-faint">
                {receipt.paymentId}
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
