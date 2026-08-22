"use client";

import { useEffect, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import type { BoardComment, BoardPost } from "@/app/actions/board";

const MAX_LENGTH = 200;

export function BoardCommentsModal({
  post,
  showNameField,
  defaultName,
  onClose,
  onLike,
  onSubmitComment,
}: {
  post: BoardPost | null;
  showNameField: boolean;
  defaultName: string;
  onClose: () => void;
  onLike: () => void;
  onSubmitComment: (content: string, anonName: string) => Promise<BoardComment>;
}) {
  const [comments, setComments] = useState<BoardComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [name, setName] = useState(defaultName);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!post) return;
    setComments([]);
    setContent("");
    setError(null);
    setLoading(true);

    const supabase = createClient();
    supabase
      .from("board_comments")
      .select("id, post_id, author_name, content, created_at")
      .eq("post_id", post.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setComments((data ?? []) as BoardComment[]);
        setLoading(false);
      });
  }, [post]);

  function handleSubmit() {
    if (!post) return;
    setError(null);
    startTransition(async () => {
      try {
        const comment = await onSubmitComment(content, name);
        setComments((prev) => [...prev, comment]);
        setContent("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "댓글을 남기지 못했어요.");
      }
    });
  }

  return (
    <AnimatePresence>
      {post && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--wood-shadow)]/70 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            className="manuscript-bg flex max-h-[85vh] w-full max-w-md flex-col rounded-sm border border-[var(--paper-grid)] shadow-2xl"
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 6 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="border-b border-[var(--paper-grid)] p-5">
              <div className="flex items-center justify-between font-sans text-xs text-[color-mix(in_srgb,var(--ink)_60%,transparent)]">
                <span className="font-bold">{post.author_name}</span>
                <button type="button" onClick={onClose} className="hover:text-[var(--stamp-red)]">
                  닫기 ✕
                </button>
              </div>
              <p className="mt-2 whitespace-pre-wrap break-words font-serif text-sm leading-relaxed text-[var(--ink)]">
                {post.content}
              </p>
              <button
                type="button"
                onClick={onLike}
                className="mt-3 flex items-center gap-1 font-sans text-sm font-bold text-[var(--stamp-red)] transition-transform hover:scale-105"
              >
                ♥ 좋아요 {post.likes_count}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {loading && (
                <p className="font-sans text-xs text-[color-mix(in_srgb,var(--ink)_50%,transparent)]">
                  불러오는 중...
                </p>
              )}
              {!loading && comments.length === 0 && (
                <p className="font-sans text-xs text-[color-mix(in_srgb,var(--ink)_50%,transparent)]">
                  아직 댓글이 없어요. 첫 댓글을 남겨 보세요.
                </p>
              )}
              <ul className="flex flex-col gap-3">
                {comments.map((c) => (
                  <li key={c.id} className="font-sans text-sm text-[var(--ink)]">
                    <span className="font-bold">{c.author_name}</span>
                    <p className="mt-0.5 whitespace-pre-wrap break-words text-[color-mix(in_srgb,var(--ink)_85%,transparent)]">
                      {c.content}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-[var(--paper-grid)] p-4">
              {showNameField && (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={20}
                  placeholder="익명"
                  className="mb-2 w-full rounded-sm border border-[var(--paper-grid)] bg-[var(--paper-cream)] px-3 py-1.5 font-sans text-xs text-[var(--ink)] outline-none focus:border-[var(--stamp-red)]"
                />
              )}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  maxLength={MAX_LENGTH}
                  placeholder="댓글 남기기"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSubmit();
                  }}
                  className="flex-1 rounded-sm border border-[var(--paper-grid)] bg-[var(--paper-cream)] px-3 py-2 font-sans text-sm text-[var(--ink)] outline-none focus:border-[var(--stamp-red)]"
                />
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isPending || content.trim().length === 0}
                  className="rounded-full bg-[var(--stamp-red)] px-4 py-2 font-sans text-sm font-bold text-[var(--paper-cream)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  등록
                </button>
              </div>
              {error && (
                <p className="mt-1 font-sans text-xs text-[var(--stamp-red)]">{error}</p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
