"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { X, ArrowRight, SpinnerGap, CheckCircle, Info } from "@phosphor-icons/react";
import {
  couponDefs,
  couponKinds,
  isEventCouponActive,
  launchPromo,
  totalCouponBenefit,
  type CouponKind,
} from "@/lib/data";

// 이벤트 개편으로 문구가 완전히 바뀌었으므로 키도 갈아끼워, 예전 팝업을
// "오늘 하루 보지 않기"로 닫았던 방문자에게도 새 안내가 한 번은 노출되게 한다.
const STORAGE_KEY = "myfitweb:launch-promo-dismissed-until";
const OPEN_DELAY_MS = 1200;

/**
 * 로그인 후 되돌아올 주소. 이 값이 붙어 있으면 팝업을 지연 없이 열고
 * 쿠폰 발급을 자동으로 이어서 진행한다 — 로그인하러 갔다가 돌아온 사람이
 * 버튼을 한 번 더 누르게 만들지 않기 위함.
 */
const RESUME_PARAM = "coupon";
const LOGIN_RETURN_URL = `/?${RESUME_PARAM}=1`;

const spring = { type: "spring", stiffness: 120, damping: 20 } as const;

/** 다음 자정까지의 timestamp — "오늘 하루 보지 않기"의 만료 시각. */
function nextMidnight(): number {
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  return d.getTime();
}

/** 발급 결과 한 장. 서버 응답(IssueCouponResult)에서 화면에 필요한 것만 추린다. */
type IssuedCoupon = {
  kind: CouponKind;
  code: string;
  /** 이번에 새로 받았는지 (false 면 전에 받아 둔 쿠폰) */
  fresh: boolean;
  used: boolean;
};

/** 쿠폰 버튼 상태 — idle 외에는 버튼 자리에 결과를 보여준다. */
type CouponState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "done"; coupons: IssuedCoupon[] }
  | { kind: "error"; message: string };

type IssueResult = {
  kind: CouponKind;
  status: "issued" | "already" | "expired" | "unavailable";
  code?: string;
  usedAt?: string | null;
};

export default function LaunchPopup() {
  const [open, setOpen] = useState(false);
  const [dontShowToday, setDontShowToday] = useState(false);
  const [coupon, setCoupon] = useState<CouponState>({ kind: "idle" });

  const router = useRouter();
  const { status: authStatus } = useSession();

  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<Element | null>(null);
  // 최신 체크박스 값을 close 시점에 읽기 위한 참조 (close 를 재생성하지 않기 위함).
  const dontShowRef = useRef(dontShowToday);
  dontShowRef.current = dontShowToday;

  /**
   * 쿠폰 발급 요청. 계정당 1장이라는 판정은 서버가 한다.
   * 401 이면 로그인 페이지로 보내고, 돌아오면 이어서 발급되도록 주소를 넘긴다.
   */
  const claimCoupon = useCallback(async () => {
    setCoupon({ kind: "loading" });
    try {
      const res = await fetch("/api/coupon", { method: "POST" });

      if (res.status === 401) {
        router.push(`/login?callbackUrl=${encodeURIComponent(LOGIN_RETURN_URL)}`);
        return;
      }

      const data = (await res.json().catch(() => null)) as
        | { status?: string; results?: IssueResult[] }
        | null;

      const issued: IssuedCoupon[] = (data?.results ?? [])
        .filter((r): r is IssueResult & { code: string } =>
          Boolean(r.code) && (r.status === "issued" || r.status === "already"),
        )
        .map((r) => ({
          kind: r.kind,
          code: r.code,
          fresh: r.status === "issued",
          used: Boolean(r.usedAt),
        }));

      if (issued.length > 0) {
        setCoupon({ kind: "done", coupons: issued });
        return;
      }

      setCoupon({
        kind: "error",
        message:
          data?.status === "unavailable"
            ? launchPromo.couponMessages.unavailable
            : launchPromo.couponMessages.error,
      });
    } catch {
      setCoupon({ kind: "error", message: launchPromo.couponMessages.error });
    }
  }, [router]);

  // 지연 노출 — 첫 화면이 그려진 뒤에 띄운다.
  // 단, 로그인 후 되돌아온 경우(?coupon=1)에는 "오늘 하루 보지 않기" 와
  // 지연을 모두 무시하고 즉시 열어 발급을 이어간다.
  const resumedRef = useRef(false);
  useEffect(() => {
    const resuming =
      new URLSearchParams(window.location.search).get(RESUME_PARAM) === "1";

    if (resuming) {
      // 새로고침해도 다시 발급 시도하지 않도록 파라미터를 지운다.
      window.history.replaceState({}, "", window.location.pathname);
      resumedRef.current = true;
      setOpen(true);
      return;
    }

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

  // 로그인 후 복귀 — 세션이 확정되는 즉시 한 번만 발급을 시도한다.
  useEffect(() => {
    if (!resumedRef.current) return;
    if (authStatus === "loading") return;

    resumedRef.current = false;
    if (authStatus === "authenticated") void claimCoupon();
  }, [authStatus, claimCoupon]);

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
                        {totalCouponBenefit.toLocaleString("ko-KR")}
                      </span>
                      <span className="text-[18px] font-extrabold text-ink">
                        원
                      </span>
                    </p>
                  </div>

                  <div className="mx-6 my-5 border-t border-dashed border-line" />

                  {/*
                    쿠폰 발급 버튼.
                    비로그인 판정은 클라이언트가 아니라 서버(401)가 한다 —
                    세션 로딩 중에 버튼을 막아 두면 눌러도 반응이 없는 것처럼
                    보이고, 어차피 발급 권한은 서버가 확인해야 하기 때문.
                  */}
                  <div className="px-5 pb-6">
                    {coupon.kind === "done" ? (
                      <CouponResult coupons={coupon.coupons} onClose={close} />
                    ) : (
                      <>
                        <button
                          onClick={() => void claimCoupon()}
                          disabled={coupon.kind === "loading"}
                          className="flex w-full items-center justify-center gap-2 text-[17px] font-bold text-ink transition-colors hover:text-accent disabled:opacity-60"
                        >
                          {coupon.kind === "loading" ? (
                            <>
                              <SpinnerGap size={17} weight="bold" className="animate-spin" />
                              발급 중…
                            </>
                          ) : (
                            <>
                              {launchPromo.cta}
                              <ArrowRight size={17} weight="bold" />
                            </>
                          )}
                        </button>
                        {coupon.kind === "error" && (
                          <p className="mt-2 text-center text-[12px] leading-relaxed text-accent-ink">
                            {coupon.message}
                          </p>
                        )}
                      </>
                    )}
                  </div>

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

            {/*
              쿠폰 두 장의 구성. 쿠폰 이름과 금액을 머리에 두고, 그 아래에
              무엇을 받는지(무상 제공되는 유상 옵션)를 정가와 함께 펼친다.
            */}
            <div className="mt-7 space-y-3">
              {couponKinds.map((kind) => {
                const def = couponDefs[kind];
                const closed = kind === "event" && !isEventCouponActive();

                return (
                  <div
                    key={kind}
                    className={`rounded-2xl bg-paper px-4 py-3.5 ${closed ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-[15px] font-extrabold text-ink sm:text-[16px]">
                        {def.name}
                        {def.memberOnly && (
                          <span className="ml-1.5 align-middle text-[11px] font-bold text-muted">
                            회원 전용
                          </span>
                        )}
                      </span>
                      <span className="whitespace-nowrap font-display text-[16px] font-extrabold text-accent">
                        {def.amount.toLocaleString("ko-KR")}원
                      </span>
                    </div>
                    <ul className="mt-2.5 space-y-1.5 border-t border-line pt-2.5">
                      {def.includes.map((item) => (
                        <li
                          key={item.label}
                          className="flex items-baseline justify-between gap-3 text-[13px]"
                        >
                          <span className="font-medium text-ink">{item.label}</span>
                          {item.value !== undefined && (
                            <span className="whitespace-nowrap text-muted">
                              (+{item.value.toLocaleString("ko-KR")})
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            {/* 하단 작은 글씨 — 이벤트 안내문.
                sm 이상에서는 notice 배열의 줄 그대로(조건 / 결과) 끊고,
                모바일에서는 한 줄이 폭을 넘겨 "계약하시면" 만 떨어지므로
                인라인으로 풀어 자연스럽게 흐르게 둔다.
                break-keep — 한글 기본 줄바꿈이 음절 단위라 "무상/으로" 처럼
                단어가 갈라지는 것을 막는다. */}
            <div className="mt-6 text-center">
              <p className="text-balance break-keep text-[12px] leading-relaxed text-paper/60">
                {launchPromo.notice.map((line, i) => (
                  <span key={line} className="sm:block">
                    {i > 0 && " "}
                    {line}
                  </span>
                ))}
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

/**
 * 발급 결과. 버튼 자리를 그대로 대체한다 — 별도 알림창을 띄우면 팝업 위에
 * 팝업이 겹쳐 닫는 동선이 두 겹이 되기 때문.
 */
function CouponResult({
  coupons,
  onClose,
}: {
  coupons: IssuedCoupon[];
  onClose: () => void;
}) {
  const fresh = coupons.some((c) => c.fresh);
  const message = fresh
    ? launchPromo.couponMessages.issued
    : coupons.every((c) => c.used)
      ? launchPromo.couponMessages.used
      : launchPromo.couponMessages.already;

  return (
    <div role="status" aria-live="polite" className="text-center">
      <p className="flex items-center justify-center gap-1.5 text-[15px] font-bold text-ink">
        {fresh ? (
          <CheckCircle size={18} weight="fill" className="text-accent" />
        ) : (
          <Info size={18} weight="fill" className="text-muted" />
        )}
        {fresh ? `쿠폰 ${coupons.length}장을 받았어요` : "이미 받으셨어요"}
      </p>
      <p className="mt-1.5 break-keep text-[12px] leading-relaxed text-muted">{message}</p>
      <ul className="mt-2.5 space-y-1">
        {coupons.map((c) => (
          <li key={c.kind} className="text-[12px] text-muted">
            <span className="font-semibold text-ink">{couponDefs[c.kind].name}</span>{" "}
            <span className="font-mono tracking-wide text-ink">{c.code}</span>
            {c.used && <span className="ml-1 text-faint">· 사용 완료</span>}
          </li>
        ))}
      </ul>
      <Link
        href="/mypage"
        onClick={onClose}
        className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-ink underline underline-offset-4 transition-colors hover:text-accent"
      >
        마이페이지에서 보기
        <ArrowRight size={13} weight="bold" />
      </Link>
    </div>
  );
}
