import { createClient } from "@/lib/supabase/server";
import { computeAllStreaks } from "@/lib/attendance";
import { todayKst } from "@/lib/date";

const RANKING_SIZE = 5;

type RankRow = {
  id: string;
  nickname: string;
  value: number;
  unit: string;
};

function RankList({ rows }: { rows: RankRow[] }) {
  return (
    <ol className="flex flex-col">
      {rows.map((row, i) => {
        const rank = i + 1;
        const isTop = rank <= 3;
        return (
          <li
            key={row.id}
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
              {row.nickname}
            </span>
            <span className="font-mono text-sm text-[color-mix(in_srgb,var(--ink)_70%,transparent)]">
              {row.value.toLocaleString()}
              {row.unit}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default async function RankingPage() {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, nickname, points")
    .order("points", { ascending: false })
    .limit(50);

  const pointsRanked = (profiles ?? [])
    .filter((p) => p.points > 0)
    .slice(0, RANKING_SIZE)
    .map((p) => ({ id: p.id, nickname: p.nickname, value: p.points, unit: "점" }));

  const streaks = await computeAllStreaks(supabase, todayKst());

  const topStreaks = streaks
    .filter((s) => s.currentStreak > 0)
    .sort((a, b) => b.currentStreak - a.currentStreak)
    .slice(0, RANKING_SIZE);

  const topAttendanceIds = topStreaks.map((s) => s.userId);

  const { data: attendanceProfiles } = topAttendanceIds.length
    ? await supabase.from("profiles").select("id, nickname").in("id", topAttendanceIds)
    : { data: [] };

  const nicknameById = new Map((attendanceProfiles ?? []).map((p) => [p.id, p.nickname]));

  const attendanceRanked = topStreaks.map((s) => ({
    id: s.userId,
    nickname: nicknameById.get(s.userId) ?? "알 수 없음",
    value: s.currentStreak,
    unit: "일",
  }));

  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <span className="font-sans text-xs font-bold tracking-[0.3em] text-[color-mix(in_srgb,var(--ink)_55%,transparent)]">
            랭킹
          </span>
          <h1 className="font-serif text-xl tracking-wide text-[var(--ink)] sm:text-2xl">
            이달의 문장가들.
          </h1>
        </header>

        {pointsRanked.length === 0 ? (
          <p className="font-serif text-base leading-relaxed text-[color-mix(in_srgb,var(--ink)_70%,transparent)]">
            아직 집계된 포인트가 없습니다.
          </p>
        ) : (
          <RankList rows={pointsRanked} />
        )}
      </section>

      <section className="flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <span className="font-sans text-xs font-bold tracking-[0.3em] text-[color-mix(in_srgb,var(--ink)_55%,transparent)]">
            출석 랭킹
          </span>
          <h1 className="font-serif text-xl tracking-wide text-[var(--ink)] sm:text-2xl">
            꾸준히 쓰는 사람들.
          </h1>
        </header>

        {attendanceRanked.length === 0 ? (
          <p className="font-serif text-base leading-relaxed text-[color-mix(in_srgb,var(--ink)_70%,transparent)]">
            아직 집계된 출석이 없습니다.
          </p>
        ) : (
          <RankList rows={attendanceRanked} />
        )}
      </section>
    </div>
  );
}
