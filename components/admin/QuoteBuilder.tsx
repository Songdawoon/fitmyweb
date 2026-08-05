"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  formatKRW,
  QUOTE_BASE_LABEL,
  QUOTE_BASE_PRICE,
  quotePresets,
  type QuotePreset,
} from "@/lib/data";
import { formatPhone, isValidPhone, PHONE_HINT, PHONE_PLACEHOLDER } from "@/lib/phone";

/** lib/db/schema.ts 의 QuoteItem 과 같은 모양. 서버 모듈을 끌고 오지 않으려고 다시 적는다. */
export type BuilderItem = {
  presetId: string | null;
  label: string;
  amount: number;
};

export type BuilderQuote = {
  id: string;
  title: string;
  note: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  baseLabel: string;
  baseAmount: number;
  items: BuilderItem[];
  status: string;
  /** 이미 보낸 견적이면 금액 수정 전에 한 번 확인시킨다. */
  sent: boolean;
};

/** "1,000,000" / "-50000" 같은 입력을 정수로. 빈 값은 0. */
function toAmount(raw: string): number {
  const negative = raw.trim().startsWith("-");
  const digits = raw.replace(/[^\d]/g, "").slice(0, 9);
  if (!digits) return 0;
  return (negative ? -1 : 1) * Number(digits);
}

export default function QuoteBuilder({ quote }: { quote: BuilderQuote | null }) {
  const router = useRouter();
  const readOnly = quote?.status === "paid";

  const [title, setTitle] = useState(quote?.title ?? "");
  const [customerName, setCustomerName] = useState(quote?.customerName ?? "");
  const [customerEmail, setCustomerEmail] = useState(quote?.customerEmail ?? "");
  const [customerPhone, setCustomerPhone] = useState(quote?.customerPhone ?? "");
  const [note, setNote] = useState(quote?.note ?? "");
  const [baseLabel, setBaseLabel] = useState(quote?.baseLabel ?? QUOTE_BASE_LABEL);
  const [baseAmount, setBaseAmount] = useState(quote?.baseAmount ?? QUOTE_BASE_PRICE);
  const [items, setItems] = useState<BuilderItem[]>(quote?.items ?? []);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);

  const total = useMemo(
    () => items.reduce((sum, i) => sum + i.amount, baseAmount),
    [items, baseAmount],
  );

  // 연락처는 선택이지만, 적었다면 걸 수 있는 번호여야 한다.
  const phoneInvalid = customerPhone.trim().length > 0 && !isValidPhone(customerPhone);

  const checkedPresets = useMemo(
    () => new Set(items.map((i) => i.presetId).filter(Boolean) as string[]),
    [items],
  );

  function togglePreset(preset: QuotePreset, on: boolean) {
    setItems((prev) =>
      on
        ? [...prev, { presetId: preset.id, label: preset.label, amount: preset.price }]
        : prev.filter((i) => i.presetId !== preset.id),
    );
  }

  function patchItem(index: number, patch: Partial<BuilderItem>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function addFreeItem() {
    setItems((prev) => [...prev, { presetId: null, label: "", amount: 0 }]);
  }

  async function save() {
    setFailed(false);

    if (title.trim().length < 2) {
      setFailed(true);
      setMessage("견적 제목을 2자 이상 입력해 주세요.");
      return;
    }
    if (items.some((i) => !i.label.trim())) {
      setFailed(true);
      setMessage("이름이 비어 있는 항목이 있습니다.");
      return;
    }
    if (phoneInvalid) {
      setFailed(true);
      setMessage(`연락처를 확인해 주세요. ${PHONE_HINT}`);
      return;
    }
    // 이미 보낸 견적의 금액을 고치면 고객 화면 금액도 즉시 바뀐다. 결제 시점에
    // 서버가 최신 금액으로 다시 대조하므로 손해는 없지만, 고객은 이유를 모른다.
    if (
      quote?.sent &&
      total !== (quote.baseAmount + quote.items.reduce((s, i) => s + i.amount, 0)) &&
      !confirm("이미 발송한 견적입니다. 금액을 바꾸면 고객 화면의 금액도 즉시 바뀝니다. 계속할까요?")
    ) {
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      // total 은 보내지 않는다 — 서버가 항목에서 다시 계산한다.
      const body = {
        title,
        note,
        customerName,
        customerEmail,
        customerPhone,
        baseLabel,
        baseAmount,
        items,
      };

      const res = await fetch(quote ? `/api/admin/quotes/${quote.id}` : "/api/admin/quotes", {
        method: quote ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({ ok: false }));

      if (!data.ok) {
        setFailed(true);
        setMessage(data.message ?? "저장에 실패했습니다.");
        return;
      }

      if (!quote) {
        router.push(`/admin/quotes/${data.quote.id}`);
        return;
      }

      setMessage("저장했습니다.");
      router.refresh();
    } catch {
      setFailed(true);
      setMessage("네트워크 오류로 저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-12">
      {/* ── 입력 ─────────────────────────────────────────────── */}
      <div className="grid gap-8 lg:col-span-7">
        <section>
          <h2 className="font-display text-xl font-extrabold tracking-tight text-ink">
            견적 정보
          </h2>
          <div className="mt-4 grid gap-3">
            <input
              className="field"
              placeholder="견적 제목 (예: OO치과 홈페이지 제작)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={readOnly}
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <input
                className="field"
                placeholder="고객 이름"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                disabled={readOnly}
              />
              <input
                className="field"
                type="email"
                placeholder="고객 이메일"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                disabled={readOnly}
              />
              <div>
                <input
                  className="field"
                  inputMode="tel"
                  placeholder={`연락처 (${PHONE_PLACEHOLDER})`}
                  value={customerPhone}
                  // 입력하는 동안 하이픈을 붙여 준다. 형식이 눈에 보이면
                  // 자릿수가 모자란 번호를 적고 넘어가기 어렵다.
                  onChange={(e) => setCustomerPhone(formatPhone(e.target.value))}
                  disabled={readOnly}
                />
                {phoneInvalid && (
                  <p className="mt-1.5 text-[13px] text-accent">{PHONE_HINT}</p>
                )}
              </div>
            </div>
            <textarea
              className="field min-h-[96px] resize-y"
              placeholder="고객 화면과 메일에 함께 보일 안내 (선택)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={readOnly}
            />
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl font-extrabold tracking-tight text-ink">
            기본 제작비
          </h2>
          {/*
            너비는 감싼 div 가 잡는다. .field 에 w-full 이 들어 있어서 input 에
            w-44 를 직접 걸면 유틸리티 순서에 따라 무시된다(항목 이름 칸이
            사라졌던 원인).
          */}
          <div className="mt-4 flex gap-3">
            <div className="min-w-0 flex-1">
              <input
                className="field"
                value={baseLabel}
                onChange={(e) => setBaseLabel(e.target.value)}
                disabled={readOnly}
              />
            </div>
            <div className="w-44 shrink-0">
              <input
                className="field text-right"
                inputMode="numeric"
                value={baseAmount.toLocaleString("ko-KR")}
                onChange={(e) => setBaseAmount(toAmount(e.target.value))}
                disabled={readOnly}
              />
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl font-extrabold tracking-tight text-ink">옵션</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {quotePresets.map((preset) => {
              const on = checkedPresets.has(preset.id);
              return (
                <label
                  key={preset.id}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3 text-[14px] transition-colors ${
                    on ? "border-ink bg-mist" : "border-line hover:border-ink/40"
                  } ${readOnly ? "pointer-events-none opacity-60" : ""}`}
                >
                  <span className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[#f05540]"
                      checked={on}
                      onChange={(e) => togglePreset(preset, e.target.checked)}
                      disabled={readOnly}
                    />
                    <span className="text-ink">{preset.label}</span>
                  </span>
                  <span className="whitespace-nowrap text-muted">
                    +{preset.price.toLocaleString("ko-KR")}
                  </span>
                </label>
              );
            })}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-extrabold tracking-tight text-ink">
              직접 입력
            </h2>
            <button
              type="button"
              onClick={addFreeItem}
              disabled={readOnly}
              className="rounded-full border border-line px-4 py-2 text-[13px] font-semibold text-muted transition-colors hover:border-ink hover:text-ink disabled:opacity-50"
            >
              항목 추가
            </button>
          </div>

          <div className="mt-4 grid gap-2">
            {items.map((item, index) =>
              item.presetId ? null : (
                <div key={index} className="flex gap-2">
                  <div className="min-w-0 flex-1">
                    <input
                      className="field"
                      placeholder="항목 이름"
                      value={item.label}
                      onChange={(e) => patchItem(index, { label: e.target.value })}
                      disabled={readOnly}
                    />
                  </div>
                  <div className="w-40 shrink-0">
                    <input
                      className="field text-right"
                      inputMode="numeric"
                      value={item.amount.toLocaleString("ko-KR")}
                      onChange={(e) => patchItem(index, { amount: toAmount(e.target.value) })}
                      disabled={readOnly}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={readOnly}
                    aria-label="항목 삭제"
                    className="rounded-xl border border-line px-3 text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
                  >
                    ✕
                  </button>
                </div>
              ),
            )}
            {items.every((i) => i.presetId) && (
              <p className="text-[13px] text-faint">
                목록에 없는 작업은 여기에 이름과 금액을 직접 적습니다. 할인은 음수로 넣습니다.
              </p>
            )}
          </div>
        </section>
      </div>

      {/* ── 합계 ─────────────────────────────────────────────── */}
      <div className="lg:col-span-5">
        <div className="rounded-3xl border border-line bg-paper p-8 lg:sticky lg:top-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
            견적 합계
          </p>

          <ul className="mt-5 grid gap-2 border-t border-line pt-5 text-[14px]">
            <li className="flex justify-between gap-4">
              <span className="text-muted">{baseLabel || "기본 제작비"}</span>
              <span className="whitespace-nowrap text-ink">{formatKRW(baseAmount)}</span>
            </li>
            {items.map((item, index) => (
              <li key={index} className="flex justify-between gap-4">
                <span className="text-muted">{item.label || "(이름 없음)"}</span>
                <span className="whitespace-nowrap text-ink">{formatKRW(item.amount)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex items-baseline justify-between gap-4 border-t border-line pt-5">
            <span className="text-sm text-muted">합계</span>
            <span className="font-display text-3xl font-extrabold tracking-tightest text-ink">
              {formatKRW(total)}
            </span>
          </div>

          <button
            type="button"
            onClick={save}
            disabled={saving || readOnly}
            className="mt-7 w-full rounded-full bg-accent px-6 py-4 text-sm font-semibold text-paper transition-all hover:bg-accent-ink disabled:opacity-60"
          >
            {readOnly ? "결제 완료된 견적" : saving ? "저장 중…" : quote ? "견적 저장" : "견적 만들기"}
          </button>

          {message && (
            <p className={`mt-4 text-center text-[13px] ${failed ? "text-accent" : "text-muted"}`}>
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
