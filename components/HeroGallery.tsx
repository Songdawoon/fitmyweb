"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

const slides = [
  { seed: "myfitweb-brand", tag: "브랜드 소개형", tone: "기업 · 브랜드" },
  { seed: "myfitweb-booking", tag: "예약 · 문의형", tone: "전문 서비스" },
  { seed: "myfitweb-product", tag: "제품 상세형", tone: "제조 · 커머스" },
  { seed: "myfitweb-onepage", tag: "원페이지형", tone: "1인 · 창업" },
];

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
};

export default function HeroGallery() {
  const [[index, dir], setState] = useState<[number, number]>([0, 0]);
  const paused = useRef(false);
  const n = slides.length;

  const go = (d: number) => setState(([i]) => [(i + d + n) % n, d]);

  useEffect(() => {
    const t = setInterval(() => {
      if (!paused.current) setState(([i]) => [(i + 1) % n, 1]);
    }, 3500);
    return () => clearInterval(t);
  }, [n]);

  const slide = slides[index];

  return (
    <div
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-line bg-paper shadow-[0_30px_70px_-40px_rgba(16,23,51,0.4)]">
        {/* browser chrome */}
        <div className="absolute inset-x-0 top-0 z-10 flex items-center gap-1.5 border-b border-line/70 bg-paper/80 px-4 py-3 backdrop-blur">
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
          <span className="ml-3 h-4 flex-1 rounded-full bg-mist" />
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
            className="absolute inset-0 cursor-grab active:cursor-grabbing"
          >
            <Image
              src={`https://picsum.photos/seed/${slide.seed}/900/680`}
              alt={`${slide.tag} 홈페이지 예시`}
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover"
              priority={index === 0}
              draggable={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
              <div>
                <span className="inline-flex rounded-full bg-accent px-3 py-1 text-[12px] font-semibold text-paper">
                  {slide.tag}
                </span>
                <p className="mt-2 text-[13px] font-medium text-paper/85">
                  {slide.tone}
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* pagination */}
      <div className="mt-5 flex items-center justify-center gap-2">
        {slides.map((s, i) => (
          <button
            key={s.seed}
            aria-label={`${s.tag} 보기`}
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
