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
          "pop-in flex items-center gap-1.5 rounded-full border border-[var(--paper-grid)] px-3 py-1.5 font-sans text-xs font-bold shadow-[2px_3px_8px_rgba(0,0,0,0.28)] transition-transform hover:scale-105",
          allDone
            ? "bg-[var(--postit-active)] text-[var(--wood-shadow)]"
            : "bg-[color-mix(in_srgb,var(--paper-cream)_96%,#fff)] text-[var(--ink)]",
        ].join(" ")}
      >
        <span aria-hidden>{allDone ? "🎉" : "📋"}</span>
        <span className="font-mono">
          {doneCount}/{QUESTS.length}
        </span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-10 mt-2 flex w-44 flex-col gap-2 rounded-sm border border-[var(--paper-grid)] bg-[color-mix(in_srgb,var(--paper-cream)_96%,#fff)] p-3 shadow-[3px_4px_10px_rgba(0,0,0,0.28)] sm:w-48"
          style={{ transform: "rotate(-1.2deg)" }}
        >
          <span className="font-sans text-[11px] font-bold tracking-[0.1em] text-[var(--ink)]">
            {allDone ? "오늘의 퀘스트 완료 🎉" : "오늘의 퀘스트"}
          </span>
          <ul className="flex flex-col gap-1.5">
          {QUESTS.map((q) => {
            const done = status[q.key];
            return (
              <li key={q.key}>
                <Link
                  href={q.href}
                  className={[
                    "flex items-center gap-2 rounded-sm px-2 py-1.5 font-sans text-xs transition-colors",
                    done
                      ? "bg-[color-mix(in_srgb,var(--postit-active)_55%,transparent)] text-[var(--ink)]"
                      : "bg-white text-[color-mix(in_srgb,var(--ink)_75%,transparent)] hover:bg-[color-mix(in_srgb,var(--paper-cream)_60%,#fff)]",
                  ].join(" ")}
                >
                  <span
                    aria-hidden
                    className={[
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold",
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
