"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { shareContentToBoard } from "@/app/actions/board";

const MAX_ENTRIES = 10;

export type WordplayEntry = {
  id: string;
  adjective: string;
  noun: string;
  verb: string;
  color_name: string;
  color_hex: string;
  sentence: string;
  created_at: string;
};

async function currentUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다.");
  return user.id;
}

export async function saveWordplayEntry(params: {
  adjective: string;
  noun: string;
  verb: string;
  colorName: string;
  colorHex: string;
  sentence: string;
}) {
  const sentence = params.sentence.trim();
  if (!sentence) throw new Error("문장을 입력해 주세요.");

  const supabase = await createClient();
  const userId = await currentUserId();

  const { count, error: countError } = await supabase
    .from("wordplay_entries")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (countError) throw new Error(countError.message);
  if ((count ?? 0) >= MAX_ENTRIES) {
    throw new Error(`최대 ${MAX_ENTRIES}개까지 저장할 수 있어요. 기존 글을 지우고 다시 시도해 주세요.`);
  }

  const { error } = await supabase.from("wordplay_entries").insert({
    user_id: userId,
    adjective: params.adjective,
    noun: params.noun,
    verb: params.verb,
    color_name: params.colorName,
    color_hex: params.colorHex,
    sentence,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/wordplay");
}

export async function deleteWordplayEntry(id: string) {
  const supabase = await createClient();
  const userId = await currentUserId();

  const { data, error } = await supabase
    .from("wordplay_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select("id");
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("본인 글만 지울 수 있어요.");

  revalidatePath("/wordplay");
}

export async function shareWordplayEntry(id: string) {
  const supabase = await createClient();
  const userId = await currentUserId();

  const { data: entry, error } = await supabase
    .from("wordplay_entries")
    .select("adjective, noun, verb, color_name, sentence")
    .eq("id", id)
    .eq("user_id", userId)
    .single();
  if (error || !entry) throw new Error("글을 찾을 수 없어요.");

  const content = `"${entry.sentence}"\n— ${entry.adjective} ${entry.noun} · ${entry.color_name} · ${entry.verb}`;
  await shareContentToBoard(content);
}
