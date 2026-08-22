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

/** 입력용 원고지: 격자 배경 위에 textarea를 겹쳐 한 칸에 한 글자씩 정렬 */
export function ManuscriptInput({
  value,
  onChange,
  columns = 10,
  rows = 4,
  maxLength,
  ariaLabel,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  columns?: number;
  rows?: number;
  maxLength?: number;
  ariaLabel: string;
  placeholder?: string;
}) {
  const cellRem = 2.5;
  return (
    <div className="relative inline-block">
      <div
        className="pointer-events-none absolute inset-0 grid rounded-sm border border-[var(--paper-grid)]"
        style={{
          gridTemplateColumns: `repeat(${columns}, ${cellRem}rem)`,
          gridTemplateRows: `repeat(${rows}, ${cellRem}rem)`,
        }}
        aria-hidden="true"
      >
        {Array.from({ length: columns * rows }).map((_, i) => (
          <span
            key={i}
            className="border-[0.5px] border-[color-mix(in_srgb,var(--paper-grid)_70%,transparent)]"
          />
        ))}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength ?? columns * rows}
        aria-label={ariaLabel}
        placeholder={placeholder}
        spellCheck={false}
        className="relative block resize-none bg-transparent p-0 font-mono text-[var(--ink)] caret-[var(--stamp-red)] outline-none placeholder:text-[color-mix(in_srgb,var(--ink)_40%,transparent)] focus-visible:ring-2 focus-visible:ring-[var(--stamp-red)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper-cream)]"
        style={{
          width: `${columns * cellRem}rem`,
          height: `${rows * cellRem}rem`,
          lineHeight: `${cellRem}rem`,
          fontSize: "1.25rem",
          letterSpacing: `${cellRem - 1.25}rem`,
          textIndent: `${(cellRem - 1.25) / 2}rem`,
          wordBreak: "break-all",
          whiteSpace: "pre-wrap",
        }}
      />
    </div>
  );
}
