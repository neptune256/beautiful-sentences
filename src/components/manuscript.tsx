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

/**
 * 입력용 원고지: 실제 글자는 ManuscriptDisplay와 동일한 방식(칸마다 flex 중앙정렬)으로 그리고,
 * 타이핑은 그 위에 겹친 투명 textarea가 받는다. (letter-spacing으로 칸을 흉내 내던 예전 방식은
 * 마침표·띄어쓰기처럼 폭이 좁은 글자가 섞이면 칸 중앙에서 왼쪽으로 쏠려 보이는 문제가 있었음)
 */
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
  const cells = useMemo(() => toCells(value, columns * rows), [value, columns, rows]);

  return (
    <div className="relative inline-block">
      <div
        className="pointer-events-none grid rounded-sm border border-[var(--paper-grid)]"
        style={{ gridTemplateColumns: `repeat(${columns}, ${cellRem}rem)` }}
        aria-hidden="true"
      >
        {cells.map((ch, i) => (
          <span
            key={i}
            className="flex items-center justify-center border-[0.5px] border-[color-mix(in_srgb,var(--paper-grid)_70%,transparent)] font-mono text-xl text-[var(--ink)]"
            style={{ width: `${cellRem}rem`, height: `${cellRem}rem` }}
          >
            {ch}
          </span>
        ))}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength ?? columns * rows}
        aria-label={ariaLabel}
        placeholder={placeholder}
        spellCheck={false}
        className="absolute inset-0 block resize-none bg-transparent p-0 font-mono text-transparent caret-[var(--stamp-red)] outline-none placeholder:text-[color-mix(in_srgb,var(--ink)_40%,transparent)] focus-visible:ring-2 focus-visible:ring-[var(--stamp-red)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper-cream)]"
        style={{
          fontSize: "1.25rem",
          lineHeight: `${cellRem}rem`,
          wordBreak: "break-all",
          whiteSpace: "pre-wrap",
        }}
      />
    </div>
  );
}
