"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { getFeedBatch, type FeedCard } from "@/lib/feed";

export async function loadFeedBatch(excludeIds: string[]): Promise<FeedCard[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  return getFeedBatch(supabase, user.id, excludeIds);
}

/**
 * 좋아요(liked=true) 또는 패스(liked=false, 스크롤로 카드를 넘긴 것)를 1회 기록한다.
 * `cast_submission_vote`는 public 실행권한이 회수돼 있어 admin(service-role) 클라이언트로만
 * 호출할 수 있다 — 자기 글 차단/24시간 마감/중복 투표 방지는 RPC 내부에서 처리된다.
 * 반환값이 false면 이미 투표한 글이라 이번 호출은 아무 효과가 없었다는 뜻(멱등).
 */
export async function castVote(submissionId: string, liked: boolean): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  const { data, error } = await createAdminClient().rpc("cast_submission_vote", {
    p_submission_id: submissionId,
    p_voter_id: user.id,
    p_liked: liked,
  });

  if (error) throw new Error(error.message);

  if (liked) revalidatePath("/yesterday");

  return data as boolean;
}
