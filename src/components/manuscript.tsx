"use client";

import { useMemo, useState, type SyntheticEvent } from "react";

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
  const [cursor, setCursor] = useState(0);
  const [focused, setFocused] = useState(false);

  const len = Array.from(value).length;
  // 최소 rows는 유지하되, 글자가 넘치면 원고지가 아래로 계속 늘어나게 함
  // (+1칸은 다음 글자가 들어갈 빈 칸이 항상 한 줄 남아 보이도록)
  const visibleRows = Math.max(rows, Math.ceil((len + 1) / columns));
  const cellCount = columns * visibleRows;
  const cells = useMemo(() => toCells(value, cellCount), [value, cellCount]);

  const cursorRow = Math.floor(cursor / columns);
  const cursorCol = cursor % columns;

  function syncCursor(el: HTMLTextAreaElement) {
    const raw = el.selectionStart ?? value.length;
    setCursor(Array.from(value.slice(0, raw)).length);
  }

  function handleCursorEvent(e: SyntheticEvent<HTMLTextAreaElement>) {
    syncCursor(e.currentTarget);
  }

  return (
    <div className="relative inline-block">
      <div
        className="pointer-events-none relative grid rounded-sm border border-[var(--paper-grid)]"
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
        {focused && (
          <span
            className="absolute animate-pulse bg-[var(--stamp-red)]"
            style={{
              left: `${cursorCol * cellRem + cellRem * 0.15}rem`,
              top: `${cursorRow * cellRem + cellRem * 0.15}rem`,
              width: "2px",
              height: `${cellRem * 0.7}rem`,
            }}
          />
        )}
      </div>
      <textarea
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          syncCursor(e.target);
        }}
        onClick={handleCursorEvent}
        onKeyUp={handleCursorEvent}
        onSelect={handleCursorEvent}
        onFocus={(e) => {
          setFocused(true);
          handleCursorEvent(e);
        }}
        onBlur={() => setFocused(false)}
        maxLength={maxLength ?? cellCount}
        aria-label={ariaLabel}
        placeholder={placeholder}
        spellCheck={false}
        className="absolute inset-0 block resize-none bg-transparent p-0 font-mono text-transparent caret-transparent outline-none placeholder:text-[color-mix(in_srgb,var(--ink)_40%,transparent)] focus-visible:ring-2 focus-visible:ring-[var(--stamp-red)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper-cream)]"
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
