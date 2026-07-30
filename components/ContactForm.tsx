"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle,
  SpinnerGap,
  ArrowRight,
  Phone,
  EnvelopeSimple,
  ChatCircleDots,
} from "@phosphor-icons/react";
import {
  brand,
  budgetOptions,
  contactFormEnabled,
  contactPaused,
  hasRealPhone,
  kakaoConsult,
} from "@/lib/data";
import DateField from "./DateField";

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
    // 폼을 닫아 둔 동안에는 제출 자체를 받지 않는다. 입력은 fieldset 으로
    // 막혀 있지만, 엔터 제출 같은 경로가 남아 있어 여기서 한 번 더 끊는다.
    if (!contactFormEnabled) return;
    if (!validate()) return;
    setStatus("loading");
    setServerError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      // 접수 실패 사유는 서버가 더 잘 안다(메일 발송 실패 등). 그대로 보여준다.
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message ?? "요청 처리에 실패했습니다.");
      }
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
    <div className="grid gap-5">
      {/*
        폼을 닫아 둔 동안에는 직접 연락 수단을 먼저 보여준다. 폼 자체는
        지우지 않고 그대로 두되(다시 열 때 contactFormEnabled 만 바꾸면 된다)
        입력과 제출만 막는다.
      */}
      {!contactFormEnabled && <ContactChannels />}

      <form
        onSubmit={onSubmit}
        noValidate
        className="rounded-3xl border border-line bg-paper p-7 sm:p-9"
      >
        <fieldset
          disabled={!contactFormEnabled}
          className={contactFormEnabled ? "" : "opacity-55"}
        >
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
              <DateField
                value={form.timeline}
                onChange={(v) => set("timeline", v)}
                placeholder="날짜를 선택하거나 직접 입력해 주세요"
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

          {!contactFormEnabled && (
            <p className="mt-4 text-[13px] leading-relaxed text-muted">
              {contactPaused.formNotice}
            </p>
          )}
        </fieldset>
      </form>
    </div>
  );
}

/**
 * 상담 폼을 닫아 둔 동안 노출하는 직접 연락 수단.
 * 전화번호는 아직 자리표시자일 수 있어(hasRealPhone) 실제 번호가 들어왔을 때만 넣는다.
 */
function ContactChannels() {
  const channels = [
    ...(hasRealPhone
      ? [
          {
            key: "phone",
            icon: Phone,
            label: "전화 상담",
            value: brand.phone,
            href: `tel:${brand.phone.replace(/[^\d+]/g, "")}`,
            external: false,
          },
        ]
      : []),
    {
      key: "email",
      icon: EnvelopeSimple,
      label: "이메일 문의",
      value: brand.email,
      href: `mailto:${brand.email}`,
      external: false,
    },
    {
      key: "kakao",
      icon: ChatCircleDots,
      label: "카카오톡 상담",
      value: "1:1 채팅 상담",
      href: kakaoConsult.url,
      external: true,
    },
  ];

  return (
    <div className="rounded-3xl border border-line bg-paper p-7 sm:p-9">
      <h3 className="font-display text-xl font-bold tracking-tight text-ink">
        {contactPaused.title}
      </h3>
      <p className="mt-2.5 max-w-[46ch] text-[15px] leading-relaxed text-muted">
        {contactPaused.body}
      </p>

      <ul className="mt-6 grid gap-3">
        {channels.map((c) => (
          <li key={c.key}>
            <a
              href={c.href}
              {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="group flex items-center gap-4 rounded-2xl border border-line px-5 py-4 outline-none transition-colors duration-200 hover:border-ink/40 focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-mist text-ink transition-colors duration-200 group-hover:bg-accent group-hover:text-paper">
                <c.icon size={18} weight="bold" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] text-muted">{c.label}</span>
                <span className="block truncate text-[16px] font-bold text-ink">
                  {c.value}
                </span>
              </span>
              <ArrowRight
                size={16}
                weight="bold"
                className="shrink-0 text-faint transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-ink"
              />
            </a>
          </li>
        ))}
      </ul>

      <p className="mt-5 text-[13px] text-faint">상담 가능 시간 · {brand.hours}</p>
    </div>
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
