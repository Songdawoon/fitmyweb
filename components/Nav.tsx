"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { List, X } from "@phosphor-icons/react";
import { brand } from "@/lib/data";

const links = [
  { label: "소개", href: "/about" },
  { label: "4가지 FIT", href: "/#fit" },
  { label: "플랜", href: "/#plans" },
  { label: "포트폴리오", href: "/#portfolio" },
  { label: "제작 과정", href: "/#process" },
  { label: "FAQ", href: "/#faq" },
];

function Wordmark() {
  return (
    <Link href="/" className="flex items-baseline gap-2 leading-none">
      <span className="font-display text-xl font-extrabold tracking-tightest text-ink">
        {brand.name}
      </span>
      <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-faint sm:inline">
        {brand.latin}
      </span>
    </Link>
  );
}

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={`section-x flex items-center justify-between transition-all duration-300 ease-editorial ${
          scrolled
            ? "border-b border-line bg-paper/85 py-3 backdrop-blur-xl"
            : "border-b border-transparent py-5"
        }`}
      >
        <Wordmark />

        <nav className="hidden items-center gap-7 lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[15px] text-muted transition-colors duration-200 hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <Link
            href="/#contact"
            className="hidden rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper transition-colors duration-200 hover:bg-accent sm:inline-flex"
          >
            구성 제안받기
          </Link>
          <button
            aria-label="메뉴 열기"
            onClick={() => setOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-full border border-line text-ink lg:hidden"
          >
            <List size={20} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-paper lg:hidden"
          >
            <div className="section-x flex items-center justify-between py-5">
              <Wordmark />
              <button
                aria-label="메뉴 닫기"
                onClick={() => setOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-full border border-line"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="section-x mt-4 flex flex-col">
              {links.map((l, i) => (
                <motion.div
                  key={l.href}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * i + 0.05 }}
                >
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block border-b border-line py-4 font-display text-3xl font-bold tracking-tightest"
                  >
                    {l.label}
                  </Link>
                </motion.div>
              ))}
              <Link
                href="/#contact"
                onClick={() => setOpen(false)}
                className="mt-6 inline-flex items-center justify-center rounded-full bg-ink px-6 py-4 text-base font-semibold text-paper"
              >
                구성 제안받기
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
