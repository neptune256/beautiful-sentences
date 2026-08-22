"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getAnonToken } from "@/lib/anon-token";
import {
  createBoardPost,
  deleteBoardPost,
  likeBoardPost,
  moveBoardPost,
  addBoardComment,
  type BoardPost,
} from "@/app/actions/board";
import { BoardNote } from "@/components/board-note";
import { BoardComposeModal } from "@/components/board-compose-modal";
import { BoardCommentsModal } from "@/components/board-comments-modal";

const CANVAS_WIDTH = 2400;
const CANVAS_HEIGHT = 1400;
const NOTE_WIDTH = 224;
const NOTE_HEIGHT = 170;
const ANON_NAME_KEY = "bs_board_anon_name";
const EXPIRE_CHECK_MS = 15000;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function BoardCanvas({
  initialPosts,
  currentUser,
}: {
  initialPosts: BoardPost[];
  currentUser: { id: string; nickname: string } | null;
}) {
  const [posts, setPosts] = useState<BoardPost[]>(initialPosts);
  const [anonToken, setAnonToken] = useState("");
  const [anonName, setAnonName] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [pendingPos, setPendingPos] = useState({ x: 0, y: 0 });
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAnonToken(getAnonToken());
    setAnonName(window.localStorage.getItem(ANON_NAME_KEY) ?? "");
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("board_posts_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "board_posts" },
        (payload) => {
          const next = payload.new as BoardPost;
          setPosts((prev) => (prev.some((p) => p.id === next.id) ? prev : [...prev, next]));
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "board_posts" },
        (payload) => {
          const next = payload.new as BoardPost;
          setPosts((prev) => prev.map((p) => (p.id === next.id ? next : p)));
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "board_posts" },
        (payload) => {
          const oldId = (payload.old as { id: string }).id;
          setPosts((prev) => prev.filter((p) => p.id !== oldId));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setPosts((prev) => prev.filter((p) => new Date(p.expires_at).getTime() > now));
    }, EXPIRE_CHECK_MS);
    return () => clearInterval(timer);
  }, []);

  const selectedPost = posts.find((p) => p.id === selectedPostId) ?? null;

  function isOwner(post: BoardPost) {
    if (currentUser) return post.user_id === currentUser.id;
    return !!anonToken && post.anon_token === anonToken;
  }

  function persistAnonName(value: string) {
    setAnonName(value);
    window.localStorage.setItem(ANON_NAME_KEY, value);
  }

  function openCompose() {
    const el = scrollRef.current;
    const centerX = el ? el.scrollLeft + el.clientWidth / 2 : CANVAS_WIDTH / 2;
    const centerY = el ? el.scrollTop + el.clientHeight / 2 : CANVAS_HEIGHT / 2;
    const jitterX = Math.random() * 200 - 100;
    const jitterY = Math.random() * 160 - 80;
    setPendingPos({
      x: clamp(centerX + jitterX - NOTE_WIDTH / 2, 0, CANVAS_WIDTH - NOTE_WIDTH),
      y: clamp(centerY + jitterY - NOTE_HEIGHT / 2, 0, CANVAS_HEIGHT - NOTE_HEIGHT),
    });
    setComposeOpen(true);
  }

  async function handleCompose(content: string, name: string) {
    if (!currentUser) persistAnonName(name);
    const created = await createBoardPost({
      content,
      x: pendingPos.x,
      y: pendingPos.y,
      anonToken: currentUser ? null : anonToken,
      anonName: name,
    });
    setPosts((prev) => (prev.some((p) => p.id === created.id) ? prev : [...prev, created]));
    setComposeOpen(false);
  }

  function handleMove(postId: string, x: number, y: number) {
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, x, y } : p)));
    moveBoardPost(postId, x, y, anonToken).catch(() => {
      // 실패해도 다음 실시간 업데이트/새로고침에서 서버 값으로 맞춰지므로 조용히 무시
    });
  }

  function handleLike(postId: string) {
    likeBoardPost(postId, anonToken).catch(() => {});
  }

  async function handleDelete(postId: string) {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    if (selectedPostId === postId) setSelectedPostId(null);
    try {
      await deleteBoardPost(postId, anonToken);
    } catch {
      // 무시: 실시간 구독이 실제 상태로 다시 맞춰줌
    }
  }

  async function handleAddComment(content: string, name: string) {
    if (!selectedPostId) throw new Error("잘못된 요청입니다.");
    if (!currentUser) persistAnonName(name);
    return addBoardComment({
      postId: selectedPostId,
      content,
      anonToken: currentUser ? null : anonToken,
      anonName: name,
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3 px-1">
        <div>
          <span className="font-sans text-xs font-bold tracking-[0.3em] text-[color-mix(in_srgb,var(--paper-cream)_85%,#fff)]">
            자유 게시판
          </span>
          <h1 className="font-serif text-xl text-[var(--paper-cream)]">
            코르크보드에 자유롭게 붙여 보세요.
          </h1>
          <p className="mt-1 font-sans text-xs text-[color-mix(in_srgb,var(--paper-cream)_75%,transparent)]">
            글은 24시간 뒤 사라져요. 좋아요를 받으면 24시간이 다시 채워져요.
          </p>
        </div>
        <button
          type="button"
          onClick={openCompose}
          className="rounded-full bg-[var(--stamp-red)] px-5 py-2.5 font-sans text-sm font-bold text-[var(--paper-cream)] shadow-lg transition-transform hover:scale-105"
        >
          + 새 글쓰기
        </button>
      </div>

      <div
        ref={scrollRef}
        className="manuscript-bg relative h-[75vh] w-full overflow-auto rounded-sm border border-[var(--paper-grid)] shadow-[inset_0_2px_10px_rgba(0,0,0,0.25)]"
      >
        <div className="relative" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
          {posts.map((post) => (
            <BoardNote
              key={post.id}
              post={post}
              isOwner={isOwner(post)}
              onMove={(x, y) => handleMove(post.id, x, y)}
              onOpen={() => setSelectedPostId(post.id)}
              onLike={() => handleLike(post.id)}
              onDelete={() => handleDelete(post.id)}
            />
          ))}
        </div>
      </div>

      <BoardComposeModal
        open={composeOpen}
        showNameField={!currentUser}
        defaultName={anonName}
        onClose={() => setComposeOpen(false)}
        onSubmit={handleCompose}
      />

      <BoardCommentsModal
        post={selectedPost}
        showNameField={!currentUser}
        defaultName={anonName}
        onClose={() => setSelectedPostId(null)}
        onLike={() => selectedPostId && handleLike(selectedPostId)}
        onSubmitComment={handleAddComment}
      />
    </div>
  );
}
