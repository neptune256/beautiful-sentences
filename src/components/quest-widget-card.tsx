"use client";

import { useState } from "react";
import Link from "next/link";
import type { DailyQuestStatus } from "@/lib/quests";

const QUESTS = [
  { key: "sentenceDone", label: "오늘의 문장 쓰기", href: "/" },
  { key: "wordplayDone", label: "네 단어 글쓰기 공유", href: "/wordplay" },
] as const;

export function QuestWidgetCard({ status }: { status: DailyQuestStatus }) {
  const [open, setOpen] = useState(false);
  const doneCount = QUESTS.filter((q) => status[q.key]).length;
  const allDone = doneCount === QUESTS.length;

  return (
    <div className="pointer-events-auto relative">
      <button
        key={doneCount}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={[
          "pop-in flex items-center gap-2.5 rounded-full border-2 border-[var(--paper-grid)] px-5 py-3 font-sans text-base font-bold shadow-[3px_5px_14px_rgba(0,0,0,0.32)] transition-transform hover:scale-105",
          allDone
            ? "bg-[var(--postit-active)] text-[var(--wood-shadow)]"
            : "bg-[color-mix(in_srgb,var(--paper-cream)_96%,#fff)] text-[var(--ink)]",
        ].join(" ")}
      >
        <span aria-hidden className="text-2xl leading-none">
          {allDone ? "🎉" : "📋"}
        </span>
        <span className="flex flex-col items-start leading-tight">
          <span className="text-[10px] font-bold tracking-[0.15em] opacity-70">퀘스트</span>
          <span className="font-mono text-lg">
            {doneCount}/{QUESTS.length}
          </span>
        </span>
      </button>

      {open && (
        <div
          className="absolute right-0 bottom-full z-10 mb-3 flex w-56 flex-col gap-2.5 rounded-sm border border-[var(--paper-grid)] bg-[color-mix(in_srgb,var(--paper-cream)_96%,#fff)] p-4 shadow-[4px_6px_16px_rgba(0,0,0,0.35)] sm:w-64"
          style={{ transform: "rotate(-1.2deg)" }}
        >
          <span className="font-sans text-sm font-bold tracking-[0.1em] text-[var(--ink)]">
            {allDone ? "오늘의 퀘스트 완료 🎉" : "오늘의 퀘스트"}
          </span>
          <ul className="flex flex-col gap-2">
          {QUESTS.map((q) => {
            const done = status[q.key];
            return (
              <li key={q.key}>
                <Link
                  href={q.href}
                  className={[
                    "flex items-center gap-3 rounded-sm px-3 py-2.5 font-sans text-sm transition-colors",
                    done
                      ? "bg-[color-mix(in_srgb,var(--postit-active)_55%,transparent)] text-[var(--ink)]"
                      : "bg-white text-[color-mix(in_srgb,var(--ink)_75%,transparent)] hover:bg-[color-mix(in_srgb,var(--paper-cream)_60%,#fff)]",
                  ].join(" ")}
                >
                  <span
                    aria-hidden
                    className={[
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                      done
                        ? "border-[var(--stamp-red)] bg-[var(--stamp-red)] text-[var(--paper-cream)]"
                        : "border-[color-mix(in_srgb,var(--ink)_35%,transparent)] text-transparent",
                    ].join(" ")}
                  >
                    ✓
                  </span>
                  <span className={done ? "line-through opacity-70" : ""}>{q.label}</span>
                </Link>
              </li>
            );
          })}
          </ul>
        </div>
      )}
    </div>
  );
}
