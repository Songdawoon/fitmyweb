"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, SpinnerGap } from "@phosphor-icons/react";

import { briefFields, briefIntro, type BriefField, type BriefFieldKey } from "@/lib/data";
import { formatPhone, PHONE_PLACEHOLDER } from "@/lib/phone";
import DateField from "./DateField";

export type BriefValues = Record<BriefFieldKey, string>;

type Props = {
  token: string;
  initial: BriefValues;
  /** 이미 한 번 보낸 적이 있으면 화면 문구가 "수정" 으로 바뀐다. */
  submitted: boolean;
  planName: string | null;
};

function Field({
  field,
  error,
  children,
}: {
  field: BriefField;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={field.full ? "sm:col-span-2" : undefined}>
      <label className="mb-1.5 block text-[13px] font-medium text-muted">
        {field.label}
        {field.required && <span className="ml-1 text-accent">*</span>}
      </label>
      {children}
      {field.hint && !error && (
        <p className="mt-1.5 text-[12px] text-faint">{field.hint}</p>
      )}
      {error && <p className="mt-1.5 text-[13px] text-accent">{error}</p>}
    </div>
  );
}

export default function BriefForm({ token, initial, submitted, planName }: Props) {
  const [values, setValues] = useState<BriefValues>(initial);
  const [errors, setErrors] = useState<Partial<Record<BriefFieldKey, string>>>({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");

  function set(key: BriefFieldKey, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const next: Partial<Record<BriefFieldKey, string>> = {};

    for (const field of briefFields) {
      if (field.required && !values[field.key].trim()) {
        next[field.key] = `${field.label}을(를) 입력해 주세요.`;
      }
    }
    if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      next.email = "올바른 이메일 형식이 아닙니다.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit() {
    if (!validate()) return;

    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/brief/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => ({ ok: false }));

      if (!data.ok) {
        setMessage(data.message ?? "저장하지 못했습니다.");
        return;
      }
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setMessage("네트워크 오류로 저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-line bg-paper p-10 text-center"
      >
        <CheckCircle size={40} weight="fill" className="mx-auto text-accent" />
        <h2 className="mt-5 font-display text-2xl font-extrabold tracking-tight text-ink">
          잘 받았습니다
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          담당자가 내용을 확인하고 연락드리겠습니다.
          <br />이 링크로 언제든 다시 들어와 고치실 수 있습니다.
        </p>
        <button
          type="button"
          onClick={() => setDone(false)}
          className="mt-7 rounded-full border border-line px-6 py-3 text-sm font-semibold text-muted transition-colors hover:border-ink hover:text-ink"
        >
          내용 계속 보기
        </button>
      </motion.div>
    );
  }

  return (
    <>
      <div className="grid gap-x-5 gap-y-6 sm:grid-cols-2">
        {briefFields.map((field) => {
          const value = values[field.key];
          const error = errors[field.key];

          return (
            <Field key={field.key} field={field} error={error}>
              {field.type === "textarea" ? (
                <textarea
                  className="field min-h-[110px] resize-y"
                  placeholder={field.placeholder}
                  value={value}
                  maxLength={field.max}
                  onChange={(e) => set(field.key, e.target.value)}
                />
              ) : field.type === "select" ? (
                <select
                  className="field appearance-none"
                  value={value}
                  onChange={(e) => set(field.key, e.target.value)}
                >
                  <option value="">선택해 주세요</option>
                  {field.options?.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : field.type === "date" ? (
                <DateField
                  value={value}
                  onChange={(v) => set(field.key, v)}
                  placeholder="예: 2026년 9월 1일 또는 미정"
                />
              ) : (
                <input
                  className="field"
                  type={field.type === "email" ? "email" : "text"}
                  inputMode={field.type === "tel" ? "tel" : undefined}
                  placeholder={field.type === "tel" ? PHONE_PLACEHOLDER : field.placeholder}
                  value={value}
                  maxLength={field.max}
                  onChange={(e) =>
                    set(field.key, field.type === "tel" ? formatPhone(e.target.value) : e.target.value)
                  }
                />
              )}
            </Field>
          );
        })}
      </div>

      <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-8 py-4 text-sm font-semibold text-paper transition-all hover:bg-accent-ink disabled:opacity-60"
        >
          {saving && <SpinnerGap size={16} weight="bold" className="animate-spin" />}
          {saving ? "보내는 중…" : submitted ? "수정한 내용 보내기" : "보내기"}
        </button>
        <p className="text-[13px] text-faint">
          {planName ? `${planName} · ` : ""}
          {briefIntro.assurance}
        </p>
      </div>

      <AnimatePresence>
        {message && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4 text-[13px] text-accent"
          >
            {message}
          </motion.p>
        )}
      </AnimatePresence>
    </>
  );
}
