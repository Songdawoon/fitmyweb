"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { formatWon } from "@/lib/data";
import type { UnseenOrders } from "@/lib/account";

/**
 * 새 결제 알림.
 *
 * 결제 확인 메일은 이미 나가지만 메일함은 놓치기 쉽다. 관리자 화면을 열어 둔
 * 채로도 새 결제를 알아채도록 30초마다 미확인 건수를 확인한다.
 *
 * 폴링 주기가 짧을 이유는 없다 — 결제는 초 단위로 쏟아지지 않고, 알림이
 * 30초 늦게 뜬다고 달라지는 일도 없다. 화면이 안 보일 때는 아예 쉰다.
 */
const POLL_MS = 30_000;

export default function PaymentAlert({ initial }: { initial: UnseenOrders }) {
  const router = useRouter();
  const [unseen, setUnseen] = useState(initial);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/orders/seen", { cache: "no-store" });
      const data = await res.json();
      if (!data.ok) return;

      setUnseen((prev) => {
        // 새 결제가 들어왔으면 아래 표도 최신으로 바꾼다.
        if (data.count > prev.count) router.refresh();
        return { count: data.count, total: data.total, latest: data.latest };
      });
    } catch {
      // 폴링 실패는 조용히 넘긴다 — 다음 주기에 다시 묻는다.
    }
  }, [router]);

  useEffect(() => {
    const timer = setInterval(() => {
      // 다른 탭을 보고 있으면 물어볼 이유가 없다.
      if (document.visibilityState === "visible") void refresh();
    }, POLL_MS);

    // 탭으로 돌아왔을 때는 다음 주기를 기다리지 않고 바로 확인한다.
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  async function markSeen() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/orders/seen", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setUnseen({ count: 0, total: 0, latest: null });
        router.refresh();
      }
    } catch {
      // 실패하면 배너가 그대로 남는다 — 다시 누르면 된다.
    } finally {
      setBusy(false);
    }
  }

  if (unseen.count === 0) return null;

  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-accent/30 bg-accent/5 px-6 py-5">
      <div>
        <p className="text-[15px] font-semibold text-ink">
          새 결제 {unseen.count}건 · {formatWon(unseen.total)}
        </p>
        {unseen.latest && (
          <p className="mt-1 text-[13px] text-muted">
            최근 · {unseen.latest.planName} {formatWon(unseen.latest.amount)}
            {unseen.latest.customerName ? ` · ${unseen.latest.customerName}` : ""} ·{" "}
            {new Date(unseen.latest.createdAt).toLocaleString("ko-KR", {
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={markSeen}
        disabled={busy}
        className="whitespace-nowrap rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-accent disabled:opacity-50"
      >
        {busy ? "처리 중…" : "확인했습니다"}
      </button>
    </div>
  );
}
