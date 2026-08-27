import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

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
