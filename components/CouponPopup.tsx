"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ArrowLineDown } from "@phosphor-icons/react";
import { couponPromo, plans, formatWon } from "@/lib/data";

const STORAGE_KEY = "myfitweb:coupon-dismissed-until";
const OPEN_DELAY_MS = 1200;

const spring = { type: "spring", stiffness: 120, damping: 20 } as const;

/** 다음 자정까지의 timestamp — "오늘 하루 보지 않기"의 만료 시각. */
function nextMidnight(): number {
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  return d.getTime();
}

/**
 * 하단 작은 글씨의 플랜별 가격 라인.
 * 가격을 하드코딩하지 않고 plans 에서 생성해 단가 변경이 자동 반영되게 한다.
 * fromPrice 플랜은 "…원부터" 로 표기 (Plans 섹션의 "부터~" 와 같은 의미).
 */
function planPriceLine(): string {
  return plans
    .map((p) => `${p.name} ${formatWon(p.price)}${p.fromPrice ? "부터" : ""}`)
    .join(" · ");
}

export default function CouponPopup() {
  const [open, setOpen] = useState(false);
  const [dontShowToday, setDontShowToday] = useState(false);

  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<Element | null>(null);
  // 최신 체크박스 값을 close 시점에 읽기 위한 참조 (close 를 재생성하지 않기 위함).
  const dontShowRef = useRef(dontShowToday);
  dontShowRef.current = dontShowToday;

  // 지연 노출 — 첫 화면이 그려진 뒤에 띄운다.
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      // 프라이빗 모드 등 localStorage 접근 불가 — 그냥 노출한다.
    }

    if (stored && Number(stored) > Date.now()) return;

    const timer = window.setTimeout(() => setOpen(true), OPEN_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const close = useCallback(() => {
    if (dontShowRef.current) {
      try {
        window.localStorage.setItem(STORAGE_KEY, String(nextMidnight()));
      } catch {
        // 저장 실패해도 닫기는 정상 진행한다.
      }
    }
    setOpen(false);
  }, []);

  // 열려 있는 동안: 배경 스크롤 잠금 · Escape 로 닫기 · 포커스 이동과 복원
  useEffect(() => {
    if (!open) return;

    restoreFocusRef.current = document.activeElement;
    closeRef.current?.focus();

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKeyDown);
      if (restoreFocusRef.current instanceof HTMLElement) {
        restoreFocusRef.current.focus();
      }
    };
  }, [open, close]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
          className="fixed inset-0 z-[90] grid place-items-center bg-ink/50 p-5 backdrop-blur-sm"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="coupon-popup-title"
            initial={{ scale: 0.95, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.97, opacity: 0 }}
            transition={spring}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[640px] overflow-hidden rounded-3xl bg-ink px-6 pb-6 pt-14 shadow-2xl sm:px-9 sm:pb-7"
          >
            <button
              ref={closeRef}
              onClick={close}
              aria-label="닫기"
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-paper/60 outline-none transition-colors hover:bg-paper/10 hover:text-paper focus-visible:ring-2 focus-visible:ring-paper/50"
            >
              <X size={18} weight="bold" />
            </button>

            {/* 모바일 — 좌우 텍스트를 한 줄로 대체.
                말풍선이 카드 위로 겹쳐 올라오므로 그만큼 여백을 확보한다. */}
            <p
              id="coupon-popup-title"
              className="mb-14 text-center font-display text-2xl font-extrabold tracking-tight text-paper sm:hidden"
            >
              {couponPromo.sideLeft.join(" ")} {couponPromo.sideRight.join(" ")}
            </p>

            <div className="grid grid-cols-1 items-center gap-5 sm:grid-cols-[1fr_auto_1fr] sm:gap-4">
              {/* 좌측 — 한정 / 쿠폰 */}
              <div className="hidden text-right font-display text-[34px] font-extrabold leading-[1.15] tracking-tight text-paper sm:block">
                {couponPromo.sideLeft.map((w) => (
                  <span key={w} className="block">
                    {w}
                  </span>
                ))}
              </div>

              {/* 중앙 — 쿠폰 카드 */}
              <div className="relative mx-auto w-full max-w-[290px]">
                {/* 고객님 Only 말풍선 */}
                <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 -translate-y-full">
                  <span className="relative block whitespace-nowrap rounded-full bg-[#0a0f22] px-4 py-2 text-[13px] font-bold text-paper">
                    {couponPromo.badge}
                    <span
                      aria-hidden
                      className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-[6px] border-t-[7px] border-x-transparent border-t-[#0a0f22]"
                    />
                  </span>
                </div>

                <div className="overflow-hidden rounded-2xl bg-paper pt-7">
                  <div className="flex items-baseline justify-center gap-1 px-5">
                    <span className="text-[13px] font-bold leading-tight text-ink">
                      {couponPromo.amountLabel}
                    </span>
                    <span className="font-display text-[44px] font-extrabold leading-none tracking-tightest text-ink">
                      {couponPromo.amount.toLocaleString("ko-KR")}
                    </span>
                    <span className="text-[19px] font-extrabold text-ink">원</span>
                  </div>

                  <div className="mx-6 my-5 border-t border-dashed border-line" />

                  {/* 안내 전용 — 실제 쿠폰 발급 없이 팝업만 닫는다. */}
                  <button
                    onClick={close}
                    className="flex w-full items-center justify-center gap-2 px-5 pb-6 text-[17px] font-bold text-ink transition-colors hover:text-accent"
                  >
                    <ArrowLineDown size={17} weight="bold" />
                    {couponPromo.cta}
                  </button>

                  {/* 하단 오렌지 바 + 중앙 노치 (카드 흰색이 파고드는 형태) */}
                  <div className="relative h-3.5 bg-accent">
                    <span
                      aria-hidden
                      className="absolute left-1/2 top-0 h-3.5 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-paper"
                    />
                  </div>
                </div>
              </div>

              {/* 우측 — 발급 / 안내 */}
              <div className="hidden font-display text-[34px] font-extrabold leading-[1.15] tracking-tight text-paper sm:block">
                {couponPromo.sideRight.map((w) => (
                  <span key={w} className="block">
                    {w}
                  </span>
                ))}
              </div>
            </div>

            {/* 하단 작은 글씨 — 안내문 + 플랜 종류별 가격 */}
            <div className="mt-7 space-y-1.5 text-center">
              <p className="text-[12px] leading-relaxed text-paper/60">
                {couponPromo.notice}
              </p>
              <p className="text-[12px] leading-relaxed text-paper/60">
                {planPriceLine()}
              </p>
            </div>

            <label className="mt-6 flex cursor-pointer items-center justify-center gap-2 text-[13px] text-paper/60 transition-colors hover:text-paper/85">
              <input
                type="checkbox"
                checked={dontShowToday}
                onChange={(e) => setDontShowToday(e.target.checked)}
                className="h-3.5 w-3.5 accent-accent"
              />
              오늘 하루 보지 않기
            </label>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
