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
    <div className="space-y-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={8}
        placeholder="이 상황을 나만의 문체로 다시 써보세요."
        className="w-full rounded-2xl border border-slate-200/70 bg-white/70 p-5 font-serif text-base leading-loose tracking-wide text-slate-800 outline-none transition-colors duration-300 placeholder:font-sans placeholder:text-sm placeholder:tracking-normal placeholder:text-slate-400 focus:border-slate-300 focus:bg-white dark:border-white/10 dark:bg-neutral-900/50 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-white/20 dark:focus:bg-neutral-900"
      />
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={isPending || content.trim().length === 0}
          className="rounded-full bg-slate-800 px-5 py-2 text-sm tracking-wide text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-700 disabled:pointer-events-none disabled:opacity-40 disabled:hover:translate-y-0 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
        >
          {isPending ? "저장 중..." : "저장"}
        </button>
        {savedAt && !error && (
          <span className="text-xs tracking-wide text-slate-400 dark:text-slate-500">
            {savedAt} 저장됨 · 자정까지 계속 수정할 수 있어요
          </span>
        )}
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    </div>
  );
}
