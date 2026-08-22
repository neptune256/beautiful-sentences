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
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <span className="font-sans text-xs font-bold tracking-[0.3em] text-[color-mix(in_srgb,var(--ink)_55%,transparent)]">
          랭킹
        </span>
        <h1 className="font-serif text-xl tracking-wide text-[var(--ink)] sm:text-2xl">
          이달의 문장가들.
        </h1>
      </header>

      {ranked.length === 0 ? (
        <p className="font-serif text-base leading-relaxed text-[color-mix(in_srgb,var(--ink)_70%,transparent)]">
          아직 집계된 포인트가 없습니다.
        </p>
      ) : (
        <ol className="flex flex-col">
          {ranked.map((p, i) => {
            const rank = i + 1;
            const isTop = rank <= 3;
            return (
              <li
                key={p.id}
                className="flex items-center gap-4 border-b border-dashed border-[var(--paper-grid)] py-3"
              >
                <span
                  className={[
                    "grid h-9 w-9 shrink-0 place-items-center font-serif text-lg font-bold",
                    isTop
                      ? "rounded-full bg-[var(--stamp-red)] text-[var(--paper-cream)]"
                      : "text-[color-mix(in_srgb,var(--ink)_60%,transparent)]",
                  ].join(" ")}
                >
                  {rank}
                </span>
                <span className="flex-1 font-sans text-base font-bold text-[var(--ink)]">
                  {p.nickname}
                </span>
                <span className="font-mono text-sm text-[color-mix(in_srgb,var(--ink)_70%,transparent)]">
                  {p.points.toLocaleString()}점
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
