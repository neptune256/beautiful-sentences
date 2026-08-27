"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { evaluateSingleEntry } from "@/lib/gemini";
import { logGeminiUsage } from "@/lib/gemini-usage";
import { revalidatePath } from "next/cache";
import { todayKst } from "@/lib/date";
import { computeStreakInfo, awardStreakMilestoneIfNeeded } from "@/lib/attendance";

async function assertEditable(
  supabase: Awaited<ReturnType<typeof createClient>>,
  dailyRoundId: string,
  userId: string,
) {
  const { data: existing } = await supabase
    .from("submissions")
    .select("finalized_at")
    .eq("daily_round_id", dailyRoundId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing?.finalized_at) {
    throw new Error("이미 최종 제출한 글은 수정할 수 없습니다.");
  }
}

export async function saveSubmission(dailyRoundId: string, content: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }

  await assertEditable(supabase, dailyRoundId, user.id);

  const { error } = await supabase.from("submissions").upsert(
    {
      daily_round_id: dailyRoundId,
      user_id: user.id,
      content,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "daily_round_id,user_id" },
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/mypage");

  const today = todayKst();
  const streak = await computeStreakInfo(supabase, user.id, today);
  const diamondsAwarded = await awardStreakMilestoneIfNeeded(
    createAdminClient(),
    user.id,
    streak.currentStreak,
    today,
  );

  return { streak, diamondsAwarded };
}

/**
 * '최종 제출': 자정을 기다리지 않고 지금 개별 채점을 받는다. 이후에는 더 수정할 수 없고,
 * 자정 마감 때는 이 채점 결과를 그대로 써서 다른 참가자들과 점수만 비교한다.
 */
export async function finalizeSubmission(dailyRoundId: string, content: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }
  if (content.trim().length === 0) {
    throw new Error("내용을 입력해주세요.");
  }

  await assertEditable(supabase, dailyRoundId, user.id);

  const { data: round } = await supabase
    .from("daily_rounds")
    .select("status, situation_sentences(content)")
    .eq("id", dailyRoundId)
    .maybeSingle();

  if (!round || round.status !== "open") {
    throw new Error("이미 마감된 라운드입니다.");
  }

  const situationSentence = Array.isArray(round.situation_sentences)
    ? round.situation_sentences[0]
    : round.situation_sentences;

  const result = await evaluateSingleEntry(situationSentence?.content ?? "", content);

  await logGeminiUsage(createAdminClient(), dailyRoundId, result.usage);

  const { error } = await supabase.from("submissions").upsert(
    {
      daily_round_id: dailyRoundId,
      user_id: user.id,
      content,
      updated_at: new Date().toISOString(),
      eval_passed_gate: result.passedGate,
      eval_gate_issue: result.gateIssue,
      eval_scores: result.scores,
      eval_note: result.note,
      finalized_at: new Date().toISOString(),
    },
    { onConflict: "daily_round_id,user_id" },
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");

  return {
    passedGate: result.passedGate,
    gateIssue: result.gateIssue,
    scores: result.scores,
    note: result.note,
  };
}
