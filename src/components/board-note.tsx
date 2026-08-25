"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue } from "motion/react";
import type { BoardPost } from "@/app/actions/board";

const COLOR_VARS: Record<string, string> = {
  yellow: "var(--postit-yellow)",
  pink: "var(--postit-pink)",
  mint: "var(--postit-mint)",
  blue: "var(--postit-blue)",
};

export function BoardNote({
  post,
  isOwner,
  onMove,
  onOpen,
  onLike,
  onDelete,
}: {
  post: BoardPost;
  isOwner: boolean;
  onMove: (x: number, y: number) => void;
  onOpen: () => void;
  onLike: () => void;
  onDelete: () => void;
}) {
  const x = useMotionValue(post.x);
  const y = useMotionValue(post.y);
  const draggedRef = useRef(false);

  useEffect(() => {
    x.set(post.x);
    y.set(post.y);
  }, [post.x, post.y, x, y]);

  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const hoursLeft =
    now === null
      ? null
      : Math.max(1, Math.ceil((new Date(post.expires_at).getTime() - now) / (3600 * 1000)));

  return (
    <motion.div
      drag={isOwner}
      dragMomentum={false}
      dragElastic={0}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        x,
        y,
        rotate: post.rotation,
        backgroundColor: COLOR_VARS[post.color] ?? COLOR_VARS.yellow,
      }}
      whileDrag={{ scale: 1.05, zIndex: 40, boxShadow: "6px 10px 18px rgba(0,0,0,0.4)" }}
      onDragStart={() => {
        draggedRef.current = true;
      }}
      onDragEnd={() => {
        onMove(x.get(), y.get());
        setTimeout(() => {
          draggedRef.current = false;
        }, 0);
      }}
      onClick={() => {
        if (!draggedRef.current) onOpen();
      }}
      className="w-56 select-none rounded-sm p-4 shadow-[3px_5px_10px_rgba(0,0,0,0.3)]"
    >
      <div className="pointer-events-none flex flex-col gap-2">
        <p className="line-clamp-6 whitespace-pre-wrap break-words font-serif text-sm leading-relaxed text-[var(--ink)]">
          {post.content}
        </p>
        <div className="flex items-center justify-between font-sans text-xs text-[color-mix(in_srgb,var(--ink)_65%,transparent)]">
          <span className="font-bold">{post.author_name}</span>
          <span>{hoursLeft !== null ? `${hoursLeft}시간 후 소멸` : ""}</span>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onLike();
            }}
            className="flex items-center gap-1 font-sans text-xs font-bold text-[var(--stamp-red)] transition-transform hover:scale-110"
          >
            ♥ {post.likes_count}
          </button>
          <span className="flex items-center gap-1 font-sans text-xs text-[color-mix(in_srgb,var(--ink)_65%,transparent)]">
            💬 {post.comments_count}
          </span>
        </div>
        {isOwner && (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="font-sans text-xs text-[color-mix(in_srgb,var(--ink)_50%,transparent)] hover:text-[var(--stamp-red)]"
          >
            지우기
          </button>
        )}
      </div>
    </motion.div>
  );
}
