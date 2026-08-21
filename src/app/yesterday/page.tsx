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
      <div className="space-y-6">
        <div>
          <p className="text-sm text-black/50 dark:text-white/50">어제의 결과</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            아직 공개된 결과가 없습니다
          </h1>
        </div>
        <p className="text-black/70 dark:text-white/70">
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
    <div className="space-y-10">
      <div>
        <p className="text-sm text-black/50 dark:text-white/50">
          {round.round_date}의 상황 문장
        </p>
        <h1 className="mt-2 text-xl leading-relaxed font-medium">
          {situation?.content}
        </h1>
      </div>

      {evaluation && (
        <div className="rounded-lg border border-black/10 p-5 dark:border-white/10">
          <p className="text-sm font-semibold">1위 선정 이유</p>
          <p className="mt-2 text-sm leading-relaxed text-black/70 dark:text-white/70">
            {evaluation.reasoning}
          </p>
        </div>
      )}

      <div className="space-y-4">
        <p className="text-sm text-black/50 dark:text-white/50">
          참가자들의 글 ({submissions?.length ?? 0})
        </p>
        <ul className="space-y-4">
          {submissions?.map((s) => {
            const isWinner = s.id === evaluation?.winner_submission_id;
            const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
            const scores = s.eval_scores as CriterionScores | null;

            return (
              <li
                key={s.id}
                className={`rounded-lg border p-4 ${
                  isWinner
                    ? "border-amber-500/50 bg-amber-500/5"
                    : "border-black/10 dark:border-white/10"
                }`}
              >
                <div className="flex items-center gap-2 text-sm">
                  {isWinner && (
                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                      1위
                    </span>
                  )}
                  {s.eval_passed_gate === false && (
                    <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-600 dark:text-red-400">
                      1단계 기준 미통과
                    </span>
                  )}
                  <span className="font-medium">{profile?.nickname ?? "익명"}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-black/80 dark:text-white/80">
                  {s.content}
                </p>

                {scores && (
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-black/50 dark:text-white/50">
                    {(Object.keys(CRITERION_LABELS) as (keyof CriterionScores)[]).map(
                      (key) => (
                        <span key={key}>
                          {CRITERION_LABELS[key]} {scores[key]}
                        </span>
                      ),
                    )}
                    <span className="font-medium text-black/70 dark:text-white/70">
                      총점 {totalScore(scores)}/50
                    </span>
                  </div>
                )}

                {!isWinner && (s.eval_gate_issue || s.eval_note) && (
                  <p className="mt-2 text-xs text-black/50 dark:text-white/50">
                    아쉬운 점: {s.eval_gate_issue || s.eval_note}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
