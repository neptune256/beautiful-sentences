"use client";

import { useMemo, useState, useTransition } from "react";
import { getAttendanceMonth } from "@/app/actions/attendance";
import { STREAK_MILESTONES, STREAK_MILESTONE_REWARDS, type AttendanceDay } from "@/lib/attendance";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

type Cell = {
  day: number;
  dateStr: string;
  hasRound: boolean;
  attended: boolean;
  isHoliday: boolean;
  isToday: boolean;
  isFuture: boolean;
  diamonds: number;
};

export function AttendanceCalendar({
  initialYear,
  initialMonth,
  initialDays,
  todayStr,
  currentStreak,
}: {
  initialYear: number;
  initialMonth: number;
  initialDays: AttendanceDay[];
  todayStr: string;
  currentStreak: number;
}) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [days, setDays] = useState(initialDays);
  const [isPending, startTransition] = useTransition();

  // 지금의 연속 출석이 끊기지 않고 이어진다는 가정 하에, 앞으로 남은 마일스톤을
  // 달성할 예정일을 계산한다 (오늘 + (마일스톤 - 현재 연속일수)).
  const projectedMilestones = useMemo(() => {
    const map = new Map<string, number>();
    for (const milestone of STREAK_MILESTONES) {
      if (milestone <= currentStreak) continue;
      const projectedDate = addDays(todayStr, milestone - currentStreak);
      map.set(projectedDate, STREAK_MILESTONE_REWARDS[milestone]);
    }
    return map;
  }, [todayStr, currentStreak]);

  function goToMonth(deltaMonths: number) {
    let ny = year;
    let nm = month + deltaMonths;
    if (nm < 1) {
      ny -= 1;
      nm = 12;
    } else if (nm > 12) {
      ny += 1;
      nm = 1;
    }
    setYear(ny);
    setMonth(nm);
    startTransition(async () => {
      const result = await getAttendanceMonth(ny, nm);
      setDays(result);
    });
  }

  const cells = useMemo(() => {
    const dayMap = new Map(days.map((d) => [d.date, d]));
    const startWeekday = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();

    const list: (Cell | null)[] = Array.from({ length: startWeekday }, () => null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${pad(month)}-${pad(d)}`;
      const info = dayMap.get(dateStr);
      list.push({
        day: d,
        dateStr,
        hasRound: !!info,
        attended: info?.attended ?? false,
        isHoliday: info?.isHoliday ?? false,
        isToday: dateStr === todayStr,
        isFuture: dateStr > todayStr,
        diamonds: info?.diamonds ?? 0,
      });
    }
    return list;
  }, [days, year, month, todayStr]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => goToMonth(-1)}
          disabled={isPending}
          className="rounded-full px-2 py-1 font-sans text-sm text-[var(--ink)] transition-opacity hover:opacity-70 disabled:opacity-30"
          aria-label="이전 달"
        >
          ‹
        </button>
        <span className="font-serif text-sm font-bold tracking-wide text-[var(--ink)]">
          {year}년 {month}월
        </span>
        <button
          type="button"
          onClick={() => goToMonth(1)}
          disabled={isPending}
          className="rounded-full px-2 py-1 font-sans text-sm text-[var(--ink)] transition-opacity hover:opacity-70 disabled:opacity-30"
          aria-label="다음 달"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((w) => (
          <span
            key={w}
            className="text-center font-sans text-[10px] font-bold text-[color-mix(in_srgb,var(--ink)_50%,transparent)]"
          >
            {w}
          </span>
        ))}

        {cells.map((cell, i) => {
          if (!cell) return <span key={`empty-${i}`} />;

          const projectedReward = cell.isFuture ? projectedMilestones.get(cell.dateStr) : undefined;

          return (
            <div
              key={cell.dateStr}
              className={`relative flex h-11 flex-col items-center justify-center gap-0.5 rounded-sm ${
                cell.isToday ? "ring-2 ring-[var(--stamp-red)] ring-offset-1 ring-offset-[var(--paper-cream)]" : ""
              }`}
            >
              <span
                className={`font-mono text-[10px] leading-none ${
                  cell.isFuture
                    ? "text-[color-mix(in_srgb,var(--ink)_30%,transparent)]"
                    : "text-[color-mix(in_srgb,var(--ink)_60%,transparent)]"
                }`}
              >
                {cell.day}
              </span>

              {cell.isHoliday ? (
                <span className="font-sans text-[9px] leading-none text-[color-mix(in_srgb,var(--ink)_40%,transparent)]">
                  휴일
                </span>
              ) : cell.attended ? (
                <span
                  key={cell.dateStr}
                  className="stamp-in grid h-5 w-5 place-items-center rounded-full border-2 border-[var(--stamp-red)] font-serif text-[9px] font-bold text-[var(--stamp-red)]"
                  style={{ transform: "rotate(-10deg)" }}
                >
                  出
                </span>
              ) : cell.hasRound && !cell.isFuture ? (
                <span className="h-5 w-5 rounded-full border border-dashed border-[color-mix(in_srgb,var(--ink)_25%,transparent)]" />
              ) : (
                <span className="h-5 w-5" />
              )}

              {!cell.isFuture && cell.diamonds > 0 && (
                <span
                  title={`다이아 +${cell.diamonds}`}
                  className="absolute -top-1 -right-1 rounded-full bg-[#3B82C4] px-1 font-mono text-[8px] font-bold leading-tight text-white"
                >
                  +{cell.diamonds}
                </span>
              )}

              {projectedReward && (
                <span
                  title={`연속 출석을 이어가면 이날 다이아 +${projectedReward}`}
                  className="absolute -top-1 -right-1 rounded-full border border-dashed border-[#3B82C4] bg-[color-mix(in_srgb,#3B82C4_12%,var(--paper-cream))] px-1 font-mono text-[8px] font-bold leading-tight text-[#3B82C4]"
                >
                  💎
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5 font-sans text-[10px] text-[color-mix(in_srgb,var(--ink)_55%,transparent)]">
        <span className="inline-flex items-center gap-1">
          <span className="rounded-full bg-[#3B82C4] px-1 font-mono text-[8px] font-bold leading-tight text-white">+N</span>
          다이아 획득일
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="rounded-full border border-dashed border-[#3B82C4] px-1 font-mono text-[8px] font-bold leading-tight text-[#3B82C4]">💎</span>
          연속 출석 유지 시 받을 예정일
        </span>
      </div>
    </div>
  );
}
