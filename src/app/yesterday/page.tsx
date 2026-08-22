import { createClient } from "@/lib/supabase/server";

type CriterionScores = {
  imagery: number;
  rhythm: number;
  resonance: number;
  density: number;
  context: number;
};

const CRITERION_LABELS: Record<keyof CriterionScores, string> = {
  imagery: "선명도",
  rhythm: "운율",
  resonance: "잔향",
  density: "함축성",
  context: "맥락",
};

function totalScore(scores: CriterionScores) {
  return Object.values(scores).reduce((sum, v) => sum + v, 0);
}

export default async function YesterdayPage() {
  const supabase = await createClient();

  const { data: round } = await supabase
    .from("daily_rounds")
    .select("id, round_date, situation_sentences(content)")
    .eq("status", "closed")
    .order("round_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!round) {
    return (
      <div className="flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <span className="font-sans text-xs font-bold tracking-[0.3em] text-[color-mix(in_srgb,var(--ink)_55%,transparent)]">
            어제의 결과
          </span>
          <h1 className="font-serif text-xl tracking-wide text-[var(--ink)] sm:text-2xl">
            아직 공개된 결과가 없습니다
          </h1>
        </header>
        <p className="font-serif text-base leading-relaxed text-[color-mix(in_srgb,var(--ink)_75%,transparent)]">
          전날 상황 문장, 참가자 전원의 글, 1위 및 선정 이유가 여기에 표시됩니다.
        </p>
      </div>
    );
  }

  const situation = Array.isArray(round.situation_sentences)
    ? round.situation_sentences[0]
    : round.situation_sentences;

  const [{ data: submissions }, { data: evaluation }] = await Promise.all([
    supabase
      .from("submissions")
      .select(
        "id, content, profiles(nickname), eval_scores, eval_note, eval_passed_gate, eval_gate_issue",
      )
      .eq("daily_round_id", round.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("evaluations")
      .select("reasoning, winner_submission_id")
      .eq("daily_round_id", round.id)
      .maybeSingle(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <span className="font-sans text-xs font-bold tracking-[0.3em] text-[color-mix(in_srgb,var(--ink)_55%,transparent)]">
          어제의 결과 · {round.round_date}
        </span>
        <h1 className="font-serif text-xl tracking-wide text-[var(--ink)] sm:text-2xl">
          어제의 문장에 다른 이들이 남긴 문체들.
        </h1>
        <p className="font-serif text-base leading-relaxed text-[color-mix(in_srgb,var(--ink)_75%,transparent)]">
          &ldquo;{situation?.content}&rdquo;
        </p>
      </header>

      {evaluation && (
        <div className="manuscript-bg rounded-sm border border-[var(--paper-grid)] p-4 shadow-[0_2px_6px_rgba(0,0,0,0.12)]">
          <p className="font-sans text-xs font-bold tracking-[0.2em] text-[var(--stamp-red)]">
            1위 선정 이유
          </p>
          <p className="mt-2 font-serif text-sm leading-relaxed text-[var(--ink)]">
            {evaluation.reasoning}
          </p>
        </div>
      )}

      <section className="flex flex-col gap-3">
        <span className="font-sans text-xs font-bold tracking-[0.3em] text-[color-mix(in_srgb,var(--ink)_55%,transparent)]">
          참가자들의 글 ({submissions?.length ?? 0})
        </span>
        <ul className="flex flex-col gap-4">
          {submissions?.map((s) => {
            const isWinner = s.id === evaluation?.winner_submission_id;
            const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
            const scores = s.eval_scores as CriterionScores | null;

            return (
              <li
                key={s.id}
                className={`manuscript-bg rounded-sm border p-4 shadow-[0_2px_6px_rgba(0,0,0,0.12)] ${
                  isWinner ? "border-[var(--stamp-red)]" : "border-[var(--paper-grid)]"
                }`}
              >
                <div className="flex items-center gap-2">
                  {isWinner && (
                    <span className="rounded-full bg-[var(--stamp-red)] px-2 py-0.5 font-sans text-xs font-bold text-[var(--paper-cream)]">
                      1위
                    </span>
                  )}
                  {s.eval_passed_gate === false && (
                    <span className="rounded-full border border-[var(--stamp-red)] px-2 py-0.5 font-sans text-xs font-bold text-[var(--stamp-red)]">
                      1단계 기준 미통과
                    </span>
                  )}
                  <span className="font-sans text-sm font-bold text-[color-mix(in_srgb,var(--ink)_70%,transparent)]">
                    {profile?.nickname ?? "익명"}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap font-mono text-base leading-relaxed text-[var(--ink)]">
                  {s.content}
                </p>

                {scores && (
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-[color-mix(in_srgb,var(--ink)_60%,transparent)]">
                    {(Object.keys(CRITERION_LABELS) as (keyof CriterionScores)[]).map(
                      (key) => (
                        <span key={key}>
                          {CRITERION_LABELS[key]} {scores[key]}
                        </span>
                      ),
                    )}
                    <span className="font-bold text-[var(--ink)]">
                      총점 {totalScore(scores)}/50
                    </span>
                  </div>
                )}

                {!isWinner && (s.eval_gate_issue || s.eval_note) && (
                  <p className="mt-2 font-sans text-xs text-[color-mix(in_srgb,var(--ink)_55%,transparent)]">
                    아쉬운 점: {s.eval_gate_issue || s.eval_note}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
