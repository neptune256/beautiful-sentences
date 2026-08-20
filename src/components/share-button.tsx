"use client";

import { useState, useTransition } from "react";
import { grantShareTicket } from "@/app/actions/propose";

export function ShareButton() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleShare() {
    setError(null);

    if (navigator.share) {
      navigator
        .share({ title: "아름다운 문장", url: window.location.origin })
        .catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.origin).catch(() => {});
    }

    startTransition(async () => {
      try {
        await grantShareTicket();
      } catch (e) {
        setError(e instanceof Error ? e.message : "제안권 발급에 실패했습니다.");
      }
    });
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleShare}
        disabled={isPending}
        className="rounded-full bg-black px-4 py-1.5 text-sm text-white disabled:opacity-40 dark:bg-white dark:text-black"
      >
        {isPending ? "처리 중..." : "사이트 공유하기"}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
