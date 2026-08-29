import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 5;

export default async function YesterdayPage(props: PageProps<"/yesterday">) {
  const supabase = await createClient();
  const { page: pageParam } = await props.searchParams;
  const requestedPage = Math.max(1, parseInt(Array.isArray(pageParam) ? pageParam[0] : pageParam ?? "1", 10) || 1);

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
          전날 소재 단어로 쓴 글들과 좋아요 랭킹이 여기에 표시됩니다.
        </p>
      </div>
    );
  }

  const situation = Array.isArray(round.situation_sentences)
    ? round.situation_sentences[0]
    : round.situation_sentences;

  const { count: submissionCount } = await supabase
    .from("submissions")
    .select("id", { count: "exact", head: true })
    .eq("daily_round_id", round.id);

  const totalPages = Math.max(1, Math.ceil((submissionCount ?? 0) / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: submissions } = await supabase
    .from("submissions")
    .select("id, content, likes_count, profiles(nickname)")
    .eq("daily_round_id", round.id)
    .order("likes_count", { ascending: false })
    .range(from, to);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <span className="font-sans text-xs font-bold tracking-[0.3em] text-[color-mix(in_srgb,var(--ink)_55%,transparent)]">
          어제의 결과 · {round.round_date}
        </span>
        <h1 className="font-serif text-xl tracking-wide text-[var(--ink)] sm:text-2xl">
          좋아요를 가장 많이 받은 글들.
        </h1>
        <p className="font-serif text-base leading-relaxed text-[color-mix(in_srgb,var(--ink)_75%,transparent)]">
          &ldquo;{situation?.content}&rdquo;
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <span className="font-sans text-xs font-bold tracking-[0.3em] text-[color-mix(in_srgb,var(--ink)_55%,transparent)]">
          참가자들의 글 ({submissionCount ?? 0})
        </span>
        <ul className="flex flex-col gap-4">
          {submissions?.map((s) => {
            const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;

            return (
              <li
                key={s.id}
                className="manuscript-bg rounded-sm border border-[var(--paper-grid)] p-4 shadow-[0_2px_6px_rgba(0,0,0,0.12)]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-sans text-sm font-bold text-[color-mix(in_srgb,var(--ink)_70%,transparent)]">
                    {profile?.nickname ?? "익명"}
                  </span>
                  <span className="font-sans text-sm font-bold text-[var(--stamp-red)]">
                    ❤️ {s.likes_count ?? 0}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap font-mono text-base leading-relaxed text-[var(--ink)]">
                  {s.content}
                </p>
              </li>
            );
          })}
        </ul>

        {totalPages > 1 && (
          <nav
            aria-label="페이지 넘기기"
            className="mt-2 flex items-center justify-center gap-6 font-sans text-sm font-bold"
          >
            {page > 1 ? (
              <Link
                href={`/yesterday?page=${page - 1}`}
                className="text-[var(--stamp-red)] transition-transform hover:scale-105"
              >
                ◂ 이전 장
              </Link>
            ) : (
              <span className="text-[color-mix(in_srgb,var(--ink)_30%,transparent)]">◂ 이전 장</span>
            )}
            <span className="font-mono text-xs text-[color-mix(in_srgb,var(--ink)_55%,transparent)]">
              {page} / {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={`/yesterday?page=${page + 1}`}
                className="text-[var(--stamp-red)] transition-transform hover:scale-105"
              >
                다음 장 ▸
              </Link>
            ) : (
              <span className="text-[color-mix(in_srgb,var(--ink)_30%,transparent)]">다음 장 ▸</span>
            )}
          </nav>
        )}
      </section>
    </div>
  );
}
