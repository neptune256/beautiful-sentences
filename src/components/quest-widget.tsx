import { createClient } from "@/lib/supabase/server";
import { todayKst } from "@/lib/date";
import { getTodayQuestStatus } from "@/lib/quests";
import { QuestWidgetCard } from "@/components/quest-widget-card";

export async function QuestWidget() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const status = await getTodayQuestStatus(supabase, user.id, todayKst());

  return <QuestWidgetCard status={status} />;
}
