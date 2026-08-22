"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const GRID_COLS = 12;
const TYPE_INTERVAL_MS = 45;

// 원고지처럼 한 줄이 다 차면 다음 줄 첫 칸부터 이어지도록 빈 칸으로 채운다.
function buildManuscriptCells(text: string, cols: number): string[] {
  const cells: string[] = [];
  for (const line of text.split("\n")) {
    cells.push(...Array.from(line));
    const remainder = cells.length % cols;
    if (remainder !== 0) {
      cells.push(...Array(cols - remainder).fill(""));
    }
  }
  return cells;
}

export function SubmissionSuccessModal({
  open,
  content,
  onClose,
}: {
  open: boolean;
  content: string;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--wood-shadow)]/70 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="manuscript-bg w-full max-w-md overflow-hidden rounded-sm border border-[var(--paper-grid)] shadow-2xl"
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 6 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <div className="px-8 pt-8 pb-6">
              <p className="text-center font-sans text-xs tracking-[0.3em] text-[color-mix(in_srgb,var(--ink)_45%,transparent)] uppercase">
                오늘의 원고지
              </p>

              {/* content가 바뀌지 않는 한 이 모달은 열릴 때마다 새로 마운트되므로
                  key로 강제 리마운트하면 visibleCount가 0부터 자연스럽게 시작한다. */}
              <ManuscriptGrid key={content} content={content} />
            </div>

            <div className="border-t border-[var(--paper-grid)] bg-[color-mix(in_srgb,var(--paper-cream)_80%,var(--wood-shadow))] px-8 py-6 text-center">
              <p className="font-serif text-sm tracking-wide text-[var(--ink)]">
                당신의 문장이 밤하늘에 기록되었습니다.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-5 rounded-full bg-[var(--stamp-red)] px-6 py-2 font-sans text-sm font-bold tracking-wide text-[var(--paper-cream)] transition-transform duration-300 hover:scale-105"
              >
                닫기
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ManuscriptGrid({ content }: { content: string }) {
  const [cells] = useState(() => buildManuscriptCells(content, GRID_COLS));
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleCount((prev) => {
        if (prev >= cells.length) {
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, TYPE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [cells.length]);

  return (
    <div
      className="mx-auto mt-5 grid w-fit gap-0 rounded-sm border border-[var(--paper-grid)]"
      style={{ gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))` }}
    >
      {cells.map((ch, i) => (
        <span
          key={i}
          className="flex h-7 w-7 items-center justify-center border border-[color-mix(in_srgb,var(--paper-grid)_70%,transparent)] text-sm text-[var(--ink)] sm:h-8 sm:w-8"
        >
          {i < visibleCount && ch && (
            <motion.span
              className="font-serif"
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.18 }}
            >
              {ch}
            </motion.span>
          )}
        </span>
      ))}
    </div>
  );
}
