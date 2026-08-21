import { createClient } from "@/lib/supabase/server";

export default async function RankingPage() {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, nickname, points")
    .order("points", { ascending: false })
    .limit(50);

  const ranked = (profiles ?? []).filter((p) => p.points > 0);
  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  return (
    <div className="mx-auto max-w-3xl px-6 py-20 md:py-28">
      <div className="text-center">
        <h1 className="font-serif text-3xl tracking-wide text-slate-800 md:text-4xl dark:text-slate-100">
          이달의 문장가
        </h1>
        <p className="mt-4 text-sm tracking-wider text-slate-400 dark:text-slate-500">
          가장 깊은 울림을 남긴 아름다운 필사자들의 기록입니다.
        </p>
      </div>

      {ranked.length === 0 ? (
        <p className="mt-20 text-center text-sm tracking-wide text-slate-400 dark:text-slate-500">
          아직 집계된 울림이 없습니다.
        </p>
      ) : (
        <>
          {top3.length > 0 && (
            <div className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-5 md:items-stretch md:gap-5">
              <div className="md:col-span-3">
                <PodiumCard
                  nickname={top3[0].nickname}
                  points={top3[0].points}
                  featured
                />
              </div>
              {(top3[1] || top3[2]) && (
                <div className="grid grid-cols-1 gap-4 md:col-span-2 md:gap-5">
                  {top3[1] && (
                    <PodiumCard nickname={top3[1].nickname} points={top3[1].points} />
                  )}
                  {top3[2] && (
                    <PodiumCard nickname={top3[2].nickname} points={top3[2].points} />
                  )}
                </div>
              )}
            </div>
          )}

          {rest.length > 0 && (
            <div className="mt-16">
              {rest.map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between border-b border-slate-100 px-2 py-5 transition-colors duration-200 hover:bg-slate-50/50 dark:border-white/5 dark:hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-6">
                    <span className="font-serif text-lg text-slate-300 italic tabular-nums dark:text-slate-600">
                      {i + 4}
                    </span>
                    <span className="tracking-wide text-slate-700 dark:text-slate-200">
                      {p.nickname}
                    </span>
                  </div>
                  <span className="text-sm tracking-widest text-slate-400 tabular-nums dark:text-slate-500">
                    {p.points} 울림
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PodiumCard({
  nickname,
  points,
  featured = false,
}: {
  nickname: string;
  points: number;
  featured?: boolean;
}) {
  return (
    <div
      className={`flex h-full flex-col items-center justify-center rounded-3xl border text-center transition-all duration-300 hover:-translate-y-1 ${
        featured
          ? "border-amber-200/60 bg-gradient-to-b from-amber-50/80 to-white px-8 py-16 shadow-[0_0_40px_rgba(234,179,8,0.12)] dark:border-amber-400/20 dark:from-amber-400/[0.06] dark:to-neutral-900"
          : "border-slate-200/70 bg-white/70 px-6 py-8 shadow-sm dark:border-white/10 dark:bg-neutral-900/50"
      }`}
    >
      <p
        className={`font-serif tracking-wide text-slate-800 dark:text-slate-100 ${
          featured ? "text-2xl font-semibold md:text-3xl" : "text-lg font-medium"
        }`}
      >
        {nickname}
      </p>
      <p
        className={`mt-4 tracking-widest text-slate-400 dark:text-slate-500 ${
          featured ? "text-sm" : "text-xs"
        }`}
      >
        {points} 울림
      </p>
    </div>
  );
}
