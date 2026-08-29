"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { castVote, loadFeedBatch } from "@/app/actions/votes";
import type { FeedCard } from "@/lib/feed";

// 화면에 보이는 카드가 끝에서 이만큼 남았을 때 다음 배치를 미리 불러온다.
const LOAD_MORE_THRESHOLD = 3;
const DOUBLE_TAP_MS = 300;

type CardState = FeedCard & { liked: boolean };

export function FeedClient({ initialBatch }: { initialBatch: FeedCard[] }) {
  const [cards, setCards] = useState<CardState[]>(
    initialBatch.map((c) => ({ ...c, liked: false })),
  );
  const [activeId, setActiveId] = useState<string | null>(initialBatch[0]?.id ?? null);
  const [exhausted, setExhausted] = useState(initialBatch.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [burstId, setBurstId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const elementsRef = useRef(new Map<string, HTMLDivElement>());
  const seenRef = useRef(new Set<string>());
  const passedRef = useRef(new Set<string>());
  const likedRef = useRef(new Set<string>());
  const loadedIdsRef = useRef(new Set<string>(initialBatch.map((c) => c.id)));
  const loadingRef = useRef(false);

  const registerCard = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) elementsRef.current.set(id, el);
    else elementsRef.current.delete(id);
  }, []);

  // 이미 본(활성 카드였던) 글이 화면 밖으로 나가면 "패스"로 한 번만 기록한다.
  // 좋아요를 이미 눌렀으면 별도로 패스를 기록할 필요가 없다.
  const recordPass = useCallback((id: string) => {
    if (passedRef.current.has(id) || likedRef.current.has(id)) return;
    passedRef.current.add(id);
    castVote(id, false).catch(() => {
      passedRef.current.delete(id);
    });
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoadingMore(true);
    try {
      const next = await loadFeedBatch(Array.from(loadedIdsRef.current));
      if (next.length === 0) {
        setExhausted(true);
      } else {
        next.forEach((c) => loadedIdsRef.current.add(c.id));
        setCards((prev) => [...prev, ...next.map((c) => ({ ...c, liked: false }))]);
      }
    } finally {
      loadingRef.current = false;
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.getAttribute("data-card-id");
          if (!id) continue;
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            seenRef.current.add(id);
            setActiveId(id);
          } else if (!entry.isIntersecting && seenRef.current.has(id)) {
            recordPass(id);
          }
        }
      },
      { root, threshold: [0, 0.6] },
    );

    elementsRef.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [cards, recordPass]);

  useEffect(() => {
    if (exhausted || !activeId) return;
    const idx = cards.findIndex((c) => c.id === activeId);
    if (idx === -1) return;
    if (cards.length - idx <= LOAD_MORE_THRESHOLD) {
      loadMore();
    }
  }, [activeId, cards, exhausted, loadMore]);

  function like(id: string) {
    if (likedRef.current.has(id)) return;
    likedRef.current.add(id);
    passedRef.current.add(id);
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, liked: true, likesCount: c.likesCount + 1 } : c)),
    );
    setBurstId(id);
    window.setTimeout(() => setBurstId((cur) => (cur === id ? null : cur)), 700);
    castVote(id, true).catch(() => {
      likedRef.current.delete(id);
      setCards((prev) =>
        prev.map((c) => (c.id === id ? { ...c, liked: false, likesCount: c.likesCount - 1 } : c)),
      );
    });
  }

  if (cards.length === 0 && exhausted) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <span className="text-4xl" aria-hidden>
          🌙
        </span>
        <p className="font-serif text-lg text-[color-mix(in_srgb,var(--paper-cream)_92%,#fff)]">
          아직 넘겨볼 글이 없어요.
        </p>
        <p className="font-sans text-sm text-[color-mix(in_srgb,var(--paper-cream)_60%,transparent)]">
          내일 다시 와서 새 글들을 만나보세요.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="no-scrollbar h-full snap-y snap-mandatory overflow-y-auto overscroll-y-contain"
    >
      {cards.map((card) => (
        <FeedCardView
          key={card.id}
          card={card}
          burst={burstId === card.id}
          registerCard={registerCard}
          onLike={() => like(card.id)}
        />
      ))}
      {loadingMore && (
        <div className="flex h-full snap-start items-center justify-center">
          <span className="font-sans text-sm text-[color-mix(in_srgb,var(--paper-cream)_60%,transparent)]">
            불러오는 중…
          </span>
        </div>
      )}
    </div>
  );
}

function FeedCardView({
  card,
  burst,
  registerCard,
  onLike,
}: {
  card: CardState;
  burst: boolean;
  registerCard: (id: string, el: HTMLDivElement | null) => void;
  onLike: () => void;
}) {
  const lastTapRef = useRef(0);

  function handleTap() {
    const now = Date.now();
    if (now - lastTapRef.current < DOUBLE_TAP_MS) {
      onLike();
    }
    lastTapRef.current = now;
  }

  return (
    <div
      ref={(el) => registerCard(card.id, el)}
      data-card-id={card.id}
      className="flex h-full w-full shrink-0 snap-start snap-always items-center justify-center p-4 sm:p-8"
      onClick={handleTap}
    >
      <div
        className="manuscript-bg relative flex w-full max-w-md flex-col justify-between overflow-hidden rounded-sm border border-[var(--paper-grid)] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.45)] sm:p-8"
        style={{ minHeight: "min(70vh, 560px)" }}
      >
        <span className="font-sans text-xs font-bold tracking-[0.3em] text-[color-mix(in_srgb,var(--ink)_45%,transparent)]">
          오늘의 글
        </span>

        <p className="whitespace-pre-wrap font-serif text-xl leading-relaxed text-[var(--ink)] sm:text-2xl">
          {card.content}
        </p>

        <div className="flex items-center justify-between gap-3">
          <span className="font-sans text-sm font-bold text-[color-mix(in_srgb,var(--ink)_70%,transparent)]">
            {card.authorNickname}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onLike();
            }}
            disabled={card.liked}
            aria-label="좋아요"
            className="flex items-center gap-1.5 rounded-full border border-[var(--paper-grid)] bg-white px-3 py-1.5 transition-transform hover:scale-105 disabled:hover:scale-100"
          >
            <span className={`text-lg ${card.liked ? "" : "grayscale opacity-70"}`} aria-hidden>
              ❤️
            </span>
            <span className="font-mono text-sm font-bold text-[var(--stamp-red)]">
              {card.likesCount}
            </span>
          </button>
        </div>

        <AnimatePresence>
          {burst && (
            <motion.span
              className="pointer-events-none absolute inset-0 flex items-center justify-center text-8xl"
              aria-hidden
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1.15 }}
              exit={{ opacity: 0, scale: 1.3 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              ❤️
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
