"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { todayKst } from "@/lib/date";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    throw new Error("관리자만 접근할 수 있습니다.");
  }
}

async function nextQueuePosition(admin: ReturnType<typeof createAdminClient>) {
  const { data: last } = await admin
    .from("situation_sentences")
    .select("queue_position")
    .eq("status", "queued")
    .order("queue_position", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (last?.queue_position ?? 0) + 1;
}

export async function approveProposal(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id");
  if (typeof id !== "string") {
    throw new Error("잘못된 요청입니다.");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("situation_sentences")
    .update({
      status: "queued",
      approved_at: new Date().toISOString(),
      queue_position: await nextQueuePosition(admin),
    })
    .eq("id", id)
    .eq("status", "pending_review");

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
}

export async function moveToQueue(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id");
  if (typeof id !== "string") {
    throw new Error("잘못된 요청입니다.");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("situation_sentences")
    .update({
      status: "queued",
      approved_at: new Date().toISOString(),
      queue_position: await nextQueuePosition(admin),
    })
    .eq("id", id)
    .eq("status", "pool");

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
}

export async function moveQueueItem(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id");
  const direction = formData.get("direction");
  if (typeof id !== "string" || (direction !== "up" && direction !== "down")) {
    throw new Error("잘못된 요청입니다.");
  }

  const admin = createAdminClient();
  const { data: queue } = await admin
    .from("situation_sentences")
    .select("id, queue_position")
    .eq("status", "queued")
    .order("queue_position", { ascending: true });

  if (!queue) return;

  const index = queue.findIndex((item) => item.id === id);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= queue.length) return;

  const current = queue[index];
  const target = queue[swapWith];

  await Promise.all([
    admin
      .from("situation_sentences")
      .update({ queue_position: target.queue_position })
      .eq("id", current.id),
    admin
      .from("situation_sentences")
      .update({ queue_position: current.queue_position })
      .eq("id", target.id),
  ]);

  revalidatePath("/admin");
}

export async function rejectProposal(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id");
  if (typeof id !== "string") {
    throw new Error("잘못된 요청입니다.");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("situation_sentences")
    .update({ status: "rejected" })
    .eq("id", id)
    .eq("status", "pending_review");

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
}

export async function updateSentenceContent(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id");
  const content = formData.get("content");
  if (
    typeof id !== "string" ||
    typeof content !== "string" ||
    content.trim().length === 0
  ) {
    throw new Error("잘못된 요청입니다.");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("situation_sentences")
    .update({ content: content.trim() })
    .eq("id", id)
    .in("status", ["queued", "pool"]);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
}

export async function updateGeminiBudget(formData: FormData) {
  await requireAdmin();

  const amount = Number(formData.get("amount_usd"));
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("올바른 금액을 입력해주세요.");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("gemini_credit_budget")
    .update({ amount_usd: amount, updated_at: new Date().toISOString() })
    .eq("id", 1);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
}

export async function upsertGeminiPricing(formData: FormData) {
  await requireAdmin();

  const model = formData.get("model");
  const inputPrice = Number(formData.get("input_price_per_million"));
  const outputPrice = Number(formData.get("output_price_per_million"));

  if (
    typeof model !== "string" ||
    model.trim().length === 0 ||
    !Number.isFinite(inputPrice) ||
    inputPrice < 0 ||
    !Number.isFinite(outputPrice) ||
    outputPrice < 0
  ) {
    throw new Error("올바른 모델명과 단가를 입력해주세요.");
  }

  const admin = createAdminClient();
  const { error } = await admin.from("gemini_model_pricing").upsert({
    model: model.trim(),
    input_price_per_million: inputPrice,
    output_price_per_million: outputPrice,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
}

// 오늘 라운드가 없거나 휴일로 지정된 경우에만 보충을 허용한다.
// 이미 진행 중이거나 마감된 라운드를 실수로 덮어써서 참가자 제출을 뒤흔들지 않기 위함.
async function assertTodayFillable(admin: ReturnType<typeof createAdminClient>) {
  const today = todayKst();
  const { data: round } = await admin
    .from("daily_rounds")
    .select("id, status")
    .eq("round_date", today)
    .maybeSingle();

  if (round && round.status !== "holiday") {
    throw new Error("오늘 라운드가 이미 진행 중이거나 마감되어 보충할 수 없습니다.");
  }

  return { today, existingRoundId: round?.id ?? null };
}

async function applyTodaySentence(
  admin: ReturnType<typeof createAdminClient>,
  today: string,
  existingRoundId: string | null,
  sentenceId: string,
) {
  if (existingRoundId) {
    const { error } = await admin
      .from("daily_rounds")
      .update({ situation_sentence_id: sentenceId, status: "open" })
      .eq("id", existingRoundId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await admin
      .from("daily_rounds")
      .insert({ round_date: today, situation_sentence_id: sentenceId, status: "open" });
    if (error) throw new Error(error.message);
  }
}

export async function useSentenceToday(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id");
  if (typeof id !== "string") {
    throw new Error("잘못된 요청입니다.");
  }

  const admin = createAdminClient();
  const { today, existingRoundId } = await assertTodayFillable(admin);

  const { data: sentence } = await admin
    .from("situation_sentences")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();

  if (!sentence || (sentence.status !== "queued" && sentence.status !== "pool")) {
    throw new Error("대기열/풀에 있는 문장만 선택할 수 있습니다.");
  }

  const { error: updateError } = await admin
    .from("situation_sentences")
    .update({ status: "used", used_on: today })
    .eq("id", id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  await applyTodaySentence(admin, today, existingRoundId, id);

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function writeSentenceToday(formData: FormData) {
  await requireAdmin();

  const content = formData.get("content");
  if (typeof content !== "string" || content.trim().length === 0) {
    throw new Error("문장을 입력해주세요.");
  }

  const admin = createAdminClient();
  const { today, existingRoundId } = await assertTodayFillable(admin);

  const { data: sentence, error: insertError } = await admin
    .from("situation_sentences")
    .insert({ content: content.trim(), status: "used", used_on: today })
    .select("id")
    .single();

  if (insertError || !sentence) {
    throw new Error(insertError?.message ?? "문장 생성에 실패했습니다.");
  }

  await applyTodaySentence(admin, today, existingRoundId, sentence.id);

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function markAllFeedbackRead() {
  await requireAdmin();

  const admin = createAdminClient();
  const { error } = await admin
    .from("feedback")
    .update({ is_read: true })
    .eq("is_read", false);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
}

export async function addToPool(formData: FormData) {
  await requireAdmin();

  const content = formData.get("content");
  if (typeof content !== "string" || content.trim().length === 0) {
    throw new Error("문장을 입력해주세요.");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("situation_sentences")
    .insert({ content: content.trim(), status: "pool" });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
}
