"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveSubmission(dailyRoundId: string, content: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }

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
}
