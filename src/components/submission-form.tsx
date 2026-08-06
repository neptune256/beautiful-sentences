"use client";

import { useState, useTransition } from "react";
import { saveSubmission } from "@/app/actions/submissions";

export function SubmissionForm({
  dailyRoundId,
  initialContent,
}: {
  dailyRoundId: string;
  initialContent: string;
}) {
  const [content, setContent] = useState(initialContent);
  const [isPending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    setError(null);
    startTransition(async () => {
      try {
        await saveSubmission(dailyRoundId, content);
        setSavedAt(new Date().toLocaleTimeString("ko-KR"));
      } catch (e) {
        setError(e instanceof Error ? e.message : "저장에 실패했습니다.");
      }
    });
  }

  return (
    <div className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={8}
        placeholder="이 상황을 나만의 문체로 다시 써보세요."
        className="w-full rounded-md border border-black/10 bg-transparent p-3 text-sm outline-none focus:border-black/30 dark:border-white/10 dark:focus:border-white/30"
      />
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isPending || content.trim().length === 0}
          className="rounded-full bg-black px-4 py-1.5 text-sm text-white disabled:opacity-40 dark:bg-white dark:text-black"
        >
          {isPending ? "저장 중..." : "저장"}
        </button>
        {savedAt && !error && (
          <span className="text-xs text-black/50 dark:text-white/50">
            {savedAt} 저장됨 · 자정까지 계속 수정할 수 있어요
          </span>
        )}
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    </div>
  );
}
