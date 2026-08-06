import { createClient } from "@/lib/supabase/server";
import { todayKst } from "@/lib/date";
import { SubmissionForm } from "@/components/submission-form";

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
      <div className="space-y-6">
        <div>
          <p className="text-sm text-black/50 dark:text-white/50">오늘의 상황 문장</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            오늘은 휴일입니다
          </h1>
        </div>
        <p className="text-black/70 dark:text-white/70">
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
  if (user) {
    const { data: submission } = await supabase
      .from("submissions")
      .select("content")
      .eq("daily_round_id", round.id)
      .eq("user_id", user.id)
      .maybeSingle();
    myContent = submission?.content ?? "";
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-black/50 dark:text-white/50">오늘의 상황 문장</p>
        <h1 className="mt-2 text-xl leading-relaxed font-medium">
          {situation?.content}
        </h1>
      </div>

      {user ? (
        <SubmissionForm dailyRoundId={round.id} initialContent={myContent} />
      ) : (
        <p className="text-sm text-black/50 dark:text-white/50">
          로그인하면 이 상황을 나만의 문체로 다시 써서 제출할 수 있어요.
        </p>
      )}
    </div>
  );
}
