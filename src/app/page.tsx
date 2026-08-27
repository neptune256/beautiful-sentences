import { createClient } from "@/lib/supabase/server";
import { todayKst } from "@/lib/date";
import { SubmissionForm } from "@/components/submission-form";
import { ManuscriptDisplay } from "@/components/manuscript";

export default async function HomePage() {
  const supabase = await createClient();
  const today = todayKst();

  const { data: round } = await supabase
    .from("daily_rounds")
    .select("id, status, situation_sentences(content)")
    .eq("round_date", today)
    .maybeSingle();

  if (!round || round.status === "holiday") {
    return (
      <div className="flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <span className="font-sans text-xs font-bold tracking-[0.3em] text-[color-mix(in_srgb,var(--ink)_55%,transparent)]">
            오늘의 상황 문장
          </span>
          <h1 className="font-serif text-xl tracking-wide text-[var(--ink)] sm:text-2xl">
            오늘은 휴일입니다
          </h1>
        </header>
        <p className="font-serif text-base leading-relaxed text-[color-mix(in_srgb,var(--ink)_75%,transparent)]">
          제안된 상황 문장이 없어 오늘은 쉬어갑니다. 내일 다시 만나요.
        </p>
      </div>
    );
  }

  const situation = Array.isArray(round.situation_sentences)
    ? round.situation_sentences[0]
    : round.situation_sentences;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let myContent = "";
  let myFinalizedAt: string | null = null;
  let myEvaluation: {
    passedGate: boolean | null;
    gateIssue: string | null;
    scores: { imagery: number; rhythm: number; resonance: number; density: number; context: number } | null;
    note: string | null;
  } | null = null;
  if (user) {
    const { data: submission } = await supabase
      .from("submissions")
      .select(
        "content, finalized_at, eval_passed_gate, eval_gate_issue, eval_scores, eval_note",
      )
      .eq("daily_round_id", round.id)
      .eq("user_id", user.id)
      .maybeSingle();
    myContent = submission?.content ?? "";
    myFinalizedAt = submission?.finalized_at ?? null;
    if (myFinalizedAt) {
      myEvaluation = {
        passedGate: submission?.eval_passed_gate ?? null,
        gateIssue: submission?.eval_gate_issue ?? null,
        scores: submission?.eval_scores ?? null,
        note: submission?.eval_note ?? null,
      };
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <span className="font-sans text-xs font-bold tracking-[0.3em] text-[color-mix(in_srgb,var(--ink)_55%,transparent)]">
          오늘의 상황 문장
        </span>
        <h1 className="font-serif text-xl tracking-wide text-[var(--ink)] sm:text-2xl">
          이 장면을, 당신의 문체로 다시 써보세요.
        </h1>
        <div className="mt-2 overflow-x-auto pb-1">
          <ManuscriptDisplay text={situation?.content ?? ""} columns={18} />
        </div>
      </header>

      {user ? (
        <SubmissionForm
          dailyRoundId={round.id}
          initialContent={myContent}
          finalizedAt={myFinalizedAt}
          evaluation={myEvaluation}
        />
      ) : (
        <p className="font-serif text-base leading-relaxed text-[color-mix(in_srgb,var(--ink)_70%,transparent)]">
          로그인하면 이 상황을 나만의 문체로 다시 써서 제출할 수 있어요.
        </p>
      )}
    </div>
  );
}
