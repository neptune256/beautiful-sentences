import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AuthButton } from "@/components/auth-button";
import { NicknameSetupModal } from "@/components/nickname-setup-modal";
import { PostitNav } from "@/components/postit-nav";

export async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let nickname: string | null = null;
  let needsNicknameSetup = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("nickname, nickname_set")
      .eq("id", user.id)
      .single();
    nickname = profile?.nickname ?? null;
    needsNicknameSetup = profile?.nickname_set === false;
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
        <AuthButton nickname={nickname} />
      </div>
      <PostitNav loggedIn={!!user} />
    </>
  );
}
