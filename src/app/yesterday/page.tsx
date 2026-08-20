import { createClient } from "@/lib/supabase/server";

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
      .select("id, content, profiles(nickname)")
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
                  <span className="font-medium">{profile?.nickname ?? "익명"}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-black/80 dark:text-white/80">
                  {s.content}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
