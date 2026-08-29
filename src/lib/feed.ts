import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const FEED_BATCH_SIZE = 20;
const VOTE_WINDOW_HOURS = 24;

export type FeedCard = {
  id: string;
  content: string;
  likesCount: number;
  authorNickname: string;
};

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 아직 살아있는(마감 후 24시간 이내) 라운드의 글 중, 내가 쓴 글과 이미 투표(좋아요/패스)한
 * 글을 뺀 나머지를 랜덤 순서로 한 배치(FEED_BATCH_SIZE개) 가져온다. `excludeIds`는 같은
 * 세션에서 이미 클라이언트로 내려준(아직 서버에 투표로 기록되지 않았을 수 있는) 글 id들 —
 * 다음 배치 요청 시 중복으로 다시 받지 않도록 한다.
 */
export async function getFeedBatch(
  supabase: SupabaseServerClient,
  userId: string,
  excludeIds: string[],
): Promise<FeedCard[]> {
  const cutoff = new Date(Date.now() - VOTE_WINDOW_HOURS * 3600 * 1000).toISOString();

  const { data: rounds } = await supabase
    .from("daily_rounds")
    .select("id")
    .eq("status", "closed")
    .gte("evaluated_at", cutoff);

  if (!rounds || rounds.length === 0) return [];
  const roundIds = rounds.map((r) => r.id);

  const { data: votes } = await supabase
    .from("submission_votes")
    .select("submission_id")
    .eq("voter_id", userId);

  const excluded = Array.from(
    new Set([...(votes ?? []).map((v) => v.submission_id), ...excludeIds]),
  );

  let query = supabase
    .from("submissions")
    .select("id, content, likes_count, profiles(nickname)")
    .in("daily_round_id", roundIds)
    .neq("user_id", userId)
    .limit(100);

  if (excluded.length > 0) {
    query = query.not("id", "in", `(${excluded.join(",")})`);
  }

  const { data } = await query;
  if (!data) return [];

  return shuffle(data)
    .slice(0, FEED_BATCH_SIZE)
    .map((s) => {
      const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
      return {
        id: s.id,
        content: s.content,
        likesCount: s.likes_count ?? 0,
        authorNickname: profile?.nickname ?? "익명",
      };
    });
}
