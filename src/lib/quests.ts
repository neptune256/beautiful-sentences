import type { createClient } from "@/lib/supabase/server";
import type { createAdminClient } from "@/lib/supabase/admin";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export const DAILY_QUEST_DIAMOND_REWARD = 30;

/**
 * 이 날짜부터 "출석 = 두 퀘스트(오늘의 문장 + 네 단어 글쓰기) 모두 완료"로 판정한다.
 * 그 이전 날짜는 네 단어 글쓰기 퀘스트가 존재하지 않았으므로 문장 제출만으로 출석 인정.
 */
export const QUEST_FEATURE_LAUNCH_DATE = "2026-08-27";

export type DailyQuestStatus = {
  sentenceDone: boolean;
  wordplayDone: boolean;
};

export async function getTodayQuestStatus(
  supabase: SupabaseServerClient,
  userId: string,
  todayStr: string,
): Promise<DailyQuestStatus> {
  const [{ data: round }, { data: questLog }] = await Promise.all([
    supabase
      .from("daily_rounds")
      .select("id")
      .eq("round_date", todayStr)
      .eq("status", "open")
      .maybeSingle(),
    supabase
      .from("wordplay_quest_log")
      .select("id")
      .eq("user_id", userId)
      .eq("quest_date", todayStr)
      .maybeSingle(),
  ]);

  let sentenceDone = false;
  if (round) {
    const { data: sub } = await supabase
      .from("submissions")
      .select("id")
      .eq("daily_round_id", round.id)
      .eq("user_id", userId)
      .maybeSingle();
    sentenceDone = !!sub;
  }

  return { sentenceDone, wordplayDone: !!questLog };
}

/**
 * 오늘의 문장 + 네 단어 글쓰기 두 퀘스트가 모두 끝난 시점(둘 중 나중에 완료된 액션)마다 호출한다.
 * diamond_transactions의 (user_id, reference_date, reason) 유니크 제약 덕분에 같은 날 여러 번
 * 불려도(임시저장을 반복해도) 한 번만 지급된다.
 */
export async function awardDailyQuestDiamondsIfNeeded(
  supabase: SupabaseServerClient,
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  todayStr: string,
): Promise<number> {
  const status = await getTodayQuestStatus(supabase, userId, todayStr);
  if (!status.sentenceDone || !status.wordplayDone) return 0;

  const { error } = await admin.from("diamond_transactions").insert({
    user_id: userId,
    amount: DAILY_QUEST_DIAMOND_REWARD,
    reason: "daily_quest_complete",
    reference_date: todayStr,
  });

  if (error) return 0;

  await admin.rpc("increment_diamonds", { p_user_id: userId, p_amount: DAILY_QUEST_DIAMOND_REWARD });
  return DAILY_QUEST_DIAMOND_REWARD;
}
