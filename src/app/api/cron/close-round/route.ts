import { createAdminClient } from "@/lib/supabase/admin";
import { evaluateSubmissions } from "@/lib/gemini";
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
    .select("id, user_id, content")
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

  let evaluated = false;
  try {
    const entries = submissions.map((s, i) => ({ index: i + 1, content: s.content }));
    const { winnerIndex, reasoning, results } = await evaluateSubmissions(
      situationContent ?? "",
      entries,
    );
    const winner = submissions[winnerIndex - 1];

    if (winner) {
      await Promise.all(
        results.map((r) =>
          supabase
            .from("submissions")
            .update({
              eval_passed_gate: r.passedGate,
              eval_gate_issue: r.gateIssue,
              eval_scores: r.scores,
              eval_note: r.note,
            })
            .eq("id", submissions[r.index - 1].id),
        ),
      );

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
    }
  } catch (error) {
    console.error(`Gemini evaluation failed for round ${round.id}`, error);
  }

  return { roundId: round.id, submissions: submissions.length, evaluated };
}
