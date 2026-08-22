"use client";

import { useState, useTransition } from "react";
import { submitProposal } from "@/app/actions/propose";
import { ManuscriptInput } from "@/components/manuscript";

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
      <p className="stamp-in font-serif text-lg font-bold text-[var(--stamp-red)]">
        제안 접수됨
        <br />
        <span className="font-sans text-xs font-normal text-[color-mix(in_srgb,var(--ink)_60%,transparent)]">
          Ivy의 승인을 기다려주세요.
        </span>
      </p>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="overflow-x-auto pb-1">
        <ManuscriptInput
          value={content}
          onChange={setContent}
          columns={12}
          rows={3}
          maxLength={500}
          ariaLabel="제안 문장 입력"
          placeholder="상황 문장을 입력하세요."
        />
      </div>
      <div className="flex items-center gap-6">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || content.trim().length === 0}
          className="rounded-sm bg-[var(--stamp-red)] px-6 py-2.5 font-sans text-sm font-bold text-[var(--paper-cream)] transition-transform duration-150 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--stamp-red)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper-cream)] disabled:cursor-not-allowed disabled:opacity-30"
        >
          {isPending ? "제출 중..." : "제안 제출"}
        </button>
        {error && <span className="text-xs text-[var(--stamp-red)]">{error}</span>}
      </div>
    </section>
  );
}
