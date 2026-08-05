"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { asQuoteStatus, quoteStatusLabel, quoteStatusTone } from "@/lib/quoteStatus";

type Props = {
  quoteId: string;
  ref_: string;
  url: string;
  status: string;
  customerEmail: string | null;
  sentAt: string | null;
  sentCount: number;
};

export default function QuoteAdminActions({
  quoteId,
  ref_,
  url,
  status,
  customerEmail,
  sentAt,
  sentCount,
}: Props) {
  const router = useRouter();
  const urlInput = useRef<HTMLInputElement>(null);

  const [busy, setBusy] = useState<"send" | "status" | null>(null);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);

  const state = asQuoteStatus(status);

  async function copyLink() {
    setFailed(false);
    try {
      await navigator.clipboard.writeText(url);
      setMessage("링크를 복사했습니다.");
    } catch {
      // 권한이 없거나 http 환경이면 클립보드 API 가 막힌다 — 직접 고르게 해 준다.
      urlInput.current?.select();
      setMessage("복사가 막혀 있습니다. 선택된 주소를 직접 복사해 주세요.");
    }
  }

  async function sendMail() {
    setBusy("send");
    setMessage("");
    setFailed(false);

    try {
      const res = await fetch(`/api/admin/quotes/${quoteId}/send`, { method: "POST" });
      const data = await res.json().catch(() => ({ ok: false }));

      if (!data.ok) {
        setFailed(true);
        setMessage(data.message ?? "발송에 실패했습니다.");
        return;
      }
      setMessage(`${data.sentTo} 으로 보냈습니다.`);
      router.refresh();
    } catch {
      setFailed(true);
      setMessage("네트워크 오류로 보내지 못했습니다.");
    } finally {
      setBusy(null);
    }
  }

  async function toggleStatus() {
    const open = state !== "open";
    setBusy("status");
    setMessage("");
    setFailed(false);

    try {
      const res = await fetch(`/api/admin/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: open ? "open" : "closed" }),
      });
      const data = await res.json().catch(() => ({ ok: false }));

      if (!data.ok) {
        setFailed(true);
        setMessage(data.message ?? "상태를 바꾸지 못했습니다.");
        return;
      }
      router.refresh();
    } catch {
      setFailed(true);
      setMessage("네트워크 오류로 상태를 바꾸지 못했습니다.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="mt-12 rounded-3xl border border-line bg-mist/50 p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
            견적번호 {ref_}
          </p>
          <p className={`mt-1 text-[15px] font-semibold ${quoteStatusTone[state]}`}>
            {quoteStatusLabel[state]}
            {sentAt && (
              <span className="ml-2 text-[13px] font-normal text-faint">
                마지막 발송 {new Date(sentAt).toLocaleString("ko-KR")} · {sentCount}회
              </span>
            )}
          </p>
        </div>

        {state !== "paid" && (
          <button
            type="button"
            onClick={toggleStatus}
            disabled={busy !== null}
            className="rounded-full border border-line bg-paper px-5 py-2.5 text-sm font-semibold text-muted transition-colors hover:border-ink hover:text-ink disabled:opacity-50"
          >
            {state === "open" ? "견적 닫기" : "다시 열기"}
          </button>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          ref={urlInput}
          readOnly
          value={url}
          onFocus={(e) => e.target.select()}
          className="field flex-1 font-mono text-[13px]"
        />
        <button
          type="button"
          onClick={copyLink}
          className="whitespace-nowrap rounded-full border border-line bg-paper px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-ink"
        >
          링크 복사
        </button>
        <button
          type="button"
          onClick={sendMail}
          disabled={busy !== null || state !== "open" || !customerEmail}
          className="whitespace-nowrap rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-accent disabled:opacity-50"
        >
          {busy === "send" ? "보내는 중…" : "이메일로 보내기"}
        </button>
      </div>

      {!customerEmail && (
        <p className="mt-4 text-[13px] text-faint">
          고객 이메일을 입력하고 저장하면 메일로 보낼 수 있습니다. 지금도 링크 복사는 됩니다.
        </p>
      )}

      {message && (
        <p className={`mt-4 text-[13px] ${failed ? "text-accent" : "text-muted"}`}>{message}</p>
      )}
    </section>
  );
}
