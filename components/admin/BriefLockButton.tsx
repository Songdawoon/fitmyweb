"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  briefId: string;
  locked: boolean;
  /** 작성 전이면 확정할 것이 없다. */
  submitted: boolean;
};

export default function BriefLockButton({ briefId, locked, submitted }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function toggle() {
    if (
      !locked &&
      !confirm("확정하면 고객이 더 이상 내용을 고칠 수 없습니다. 제작을 시작할까요?")
    ) {
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/briefs/${briefId}/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locked: !locked }),
      });
      const data = await res.json().catch(() => ({ ok: false }));

      if (!data.ok) {
        setMessage(data.message ?? "처리하지 못했습니다.");
        return;
      }
      router.refresh();
    } catch {
      setMessage("네트워크 오류로 처리하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="text-right">
      <button
        type="button"
        onClick={toggle}
        disabled={busy || (!locked && !submitted)}
        className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${
          locked
            ? "border border-line bg-paper text-muted hover:border-ink hover:text-ink"
            : "bg-ink text-paper hover:bg-accent"
        }`}
      >
        {busy ? "처리 중…" : locked ? "수정 다시 허용" : "확정하고 제작 시작"}
      </button>
      {message && <p className="mt-2 text-[13px] text-accent">{message}</p>}
    </div>
  );
}
