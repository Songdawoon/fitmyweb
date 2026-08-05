"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle,
  SpinnerGap,
  ArrowRight,
  CaretDown,
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
  inquiryAssurance,
  inquiryNextSteps,
  kakaoConsult,
} from "@/lib/data";
import { inboundChannel, track } from "@/lib/track";
import { formatPhone, isValidPhone, PHONE_HINT, PHONE_PLACEHOLDER } from "@/lib/phone";
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
  // 선택 항목은 접어 둔다. 처음 보이는 입력칸이 많을수록 시작 자체를 미룬다.
  const [detailsOpen, setDetailsOpen] = useState(false);

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  /**
   * 필수는 이름·연락처·제작목적 셋뿐이다.
   *
   * 이메일은 연락처가 이미 있으므로 선택으로 내렸다. 다만 적어 넣었다면
   * 오타로 답장을 못 보내는 일이 없도록 형식은 검사한다.
   */
  function validate(): boolean {
    const e: Errors = {};
    if (form.name.trim().length < 2) e.name = "이름 또는 업체명을 입력해 주세요.";
    if (!isValidPhone(form.phone)) e.phone = PHONE_HINT;
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "올바른 이메일 형식이 아닙니다.";
    if (form.purpose.trim().length < 2)
      e.purpose = "제작 목적을 간단히 적어 주세요.";
    if (!form.consent) e.consent = "개인정보 수집·이용에 동의해 주세요.";
    setErrors(e);
    // 접어 둔 영역 안에 오류가 생기면 열어 준다 — 안 보이는 곳에서 막히면
    // 왜 안 되는지 알 수 없다.
    if (e.email) setDetailsOpen(true);
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
      // 서버가 접수까지 끝낸 시점에만 전환으로 센다. 제출 버튼 클릭을 전환으로
      // 세면 실패한 시도까지 섞여 전환율이 부풀려진다.
      track("inquiry_submitted", {
        budget: form.budget || "미기재",
        industry: form.industry || "미기재",
        ...inboundChannel(),
      });
      setStatus("success");
      setForm(empty);
    } catch (err) {
      track("inquiry_failed", { ...inboundChannel() });
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
          담당자가 <span className="font-semibold text-ink">1영업일 안에</span> 직접
          연락드립니다. 급한 문의는 {brand.email} 으로 보내주셔도 됩니다.
        </p>

        {/* 접수 후 무엇이 이어지는지 한 번 더 보여 준다. 기다리는 동안
            "연락이 오긴 오나" 하는 불안이 가장 흔한 이탈 사유다. */}
        <ol className="mx-auto mt-8 grid max-w-[30rem] gap-3 text-left">
          {inquiryNextSteps.map((s) => (
            <li key={s.step} className="flex gap-3.5 rounded-2xl border border-line p-4">
              <span className="font-mono text-[12px] font-bold text-accent">{s.step}</span>
              <span>
                <span className="block text-[15px] font-semibold text-ink">{s.title}</span>
                <span className="mt-0.5 block text-[13px] leading-relaxed text-muted">
                  {s.desc}
                </span>
              </span>
            </li>
          ))}
        </ol>

        <button
          onClick={() => setStatus("idle")}
          className="mt-8 rounded-full border border-line px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-ink/40"
        >
          새 상담 신청하기
        </button>
      </motion.div>
    );
  }

  // 폼을 닫아 둔 동안에는 직접 연락 수단만 보여준다. 폼 마크업은 아래에 그대로
  // 두었으므로, lib/data.ts 의 contactFormEnabled 를 true 로 되돌리면 살아난다.
  if (!contactFormEnabled) return <ContactChannels />;

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-3xl border border-line bg-paper p-7 sm:p-9">
      <p className="mb-6 rounded-2xl bg-mist px-4 py-3 text-[13.5px] leading-relaxed text-muted">
        {inquiryAssurance}
      </p>

      {/* 필수는 셋뿐이다. 나머지는 아래 "자세히 알려주기" 안으로 접어 두어
          첫인상에서 폼이 길어 보이지 않게 한다. */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="이름 또는 업체명" error={errors.name} required>
          <input
            className="field"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="예: OO컴퍼니"
          />
        </Field>
        <Field label="연락처" error={errors.phone} required>
          <input
            className="field"
            inputMode="tel"
            value={form.phone}
            onChange={(e) => set("phone", formatPhone(e.target.value))}
            placeholder={PHONE_PLACEHOLDER}
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
      </div>

      <button
        type="button"
        onClick={() => setDetailsOpen((v) => !v)}
        aria-expanded={detailsOpen}
        className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-semibold text-muted transition-colors hover:text-ink"
      >
        {detailsOpen ? "간단히 보기" : "자세히 알려주기 (선택)"}
        <CaretDown
          size={14}
          weight="bold"
          className={`transition-transform duration-200 ${detailsOpen ? "rotate-180" : ""}`}
        />
      </button>
      <p className="mt-1.5 text-[13px] text-faint">
        적어주시면 상담이 빨라집니다. 비워두셔도 접수됩니다.
      </p>

      <div
        className={`grid grid-cols-1 gap-5 sm:grid-cols-2 ${detailsOpen ? "mt-6" : "hidden"}`}
      >
        <Field label="이메일" error={errors.email}>
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
            상담 진행을 위한{" "}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="underline underline-offset-2 hover:text-accent"
            >
              개인정보 수집·이용
            </a>
            에 동의합니다. (이름, 연락처, 이메일 · 상담 응대 목적 · 문의 처리 후 3년 보관)
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
            event: "phone_click" as const,
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
      event: "email_click" as const,
    },
    {
      key: "kakao",
      icon: ChatCircleDots,
      label: "카카오톡 상담",
      value: "1:1 채팅 상담",
      href: kakaoConsult.url,
      external: true,
      event: "kakao_click" as const,
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
              onClick={() => track(c.event, { where: "contact", ...inboundChannel() })}
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
