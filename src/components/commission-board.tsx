"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createCommission } from "@/app/actions/commissions";
import { CommissionCreateModal } from "@/components/commission-create-modal";
import { CommissionCard, type CommissionListItem } from "@/components/commission-card";
import type { CommissionType } from "@/lib/commission-constants";

type FilterTab = "all" | CommissionType;

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "critique", label: "합평 의뢰" },
  { value: "writing", label: "집필 의뢰" },
];

// 카드마다 살짝 다른 기울기를 줘서 게시판에 핀으로 꽂아둔 느낌을 낸다.
function rotationFor(id: string) {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) % 1000;
  return (hash / 1000) * 4 - 2;
}

export function CommissionBoard({
  initialCommissions,
  currentUser,
}: {
  initialCommissions: CommissionListItem[];
  currentUser: { id: string; nickname: string; diamonds: number } | null;
}) {
  const [commissions, setCommissions] = useState(initialCommissions);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [createType, setCreateType] = useState<CommissionType | null>(null);

  const filtered = useMemo(
    () => (filter === "all" ? commissions : commissions.filter((c) => c.type === filter)),
    [commissions, filter],
  );

  async function handleCreate(title: string, body: string) {
    if (!createType) return;
    const created = await createCommission({ type: createType, title, body });
    setCommissions((prev) => [
      { ...created, requester_nickname: currentUser?.nickname ?? "익명" },
      ...prev,
    ]);
    setCreateType(null);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 flex-wrap items-end justify-between gap-3 px-4 pb-3 sm:px-6">
        <div>
          <span className="font-sans text-xs font-bold tracking-[0.3em] text-[color-mix(in_srgb,var(--paper-cream)_85%,#fff)]">
            의뢰소
          </span>
          <h1 className="font-serif text-lg text-[var(--paper-cream)]">
            다이아를 걸고 합평이나 집필을 의뢰해 보세요.
          </h1>
          <p className="mt-1 font-sans text-xs text-[color-mix(in_srgb,var(--paper-cream)_75%,transparent)]">
            채택된 응답자에게 보상 다이아가 지급돼요. 7일간 채택이 없으면 자동 환불돼요.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="rounded-full border border-[color-mix(in_srgb,var(--paper-cream)_50%,transparent)] px-4 py-2.5 font-sans text-sm font-bold text-[var(--paper-cream)] transition-colors hover:bg-[color-mix(in_srgb,var(--paper-cream)_12%,transparent)]"
          >
            ← 노트로 돌아가기
          </Link>
          {currentUser && (
            <>
              <button
                type="button"
                onClick={() => setCreateType("critique")}
                className="rounded-full bg-[var(--postit-blue)] px-4 py-2.5 font-sans text-sm font-bold text-[var(--ink)] shadow-lg transition-transform hover:scale-105"
              >
                + 합평 의뢰
              </button>
              <button
                type="button"
                onClick={() => setCreateType("writing")}
                className="rounded-full bg-[var(--stamp-red)] px-4 py-2.5 font-sans text-sm font-bold text-[var(--paper-cream)] shadow-lg transition-transform hover:scale-105"
              >
                + 집필 의뢰
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 px-4 pb-3 sm:px-6">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setFilter(tab.value)}
            className={`rounded-full px-3.5 py-1.5 font-sans text-xs font-bold transition-colors ${
              filter === tab.value
                ? "bg-[var(--paper-cream)] text-[var(--ink)]"
                : "bg-[color-mix(in_srgb,var(--paper-cream)_18%,transparent)] text-[var(--paper-cream)] hover:bg-[color-mix(in_srgb,var(--paper-cream)_28%,transparent)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
        {currentUser && (
          <span className="ml-auto flex items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--paper-cream)_18%,transparent)] px-3 py-1.5 font-sans text-xs font-bold text-[var(--paper-cream)]">
            💎 보유 {currentUser.diamonds}
          </span>
        )}
      </div>

      <div className="quest-board-bg min-h-0 flex-1 overflow-auto px-4 pb-8 pt-6 sm:px-6">
        {filtered.length === 0 ? (
          <p className="mt-16 text-center font-sans text-sm text-[color-mix(in_srgb,var(--paper-cream)_70%,transparent)]">
            아직 올라온 의뢰가 없어요. 첫 의뢰를 등록해 보세요.
          </p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-6">
            {filtered.map((item) => (
              <CommissionCard key={item.id} item={item} rotation={rotationFor(item.id)} />
            ))}
          </div>
        )}
      </div>

      <CommissionCreateModal
        type={createType}
        diamonds={currentUser?.diamonds ?? 0}
        onClose={() => setCreateType(null)}
        onSubmit={handleCreate}
      />
    </div>
  );
}
