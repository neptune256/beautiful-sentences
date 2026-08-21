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
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={20}
          className="flex-1 rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/10 dark:focus:border-white/30"
        />
        <button
          onClick={handleSubmit}
          disabled={isPending || nickname.trim().length === 0}
          className="shrink-0 rounded-full bg-black px-4 py-2 text-sm text-white disabled:opacity-40 dark:bg-white dark:text-black"
        >
          {isPending ? "저장 중..." : submitLabel}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {savedAt && !error && (
        <p className="text-xs text-black/50 dark:text-white/50">{savedAt} 저장됨</p>
      )}
    </div>
  );
}
