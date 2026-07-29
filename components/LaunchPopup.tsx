"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { X, ArrowRight } from "@phosphor-icons/react";
import {
  launchPromo,
  launchTotalBenefit,
  plans,
  formatWon,
} from "@/lib/data";

// 이벤트 개편으로 문구가 완전히 바뀌었으므로 키도 갈아끼워, 예전 팝업을
// "오늘 하루 보지 않기"로 닫았던 방문자에게도 새 안내가 한 번은 노출되게 한다.
const STORAGE_KEY = "myfitweb:launch-promo-dismissed-until";
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

export default function LaunchPopup() {
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
            aria-labelledby="launch-popup-title"
            initial={{ scale: 0.95, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.97, opacity: 0 }}
            transition={spring}
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[90vh] w-full max-w-[640px] overflow-y-auto rounded-3xl bg-ink px-6 pb-6 pt-14 shadow-2xl sm:px-9 sm:pb-7"
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
              id="launch-popup-title"
              className="mb-14 text-center font-display text-2xl font-extrabold tracking-tight text-paper sm:hidden"
            >
              {launchPromo.sideLeft.join(" ")} {launchPromo.sideRight.join(" ")}
            </p>

            <div className="grid grid-cols-1 items-center gap-5 sm:grid-cols-[1fr_auto_1fr] sm:gap-4">
              {/* 좌측 — 런칭 / 기념 */}
              <div className="hidden text-right font-display text-[34px] font-extrabold leading-[1.15] tracking-tight text-paper sm:block">
                {launchPromo.sideLeft.map((w) => (
                  <span key={w} className="block">
                    {w}
                  </span>
                ))}
              </div>

              {/* 중앙 — 혜택 금액 카드 */}
              <div className="relative mx-auto w-full max-w-[290px]">
                {/* 배지 말풍선 */}
                <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 -translate-y-full">
                  <span className="relative block whitespace-nowrap rounded-full bg-[#0a0f22] px-4 py-2 text-[13px] font-bold text-paper">
                    {launchPromo.badge}
                    <span
                      aria-hidden
                      className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-[6px] border-t-[7px] border-x-transparent border-t-[#0a0f22]"
                    />
                  </span>
                </div>

                <div className="overflow-hidden rounded-2xl bg-paper pt-7">
                  {/* 금액이 6자리 이상이라 라벨을 윗줄로 올려 한 줄 폭을 확보한다. */}
                  <div className="px-5 text-center">
                    <p className="text-[14px] font-bold leading-tight text-ink">
                      {launchPromo.amountLabel}
                    </p>
                    <p className="mt-1 flex items-baseline justify-center gap-0.5">
                      <span className="font-display text-[40px] font-extrabold leading-none tracking-tightest text-ink">
                        {launchTotalBenefit.toLocaleString("ko-KR")}
                      </span>
                      <span className="text-[18px] font-extrabold text-ink">
                        원
                      </span>
                    </p>
                  </div>

                  <div className="mx-6 my-5 border-t border-dashed border-line" />

                  {/* 쿠폰 발급이 없는 이벤트라 상담 폼으로 보내고 팝업을 닫는다. */}
                  <Link
                    href={launchPromo.ctaHref}
                    onClick={close}
                    className="flex w-full items-center justify-center gap-2 px-5 pb-6 text-[17px] font-bold text-ink transition-colors hover:text-accent"
                  >
                    {launchPromo.cta}
                    <ArrowRight size={17} weight="bold" />
                  </Link>

                  {/* 하단 오렌지 바 + 중앙 노치 (카드 흰색이 파고드는 형태) */}
                  <div className="relative h-3.5 bg-accent">
                    <span
                      aria-hidden
                      className="absolute left-1/2 top-0 h-3.5 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-paper"
                    />
                  </div>
                </div>
              </div>

              {/* 우측 — 혜택 / 안내 */}
              <div className="hidden font-display text-[34px] font-extrabold leading-[1.15] tracking-tight text-paper sm:block">
                {launchPromo.sideRight.map((w) => (
                  <span key={w} className="block">
                    {w}
                  </span>
                ))}
              </div>
            </div>

            {/* 이벤트로 무상 제공하는 유상 옵션 — 라벨과 정가를 나란히 보여준다. */}
            <ul className="mt-7 space-y-2">
              {launchPromo.benefits.map((b) => (
                <li
                  key={b.label}
                  className="flex items-center justify-between gap-3 rounded-xl bg-paper px-4 py-2.5"
                >
                  <span className="text-[14px] font-bold text-ink sm:text-[15px]">
                    {b.label}
                  </span>
                  <span className="whitespace-nowrap font-display text-[14px] font-extrabold text-accent sm:text-[15px]">
                    (+{b.value.toLocaleString("ko-KR")})
                  </span>
                </li>
              ))}
            </ul>

            {/* 하단 작은 글씨 — 안내문 + 플랜 종류별 가격 */}
            <div className="mt-6 space-y-1.5 text-center">
              <p className="text-[12px] leading-relaxed text-paper/60">
                {launchPromo.notice}
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
