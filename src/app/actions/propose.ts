"use server";

import { createClient } from "@/lib/supabase/server";
import { sendIvyEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";

export async function grantShareTicket() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }

  const { error } = await supabase
    .from("proposal_tickets")
    .insert({ user_id: user.id });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/propose");
}

export async function submitProposal(ticketId: string, content: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }

  const { data: ticket } = await supabase
    .from("proposal_tickets")
    .select("id, used_at")
    .eq("id", ticketId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!ticket || ticket.used_at) {
    throw new Error("사용할 수 있는 제안권이 없습니다.");
  }

  const { data: sentence, error: insertError } = await supabase
    .from("situation_sentences")
    .insert({
      content,
      status: "pending_review",
      proposed_by: user.id,
    })
    .select("id")
    .single();

  if (insertError || !sentence) {
    throw new Error(insertError?.message ?? "제안 등록에 실패했습니다.");
  }

  const { error: ticketError } = await supabase
    .from("proposal_tickets")
    .update({ used_at: new Date().toISOString(), used_sentence_id: sentence.id })
    .eq("id", ticketId);

  if (ticketError) {
    throw new Error(ticketError.message);
  }

  const adminUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/admin`;
  await sendIvyEmail(
    "[아름다운 문장] 새로운 상황 문장 제안이 도착했습니다",
    `<p>${escapeHtml(content)}</p><p><a href="${adminUrl}">관리자 대시보드에서 승인/반려</a></p>`,
  );

  revalidatePath("/propose");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
