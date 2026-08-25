"use client";

import { useMemo } from "react";

const CELL = "h-9 w-9 sm:h-10 sm:w-10";

function toCells(text: string, count: number) {
  const chars = Array.from(text);
  return Array.from({ length: count }, (_, i) => chars[i] ?? "");
}

/** 읽기 전용 원고지: 칸마다 한 글자씩 표시 (오늘의 상황 문장 등) */
export function ManuscriptDisplay({
  text,
  columns = 10,
  minRows = 2,
}: {
  text: string;
  columns?: number;
  minRows?: number;
}) {
  const cells = useMemo(() => {
    const rows = Math.max(minRows, Math.ceil(Array.from(text).length / columns) || minRows);
    return toCells(text, rows * columns);
  }, [text, columns, minRows]);

  return (
    <div
      className="inline-grid gap-0 rounded-sm border border-[var(--paper-grid)] bg-[color-mix(in_srgb,var(--paper-cream)_92%,#fff)]"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      role="img"
      aria-label={text}
    >
      {cells.map((ch, i) => (
        <span
          key={i}
          className={`${CELL} flex items-center justify-center border-[0.5px] border-[color-mix(in_srgb,var(--paper-grid)_70%,transparent)] font-mono text-lg text-[var(--ink)] sm:text-xl`}
        >
          {ch}
        </span>
      ))}
    </div>
  );
}
