import Link from "next/link";
import { COMMISSION_RULES } from "@/lib/commission-constants";
import type { CommissionType } from "@/lib/commission-constants";

export type CommissionListItem = {
  id: string;
  type: CommissionType;
  title: string;
  body: string;
  diamond_cost: number;
  reward_diamonds: number;
  status: "open" | "resolved" | "expired";
  response_count: number;
  expires_at: string;
  created_at: string;
  requester_nickname: string;
};

const STATUS_LABEL: Record<CommissionListItem["status"], { text: string; className: string }> = {
  open: { text: "모집중", className: "bg-[var(--postit-mint)] text-[var(--ink)]" },
  resolved: { text: "채택완료", className: "bg-[var(--postit-blue)] text-[var(--ink)]" },
  expired: { text: "만료", className: "bg-[color-mix(in_srgb,var(--ink)_25%,var(--paper-cream)_75%)] text-[color-mix(in_srgb,var(--ink)_70%,transparent)]" },
};

function daysLeft(expiresAt: string) {
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 3600 * 1000)));
}

export function CommissionCard({ item, rotation }: { item: CommissionListItem; rotation: number }) {
  const rule = COMMISSION_RULES[item.type];
  const status = STATUS_LABEL[item.status];

  return (
    <Link
      href={`/commission/${item.id}`}
      style={{ transform: `rotate(${rotation}deg)` }}
      className="quest-parchment relative block w-full max-w-xs rounded-sm border border-[color-mix(in_srgb,var(--wood-shadow)_35%,transparent)] p-4 shadow-[3px_5px_10px_rgba(0,0,0,0.35)] transition-transform hover:-translate-y-1 hover:rotate-0"
    >
      <span className="pointer-events-none absolute left-1/2 top-0 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--stamp-red)] shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />

      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-[color-mix(in_srgb,var(--wood-shadow)_85%,transparent)] px-2.5 py-0.5 font-sans text-[11px] font-bold text-[var(--paper-cream)]">
          {rule.label}
        </span>
        <span className={`rounded-full px-2.5 py-0.5 font-sans text-[11px] font-bold ${status.className}`}>
          {status.text}
        </span>
      </div>

      <h3 className="mt-3 line-clamp-2 font-serif text-base font-bold text-[var(--ink)]">
        {item.title}
      </h3>
      <p className="mt-1.5 line-clamp-3 whitespace-pre-wrap break-words font-serif text-sm leading-relaxed text-[color-mix(in_srgb,var(--ink)_82%,transparent)]">
        {item.body}
      </p>

      <div className="mt-3 flex items-center justify-between font-sans text-xs text-[color-mix(in_srgb,var(--ink)_65%,transparent)]">
        <span className="font-bold">{item.requester_nickname}</span>
        <span>응답 {item.response_count}개</span>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="flex items-center gap-1 font-sans text-xs font-bold text-[var(--stamp-red)]">
          💎 채택 시 {item.reward_diamonds}
        </span>
        {item.status === "open" && (
          <span className="font-sans text-[11px] text-[color-mix(in_srgb,var(--ink)_55%,transparent)]">
            {daysLeft(item.expires_at)}일 남음
          </span>
        )}
      </div>
    </Link>
  );
}
