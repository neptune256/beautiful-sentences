"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { todayKst } from "@/lib/date";
import { computeStreakInfo, awardStreakMilestoneIfNeeded } from "@/lib/attendance";
import { awardDailyQuestDiamondsIfNeeded } from "@/lib/quests";

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
  const admin = createAdminClient();
  const streak = await computeStreakInfo(supabase, user.id, today);
  const milestoneAwarded = await awardStreakMilestoneIfNeeded(
    admin,
    user.id,
    streak.currentStreak,
    today,
  );
  const dailyQuestAwarded = await awardDailyQuestDiamondsIfNeeded(supabase, admin, user.id, today);

  return {
    streak,
    diamondsAwarded: milestoneAwarded + dailyQuestAwarded,
    milestoneAwarded: milestoneAwarded > 0,
    dailyQuestCompletedNow: dailyQuestAwarded > 0,
  };
}
