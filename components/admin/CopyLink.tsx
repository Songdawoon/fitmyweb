"use client";

import { useRef, useState } from "react";

/** 관리자가 고객에게 다시 안내할 수 있도록 링크를 복사해 준다. */
export default function CopyLink({ url, label }: { url: string; label: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setMessage("복사했습니다.");
    } catch {
      // 권한이 없거나 http 환경이면 클립보드 API 가 막힌다 — 직접 고르게 해 준다.
      input.current?.select();
      setMessage("복사가 막혀 있습니다. 선택된 주소를 직접 복사해 주세요.");
    }
  }

  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">{label}</p>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <input
          ref={input}
          readOnly
          value={url}
          onFocus={(e) => e.target.select()}
          className="field flex-1 font-mono text-[13px]"
        />
        <button
          type="button"
          onClick={copy}
          className="whitespace-nowrap rounded-full border border-line bg-paper px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-ink"
        >
          링크 복사
        </button>
      </div>
      {message && <p className="mt-3 text-[13px] text-muted">{message}</p>}
    </div>
  );
}
