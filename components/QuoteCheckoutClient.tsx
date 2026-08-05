"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { brand, formatKRW, quoteNotice } from "@/lib/data";
import { formatPhone, isValidPhone, PHONE_HINT, PHONE_PLACEHOLDER } from "@/lib/phone";
import { loadPortOneV1, readRedirectResult, requestPay } from "@/lib/portone-client";
import { asQuoteStatus } from "@/lib/quoteStatus";
import { inboundChannel, track } from "@/lib/track";

export type QuoteLine = { label: string; amount: number };

type Props = {
  token: string;
  quoteId: string;
  ref_: string;
  title: string;
  note: string | null;
  baseLabel: string;
  baseAmount: number;
  items: QuoteLine[];
  total: number;
  status: string;
  impCode: string;
  channelKey: string;
  pg: string;
  defaultName: string;
  defaultEmail: string;
  defaultPhone: string;
};

/**
 * stale — 화면을 열어 둔 사이 관리자가 견적을 고친 경우.
 * 결제창을 열기 전에 서버에 다시 물어 미리 잡아낸다.
 */
type Status = "idle" | "loading" | "verifying" | "success" | "pending" | "error" | "stale";
type Form = { name: string; email: string; phone: string; agree: boolean };
type Errors = Partial<Record<keyof Form, string>>;

export default function QuoteCheckoutClient({
  token,
  quoteId,
  ref_,
  title,
  note,
  baseLabel,
  baseAmount,
  items,
  total,
  status: quoteStatus,
  impCode,
  channelKey,
  pg,
  defaultName,
  defaultEmail,
  defaultPhone,
}: Props) {
  const router = useRouter();
  const state = asQuoteStatus(quoteStatus);

  const [form, setForm] = useState<Form>({
    name: defaultName,
    email: defaultEmail,
    phone: defaultPhone,
    agree: false,
  });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [serverAmount, setServerAmount] = useState<number | null>(null);

  const configured = Boolean(
    impCode && !impCode.includes("00000000") && (channelKey || pg),
  );

  useEffect(() => {
    track("checkout_start", { plan: "quote", price: total, ...inboundChannel() });
  }, [total]);

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
        setMessage(data?.message ?? "결제 검증에 실패했습니다. 담당자에게 문의해 주세요.");
        return;
      }

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

  // 모바일 결제창은 페이지 이동으로 동작해 콜백 대신 쿼리스트링으로 돌아온다.
  // 토큰이 이미 경로에 있으므로 남길 쿼리는 없다.
  const handledRedirect = useRef(false);
  useEffect(() => {
    if (handledRedirect.current) return;

    const result = readRedirectResult("");
    if (!result) return;

    handledRedirect.current = true;

    if (!result.ok) {
      setStatus("error");
      setMessage(result.message);
      return;
    }

    void confirmPayment(result.impUid);
  }, [confirmPayment]);

  function validate(): boolean {
    const e: Errors = {};
    if (form.name.trim().length < 2) e.name = "이름 또는 담당자명을 입력해 주세요.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "올바른 이메일 형식이 아닙니다.";
    if (!isValidPhone(form.phone)) e.phone = PHONE_HINT;
    if (!form.agree) e.agree = "결제 진행을 위해 동의가 필요합니다.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handlePay() {
    if (!configured) {
      setStatus("error");
      setMessage("결제 설정이 완료되지 않았습니다. 담당자에게 문의해 주세요.");
      return;
    }
    if (!validate()) return;

    setStatus("loading");
    setMessage("");

    try {
      /**
       * 결제창을 열기 전에 서버에서 최신 금액과 주문번호를 받는다.
       * 옛 금액으로 결제창을 열면 승인은 되고 서버 검증에서 실패해 가장 나쁜
       * 상태가 된다(돈은 나갔는데 주문은 없음). 여기서 먼저 걸러 낸다.
       */
      const res = await fetch(`/api/quote/${token}/prepare`, { method: "POST" });
      const prep = await res.json().catch(() => ({ ok: false }));

      if (!prep.ok) {
        setStatus("error");
        setMessage(prep.message ?? "지금은 결제할 수 없는 견적입니다.");
        return;
      }

      if (prep.amount !== total) {
        setStatus("stale");
        setServerAmount(prep.amount);
        return;
      }

      await loadPortOneV1();

      const response = await requestPay(impCode, {
        ...(channelKey ? { channelKey } : { pg }),
        pay_method: "card",
        // 서버가 발급한 주문번호. 안에 든 견적번호를 서버가 custom_data 와
        // 교차 검증하므로, 둘 중 하나만 바꿔 보내면 통과하지 못한다.
        merchant_uid: prep.merchantUid,
        name: `${brand.name} · ${title}`,
        amount: prep.amount,
        buyer_name: form.name,
        buyer_email: form.email,
        buyer_tel: form.phone,
        custom_data: JSON.stringify({
          quoteId,
          name: form.name,
          email: form.email,
          phone: form.phone,
        }),
        m_redirect_url: `${window.location.origin}/quote/${token}`,
      });

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

  const lines = [{ label: baseLabel, amount: baseAmount }, ...items];

  // ── 결제가 끝났거나 종료된 견적 ─────────────────────────────────
  if (state !== "open" && status !== "success") {
    return (
      <section className="container-page section-x py-32">
        <div className="mx-auto max-w-xl rounded-3xl border border-line bg-paper p-10 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
            견적번호 {ref_}
          </p>
          <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tightest text-ink">
            {state === "paid" ? "결제가 완료된 견적입니다" : "종료된 견적입니다"}
          </h1>

          {state === "paid" ? (
            <>
              <p className="mt-4 text-[15px] text-muted">
                {title} · {formatKRW(total)}
              </p>
              <p className="mt-6 text-[14px] text-muted">
                진행 안내는 담당자가 따로 연락드립니다.
              </p>
            </>
          ) : (
            <p className="mt-4 text-[15px] text-muted">
              이 견적은 더 이상 결제할 수 없습니다. 담당자에게 문의해 주세요.
            </p>
          )}
        </div>
      </section>
    );
  }

  return (
    // Nav 가 fixed 라 상단 여백이 없으면 제목이 로고에 겹친다(다른 페이지와 같은 py-32).
    <section className="container-page section-x py-32">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
        주문제작 견적 · {ref_}
      </p>
      <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tightest text-ink">
        {title}
      </h1>
      {note && (
        <p className="mt-4 max-w-2xl whitespace-pre-wrap text-[15px] leading-relaxed text-muted">
          {note}
        </p>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-14">
        {/* ── 결제자 정보 ─────────────────────────────────────── */}
        <div className="lg:col-span-7">
          {status === "success" ? (
            <div className="rounded-3xl border border-line bg-paper p-10">
              <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">
                결제가 완료되었습니다
              </h2>
              <p className="mt-3 text-[15px] text-muted">담당자가 곧 연락드립니다.</p>
            </div>
          ) : (
            <>
              <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">
                결제자 정보
              </h2>
              <div className="mt-5 grid gap-3">
                <div>
                  <input
                    className="field"
                    placeholder="이름 또는 담당자명"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                  {errors.name && <p className="mt-1.5 text-[13px] text-accent">{errors.name}</p>}
                </div>
                <div>
                  <input
                    className="field"
                    type="email"
                    placeholder="이메일"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                  {errors.email && (
                    <p className="mt-1.5 text-[13px] text-accent">{errors.email}</p>
                  )}
                </div>
                <div>
                  <input
                    className="field"
                    inputMode="tel"
                    placeholder={`연락처 (${PHONE_PLACEHOLDER})`}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })}
                  />
                  {errors.phone && (
                    <p className="mt-1.5 text-[13px] text-accent">{errors.phone}</p>
                  )}
                </div>

                <label className="mt-2 flex cursor-pointer items-start gap-2.5 text-[14px] text-muted">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 accent-[#f05540]"
                    checked={form.agree}
                    onChange={(e) => setForm({ ...form, agree: e.target.checked })}
                  />
                  <span>견적 내용과 결제 금액을 확인했으며, 결제 진행에 동의합니다.</span>
                </label>
                {errors.agree && <p className="text-[13px] text-accent">{errors.agree}</p>}
              </div>

              <p className="mt-8 text-[13px] leading-relaxed text-faint">{quoteNotice}</p>
            </>
          )}
        </div>

        {/* ── 견적 내역 + 결제 ────────────────────────────────── */}
        <div className="lg:col-span-5">
          <div className="rounded-3xl border border-line bg-paper p-8 lg:sticky lg:top-8">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
              견적 내역
            </p>

            <ul className="mt-5 grid gap-2 border-t border-line pt-5 text-[14px]">
              {lines.map((line, index) => (
                <li key={index} className="flex justify-between gap-4">
                  <span className="text-muted">{line.label}</span>
                  <span className="whitespace-nowrap text-ink">{formatKRW(line.amount)}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex items-baseline justify-between gap-4 border-t border-line pt-5">
              <span className="text-sm text-muted">결제 금액</span>
              <span className="font-display text-3xl font-extrabold tracking-tightest text-ink">
                {formatKRW(total)}
              </span>
            </div>

            {status !== "success" && (
              <button
                type="button"
                onClick={handlePay}
                disabled={status === "loading" || status === "verifying"}
                className="mt-7 w-full rounded-full bg-accent px-6 py-4 text-sm font-semibold text-paper transition-all hover:bg-accent-ink disabled:opacity-60"
              >
                {status === "loading"
                  ? "결제창을 여는 중…"
                  : status === "verifying"
                    ? "결제 확인 중…"
                    : `${formatKRW(total)} 결제하기`}
              </button>
            )}

            {/* 결제창이 뜨지 않거나 사용자가 창을 닫아 버린 경우의 탈출구. */}
            {status === "loading" && (
              <button
                type="button"
                onClick={() => setStatus("idle")}
                className="mt-3 w-full text-center text-[13px] text-faint underline underline-offset-4"
              >
                결제창이 닫혔나요? 다시 시도하기
              </button>
            )}

            {status === "stale" && (
              <div className="mt-5 rounded-2xl border border-accent/30 bg-accent/5 p-5 text-[13px] leading-relaxed text-muted">
                <p className="font-semibold text-ink">견적 금액이 변경되었습니다</p>
                <p className="mt-1.5">
                  최신 금액은 {serverAmount !== null ? formatKRW(serverAmount) : "-"} 입니다.
                  화면을 새로 고친 뒤 확인해 주세요.
                </p>
                <button
                  type="button"
                  onClick={() => router.refresh()}
                  className="mt-3 rounded-full bg-ink px-5 py-2.5 text-[13px] font-semibold text-paper transition-colors hover:bg-accent"
                >
                  새로고침
                </button>
              </div>
            )}

            {message && status !== "stale" && (
              <p
                className={`mt-4 text-center text-[13px] ${
                  status === "error" ? "text-accent" : "text-muted"
                }`}
              >
                {message}
              </p>
            )}

            {!configured && (
              <p className="mt-4 text-center text-[12px] text-faint">
                테스트 모드 — 결제 키가 설정되지 않았습니다.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
