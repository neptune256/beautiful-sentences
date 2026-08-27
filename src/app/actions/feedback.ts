"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendIvyEmail } from "@/lib/email";

const FEEDBACK_MAX_LENGTH = 1000;

export async function submitFeedback(content: string, pagePath: string) {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error("내용을 입력해 주세요.");
  }
  if (Array.from(trimmed).length > FEEDBACK_MAX_LENGTH) {
    throw new Error(`${FEEDBACK_MAX_LENGTH}자 이내로 작성해 주세요.`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let nickname: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("nickname")
      .eq("id", user.id)
      .single();
    nickname = profile?.nickname ?? null;
  }

  const admin = createAdminClient();
  const { error } = await admin.from("feedback").insert({
    content: trimmed,
    user_id: user?.id ?? null,
    nickname,
    page_path: pagePath,
  });

  if (error) {
    throw new Error(error.message);
  }

  const adminUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/admin?tab=feedback`;
  await sendIvyEmail(
    "[아름다운 문장] 새 피드백이 도착했습니다",
    `<p>${escapeHtml(trimmed)}</p><p>작성자: ${escapeHtml(nickname ?? "익명")} · 페이지: ${escapeHtml(pagePath)}</p><p><a href="${adminUrl}">관리자 대시보드에서 확인</a></p>`,
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
