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
      <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 py-24 text-center">
        <p className="text-xs font-medium tracking-[0.3em] text-slate-400 uppercase dark:text-slate-500">
          오늘의 상황 문장
        </p>
        <h1 className="mt-6 font-serif text-2xl leading-relaxed tracking-wide text-slate-800 dark:text-slate-100">
          오늘은 휴일입니다
        </h1>
        <p className="mt-5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
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
    <div className="mx-auto flex max-w-2xl flex-col items-center px-6 py-20 md:py-28">
      <p className="text-xs font-medium tracking-[0.3em] text-slate-400 uppercase dark:text-slate-500">
        오늘의 상황 문장
      </p>

      <div
        className="mt-10 w-full rounded-2xl border border-slate-200/70 bg-white/80 p-10 text-center
        shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md
        dark:border-white/10 dark:bg-neutral-900/60 md:p-16"
      >
        <h1 className="font-serif text-2xl leading-loose tracking-wide text-slate-800 md:text-3xl dark:text-slate-100">
          {situation?.content}
        </h1>
      </div>

      <div className="mt-14 w-full">
        {user ? (
          <SubmissionForm dailyRoundId={round.id} initialContent={myContent} />
        ) : (
          <div className="rounded-2xl bg-gradient-to-r from-amber-200/50 via-rose-200/30 to-slate-200/50 p-px dark:from-amber-400/20 dark:via-rose-400/10 dark:to-slate-400/10">
            <div className="rounded-2xl bg-white/50 px-8 py-7 text-center backdrop-blur-md dark:bg-neutral-900/50">
              <p className="text-sm leading-relaxed tracking-wide text-slate-600 dark:text-slate-300">
                로그인하면 이 상황을 나만의 문체로 다시 써서 제출할 수 있어요.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
