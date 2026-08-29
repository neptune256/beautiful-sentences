"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import confetti from "canvas-confetti";
import { saveSubmission } from "@/app/actions/submissions";
import { SubmissionSuccessModal } from "@/components/submission-success-modal";
import { fireDiamondConfetti } from "@/components/quest-celebration";

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

// 연속 출석 마일스톤을 채운 날에만 불꽃 톤으로 한 번 더 터뜨린다.
function fireStreakConfetti() {
  confetti({
    particleCount: 90,
    spread: 100,
    startVelocity: 35,
    gravity: 0.7,
    scalar: 0.9,
    ticks: 260,
    origin: { x: 0.5, y: 0.6 },
    colors: ["#EAB308", "#B23A24", "#E8985B", "#8B6914"],
  });
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
  const [streak, setStreak] = useState<number | null>(null);
  const [isMilestone, setIsMilestone] = useState(false);
  const [diamondsAwarded, setDiamondsAwarded] = useState(0);
  const [dailyQuestCompletedNow, setDailyQuestCompletedNow] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 페이지를 넘기는 대신, 노트 페이지 전체가 그렇듯 글이 길어지면 입력창도 아래로 늘어나게 함.
  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  useEffect(() => {
    if (textareaRef.current) autoResize(textareaRef.current);
  }, []);

  function handleSave() {
    setError(null);
    startTransition(async () => {
      try {
        const {
          streak: streakInfo,
          diamondsAwarded: awarded,
          milestoneAwarded,
          dailyQuestCompletedNow: questDone,
        } = await saveSubmission(dailyRoundId, content);
        setSavedAt(new Date().toLocaleTimeString("ko-KR"));
        setStreak(streakInfo.currentStreak);
        setDiamondsAwarded(awarded);
        setIsMilestone(milestoneAwarded);
        setDailyQuestCompletedNow(questDone);

        fireSuccessConfetti();
        if (milestoneAwarded) {
          fireStreakConfetti();
        }
        if (questDone) {
          fireDiamondConfetti();
        }
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
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          autoResize(e.target);
        }}
        maxLength={2000}
        rows={6}
        aria-label="나의 문장 입력"
        placeholder="이 단어에서 떠오르는 아름다운 문장을 써보세요."
        className="w-full resize-none rounded-sm border border-[var(--paper-grid)] bg-white p-4 font-serif text-sm leading-relaxed text-[var(--ink)] shadow-[inset_0_1px_3px_rgba(0,0,0,0.08)] outline-none transition-colors placeholder:font-sans placeholder:text-[color-mix(in_srgb,var(--ink)_40%,transparent)] focus:border-[var(--stamp-red)]"
      />
      <div className="flex items-center gap-4">
        <span className="font-mono text-xs text-[color-mix(in_srgb,var(--ink)_55%,transparent)]">
          {Array.from(content).length}자
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-6">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || content.trim().length === 0}
          className="relative grid h-24 w-24 place-items-center rounded-full border-[3px] border-[var(--stamp-red)] font-serif text-lg font-bold text-[var(--stamp-red)] transition-transform duration-150 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--stamp-red)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper-cream)] disabled:cursor-not-allowed disabled:opacity-30"
        >
          <span className="leading-none">
            {isPending ? "저장 중" : "저장"}
            <br />
            <span className="text-sm">保存</span>
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
        streak={streak}
        isMilestone={isMilestone}
        diamondsAwarded={diamondsAwarded}
        dailyQuestCompletedNow={dailyQuestCompletedNow}
      />
    </section>
  );
}
