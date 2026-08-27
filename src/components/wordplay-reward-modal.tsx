"use client";

import { AnimatePresence, motion } from "motion/react";
import { QuestCompleteBanner } from "@/components/quest-celebration";

export function WordplayRewardModal({
  open,
  onClose,
  streak,
  isMilestone,
  diamondsAwarded = 0,
  dailyQuestCompletedNow = false,
}: {
  open: boolean;
  onClose: () => void;
  streak?: number | null;
  isMilestone?: boolean;
  diamondsAwarded?: number;
  dailyQuestCompletedNow?: boolean;
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
            className="manuscript-bg w-full max-w-sm overflow-hidden rounded-sm border border-[var(--paper-grid)] shadow-2xl"
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 6 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <div className="px-8 pt-8 pb-6 text-center">
              <p className="font-sans text-xs tracking-[0.3em] text-[color-mix(in_srgb,var(--ink)_45%,transparent)] uppercase">
                자유 게시판에 붙였어요
              </p>
              <p className="mt-3 font-serif text-sm leading-relaxed text-[var(--ink)]">
                네 단어로 지은 문장이 게시판에 걸렸습니다.
              </p>

              <QuestCompleteBanner
                streak={streak}
                milestoneAwarded={isMilestone}
                dailyQuestCompletedNow={dailyQuestCompletedNow}
                diamondsAwarded={diamondsAwarded}
              />

              <button
                type="button"
                onClick={onClose}
                className="mt-6 rounded-full bg-[var(--stamp-red)] px-6 py-2 font-sans text-sm font-bold tracking-wide text-[var(--paper-cream)] transition-transform duration-300 hover:scale-105"
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
