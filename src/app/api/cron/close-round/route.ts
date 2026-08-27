import { createAdminClient } from "@/lib/supabase/admin";
import { evaluateBatch, totalScore, writeWinnerReasoning } from "@/lib/gemini";
import { logGeminiUsage } from "@/lib/gemini-usage";
import { todayKst } from "@/lib/date";
import { createWinnerBoardPost } from "@/app/actions/board";
import { NextResponse } from "next/server";

type CriterionScores = {
  imagery: number;
  rhythm: number;
  resonance: number;
  density: number;
  context: number;
};

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
    .select("id, situation_sentences(content)")
    .eq("status", "open")
    .lt("round_date", today);

  if (roundsError) {
    return NextResponse.json({ error: roundsError.message }, { status: 500 });
  }

  const results = [];
  for (const round of rounds ?? []) {
    results.push(await closeRound(supabase, round));
  }

  return NextResponse.json({ closed: results });
}

async function closeRound(
  supabase: AdminClient,
  round: {
    id: string;
    situation_sentences: { content: string }[] | { content: string } | null;
  },
) {
  const { data: submissions } = await supabase
    .from("submissions")
    .select(
      "id, user_id, content, finalized_at, eval_passed_gate, eval_scores",
    )
    .eq("daily_round_id", round.id);

  await supabase
    .from("daily_rounds")
    .update({ status: "closed", evaluated_at: new Date().toISOString() })
    .eq("id", round.id);

  if (!submissions || submissions.length === 0) {
    return { roundId: round.id, submissions: 0, evaluated: false };
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

  const situationContent = Array.isArray(round.situation_sentences)
    ? round.situation_sentences[0]?.content
    : round.situation_sentences?.content;

  // '최종 제출'로 이미 개별 채점을 마친 글은 다시 채점하지 않고 그 결과를 그대로 쓴다.
  // 자정까지 '저장'만 하고 최종 제출하지 않은 글들만 지금 한 번에(배치로) 채점한다 —
  // 사람 수만큼 개별 호출하면 크레딧이 낭비되므로, 이 그룹은 서로 비교하며 한 번의 호출로 채점한다.
  const graded: { id: string; user_id: string; content: string; eval_scores: CriterionScores; eval_passed_gate: boolean }[] = [];
  const straggler: { id: string; user_id: string; content: string }[] = [];

  for (const s of submissions) {
    if (s.finalized_at && s.eval_scores) {
      graded.push({
        id: s.id,
        user_id: s.user_id,
        content: s.content,
        eval_scores: s.eval_scores as CriterionScores,
        eval_passed_gate: s.eval_passed_gate ?? false,
      });
    } else {
      straggler.push({ id: s.id, user_id: s.user_id, content: s.content });
    }
  }

  if (straggler.length > 0) {
    try {
      const entries = straggler.map((s, i) => ({ index: i + 1, content: s.content }));
      const { results, usage } = await evaluateBatch(situationContent ?? "", entries);
      await logGeminiUsage(supabase, round.id, usage);

      await Promise.all(
        results.map((r) => {
          const s = straggler[r.index - 1];
          return supabase
            .from("submissions")
            .update({
              eval_passed_gate: r.passedGate,
              eval_gate_issue: r.gateIssue,
              eval_scores: r.scores,
              eval_note: r.note,
              finalized_at: new Date().toISOString(),
            })
            .eq("id", s.id);
        }),
      );

      for (const r of results) {
        const s = straggler[r.index - 1];
        graded.push({
          id: s.id,
          user_id: s.user_id,
          content: s.content,
          eval_scores: r.scores,
          eval_passed_gate: r.passedGate,
        });
      }
    } catch (error) {
      console.error(`Gemini batch evaluation failed for round ${round.id}`, error);
    }
  }

  let evaluated = false;
  if (graded.length > 0) {
    try {
      const passed = graded.filter((s) => s.eval_passed_gate);
      // 아무도 1단계를 통과하지 못했다면, 점수가 가장 높은 글을 차선으로 선정한다.
      const pool = passed.length > 0 ? passed : graded;
      const winner = pool.reduce((best, s) =>
        totalScore(s.eval_scores) > totalScore(best.eval_scores) ? s : best,
      );

      const { reasoning, usage } = await writeWinnerReasoning(
        situationContent ?? "",
        winner.content,
        winner.eval_scores,
      );
      await logGeminiUsage(supabase, round.id, usage);

      await supabase.from("evaluations").insert({
        daily_round_id: round.id,
        winner_submission_id: winner.id,
        reasoning,
      });

      await supabase.from("point_transactions").insert({
        user_id: winner.user_id,
        amount: 50,
        reason: "daily_winner" as const,
        reference_id: winner.id,
      });
      await supabase.rpc("increment_points", {
        p_user_id: winner.user_id,
        p_amount: 50,
      });
      evaluated = true;

      try {
        const { data: winnerProfile } = await supabase
          .from("profiles")
          .select("nickname")
          .eq("id", winner.user_id)
          .single();
        await createWinnerBoardPost({
          content: winner.content,
          authorId: winner.user_id,
          authorName: winnerProfile?.nickname ?? "익명",
        });
      } catch (error) {
        console.error(`Auto-posting winner to board failed for round ${round.id}`, error);
      }
    } catch (error) {
      console.error(`Winner reasoning failed for round ${round.id}`, error);
    }
  }

  return { roundId: round.id, submissions: submissions.length, evaluated };
}
