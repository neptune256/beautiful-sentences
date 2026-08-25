"use client";

import { useMemo, useState, useTransition } from "react";
import { getAttendanceMonth } from "@/app/actions/attendance";
import type { AttendanceDay } from "@/lib/attendance";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

type Cell = {
  day: number;
  dateStr: string;
  hasRound: boolean;
  attended: boolean;
  isHoliday: boolean;
  isToday: boolean;
  isFuture: boolean;
};

export function AttendanceCalendar({
  initialYear,
  initialMonth,
  initialDays,
  todayStr,
}: {
  initialYear: number;
  initialMonth: number;
  initialDays: AttendanceDay[];
  todayStr: string;
}) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [days, setDays] = useState(initialDays);
  const [isPending, startTransition] = useTransition();

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

      <div className="grid grid-cols-7 gap-1">
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

          return (
            <div
              key={cell.dateStr}
              className={`relative flex h-9 flex-col items-center justify-center gap-0 rounded-sm ${
                cell.isToday ? "ring-2 ring-[var(--stamp-red)] ring-offset-1 ring-offset-[var(--paper-cream)]" : ""
              }`}
            >
              <span
                className={`font-mono text-[9px] leading-none ${
                  cell.isFuture
                    ? "text-[color-mix(in_srgb,var(--ink)_30%,transparent)]"
                    : "text-[color-mix(in_srgb,var(--ink)_60%,transparent)]"
                }`}
              >
                {cell.day}
              </span>

              {cell.isHoliday ? (
                <span className="font-sans text-[8px] leading-none text-[color-mix(in_srgb,var(--ink)_40%,transparent)]">
                  휴일
                </span>
              ) : cell.attended ? (
                <span
                  key={cell.dateStr}
                  className="stamp-in grid h-4 w-4 place-items-center rounded-full border-2 border-[var(--stamp-red)] font-serif text-[8px] font-bold text-[var(--stamp-red)]"
                  style={{ transform: "rotate(-10deg)" }}
                >
                  出
                </span>
              ) : cell.hasRound && !cell.isFuture ? (
                <span className="h-4 w-4 rounded-full border border-dashed border-[color-mix(in_srgb,var(--ink)_25%,transparent)]" />
              ) : (
                <span className="h-4 w-4" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
