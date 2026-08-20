import { createClient } from "@/lib/supabase/server";

export default async function RankingPage() {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, nickname, points")
    .order("points", { ascending: false })
    .limit(50);

  const ranked = (profiles ?? []).filter((p) => p.points > 0);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-black/50 dark:text-white/50">랭킹</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          누적 포인트 순위표
        </h1>
      </div>

      {ranked.length === 0 ? (
        <p className="text-black/70 dark:text-white/70">
          아직 집계된 포인트가 없습니다.
        </p>
      ) : (
        <ol className="divide-y divide-black/10 dark:divide-white/10">
          {ranked.map((p, i) => (
            <li key={p.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-4">
                <span className="w-6 text-sm tabular-nums text-black/40 dark:text-white/40">
                  {i + 1}
                </span>
                <span className="text-sm font-medium">{p.nickname}</span>
              </div>
              <span className="text-sm tabular-nums text-black/70 dark:text-white/70">
                {p.points}점
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
