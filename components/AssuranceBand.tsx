"use client";

import { motion } from "framer-motion";
import { ShieldCheck, ArrowUUpLeft } from "@phosphor-icons/react";
import { assuranceMetrics, assuranceNote } from "@/lib/data";

const icons = {
  warranty: ShieldCheck,
  refund: ArrowUUpLeft,
} as const;

const spring = { type: "spring", stiffness: 120, damping: 18 } as const;

export default function AssuranceBand() {
  return (
    <section className="border-y border-line bg-mist">
      <div className="container-page section-x py-14 sm:py-16">
        <div className="mx-auto grid max-w-4xl gap-4">
          {assuranceMetrics.map((m, i) => {
            const Icon = icons[m.icon];
            return (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ ...spring, delay: i * 0.12 }}
                whileHover={{ y: -3 }}
                className="group relative flex items-center gap-5 overflow-hidden rounded-2xl border border-line bg-paper p-6 shadow-[0_20px_50px_-40px_rgba(16,23,51,0.4)] transition-colors duration-300 hover:border-accent/40 sm:gap-7 sm:p-7"
              >
                {/* attention shimmer sweep */}
                <motion.span
                  aria-hidden
                  initial={{ x: "-140%" }}
                  animate={{ x: "260%" }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    repeatDelay: 2.8,
                    delay: i * 1.3,
                    ease: "easeInOut",
                  }}
                  className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-accent/12 to-transparent"
                />

                {/* icon with sonar pulse */}
                <div className="relative shrink-0">
                  <motion.span
                    aria-hidden
                    animate={{ scale: [1, 1.7], opacity: [0.4, 0] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeOut",
                      delay: i * 0.6,
                    }}
                    className="absolute inset-0 rounded-full bg-accent"
                  />
                  <span className="relative grid h-14 w-14 place-items-center rounded-full bg-accent text-paper">
                    <Icon size={26} weight="fill" />
                  </span>
                </div>

                {/* text */}
                <div className="flex flex-1 flex-col sm:flex-row sm:items-baseline sm:gap-4">
                  <span className="font-display text-2xl font-extrabold tracking-tightest text-ink sm:text-3xl">
                    {m.value}
                  </span>
                  <span className="text-[14px] leading-relaxed text-muted sm:text-[15px]">
                    {m.label}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        <p className="mt-6 text-center text-[12px] text-faint">* {assuranceNote}</p>
      </div>
    </section>
  );
}
