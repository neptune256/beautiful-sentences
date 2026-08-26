"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import confetti from "canvas-confetti";
import { saveSubmission, finalizeSubmission } from "@/app/actions/submissions";
import { SubmissionSuccessModal } from "@/components/submission-success-modal";
import { STREAK_MILESTONES } from "@/lib/attendance";
import { todayKst } from "@/lib/date";

type CriterionScores = {
  imagery: number;
  rhythm: number;
  resonance: number;
  density: number;
  context: number;
};

type Evaluation = {
  passedGate: boolean | null;
  gateIssue: string | null;
  scores: CriterionScores | null;
  note: string | null;
};

const CRITERION_LABELS: Record<keyof CriterionScores, string> = {
  imagery: "선명도",
  rhythm: "운율",
  resonance: "잔향",
  density: "함축성",
  context: "맥락",
};

function totalScore(scores: CriterionScores) {
  return Object.values(scores).reduce((sum, v) => sum + v, 0);
}

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

const STREAK_SHOWN_KEY_PREFIX = "streak_milestone_shown_";

export function SubmissionForm({
  dailyRoundId,
  initialContent,
  finalizedAt,
  evaluation,
}: {
  dailyRoundId: string;
  initialContent: string;
  finalizedAt: string | null;
  evaluation: Evaluation | null;
}) {
  const [content, setContent] = useState(initialContent);
  const [isPending, startTransition] = useTransition();
  const [isFinalizing, startFinalizeTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [streak, setStreak] = useState<number | null>(null);
  const [isMilestone, setIsMilestone] = useState(false);
  const [isFinalized, setIsFinalized] = useState(!!finalizedAt);
  const [result, setResult] = useState<Evaluation | null>(evaluation);
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
        const { streak: streakInfo } = await saveSubmission(dailyRoundId, content);
        setSavedAt(new Date().toLocaleTimeString("ko-KR"));
        setStreak(streakInfo.currentStreak);

        const milestoneKey = `${STREAK_SHOWN_KEY_PREFIX}${todayKst()}`;
        const alreadyCelebratedToday = localStorage.getItem(milestoneKey) === "1";
        const hitMilestone =
          STREAK_MILESTONES.includes(streakInfo.currentStreak) && !alreadyCelebratedToday;
        setIsMilestone(hitMilestone);

        fireSuccessConfetti();
        if (hitMilestone) {
          fireStreakConfetti();
          localStorage.setItem(milestoneKey, "1");
        }
        setShowSuccess(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "저장에 실패했습니다.");
      }
    });
  }

  function handleFinalize() {
    if (
      !window.confirm(
        "최종 제출하면 더 이상 수정할 수 없고, 지금 바로 채점을 받아요. 계속할까요?",
      )
    ) {
      return;
    }
    setError(null);
    startFinalizeTransition(async () => {
      try {
        const r = await finalizeSubmission(dailyRoundId, content);
        setResult(r);
        setIsFinalized(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "최종 제출에 실패했습니다.");
      }
    });
  }

  if (isFinalized) {
    return (
      <section className="flex flex-col gap-3">
        <span className="font-sans text-xs font-bold tracking-[0.3em] text-[color-mix(in_srgb,var(--ink)_55%,transparent)]">
          나의 문장 · 최종 제출 완료
        </span>
        <div className="rounded-sm border border-[var(--paper-grid)] bg-white p-4 shadow-[inset_0_1px_3px_rgba(0,0,0,0.08)]">
          <p className="whitespace-pre-wrap font-serif text-sm leading-relaxed text-[var(--ink)]">
            {content}
          </p>
        </div>

        {result && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              {result.passedGate === false && (
                <span className="rounded-full border border-[var(--stamp-red)] px-2 py-0.5 font-sans text-xs font-bold text-[var(--stamp-red)]">
                  1단계 기준 미통과
                </span>
              )}
              {result.scores && (
                <span className="font-mono text-xs text-[color-mix(in_srgb,var(--ink)_60%,transparent)]">
                  {(Object.keys(CRITERION_LABELS) as (keyof CriterionScores)[])
                    .map((key) => `${CRITERION_LABELS[key]} ${result.scores![key]}`)
                    .join("  ·  ")}
                  {"  ·  "}
                  <span className="font-bold text-[var(--ink)]">
                    총점 {totalScore(result.scores)}/50
                  </span>
                </span>
              )}
            </div>
            {result.note && (
              <p className="font-sans text-xs text-[color-mix(in_srgb,var(--ink)_55%,transparent)]">
                아쉬운 점: {result.note}
              </p>
            )}
          </div>
        )}

        <p className="font-sans text-xs text-[color-mix(in_srgb,var(--ink)_55%,transparent)]">
          자정에 다른 참가자들과 점수를 비교해 오늘의 1위가 정해져요.
        </p>
      </section>
    );
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
        placeholder="이 상황을 나만의 문체로 다시 써보세요."
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
          disabled={isPending || isFinalizing || content.trim().length === 0}
          className="relative grid h-24 w-24 place-items-center rounded-full border-[3px] border-[var(--stamp-red)] font-serif text-lg font-bold text-[var(--stamp-red)] transition-transform duration-150 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--stamp-red)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper-cream)] disabled:cursor-not-allowed disabled:opacity-30"
        >
          <span className="leading-none">
            {isPending ? "저장 중" : "저장"}
            <br />
            <span className="text-sm">保存</span>
          </span>
          <span className="pointer-events-none absolute inset-1 rounded-full border border-dashed border-[var(--stamp-red)] opacity-60" />
        </button>

        <button
          type="button"
          onClick={handleFinalize}
          disabled={isPending || isFinalizing || content.trim().length === 0}
          className="relative grid h-24 w-24 place-items-center rounded-full border-[3px] border-[var(--wood-shadow)] font-serif text-lg font-bold text-[var(--wood-shadow)] transition-transform duration-150 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wood-shadow)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper-cream)] disabled:cursor-not-allowed disabled:opacity-30"
        >
          <span className="leading-none">
            {isFinalizing ? "채점 중" : "최종 제출"}
            <br />
            <span className="text-sm">確定</span>
          </span>
          <span className="pointer-events-none absolute inset-1 rounded-full border border-dashed border-[var(--wood-shadow)] opacity-60" />
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
      />
    </section>
  );
}
