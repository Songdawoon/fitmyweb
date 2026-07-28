"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarBlank, CaretLeft, CaretRight } from "@phosphor-icons/react";

/**
 * 날짜 입력 필드.
 *
 * 입력창을 클릭하면 달력이 열리고, 날짜를 고르면 입력창에 채워집니다.
 * 다만 값은 계속 자유 문자열로 둡니다 — 상담 단계에서는 "미정"이나 "다음 달 중"
 * 같은 답이 정확한 날짜만큼 흔하고, 그걸 막으면 오히려 폼을 못 넘어갑니다.
 * 그래서 직접 타이핑도 그대로 되고, 달력 하단에 빠른 선택 버튼을 둡니다.
 */

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

/** 입력값이 달력에서 고른 날짜 형식이면 Date 로 되돌린다(선택 표시용). */
function parseDate(value: string): Date | null {
  const m = /^(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일$/.exec(value.trim());
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const parsed = new Date(y, mo - 1, d);
  // 2026년 2월 31일 같은 값이 3월로 굴러가는 것을 걸러낸다.
  return parsed.getMonth() === mo - 1 && parsed.getDate() === d ? parsed : null;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export default function DateField({ value, onChange, placeholder }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const today = useMemo(() => startOfDay(new Date()), []);
  const selected = useMemo(() => parseDate(value), [value]);

  // 달력이 보여주는 달. 이미 고른 날짜가 있으면 그 달에서 시작한다.
  const [view, setView] = useState(() => {
    const base = parseDate(value) ?? new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  // 열 때마다 선택된 달로 되돌린다 — 지난번에 넘겨 둔 달이 그대로 남으면 혼란스럽다.
  useEffect(() => {
    if (!open) return;
    const base = parseDate(value) ?? new Date();
    setView(new Date(base.getFullYear(), base.getMonth(), 1));
  }, [open, value]);

  // 바깥 클릭 · Escape 로 닫기
  useEffect(() => {
    if (!open) return;

    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // 앞쪽 빈칸 + 날짜. 뒤쪽은 채우지 않아도 그리드가 알아서 맞는다.
  const cells = useMemo(() => {
    const year = view.getFullYear();
    const month = view.getMonth();
    const lead = new Date(year, month, 1).getDay();
    const total = new Date(year, month + 1, 0).getDate();

    return [
      ...Array.from({ length: lead }, () => null),
      ...Array.from({ length: total }, (_, i) => new Date(year, month, i + 1)),
    ];
  }, [view]);

  function pick(date: Date) {
    onChange(formatDate(date));
    setOpen(false);
  }

  function shiftMonth(delta: number) {
    setView((v) => new Date(v.getFullYear(), v.getMonth() + delta, 1));
  }

  // 지난 달로는 갈 수 있지만 과거 날짜는 고를 수 없다. 오픈 일정이므로 미래만 유효.
  const atCurrentMonth =
    view.getFullYear() === today.getFullYear() && view.getMonth() === today.getMonth();

  return (
    <div ref={wrapRef} className="relative">
      <input
        className="field cursor-pointer pr-11"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        placeholder={placeholder}
        aria-haspopup="dialog"
        aria-expanded={open}
      />
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "달력 닫기" : "달력 열기"}
        className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-faint outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <CalendarBlank size={18} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="희망 오픈 일정 선택"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 top-[calc(100%+8px)] z-30 w-[300px] max-w-[calc(100vw-2.5rem)] rounded-2xl border border-line bg-paper p-4 shadow-[0_24px_60px_-20px_rgba(16,23,51,0.28)]"
          >
            {/* 월 이동 */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                disabled={atCurrentMonth}
                aria-label="이전 달"
                className="grid h-8 w-8 place-items-center rounded-lg text-muted outline-none transition-colors hover:bg-mist hover:text-ink disabled:cursor-not-allowed disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                <CaretLeft size={15} weight="bold" />
              </button>
              <span className="text-[15px] font-semibold text-ink">
                {view.getFullYear()}년 {view.getMonth() + 1}월
              </span>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                aria-label="다음 달"
                className="grid h-8 w-8 place-items-center rounded-lg text-muted outline-none transition-colors hover:bg-mist hover:text-ink focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                <CaretRight size={15} weight="bold" />
              </button>
            </div>

            {/* 요일 */}
            <div className="mt-3 grid grid-cols-7 gap-1">
              {WEEKDAYS.map((w, i) => (
                <span
                  key={w}
                  className={`grid h-7 place-items-center text-[12px] font-medium ${
                    i === 0 ? "text-accent/70" : "text-faint"
                  }`}
                >
                  {w}
                </span>
              ))}
            </div>

            {/* 날짜 */}
            <div className="grid grid-cols-7 gap-1">
              {cells.map((date, i) => {
                if (!date) return <span key={`blank-${i}`} />;

                const past = date < today;
                const isSelected = selected ? sameDay(date, selected) : false;
                const isToday = sameDay(date, today);

                return (
                  <button
                    key={date.getTime()}
                    type="button"
                    disabled={past}
                    onClick={() => pick(date)}
                    aria-label={formatDate(date)}
                    aria-current={isToday ? "date" : undefined}
                    className={`grid h-9 place-items-center rounded-lg text-[13px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 ${
                      isSelected
                        ? "bg-accent font-semibold text-paper"
                        : past
                          ? "cursor-not-allowed text-faint/40"
                          : isToday
                            ? "font-semibold text-accent hover:bg-mist"
                            : "text-ink hover:bg-mist"
                    }`}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            {/* 정확한 날짜를 아직 못 정한 경우의 출구 */}
            <div className="mt-3 flex gap-2 border-t border-line pt-3">
              {["미정", "3개월 이내"].map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    onChange(label);
                    setOpen(false);
                  }}
                  className={`flex-1 rounded-lg border px-2 py-2 text-[13px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 ${
                    value === label
                      ? "border-accent bg-accent/[0.08] font-medium text-accent-ink"
                      : "border-line text-muted hover:border-ink/30 hover:text-ink"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
