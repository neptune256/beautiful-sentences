import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AuthButton } from "@/components/auth-button";
import { NicknameSetupModal } from "@/components/nickname-setup-modal";
import { PostitNav } from "@/components/postit-nav";
import { computeStreakInfo } from "@/lib/attendance";
import { todayKst } from "@/lib/date";

export async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let nickname: string | null = null;
  let needsNicknameSetup = false;
  let streak = 0;
  let diamonds = 0;
  if (user) {
    const [{ data: profile }, streakInfo] = await Promise.all([
      supabase
        .from("profiles")
        .select("nickname, nickname_set, diamonds")
        .eq("id", user.id)
        .single(),
      computeStreakInfo(supabase, user.id, todayKst()),
    ]);
    nickname = profile?.nickname ?? null;
    needsNicknameSetup = profile?.nickname_set === false;
    streak = streakInfo.currentStreak;
    diamonds = profile?.diamonds ?? 0;
  }

  return (
    <>
      {needsNicknameSetup && nickname && (
        <NicknameSetupModal defaultNickname={nickname} />
      )}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="font-serif text-lg font-bold tracking-wide text-[color-mix(in_srgb,var(--paper-cream)_92%,#fff)]"
        >
          아름다운 문장
        </Link>
        <AuthButton nickname={nickname} streak={streak} diamonds={diamonds} />
      </div>
      <PostitNav loggedIn={!!user} />
    </>
  );
}
