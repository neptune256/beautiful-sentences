"use client";

import { useState, useTransition } from "react";
import confetti from "canvas-confetti";
import { saveSubmission } from "@/app/actions/submissions";
import { SubmissionSuccessModal } from "@/components/submission-success-modal";
import { ManuscriptInput } from "@/components/manuscript";

// 은은한 골드·브라운 톤 별가루가 화면 양쪽에서 부드럽게 퍼지는 정도로만 터뜨린다.
function fireSuccessConfetti() {
  const shared: confetti.Options = {
    particleCount: 45,
    spread: 65,
    startVelocity: 22,
    gravity: 0.55,
    scalar: 0.7,
    ticks: 220,
    shapes: ["circle"],
    colors: ["#EAB308", "#D4A017", "#8B6914", "#C9A063"],
  };

  confetti({ ...shared, angle: 60, origin: { x: 0.15, y: 0.7 } });
  confetti({ ...shared, angle: 120, origin: { x: 0.85, y: 0.7 } });
}

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
  const [showSuccess, setShowSuccess] = useState(false);

  function handleSave() {
    setError(null);
    startTransition(async () => {
      try {
        await saveSubmission(dailyRoundId, content);
        setSavedAt(new Date().toLocaleTimeString("ko-KR"));
        fireSuccessConfetti();
        setShowSuccess(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "저장에 실패했습니다.");
      }
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <span className="font-sans text-xs font-bold tracking-[0.3em] text-[color-mix(in_srgb,var(--ink)_55%,transparent)]">
        나의 문장
      </span>
      <div className="overflow-x-auto pb-1">
        <ManuscriptInput
          value={content}
          onChange={setContent}
          columns={12}
          rows={6}
          maxLength={2000}
          ariaLabel="나의 문장 입력"
          placeholder="이 상황을 나만의 문체로 다시 써보세요."
        />
      </div>
      <div className="flex items-center gap-4">
        <span className="font-mono text-xs text-[color-mix(in_srgb,var(--ink)_55%,transparent)]">
          {Array.from(content).length}자
        </span>
      </div>

      <div className="mt-2 flex items-center gap-6">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || content.trim().length === 0}
          className="relative grid h-24 w-24 place-items-center rounded-full border-[3px] border-[var(--stamp-red)] font-serif text-lg font-bold text-[var(--stamp-red)] transition-transform duration-150 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--stamp-red)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper-cream)] disabled:cursor-not-allowed disabled:opacity-30"
        >
          <span className="leading-none">
            {isPending ? "저장 중" : "제출"}
            <br />
            <span className="text-sm">提出</span>
          </span>
          <span className="pointer-events-none absolute inset-1 rounded-full border border-dashed border-[var(--stamp-red)] opacity-60" />
        </button>
        {savedAt && !error && (
          <span
            key={savedAt}
            className="stamp-in font-serif text-lg font-bold text-[var(--stamp-red)]"
          >
            {savedAt} 저장됨
            <br />
            <span className="font-sans text-xs font-normal text-[color-mix(in_srgb,var(--ink)_60%,transparent)]">
              자정까지 계속 수정할 수 있어요
            </span>
          </span>
        )}
        {error && <span className="text-xs text-[var(--stamp-red)]">{error}</span>}
      </div>

      <SubmissionSuccessModal
        open={showSuccess}
        content={content}
        onClose={() => setShowSuccess(false)}
      />
    </section>
  );
}
