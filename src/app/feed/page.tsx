import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getFeedBatch } from "@/lib/feed";
import { FeedClient } from "@/components/feed-client";

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-5 px-6 text-center">
        <p className="font-serif text-lg leading-relaxed text-[color-mix(in_srgb,var(--paper-cream)_92%,#fff)]">
          로그인하면 다른 사람들의 글을 넘겨보고
          <br />
          좋아요를 보낼 수 있어요.
        </p>
        <Link
          href="/"
          className="rounded-full border border-[color-mix(in_srgb,var(--paper-cream)_50%,transparent)] px-4 py-2.5 font-sans text-sm font-bold text-[var(--paper-cream)] transition-colors hover:bg-[color-mix(in_srgb,var(--paper-cream)_12%,transparent)]"
        >
          ← 노트로 돌아가기
        </Link>
      </div>
    );
  }

  const initialBatch = await getFeedBatch(supabase, user.id, []);

  return <FeedClient initialBatch={initialBatch} />;
}
