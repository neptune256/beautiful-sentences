"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";

export function BoardComposeModal({
  open,
  showNameField,
  defaultName,
  onClose,
  onSubmit,
}: {
  open: boolean;
  showNameField: boolean;
  defaultName: string;
  onClose: () => void;
  onSubmit: (content: string, anonName: string) => Promise<void>;
}) {
  const [content, setContent] = useState("");
  const [name, setName] = useState(defaultName);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      try {
        await onSubmit(content, name);
        setContent("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "글을 남기지 못했어요.");
      }
    });
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--wood-shadow)]/70 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            className="manuscript-bg w-full max-w-md rounded-sm border border-[var(--paper-grid)] p-6 shadow-2xl"
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 6 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <h2 className="font-serif text-lg font-bold text-[var(--ink)]">새 글 남기기</h2>
            <p className="mt-1 font-sans text-xs text-[color-mix(in_srgb,var(--ink)_60%,transparent)]">
              누구나 자유롭게 쓸 수 있어요. 24시간 뒤 사라지고, 좋아요를 받으면 다시 24시간이 채워져요.
            </p>

            {showNameField && (
              <div className="mt-4">
                <label className="font-sans text-xs font-bold text-[color-mix(in_srgb,var(--ink)_65%,transparent)]">
                  표시할 이름 (선택)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={20}
                  placeholder="익명"
                  className="mt-1 w-full rounded-sm border border-[var(--paper-grid)] bg-[var(--paper-cream)] px-3 py-2 font-sans text-sm text-[var(--ink)] outline-none focus:border-[var(--stamp-red)]"
                />
              </div>
            )}

            <div className="mt-4">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                autoFocus
                placeholder="자유롭게 적어 보세요."
                className="w-full resize-none rounded-sm border border-[var(--paper-grid)] bg-[var(--paper-cream)] px-3 py-2 font-serif text-sm leading-relaxed text-[var(--ink)] outline-none focus:border-[var(--stamp-red)]"
              />
            </div>

            {error && (
              <p className="mt-2 font-sans text-xs text-[var(--stamp-red)]">{error}</p>
            )}

            <div className="mt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="font-sans text-sm text-[color-mix(in_srgb,var(--ink)_60%,transparent)]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isPending || content.trim().length === 0}
                className="rounded-full bg-[var(--stamp-red)] px-5 py-2 font-sans text-sm font-bold text-[var(--paper-cream)] transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isPending ? "붙이는 중" : "붙이기"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
