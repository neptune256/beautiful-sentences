"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  WORDPLAY_NOUNS,
  WORDPLAY_VERBS,
  WORDPLAY_COLORS,
  WORDPLAY_ADJECTIVES,
  pickRandom,
} from "@/lib/wordplay-words";
import {
  saveWordplayEntry,
  deleteWordplayEntry,
  shareWordplayEntry,
  type WordplayEntry,
} from "@/app/actions/wordplay";

const MAX_ENTRIES = 60;

type Triple = {
  noun: string;
  verb: string;
  adjective: string;
  color: { name: string; hex: string };
};

function rollTriple(): Triple {
  return {
    noun: pickRandom(WORDPLAY_NOUNS),
    verb: pickRandom(WORDPLAY_VERBS),
    adjective: pickRandom(WORDPLAY_ADJECTIVES),
    color: pickRandom(WORDPLAY_COLORS),
  };
}

export function WordplayBoard({
  loggedIn,
  initialEntries,
}: {
  loggedIn: boolean;
  initialEntries: WordplayEntry[];
}) {
  const router = useRouter();
  const [triple, setTriple] = useState<Triple | null>(null);
  const [sentence, setSentence] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  // 서버 렌더링과 클라이언트 렌더링의 무작위 값이 어긋나지 않도록, 첫 조합은
  // 마운트 이후에만 뽑는다.
  useEffect(() => {
    setTriple(rollTriple());
  }, []);

  const entries = initialEntries;
  const atLimit = entries.length >= MAX_ENTRIES;

  function handleReroll() {
    setTriple(rollTriple());
  }

  function handleSave() {
    if (!triple) return;
    setError(null);
    startSaving(async () => {
      try {
        await saveWordplayEntry({
          adjective: triple.adjective,
          noun: triple.noun,
          verb: triple.verb,
          colorName: triple.color.name,
          colorHex: triple.color.hex,
          sentence,
        });
        setSentence("");
        setTriple(rollTriple());
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "저장에 실패했습니다.");
      }
    });
  }

  function handleDelete(id: string) {
    setPendingId(id);
    setShareMessage(null);
    (async () => {
      try {
        await deleteWordplayEntry(id);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "삭제에 실패했습니다.");
      } finally {
        setPendingId(null);
      }
    })();
  }

  function handleShare(id: string) {
    setPendingId(id);
    setShareMessage(null);
    (async () => {
      try {
        await shareWordplayEntry(id);
        setShareMessage("자유 게시판에 붙였어요.");
      } catch (e) {
        setError(e instanceof Error ? e.message : "공유에 실패했습니다.");
      } finally {
        setPendingId(null);
      }
    })();
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4 rounded-sm border border-[var(--paper-grid)] bg-[color-mix(in_srgb,var(--paper-cream)_90%,#fff)] p-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <WordCard label="형용사" value={triple?.adjective ?? "…"} />
          <WordCard label="명사" value={triple?.noun ?? "…"} />
          <ColorCard hex={triple?.color.hex} />
          <WordCard label="동사" value={triple?.verb ?? "…"} />
        </div>

        <button
          type="button"
          onClick={handleReroll}
          className="self-start rounded-full border border-[var(--ink)] px-4 py-1.5 font-sans text-xs font-bold text-[var(--ink)] transition-transform hover:scale-105"
        >
          다시 뽑기
        </button>

        <textarea
          value={sentence}
          onChange={(e) => setSentence(e.target.value)}
          rows={3}
          maxLength={300}
          placeholder="네 단어를 넣어서 짧은 문장을 지어보세요."
          className="w-full resize-none rounded-sm border border-[var(--paper-grid)] bg-white p-3 font-serif text-sm leading-relaxed text-[var(--ink)] shadow-[inset_0_1px_3px_rgba(0,0,0,0.08)] outline-none placeholder:font-sans placeholder:text-[color-mix(in_srgb,var(--ink)_40%,transparent)] focus:border-[var(--stamp-red)]"
        />

        {loggedIn ? (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || sentence.trim().length === 0 || atLimit}
              className="rounded-full bg-[var(--stamp-red)] px-5 py-2 font-sans text-sm font-bold text-[var(--paper-cream)] transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSaving ? "저장 중…" : "저장하기"}
            </button>
            <span className="font-mono text-xs text-[color-mix(in_srgb,var(--ink)_55%,transparent)]">
              {entries.length} / {MAX_ENTRIES}개 저장됨
            </span>
            {atLimit && (
              <span className="font-sans text-xs text-[var(--stamp-red)]">
                다 찼어요. 아래에서 글을 지우고 다시 저장해 보세요.
              </span>
            )}
          </div>
        ) : (
          <p className="font-sans text-xs text-[color-mix(in_srgb,var(--ink)_55%,transparent)]">
            로그인하면 지은 문장을 최대 {MAX_ENTRIES}개까지 저장하고 게시판에 공유할 수 있어요.
          </p>
        )}

        {error && <p className="font-sans text-xs text-[var(--stamp-red)]">{error}</p>}
      </section>

      {loggedIn && entries.length > 0 && (
        <section className="flex flex-col gap-2">
          <span className="font-sans text-xs font-bold tracking-[0.2em] text-[color-mix(in_srgb,var(--ink)_55%,transparent)]">
            내가 지은 문장
          </span>
          {shareMessage && (
            <p className="font-sans text-xs text-[var(--stamp-red)]">{shareMessage}</p>
          )}
          <ul className="flex flex-col gap-2">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-col gap-2 rounded-sm border border-[var(--paper-grid)] bg-white p-3 shadow-[inset_0_1px_3px_rgba(0,0,0,0.06)] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-col gap-1">
                  <p className="font-serif text-sm leading-relaxed text-[var(--ink)]">
                    {entry.sentence}
                  </p>
                  <div className="flex items-center gap-2 font-sans text-xs text-[color-mix(in_srgb,var(--ink)_55%,transparent)]">
                    <span>{entry.adjective}</span>
                    <span>{entry.noun}</span>
                    <span
                      aria-label={entry.color_name}
                      className="inline-block h-3 w-3 rounded-full border border-[var(--paper-grid)]"
                      style={{ backgroundColor: entry.color_hex }}
                    />
                    <span>{entry.verb}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3 font-sans text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => handleShare(entry.id)}
                    disabled={pendingId === entry.id}
                    className="text-[var(--stamp-red)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    게시판에 공유
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(entry.id)}
                    disabled={pendingId === entry.id}
                    className="text-[color-mix(in_srgb,var(--ink)_55%,transparent)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function WordCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-sm border border-[var(--paper-grid)] bg-white px-2 py-4 shadow-[inset_0_1px_3px_rgba(0,0,0,0.06)]">
      <span className="font-sans text-[10px] font-bold tracking-[0.2em] text-[color-mix(in_srgb,var(--ink)_45%,transparent)]">
        {label}
      </span>
      <span className="font-serif text-lg font-bold text-[var(--ink)]">{value}</span>
    </div>
  );
}

function ColorCard({ hex }: { hex: string | undefined }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-sm border border-[var(--paper-grid)] bg-white px-2 py-4 shadow-[inset_0_1px_3px_rgba(0,0,0,0.06)]">
      <span className="font-sans text-[10px] font-bold tracking-[0.2em] text-[color-mix(in_srgb,var(--ink)_45%,transparent)]">
        색
      </span>
      <span
        className="mt-1 h-9 w-9 rounded-full border border-[var(--paper-grid)]"
        style={{ backgroundColor: hex ?? "transparent" }}
      />
    </div>
  );
}
