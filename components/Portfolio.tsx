"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowSquareOut,
  CaretDown,
  ImageSquare,
} from "@phosphor-icons/react";
import {
  portfolioSamples,
  portfolioCategories,
  type PortfolioCategory,
  type PortfolioItem,
} from "@/lib/data";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";

/** 처음 노출할 개수 — 2열 그리드 기준 3줄. */
const INITIAL_COUNT = 6;
/** "더 보기" 한 번에 추가로 불러올 개수 — 2열 그리드 기준 2줄. */
const LOAD_STEP = 4;

type Filter = PortfolioCategory | "all";

export default function Portfolio() {
  const [active, setActive] = useState<Filter>("all");
  const [visible, setVisible] = useState(INITIAL_COUNT);

  const filtered = useMemo(
    () =>
      active === "all"
        ? portfolioSamples
        : portfolioSamples.filter((p) => p.category === active),
    [active],
  );

  // 필터를 바꿀 때 이전 탭에서 펼쳐 둔 개수가 그대로 남지 않도록 되돌린다.
  function selectFilter(id: Filter) {
    setActive(id);
    setVisible(INITIAL_COUNT);
  }

  const shown = filtered.slice(0, visible);
  const remaining = filtered.length - shown.length;

  return (
    <section id="portfolio" className="container-page section-x py-24 sm:py-32">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <SectionHeading
          eyebrow="Portfolio"
          title={["사업의 강점을 찾아", "웹사이트로 완성합니다"]}
        />
        <Reveal>
          <p className="max-w-[38ch] text-[15px] leading-relaxed text-muted md:text-right">
            마이핏웹의 포트폴리오는 디자인 결과만 나열하지 않고 고객의 문제,
            제안한 방향과 실제 해결 내용을 함께 보여줍니다.
          </p>
        </Reveal>
      </div>

      {/* 업종 필터 */}
      <Reveal>
        <div
          role="tablist"
          aria-label="포트폴리오 업종 필터"
          className="mt-10 flex flex-wrap gap-2"
        >
          {portfolioCategories.map((c) => {
            const isActive = c.id === active;
            const count =
              c.id === "all"
                ? portfolioSamples.length
                : portfolioSamples.filter((p) => p.category === c.id).length;

            return (
              <button
                key={c.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => selectFilter(c.id)}
                className={`relative rounded-full px-4 py-2 text-[14px] font-medium outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 ${
                  isActive
                    ? "text-paper"
                    : "border border-line text-muted hover:border-ink/30 hover:text-ink"
                }`}
              >
                {/* 활성 배경만 따로 두고 layoutId 로 옮겨 탭 사이를 미끄러지게 한다. */}
                {isActive && (
                  <motion.span
                    layoutId="portfolio-filter-pill"
                    transition={{ type: "spring", stiffness: 320, damping: 32 }}
                    className="absolute inset-0 rounded-full bg-ink"
                  />
                )}
                <span className="relative">
                  {c.label}
                  <span
                    className={`ml-1.5 text-[12px] ${
                      isActive ? "text-paper/60" : "text-faint"
                    }`}
                  >
                    {count}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </Reveal>

      {/* 실제 사례 준비 전 — 자리표시 카드. 허구 회사명·수치는 노출하지 않음 */}
      {shown.length > 0 ? (
        // key 를 필터에 걸어 두면 탭을 바꿀 때 카드가 새로 마운트되면서
        // Reveal 의 등장 모션이 다시 재생된다.
        <div key={active} className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {shown.map((p, i) => (
            <Reveal key={p.title} delay={(i % 2) * 0.08}>
              <PortfolioCard item={p} />
            </Reveal>
          ))}
        </div>
      ) : (
        <Reveal>
          <p className="mt-8 rounded-2xl border border-dashed border-line bg-mist px-6 py-16 text-center text-[14px] text-muted">
            이 업종의 사례는 준비 중입니다. 다른 업종을 살펴보시거나 상담을 남겨
            주세요.
          </p>
        </Reveal>
      )}

      {remaining > 0 && (
        <div className="mt-10 flex justify-center">
          <button
            onClick={() => setVisible((v) => v + LOAD_STEP)}
            className="group inline-flex items-center gap-2 rounded-full border border-line bg-paper px-6 py-3 text-[14px] font-semibold text-ink outline-none transition-colors duration-200 hover:border-ink/40 focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2"
          >
            사례 더 보기
            <span className="text-[13px] font-medium text-faint">
              +{Math.min(LOAD_STEP, remaining)}
            </span>
            <CaretDown
              size={15}
              weight="bold"
              className="transition-transform duration-200 group-hover:translate-y-0.5"
            />
          </button>
        </div>
      )}

      <Reveal delay={0.05}>
        <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-2xl border border-dashed border-line bg-mist px-6 py-5 sm:flex-row sm:items-center">
          <p className="text-[14px] text-muted">
            실제 제작 사례는 프로젝트 완료 순서대로 공개될 예정입니다. 준비되는
            대로 프로젝트별 문제·제안·결과와 PC·모바일 화면을 함께 담습니다.
          </p>
          <Link
            href="/#contact"
            className="group inline-flex shrink-0 items-center gap-1.5 text-[14px] font-semibold text-ink hover:text-accent"
          >
            내 프로젝트 상담하기
            <ArrowRight
              size={15}
              weight="bold"
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

/**
 * 사례 카드. url 이 있는 실제 사례는 새 탭으로 열리는 링크가 되고,
 * 아직 준비 중인 자리표시 항목은 클릭되지 않는 정적 카드로 남는다.
 */
function PortfolioCard({ item }: { item: PortfolioItem }) {
  const shell =
    "group block h-full overflow-hidden rounded-2xl border border-line bg-paper";

  const content = (
    <>
      <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden border-b border-line bg-mist">
        {item.image ? (
          <>
            <Image
              src={item.image}
              alt={`${item.industry} 홈페이지 제작 사례 — ${item.title}`}
              fill
              sizes="(min-width: 640px) 50vw, 100vw"
              className="object-cover object-top transition-transform duration-500 ease-editorial group-hover:scale-[1.03]"
            />
            {/* 호버 시에만 떠오르는 방문 안내 — 평소엔 화면을 가리지 않는다. */}
            <div className="absolute inset-0 flex items-center justify-center bg-ink/0 opacity-0 transition-all duration-300 group-hover:bg-ink/45 group-hover:opacity-100">
              <span className="inline-flex items-center gap-2 rounded-full bg-paper px-4 py-2 text-[13px] font-semibold text-ink">
                <ArrowSquareOut size={15} weight="bold" />
                사이트 보기
              </span>
            </div>
          </>
        ) : item.url ? (
          <div className="flex flex-col items-center gap-2 text-muted transition-colors duration-200 group-hover:text-accent">
            <ArrowSquareOut size={28} weight="light" />
            <span className="font-mono text-[11px] uppercase tracking-[0.16em]">
              사이트 보기
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-faint">
            <ImageSquare size={30} weight="thin" />
            <span className="font-mono text-[11px] uppercase tracking-[0.16em]">
              준비 중
            </span>
          </div>
        )}
        <span className="absolute left-4 top-4 z-10 rounded-full bg-paper/90 px-3 py-1 text-[12px] font-medium text-muted backdrop-blur-sm">
          {item.industry}
        </span>
      </div>
      <div className="p-6">
        <h3 className="text-[17px] font-bold leading-snug tracking-tight text-ink">
          {item.title}
        </h3>
        <p className="mt-2 text-[13px] text-muted">핵심 · {item.focus}</p>
      </div>
    </>
  );

  if (!item.url) return <article className={shell}>{content}</article>;

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${shell} outline-none transition-colors duration-200 hover:border-ink/40 focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2`}
    >
      {content}
    </a>
  );
}
