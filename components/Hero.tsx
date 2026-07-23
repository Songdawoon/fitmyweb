"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Check } from "@phosphor-icons/react";
import { brand, heroAssurances, trustKeywords } from "@/lib/data";

const ease = [0.16, 1, 0.3, 1] as const;

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 sm:pt-32">
      {/* soft neutral wash, no loud gradient */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-mist to-paper" />

      <div className="container-page section-x pb-20 pt-10 sm:pb-28">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease }}
              className="eyebrow"
            >
              합리적인 커스텀 홈페이지 제작
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

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease, delay: 0.45 }}
              className="mt-9 flex flex-col gap-3 sm:flex-row"
            >
              <Link
                href="/#contact"
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

          {/* assurance rail */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.5 }}
            className="lg:col-span-4"
          >
            <div className="rounded-2xl border border-line bg-paper p-6 shadow-[0_20px_50px_-30px_rgba(16,23,51,0.25)]">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <ShieldCheck size={18} weight="fill" className="text-accent" />
                제작 약속
              </div>
              <ul className="mt-4 flex flex-col gap-3 border-t border-line pt-4">
                {heroAssurances.map((a) => (
                  <li key={a} className="flex items-start gap-2.5 text-[15px] text-ink">
                    <Check size={17} weight="bold" className="mt-0.5 shrink-0 text-accent" />
                    {a}
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap gap-1.5">
                {trustKeywords.map((k) => (
                  <span
                    key={k}
                    className="rounded-full bg-mist px-2.5 py-1 text-[12px] text-muted"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
