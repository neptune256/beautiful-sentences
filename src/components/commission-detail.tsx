"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  submitCommissionResponse,
  adoptCommissionResponse,
} from "@/app/actions/commissions";
import { COMMISSION_RULES } from "@/lib/commission-constants";
import type { Commission, CommissionResponse } from "@/app/actions/commissions";

const RESPONSE_MAX = 4000;

type CommissionWithNickname = Commission & { requester_nickname: string };
type ResponseWithNickname = CommissionResponse & { author_nickname: string };

const STATUS_LABEL: Record<Commission["status"], string> = {
  open: "모집중",
  resolved: "채택완료",
  expired: "만료(환불됨)",
};

function daysLeft(expiresAt: string) {
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 3600 * 1000)));
}

export function CommissionDetail({
  commission,
  responses: initialResponses,
  currentUser,
}: {
  commission: CommissionWithNickname;
  responses: ResponseWithNickname[];
  currentUser: { id: string; nickname: string } | null;
}) {
  const [responses, setResponses] = useState(initialResponses);
  const [status, setStatus] = useState(commission.status);
  const [winnerResponseId, setWinnerResponseId] = useState(commission.winner_response_id);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [adoptingId, setAdoptingId] = useState<string | null>(null);

  const rule = COMMISSION_RULES[commission.type];
  const isRequester = currentUser?.id === commission.requester_id;
  const canRespond = !!currentUser && !isRequester && status === "open";

  function handleSubmitResponse() {
    setError(null);
    startTransition(async () => {
      try {
        const created = await submitCommissionResponse({
          commissionId: commission.id,
          content,
        });
        setResponses((prev) => [
          ...prev,
          { ...created, author_nickname: currentUser?.nickname ?? "익명" },
        ]);
        setContent("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "응답을 남기지 못했어요.");
      }
    });
  }

  function handleAdopt(responseId: string) {
    setAdoptingId(responseId);
    setError(null);
    startTransition(async () => {
      try {
        await adoptCommissionResponse({ commissionId: commission.id, responseId });
        setStatus("resolved");
        setWinnerResponseId(responseId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "채택하지 못했어요.");
      } finally {
        setAdoptingId(null);
      }
    });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 px-4 pb-3 pt-1 sm:px-6">
        <span className="font-sans text-xs font-bold tracking-[0.3em] text-[color-mix(in_srgb,var(--paper-cream)_85%,#fff)]">
          {rule.label}
        </span>
        <Link
          href="/commission"
          className="rounded-full border border-[color-mix(in_srgb,var(--paper-cream)_50%,transparent)] px-4 py-2 font-sans text-sm font-bold text-[var(--paper-cream)] transition-colors hover:bg-[color-mix(in_srgb,var(--paper-cream)_12%,transparent)]"
        >
          ← 의뢰소로 돌아가기
        </Link>
      </div>

      <div className="quest-board-bg min-h-0 flex-1 overflow-auto px-4 pb-10 pt-2 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <div className="quest-parchment relative rounded-sm border border-[color-mix(in_srgb,var(--wood-shadow)_35%,transparent)] p-6 shadow-[3px_5px_10px_rgba(0,0,0,0.35)]">
            <span className="pointer-events-none absolute left-1/2 top-0 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--stamp-red)] shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="rounded-full bg-[color-mix(in_srgb,var(--wood-shadow)_85%,transparent)] px-3 py-1 font-sans text-xs font-bold text-[var(--paper-cream)]">
                {STATUS_LABEL[status]}
              </span>
              <span className="flex items-center gap-1 font-sans text-xs font-bold text-[var(--stamp-red)]">
                💎 채택 시 {commission.reward_diamonds} 지급 (지불 {commission.diamond_cost})
              </span>
            </div>

            <h1 className="mt-3 font-serif text-xl font-bold text-[var(--ink)]">
              {commission.title}
            </h1>
            <div className="mt-1 flex items-center gap-2 font-sans text-xs text-[color-mix(in_srgb,var(--ink)_65%,transparent)]">
              <span className="font-bold">{commission.requester_nickname}</span>
              {status === "open" && <span>{daysLeft(commission.expires_at)}일 남음</span>}
            </div>

            <p className="mt-4 whitespace-pre-wrap break-words font-serif text-sm leading-relaxed text-[var(--ink)]">
              {commission.body}
            </p>
          </div>

          <h2 className="mt-8 font-sans text-sm font-bold text-[var(--paper-cream)]">
            응답 {responses.length}개
          </h2>

          <div className="mt-3 flex flex-col gap-3">
            {responses.length === 0 && (
              <p className="font-sans text-sm text-[color-mix(in_srgb,var(--paper-cream)_70%,transparent)]">
                아직 응답이 없어요.
              </p>
            )}
            {responses.map((r) => {
              const isWinner = winnerResponseId === r.id;
              return (
                <div
                  key={r.id}
                  className={`rounded-sm border p-4 shadow-[2px_4px_8px_rgba(0,0,0,0.25)] ${
                    isWinner
                      ? "border-[var(--stamp-red)] bg-[color-mix(in_srgb,var(--postit-mint)_35%,var(--paper-cream)_65%)]"
                      : "border-[var(--paper-grid)] bg-[var(--paper-cream)]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-xs font-bold text-[var(--ink)]">
                      {r.author_nickname}
                    </span>
                    {isWinner && (
                      <span className="rounded-full bg-[var(--stamp-red)] px-2.5 py-0.5 font-sans text-[11px] font-bold text-[var(--paper-cream)]">
                        채택됨
                      </span>
                    )}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap break-words font-serif text-sm leading-relaxed text-[var(--ink)]">
                    {r.content}
                  </p>
                  {isRequester && status === "open" && (
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleAdopt(r.id)}
                        disabled={isPending}
                        className="rounded-full bg-[var(--stamp-red)] px-4 py-1.5 font-sans text-xs font-bold text-[var(--paper-cream)] transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {adoptingId === r.id ? "채택하는 중" : "이 응답 채택하기"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {error && <p className="mt-3 font-sans text-xs text-[var(--stamp-red)]">{error}</p>}

          {canRespond && (
            <div className="quest-parchment mt-6 rounded-sm border border-[var(--paper-grid)] p-4">
              <label className="font-sans text-xs font-bold text-[color-mix(in_srgb,var(--ink)_65%,transparent)]">
                응답 남기기
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                maxLength={RESPONSE_MAX}
                placeholder={
                  commission.type === "critique"
                    ? "글을 읽고 비평을 남겨 주세요."
                    : "요청받은 장면을 써서 남겨 주세요."
                }
                className="mt-1 w-full resize-none rounded-sm border border-[var(--paper-grid)] bg-[color-mix(in_srgb,var(--paper-cream)_92%,#fff_8%)] px-3 py-2 font-serif text-sm leading-relaxed text-[var(--ink)] outline-none focus:border-[var(--stamp-red)]"
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSubmitResponse}
                  disabled={isPending || !content.trim()}
                  className="rounded-full bg-[var(--stamp-red)] px-5 py-2 font-sans text-sm font-bold text-[var(--paper-cream)] transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isPending ? "등록하는 중" : "응답 남기기"}
                </button>
              </div>
            </div>
          )}

          {!currentUser && status === "open" && (
            <p className="mt-6 text-center font-sans text-sm text-[color-mix(in_srgb,var(--paper-cream)_75%,transparent)]">
              로그인하면 응답을 남길 수 있어요.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
