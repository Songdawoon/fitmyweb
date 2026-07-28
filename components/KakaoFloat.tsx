"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChatCircleDots } from "@phosphor-icons/react";
import { kakaoConsult } from "@/lib/data";

const ENTER_DELAY_MS = 900;

const spring = { type: "spring", stiffness: 120, damping: 20 } as const;

/**
 * 우하단 카카오톡 상담 버튼.
 *
 * 페이지 내 #contact 폼은 스크롤해서 찾아가야 하지만 이 버튼은 어느 위치에서든
 * 바로 상담을 걸 수 있다. 정지한 아이콘은 배너로 오인돼 무시되기 쉬워서
 * 수면에 뜬 것처럼 계속 미세하게 움직인다.
 */
export default function KakaoFloat() {
  const [shown, setShown] = useState(false);
  const reduceMotion = useReducedMotion();

  // 첫 화면이 그려진 뒤 등장시킨다 — 로딩 중 튀어나오면 시선을 뺏는다.
  useEffect(() => {
    const timer = window.setTimeout(() => setShown(true), ENTER_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  // 부유 모션 — y 와 rotate 의 주기를 어긋나게 줘야 반복이 눈에 띄지 않는다.
  // 같은 주기로 돌리면 기계적으로 까딱이는 느낌이 난다.
  const bob = reduceMotion
    ? undefined
    : {
        animate: { y: [0, -8, 0], rotate: [-2, 2, -2] },
        transition: {
          y: { duration: 3.2, repeat: Infinity, ease: "easeInOut" as const },
          rotate: { duration: 5.1, repeat: Infinity, ease: "easeInOut" as const },
        },
      };

  return (
    <AnimatePresence>
      {shown && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={spring}
          // z-40 — 쿠폰 팝업(z-[90])과 모바일 메뉴(z-50)가 이 버튼을 덮어야 한다.
          // 위로 올라오면 딤 처리를 뚫고 클릭돼 포커스 트랩이 깨진다.
          className="fixed right-5 z-40 bottom-[calc(1.25rem+env(safe-area-inset-bottom))] sm:right-7 sm:bottom-[calc(1.75rem+env(safe-area-inset-bottom))]"
        >
          <motion.div {...bob}>
            <a
              href={kakaoConsult.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={kakaoConsult.label}
              className="group relative block outline-none"
            >
              {/* 툴팁 — absolute 로 띄워 앵커 폭에 포함시키지 않는다.
                  레이아웃을 차지하면 버튼 왼쪽 빈 공간까지 클릭 영역이 된다.
                  모바일은 폭이 좁아 숨긴다. */}
              <span
                aria-hidden
                className="pointer-events-none absolute right-full top-1/2 mr-3 hidden -translate-y-1/2 translate-x-2 whitespace-nowrap rounded-full bg-ink px-3 py-1.5 text-[13px] font-medium text-paper opacity-0 shadow-lg transition-all duration-300 ease-editorial group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 sm:block"
              >
                {kakaoConsult.tooltip}
              </span>

              <span className="relative block">
                {/* 수면 파문 */}
                {!reduceMotion && (
                  <motion.span
                    aria-hidden
                    animate={{ scale: [1, 1.8], opacity: [0.35, 0] }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: "easeOut" }}
                    className="absolute inset-0 rounded-full bg-kakao"
                  />
                )}

                <motion.span
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  transition={spring}
                  className="relative grid h-28 w-28 place-items-center rounded-full bg-kakao text-kakao-ink shadow-[0_18px_40px_-12px_rgba(16,23,51,0.45)] ring-0 transition-shadow duration-300 group-focus-visible:ring-2 group-focus-visible:ring-kakao-ink/40 group-focus-visible:ring-offset-2 sm:h-32 sm:w-32"
                >
                  <ChatCircleDots size={56} weight="fill" className="sm:hidden" />
                  <ChatCircleDots size={64} weight="fill" className="hidden sm:block" />
                </motion.span>
              </span>
            </a>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
