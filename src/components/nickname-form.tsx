"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateNickname } from "@/app/actions/profile";

export function NicknameForm({
  defaultNickname,
  submitLabel = "저장",
  onSaved,
}: {
  defaultNickname: string;
  submitLabel?: string;
  onSaved?: () => void;
}) {
  const [nickname, setNickname] = useState(defaultNickname);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const router = useRouter();

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      try {
        await updateNickname(nickname);
        router.refresh();
        setSavedAt(new Date().toLocaleTimeString("ko-KR"));
        onSaved?.();
      } catch (e) {
        setError(e instanceof Error ? e.message : "저장에 실패했습니다.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={20}
          className="flex-1 rounded-sm border border-[var(--paper-grid)] bg-[color-mix(in_srgb,var(--paper-cream)_92%,#fff)] px-3 py-2 font-sans text-sm text-[var(--ink)] outline-none focus:border-[var(--stamp-red)]"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || nickname.trim().length === 0}
          className="shrink-0 rounded-sm bg-[var(--stamp-red)] px-4 py-2 font-sans text-sm font-bold text-[var(--paper-cream)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending ? "저장 중..." : submitLabel}
        </button>
      </div>
      {error && <p className="text-xs text-[var(--stamp-red)]">{error}</p>}
      {savedAt && !error && (
        <p className="font-mono text-xs text-[color-mix(in_srgb,var(--ink)_55%,transparent)]">
          {savedAt} 저장됨
        </p>
      )}
    </div>
  );
}
