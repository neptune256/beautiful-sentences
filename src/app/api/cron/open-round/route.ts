import { createAdminClient } from "@/lib/supabase/admin";
import { todayKst } from "@/lib/date";
import { sendIvyEmail } from "@/lib/email";
import { NextResponse } from "next/server";

const POOL_LOW_THRESHOLD = Number(process.env.POOL_LOW_THRESHOLD ?? 20);

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = todayKst();

  const { data: existing } = await supabase
    .from("daily_rounds")
    .select("id")
    .eq("round_date", today)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ skipped: "round already exists for today" });
  }

  // 1순위: 승인된 사용자 제안 대기열 (관리자가 조정한 순서, queue_position 기준)
  let { data: next } = await supabase
    .from("situation_sentences")
    .select("id, proposed_by")
    .eq("status", "queued")
    .order("queue_position", { ascending: true })
    .limit(1)
    .maybeSingle();

  const fromProposal = Boolean(next);

  // 2순위: 사전 제작 문장 풀
  if (!next) {
    const { data: pooled } = await supabase
      .from("situation_sentences")
      .select("id, proposed_by")
      .eq("status", "pool")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    next = pooled;
  }

  // 3순위: 대기열도 풀도 없으면 휴일
  if (!next) {
    await supabase.from("daily_rounds").insert({
      round_date: today,
      situation_sentence_id: null,
      status: "holiday",
    });
    return NextResponse.json({ result: "holiday" });
  }

  const { error: markUsedError } = await supabase
    .from("situation_sentences")
    .update({ status: "used", used_on: today })
    .eq("id", next.id);

  if (markUsedError) {
    return NextResponse.json({ error: markUsedError.message }, { status: 500 });
  }

  await supabase.from("daily_rounds").insert({
    round_date: today,
    situation_sentence_id: next.id,
    status: "open",
  });

  if (fromProposal && next.proposed_by) {
    await supabase.from("point_transactions").insert({
      user_id: next.proposed_by,
      amount: 10,
      reason: "proposal_adopted",
      reference_id: next.id,
    });
    await supabase.rpc("increment_points", {
      p_user_id: next.proposed_by,
      p_amount: 10,
    });
  }

  const { count: poolCount } = await supabase
    .from("situation_sentences")
    .select("id", { count: "exact", head: true })
    .eq("status", "pool");

  if ((poolCount ?? 0) <= POOL_LOW_THRESHOLD) {
    await sendIvyEmail(
      "[아름다운 문장] 상황 문장 풀이 얼마 남지 않았습니다",
      `<p>남은 사전 제작 문장 개수: <strong>${poolCount ?? 0}개</strong></p><p>보충이 필요합니다.</p>`,
    );
  }

  return NextResponse.json({
    result: "opened",
    situationSentenceId: next.id,
    fromProposal,
    poolCount: poolCount ?? 0,
  });
}
