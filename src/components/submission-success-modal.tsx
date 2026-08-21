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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="w-full max-w-md overflow-hidden rounded-3xl border border-amber-900/10 bg-[#f4ecd8] shadow-2xl dark:border-amber-200/10 dark:bg-neutral-900"
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 6 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <div className="px-8 pt-8 pb-6">
              <p className="text-center text-xs tracking-[0.3em] text-amber-900/40 uppercase dark:text-amber-200/40">
                오늘의 원고지
              </p>

              {/* content가 바뀌지 않는 한 이 모달은 열릴 때마다 새로 마운트되므로
                  key로 강제 리마운트하면 visibleCount가 0부터 자연스럽게 시작한다. */}
              <ManuscriptGrid key={content} content={content} />
            </div>

            <div className="border-t border-amber-900/10 bg-[#efe4cc] px-8 py-6 text-center dark:border-amber-200/10 dark:bg-neutral-900/60">
              <p className="font-serif text-sm tracking-wide text-amber-950/70 dark:text-amber-100/70">
                당신의 문장이 밤하늘에 기록되었습니다.
              </p>
              <button
                onClick={onClose}
                className="mt-5 rounded-full bg-slate-800 px-6 py-2 text-sm tracking-wide text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
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
      className="mx-auto mt-5 grid w-fit gap-0 rounded-sm border border-amber-900/20 dark:border-amber-200/15"
      style={{ gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))` }}
    >
      {cells.map((ch, i) => (
        <span
          key={i}
          className="flex h-7 w-7 items-center justify-center border border-amber-900/10 text-sm text-slate-800 sm:h-8 sm:w-8 dark:border-amber-200/10 dark:text-slate-100"
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
