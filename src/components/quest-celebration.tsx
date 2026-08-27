"use client";

import confetti from "canvas-confetti";
import { CountUp } from "@/components/count-up";

// 다이아(파란 톤) 색감으로 터뜨리는 축하 컨페티. 스트릭 컨페티(주황·붉은 톤)와 구분되게 색만 다르게 쓴다.
export function fireDiamondConfetti() {
  confetti({
    particleCount: 70,
    spread: 90,
    startVelocity: 30,
    gravity: 0.6,
    scalar: 0.85,
    ticks: 240,
    origin: { x: 0.5, y: 0.55 },
    colors: ["#3B82C4", "#7DB8E8", "#2E6396", "#EAB308"],
  });
}

export function QuestCompleteBanner({
  streak,
  milestoneAwarded = false,
  dailyQuestCompletedNow = false,
  diamondsAwarded = 0,
}: {
  streak?: number | null;
  milestoneAwarded?: boolean;
  dailyQuestCompletedNow?: boolean;
  diamondsAwarded?: number;
}) {
  const hasStreak = !!streak && streak > 0;
  if (!hasStreak && diamondsAwarded <= 0 && !dailyQuestCompletedNow) return null;

  return (
    <div className="mt-4 flex flex-col items-center gap-3">
      {dailyQuestCompletedNow && (
        <div className="pop-in flex flex-col items-center gap-2">
          <span className="font-serif text-base font-bold text-[var(--stamp-red)]">
            오늘의 퀘스트 완료! 🎉
          </span>
          <div className="flex items-center gap-2">
            {["오늘의 문장", "네 단어 글쓰기"].map((label, i) => (
              <span
                key={label}
                className="pop-in flex items-center gap-1 rounded-full border border-[var(--stamp-red)] bg-[color-mix(in_srgb,var(--stamp-red)_10%,var(--paper-cream))] px-2.5 py-1 font-sans text-[11px] font-bold text-[var(--stamp-red)]"
                style={{ animationDelay: `${i * 150}ms`, animationFillMode: "backwards" }}
              >
                ✓ {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {hasStreak && (
        <div key={streak} className="pop-in flex flex-col items-center gap-1">
          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[var(--stamp-red)] px-4 py-1.5 font-serif text-base font-bold text-[var(--stamp-red)]">
            <span className="flame-flicker inline-block" aria-hidden>
              🔥
            </span>
            {streak}일 연속 출석
          </span>
          {milestoneAwarded && (
            <span className="font-sans text-xs font-bold tracking-wide text-[color-mix(in_srgb,var(--stamp-red)_80%,var(--ink))]">
              대단해요! {streak}일을 채웠어요
            </span>
          )}
        </div>
      )}

      {diamondsAwarded > 0 && (
        <span
          key={diamondsAwarded}
          className="pop-in inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,#3B82C4_20%,var(--paper-cream))] px-3.5 py-1.5 font-mono text-base font-bold text-[#2E6396]"
          style={{ animationDelay: "300ms", animationFillMode: "backwards" }}
        >
          💎 +
          <CountUp target={diamondsAwarded} /> 다이아 획득!
        </span>
      )}
    </div>
  );
}
