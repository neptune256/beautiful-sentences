"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  BOARD_CANVAS_WIDTH,
  BOARD_CANVAS_HEIGHT,
  BOARD_NOTE_WIDTH,
  BOARD_NOTE_HEIGHT,
} from "@/lib/board-constants";

const BOARD_TTL_HOURS = 24;
const WINNER_BOARD_TTL_HOURS = 24 * 7;
const BOARD_COLORS = ["yellow", "pink", "mint", "blue"] as const;
const CONTENT_MAX_LENGTH = 300;
const COMMENT_MAX_LENGTH = 200;

function randomBoardPosition() {
  return {
    x: Math.random() * (BOARD_CANVAS_WIDTH - BOARD_NOTE_WIDTH),
    y: Math.random() * (BOARD_CANVAS_HEIGHT - BOARD_NOTE_HEIGHT),
  };
}

export type BoardPost = {
  id: string;
  content: string;
  author_name: string;
  user_id: string | null;
  anon_token: string | null;
  x: number;
  y: number;
  rotation: number;
  color: string;
  likes_count: number;
  comments_count: number;
  expires_at: string;
  created_at: string;
};

export type BoardComment = {
  id: string;
  post_id: string;
  author_name: string;
  content: string;
  created_at: string;
};

async function currentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname")
    .eq("id", user.id)
    .single();

  return { id: user.id, nickname: profile?.nickname ?? "익명" };
}

export async function createBoardPost(params: {
  content: string;
  x: number;
  y: number;
  anonToken: string | null;
  anonName?: string;
}): Promise<BoardPost> {
  const content = params.content.trim();
  if (!content) throw new Error("내용을 입력해 주세요.");
  if (Array.from(content).length > CONTENT_MAX_LENGTH) {
    throw new Error(`${CONTENT_MAX_LENGTH}자 이내로 작성해 주세요.`);
  }

  const profile = await currentProfile();
  if (!profile && !params.anonToken) {
    throw new Error("잘못된 요청입니다.");
  }

  const authorName = profile?.nickname ?? (params.anonName?.trim() || "익명");
  const rotation = Math.random() * 10 - 5;
  const color = BOARD_COLORS[Math.floor(Math.random() * BOARD_COLORS.length)];

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("board_posts")
    .insert({
      content,
      author_name: authorName,
      user_id: profile?.id ?? null,
      anon_token: profile ? null : params.anonToken,
      x: params.x,
      y: params.y,
      rotation,
      color,
      expires_at: new Date(Date.now() + BOARD_TTL_HOURS * 3600 * 1000).toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/board");
  return data as BoardPost;
}

// 라운드 마감 cron이 그날의 1위 글을 자유 게시판에 자동으로 올릴 때 쓴다.
// 로그인 세션이 없는 서버 컨텍스트에서 호출되므로 currentProfile()을 거치지 않고
// 대상 유저 정보를 직접 받아 서비스 롤로 삽입하며, 일반 글(24시간)과 달리
// 7일간 유지되도록 ttl_hours를 다르게 준다(좋아요 리셋도 이 값을 그대로 따른다).
export async function createWinnerBoardPost(params: {
  content: string;
  authorId: string;
  authorName: string;
}): Promise<BoardPost> {
  const content = params.content.trim();
  if (!content) throw new Error("내용이 비어 있습니다.");

  const rotation = Math.random() * 10 - 5;
  const color = BOARD_COLORS[Math.floor(Math.random() * BOARD_COLORS.length)];
  const { x, y } = randomBoardPosition();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("board_posts")
    .insert({
      content,
      author_name: params.authorName,
      user_id: params.authorId,
      x,
      y,
      rotation,
      color,
      source: "daily_winner",
      ttl_hours: WINNER_BOARD_TTL_HOURS,
      expires_at: new Date(Date.now() + WINNER_BOARD_TTL_HOURS * 3600 * 1000).toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/board");
  return data as BoardPost;
}

export async function moveBoardPost(
  postId: string,
  x: number,
  y: number,
  anonToken: string | null,
) {
  const profile = await currentProfile();
  const admin = createAdminClient();

  let query = admin.from("board_posts").update({ x, y }).eq("id", postId);
  query = profile
    ? query.eq("user_id", profile.id)
    : query.eq("anon_token", anonToken ?? "");

  const { data, error } = await query.select("id");
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("본인 글만 옮길 수 있어요.");
}

export async function deleteBoardPost(postId: string, anonToken: string | null) {
  const profile = await currentProfile();
  const admin = createAdminClient();

  let query = admin.from("board_posts").delete().eq("id", postId);
  query = profile
    ? query.eq("user_id", profile.id)
    : query.eq("anon_token", anonToken ?? "");

  const { data, error } = await query.select("id");
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("본인 글만 지울 수 있어요.");

  revalidatePath("/board");
}

export async function likeBoardPost(postId: string, anonToken: string | null) {
  const profile = await currentProfile();
  const admin = createAdminClient();

  const { data, error } = await admin.rpc("like_board_post", {
    p_post_id: postId,
    p_user_id: profile?.id ?? null,
    p_anon_token: profile ? null : anonToken,
  });

  if (error) throw new Error(error.message);
  return data as boolean;
}

export async function addBoardComment(params: {
  postId: string;
  content: string;
  anonToken: string | null;
  anonName?: string;
}): Promise<BoardComment> {
  const content = params.content.trim();
  if (!content) throw new Error("댓글 내용을 입력해 주세요.");
  if (Array.from(content).length > COMMENT_MAX_LENGTH) {
    throw new Error(`${COMMENT_MAX_LENGTH}자 이내로 작성해 주세요.`);
  }

  const profile = await currentProfile();
  if (!profile && !params.anonToken) {
    throw new Error("잘못된 요청입니다.");
  }

  const authorName = profile?.nickname ?? (params.anonName?.trim() || "익명");
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("board_comments")
    .insert({
      post_id: params.postId,
      author_name: authorName,
      user_id: profile?.id ?? null,
      anon_token: profile ? null : params.anonToken,
      content,
    })
    .select("id, post_id, author_name, content, created_at")
    .single();

  if (error) throw new Error(error.message);
  return data as BoardComment;
}
