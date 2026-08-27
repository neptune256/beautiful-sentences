"use server";

import { createClient } from "@/lib/supabase/server";
import { todayKst } from "@/lib/date";
import { getTodayQuestStatus, type DailyQuestStatus } from "@/lib/quests";

export async function getQuestStatus(): Promise<DailyQuestStatus | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return getTodayQuestStatus(supabase, user.id, todayKst());
}
