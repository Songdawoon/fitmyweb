"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChartBar, RocketLaunch, ChartLineUp } from "@phosphor-icons/react";
import { stats } from "@/lib/data";

const icons = {
  brands: ChartBar,
  sales: RocketLaunch,
  conversion: ChartLineUp,
} as const;

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
};

export default function HeroStats() {
  const [[index, dir], setState] = useState<[number, number]>([0, 0]);
  const paused = useRef(false);
  const n = stats.length;

  const go = (d: number) => setState(([i]) => [(i + d + n) % n, d]);

  useEffect(() => {
    const t = setInterval(() => {
      if (!paused.current) setState(([i]) => [(i + 1) % n, 1]);
    }, 3200);
    return () => clearInterval(t);
  }, [n]);

  const s = stats[index];
  const Icon = icons[s.icon];

  return (
    <div
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-line bg-paper shadow-[0_30px_70px_-40px_rgba(16,23,51,0.4)]">
        <div className="absolute inset-x-0 top-0 z-10 flex justify-center pt-6">
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-faint">
            MY FIT WEB · 성과
          </span>
        </div>

        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.div
            key={index}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 32 },
              opacity: { duration: 0.2 },
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.5}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60) go(1);
              else if (info.offset.x > 60) go(-1);
            }}
            className="absolute inset-0 flex cursor-grab flex-col items-center justify-center px-8 text-center active:cursor-grabbing"
          >
            <Icon size={60} weight="light" className="text-accent" />
            {s.value && (
              <div className="mt-5 flex items-baseline gap-0.5">
                <span className="font-display text-6xl font-extrabold tracking-tightest text-ink">
                  {s.value}
                </span>
                {s.suffix && (
                  <span className="font-display text-3xl font-bold text-accent">
                    {s.suffix}
                  </span>
                )}
              </div>
            )}
            <p className="mt-3 text-lg font-semibold tracking-tight text-ink">
              {s.label}
            </p>
            {s.note && <p className="mt-1 text-[13px] text-muted">({s.note})</p>}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* pagination */}
      <div className="mt-5 flex items-center justify-center gap-2">
        {stats.map((st, i) => (
          <button
            key={st.label}
            aria-label={`${st.label} 보기`}
            onClick={() => go(i - index)}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: i === index ? 22 : 8,
              background: i === index ? "#f05540" : "#e5e8f0",
            }}
          />
        ))}
      </div>
    </div>
  );
}
