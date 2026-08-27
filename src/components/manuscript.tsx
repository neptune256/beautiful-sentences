"use client";

import { useMemo } from "react";

function toCells(text: string, count: number) {
  const chars = Array.from(text);
  return Array.from({ length: count }, (_, i) => chars[i] ?? "");
}

// 문장이 길수록 칸과 글자를 더 작게 그려서, 길어져도 세로 공간을 덜 차지하게 한다.
// (Tailwind가 빌드 시 클래스를 정적으로 스캔하므로, 문자열을 조립하지 않고 완성된
// 클래스명을 그대로 나열해둔다.)
const SIZE_STEPS: { maxLen: number; cell: string; text: string }[] = [
  { maxLen: 15, cell: "h-11 w-11 sm:h-12 sm:w-12", text: "text-lg sm:text-xl" },
  { maxLen: 25, cell: "h-10 w-10 sm:h-11 sm:w-11", text: "text-base sm:text-lg" },
  { maxLen: 35, cell: "h-9 w-9 sm:h-10 sm:w-10", text: "text-base sm:text-lg" },
  { maxLen: 50, cell: "h-8 w-8 sm:h-9 sm:w-9", text: "text-sm sm:text-base" },
  { maxLen: Infinity, cell: "h-7 w-7 sm:h-8 sm:w-8", text: "text-sm sm:text-base" },
];

function sizeForLength(len: number) {
  return SIZE_STEPS.find((step) => len <= step.maxLen) ?? SIZE_STEPS[SIZE_STEPS.length - 1];
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
  const len = Array.from(text).length;
  const size = useMemo(() => sizeForLength(len), [len]);

  const cells = useMemo(() => {
    const rows = Math.max(minRows, Math.ceil(len / columns) || minRows);
    return toCells(text, rows * columns);
  }, [text, len, columns, minRows]);

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
          className={`${size.cell} ${size.text} flex items-center justify-center border-[0.5px] border-[color-mix(in_srgb,var(--paper-grid)_70%,transparent)] font-mono text-[var(--ink)]`}
        >
          {ch}
        </span>
      ))}
    </div>
  );
}
