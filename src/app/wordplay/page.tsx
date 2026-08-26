import { createClient } from "@/lib/supabase/server";
import { WordplayBoard } from "@/components/wordplay-board";
import type { WordplayEntry } from "@/app/actions/wordplay";

export default async function WordplayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let entries: WordplayEntry[] = [];
  if (user) {
    const { data } = await supabase
      .from("wordplay_entries")
      .select("id, adjective, noun, verb, color_name, color_hex, sentence, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    entries = data ?? [];
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <span className="font-sans text-xs font-bold tracking-[0.3em] text-[color-mix(in_srgb,var(--ink)_55%,transparent)]">
          네 단어 글쓰기
        </span>
        <h1 className="font-serif text-xl tracking-wide text-[var(--ink)] sm:text-2xl">
          형용사, 명사, 색, 동사 네 단어로 짧은 문장을 지어보세요.
        </h1>
        <p className="font-serif text-sm leading-relaxed text-[color-mix(in_srgb,var(--ink)_70%,transparent)]">
          긴 글이 잘 안 써질 때, 여기서 가볍게 몸을 풀어보세요. 마음에 드는 조합이 나올 때까지 몇 번이든 다시 뽑을 수 있어요.
        </p>
      </header>

      <WordplayBoard loggedIn={!!user} initialEntries={entries} />
    </div>
  );
}
