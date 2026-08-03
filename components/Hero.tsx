"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "@phosphor-icons/react";
import { brand, heroAudience, heroDifferentiators } from "@/lib/data";
import { inboundChannel, track } from "@/lib/track";
import HeroStats from "./HeroStats";

const ease = [0.16, 1, 0.3, 1] as const;

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 sm:pt-32">
      {/* soft neutral wash, no loud gradient */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-mist to-paper" />

      <div className="container-page section-x pb-16 pt-10 sm:pb-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
          {/* headline block */}
          <div className="lg:col-span-7">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="eyebrow"
          >
            {heroAudience}
          </motion.p>

          <h1 className="mt-6 h-display text-[9vw] leading-[1.18] sm:text-5xl lg:text-[3.9rem]">
            {brand.mainCopy.map((line, i) => (
              <span key={line} className="block overflow-hidden py-0.5">
                <motion.span
                  initial={{ y: "110%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.7, ease, delay: 0.1 + i * 0.08 }}
                  className="block"
                >
                  {i === 1 ? (
                    <>
                      합리적인 <span className="text-accent">비용</span>으로
                    </>
                  ) : (
                    line
                  )}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.35 }}
            className="mt-7 max-w-[52ch] text-[17px] leading-relaxed text-muted"
          >
            업종과 고객, 제작 목적을 이해하고 페이지 구성부터 디자인과 기능까지
            비즈니스에 맞춰 제작합니다.{" "}
            <span className="text-ink">{brand.subMessage}</span>
          </motion.p>

          {/* 차별점 — CTA 위에 둔다. 무엇이 다른지 모르는 채로 버튼을 만나면
              누를 이유가 없다. 첫 화면 안에 들어가도록 세 줄로 제한했다. */}
          <motion.ul
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.4 }}
            className="mt-7 flex flex-col gap-2.5 border-l-2 border-accent/30 pl-4"
          >
            {heroDifferentiators.map((d) => (
              <li key={d.label} className="text-[15px] leading-snug">
                <span className="font-semibold text-ink">{d.label}</span>
                {/* 설명은 모바일에서 감춘다. 세 줄이 각각 두세 줄로 접히면
                    CTA 가 첫 화면 밖으로 밀려난다 — 라벨만으로도 차별점은
                    전달되고, 근거는 아래 섹션에서 다시 나온다. */}
                <span className="hidden text-muted sm:inline"> — {d.detail}</span>
              </li>
            ))}
          </motion.ul>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.45 }}
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <Link
              href="/#contact"
              onClick={() => track("cta_click", { where: "hero", ...inboundChannel() })}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-accent px-7 py-3.5 text-[15px] font-semibold text-paper transition-all duration-200 hover:bg-accent-ink active:scale-[0.98]"
            >
              내 사업에 맞는 구성 제안받기
              <ArrowRight
                size={17}
                weight="bold"
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </Link>
            <Link
              href="/#portfolio"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-line px-7 py-3.5 text-[15px] font-semibold text-ink transition-colors duration-200 hover:border-ink/40"
            >
              포트폴리오 보기
            </Link>
          </motion.div>
          </div>

          {/* auto-playing card gallery */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.4 }}
            className="lg:col-span-5"
          >
            <HeroStats />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
