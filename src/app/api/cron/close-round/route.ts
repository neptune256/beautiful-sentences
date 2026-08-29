import { createAdminClient } from "@/lib/supabase/admin";
import { todayKst } from "@/lib/date";
import { NextResponse } from "next/server";

type AdminClient = ReturnType<typeof createAdminClient>;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = todayKst();

  // Hobby 플랜은 cron job이 2개로 제한돼 있어, 자유 게시판의 만료 글 정리와 의뢰소의
  // 만료 의뢰 환불도 별도 cron 대신 기존 자정 cron에 얹어서 처리한다. 목록 조회는
  // expires_at 기준으로 이미 걸러지므로, 여기서는 하루 늦게 지워져도 화면에는 영향 없음.
  await supabase.from("board_posts").delete().lt("expires_at", new Date().toISOString());
  await supabase.rpc("expire_commissions");

  const { data: rounds, error: roundsError } = await supabase
    .from("daily_rounds")
    .select("id")
    .eq("status", "open")
    .lt("round_date", today);

  if (roundsError) {
    return NextResponse.json({ error: roundsError.message }, { status: 500 });
  }

  const results = [];
  for (const round of rounds ?? []) {
    results.push(await closeRound(supabase, round.id));
  }

  return NextResponse.json({ closed: results });
}

// 라운드를 마감하고(evaluated_at이 24시간 좋아요 투표 기간의 시작점이 된다) 참여자 전원에게
// +5점을 지급한다. 채점/1위 선정은 더 이상 하지 않는다 — 좋아요 스와이프 투표로 대체됨.
async function closeRound(supabase: AdminClient, roundId: string) {
  const { data: submissions } = await supabase
    .from("submissions")
    .select("id, user_id")
    .eq("daily_round_id", roundId);

  await supabase
    .from("daily_rounds")
    .update({ status: "closed", evaluated_at: new Date().toISOString() })
    .eq("id", roundId);

  if (!submissions || submissions.length === 0) {
    return { roundId, submissions: 0 };
  }

  await supabase.from("point_transactions").insert(
    submissions.map((s) => ({
      user_id: s.user_id,
      amount: 5,
      reason: "daily_submission" as const,
      reference_id: s.id,
    })),
  );
  await Promise.all(
    submissions.map((s) =>
      supabase.rpc("increment_points", { p_user_id: s.user_id, p_amount: 5 }),
    ),
  );

  return { roundId, submissions: submissions.length };
}
