"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "@phosphor-icons/react";
import { faqs } from "@/lib/data";

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="container-page section-x py-24 sm:py-32">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="eyebrow">FAQ</p>
          <h2 className="mt-5 h-display text-3xl/[1.3] sm:text-4xl/[1.3]">
            자주 묻는
            <br />
            질문
          </h2>
          <p className="mt-6 max-w-[34ch] text-[15px] leading-relaxed text-muted">
            더 궁금한 점은 상담 신청 시 함께 남겨주시면 자세히 안내해드립니다.
          </p>
        </div>

        <div className="lg:col-span-8">
          <ul className="border-t border-line">
            {faqs.map((item, i) => {
              const isOpen = open === i;
              return (
                <li key={item.q} className="border-b border-line">
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="flex w-full items-start justify-between gap-6 py-6 text-left"
                  >
                    <span className="flex items-baseline gap-3">
                      <span className="font-mono text-sm text-accent">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-[17px] font-semibold text-ink sm:text-[18px]">
                        {item.q}
                      </span>
                    </span>
                    <motion.span
                      animate={{ rotate: isOpen ? 45 : 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className="mt-0.5 shrink-0 text-muted"
                    >
                      <Plus size={20} />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="max-w-[62ch] pb-6 pl-9 text-[15px] leading-relaxed text-muted">
                          {item.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
