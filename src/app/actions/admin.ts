"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
