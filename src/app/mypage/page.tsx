import { createClient } from "@/lib/supabase/server";
import { NicknameForm } from "@/components/nickname-form";

export default async function MyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <span className="font-sans text-xs font-bold tracking-[0.3em] text-[color-mix(in_srgb,var(--ink)_55%,transparent)]">
            마이페이지
          </span>
          <h1 className="font-serif text-xl tracking-wide text-[var(--ink)] sm:text-2xl">
            로그인이 필요합니다
          </h1>
        </header>
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname, points")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <span className="font-sans text-xs font-bold tracking-[0.3em] text-[color-mix(in_srgb,var(--ink)_55%,transparent)]">
          마이페이지
        </span>
        <h1 className="font-serif text-xl tracking-wide text-[var(--ink)] sm:text-2xl">
          {profile?.nickname}
        </h1>
      </header>

      <section className="flex items-center justify-between rounded-sm border border-[var(--paper-grid)] bg-[color-mix(in_srgb,var(--paper-cream)_90%,#fff)] px-5 py-4">
        <div className="flex flex-col">
          <span className="font-sans text-xs font-bold tracking-[0.2em] text-[color-mix(in_srgb,var(--ink)_55%,transparent)]">
            누적 포인트
          </span>
          <span className="font-serif text-3xl font-bold text-[var(--stamp-red)]">
            {(profile?.points ?? 0).toLocaleString()}
            <span className="ml-1 text-base text-[var(--ink)]">점</span>
          </span>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <span className="font-sans text-xs font-bold tracking-[0.3em] text-[color-mix(in_srgb,var(--ink)_55%,transparent)]">
          닉네임 변경
        </span>
        <NicknameForm defaultNickname={profile?.nickname ?? ""} />
      </section>
    </div>
  );
}
