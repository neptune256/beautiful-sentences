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

export async function approveProposal(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id");
  if (typeof id !== "string") {
    throw new Error("잘못된 요청입니다.");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("situation_sentences")
    .update({ status: "queued", approved_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "pending_review");

  if (error) {
    throw new Error(error.message);
  }

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
