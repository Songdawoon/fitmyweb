"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, SpinnerGap, ArrowRight } from "@phosphor-icons/react";
import { brand, budgetOptions } from "@/lib/data";

type Form = {
  name: string;
  phone: string;
  email: string;
  industry: string;
  purpose: string;
  needs: string;
  reference: string;
  budget: string;
  timeline: string;
  message: string;
  consent: boolean;
};

type Errors = Partial<Record<keyof Form, string>>;

const empty: Form = {
  name: "",
  phone: "",
  email: "",
  industry: "",
  purpose: "",
  needs: "",
  reference: "",
  budget: "",
  timeline: "",
  message: "",
  consent: false,
};

export default function ContactForm() {
  const [form, setForm] = useState<Form>(empty);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [serverError, setServerError] = useState("");

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): boolean {
    const e: Errors = {};
    if (form.name.trim().length < 2) e.name = "이름 또는 업체명을 입력해 주세요.";
    if (form.phone.replace(/\D/g, "").length < 9)
      e.phone = "연락 가능한 번호를 입력해 주세요.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "올바른 이메일 형식이 아닙니다.";
    if (form.purpose.trim().length < 2)
      e.purpose = "제작 목적을 간단히 적어 주세요.";
    if (!form.consent) e.consent = "개인정보 수집·이용에 동의해 주세요.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setStatus("loading");
    setServerError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("요청 처리에 실패했습니다.");
      setStatus("success");
      setForm(empty);
    } catch (err) {
      setStatus("error");
      setServerError(
        err instanceof Error ? err.message : "잠시 후 다시 시도해 주세요.",
      );
    }
  }

  if (status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-line bg-paper p-10 text-center"
      >
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-accent/12">
          <CheckCircle size={34} weight="fill" className="text-accent" />
        </div>
        <h3 className="mt-6 font-display text-2xl font-bold tracking-tight text-ink">
          상담 신청이 접수되었습니다
        </h3>
        <p className="mx-auto mt-3 max-w-[46ch] text-[15px] leading-relaxed text-muted">
          남겨주신 내용을 검토한 뒤 영업일 기준으로 빠르게 연락드리겠습니다.
          급한 문의는 {brand.email} 으로 보내주셔도 됩니다.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-8 rounded-full border border-line px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-ink/40"
        >
          새 상담 신청하기
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-3xl border border-line bg-paper p-7 sm:p-9">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="이름 또는 업체명" error={errors.name} required>
          <input
            className="field"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="마이핏 컴퍼니"
          />
        </Field>
        <Field label="연락처" error={errors.phone} required>
          <input
            className="field"
            inputMode="numeric"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="010 0000 0000"
          />
        </Field>
        <Field label="이메일" error={errors.email} required>
          <input
            className="field"
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="you@company.com"
          />
        </Field>
        <Field label="업종" error={errors.industry}>
          <input
            className="field"
            value={form.industry}
            onChange={(e) => set("industry", e.target.value)}
            placeholder="예: 제조, 교육, 컨설팅"
          />
        </Field>
        <Field label="홈페이지 제작 목적" error={errors.purpose} required className="sm:col-span-2">
          <input
            className="field"
            value={form.purpose}
            onChange={(e) => set("purpose", e.target.value)}
            placeholder="예: 상담 문의 늘리기, 회사 소개, 제품 판매"
          />
        </Field>
        <Field label="필요한 페이지 또는 기능" className="sm:col-span-2">
          <input
            className="field"
            value={form.needs}
            onChange={(e) => set("needs", e.target.value)}
            placeholder="예: 회사소개, 제품, 문의폼, 게시판, 결제"
          />
        </Field>
        <Field label="참고 사이트">
          <input
            className="field"
            value={form.reference}
            onChange={(e) => set("reference", e.target.value)}
            placeholder="https://"
          />
        </Field>
        <Field label="예상 예산">
          <select
            className="field appearance-none bg-[right_1rem_center] pr-10"
            value={form.budget}
            onChange={(e) => set("budget", e.target.value)}
          >
            <option value="">선택해 주세요</option>
            {budgetOptions.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </Field>
        <Field label="희망 오픈 일정" className="sm:col-span-2">
          <input
            className="field"
            value={form.timeline}
            onChange={(e) => set("timeline", e.target.value)}
            placeholder="예: 다음 달 중, 미정"
          />
        </Field>
        <Field label="문의 내용" className="sm:col-span-2">
          <textarea
            className="field min-h-[120px] resize-y"
            value={form.message}
            onChange={(e) => set("message", e.target.value)}
            placeholder="사업과 서비스, 원하시는 방향을 자유롭게 적어 주세요."
          />
        </Field>
      </div>

      <div className="mt-6 grid gap-2">
        <label className="flex cursor-pointer items-start gap-3 text-[14px] text-ink">
          <input
            type="checkbox"
            checked={form.consent}
            onChange={(e) => set("consent", e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
          />
          <span>
            상담 진행을 위한 <span className="underline underline-offset-2">개인정보 수집·이용</span>
            에 동의합니다. (이름, 연락처, 이메일 · 문의 응대 목적)
          </span>
        </label>
        {errors.consent && <p className="pl-7 text-[13px] text-accent">{errors.consent}</p>}
      </div>

      {status === "error" && (
        <p className="mt-4 rounded-xl border border-accent/40 bg-accent/[0.06] px-4 py-3 text-[13px] text-accent-ink">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="group mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-7 py-4 text-[15px] font-semibold text-paper transition-all duration-200 hover:bg-accent-ink disabled:opacity-60 active:scale-[0.99] sm:w-auto"
      >
        {status === "loading" ? (
          <>
            <SpinnerGap size={18} weight="bold" className="animate-spin" />
            보내는 중…
          </>
        ) : (
          <>
            내 사업에 맞는 구성 제안받기
            <ArrowRight
              size={16}
              weight="bold"
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </>
        )}
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  required,
  className = "",
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`grid gap-2 ${className}`}>
      <label className="text-[14px] font-medium text-ink">
        {label}
        {required && <span className="ml-1 text-accent">*</span>}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-[13px] text-accent"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
