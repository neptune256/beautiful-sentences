"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { COMMISSION_RULES, type CommissionType } from "@/lib/commission-constants";

const TITLE_MAX = 60;
const BODY_MAX = 4000;

export function CommissionCreateModal({
  type,
  diamonds,
  onClose,
  onSubmit,
}: {
  type: CommissionType | null;
  diamonds: number;
  onClose: () => void;
  onSubmit: (title: string, body: string) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const rule = type ? COMMISSION_RULES[type] : null;
  const insufficient = rule ? diamonds < rule.cost : false;

  function handleClose() {
    setTitle("");
    setBody("");
    setError(null);
    onClose();
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      try {
        await onSubmit(title, body);
        setTitle("");
        setBody("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "의뢰를 등록하지 못했어요.");
      }
    });
  }

  return (
    <AnimatePresence>
      {rule && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--wood-shadow)]/70 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            className="quest-parchment w-full max-w-md rounded-sm border border-[var(--paper-grid)] p-6 shadow-2xl"
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 6 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-bold text-[var(--ink)]">
                새 {rule.label}
              </h2>
              <span className="flex items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--wood-shadow)_85%,transparent)] px-3 py-1 font-sans text-xs font-bold text-[var(--paper-cream)]">
                💎 {rule.cost} 지불 → 채택 시 {rule.reward} 지급
              </span>
            </div>
            <p className="mt-1 font-sans text-xs text-[color-mix(in_srgb,var(--ink)_60%,transparent)]">
              등록하면 다이아 {rule.cost}개가 바로 차감돼요. 7일 안에 채택하지 않으면 자동으로 전액
              환불돼요.
            </p>

            <div className="mt-4">
              <label className="font-sans text-xs font-bold text-[color-mix(in_srgb,var(--ink)_65%,transparent)]">
                제목
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={TITLE_MAX}
                autoFocus
                placeholder={type === "critique" ? "예: 첫 문단만 봐주세요" : "예: 새벽 기차역 재회 장면"}
                className="mt-1 w-full rounded-sm border border-[var(--paper-grid)] bg-[color-mix(in_srgb,var(--paper-cream)_92%,#fff_8%)] px-3 py-2 font-sans text-sm text-[var(--ink)] outline-none focus:border-[var(--stamp-red)]"
              />
            </div>

            <div className="mt-3">
              <label className="font-sans text-xs font-bold text-[color-mix(in_srgb,var(--ink)_65%,transparent)]">
                {rule.bodyLabel}
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                maxLength={BODY_MAX}
                placeholder={rule.bodyPlaceholder}
                className="mt-1 w-full resize-none rounded-sm border border-[var(--paper-grid)] bg-[color-mix(in_srgb,var(--paper-cream)_92%,#fff_8%)] px-3 py-2 font-serif text-sm leading-relaxed text-[var(--ink)] outline-none focus:border-[var(--stamp-red)]"
              />
            </div>

            {insufficient && (
              <p className="mt-2 font-sans text-xs text-[var(--stamp-red)]">
                다이아가 부족해요. (보유 {diamonds} / 필요 {rule.cost})
              </p>
            )}
            {error && <p className="mt-2 font-sans text-xs text-[var(--stamp-red)]">{error}</p>}

            <div className="mt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="font-sans text-sm text-[color-mix(in_srgb,var(--ink)_60%,transparent)]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={
                  isPending || !title.trim() || !body.trim() || insufficient
                }
                className="rounded-full bg-[var(--stamp-red)] px-5 py-2 font-sans text-sm font-bold text-[var(--paper-cream)] transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isPending ? "등록하는 중" : `💎 ${rule.cost} 쓰고 의뢰하기`}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
