"use client";

import { useState, useTransition } from "react";
import { submitProposal } from "@/app/actions/propose";

export function ProposalForm({ ticketId }: { ticketId: string }) {
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      try {
        await submitProposal(ticketId, content);
        setSubmitted(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "제안 등록에 실패했습니다.");
      }
    });
  }

  if (submitted) {
    return (
      <p className="text-sm text-black/70 dark:text-white/70">
        제안이 등록됐습니다. Ivy의 승인을 기다려주세요.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        placeholder="상황 문장을 입력하세요. (예: 우리는 밤하늘의 별을 보기 위해 높은 산에 올라갔다.)"
        className="w-full rounded-md border border-black/10 bg-transparent p-3 text-sm outline-none focus:border-black/30 dark:border-white/10 dark:focus:border-white/30"
      />
      <div className="flex items-center gap-3">
        <button
          onClick={handleSubmit}
          disabled={isPending || content.trim().length === 0}
          className="rounded-full bg-black px-4 py-1.5 text-sm text-white disabled:opacity-40 dark:bg-white dark:text-black"
        >
          {isPending ? "제출 중..." : "제안 제출"}
        </button>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    </div>
  );
}
