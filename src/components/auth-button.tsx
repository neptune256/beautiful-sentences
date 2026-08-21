"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AuthButton({ nickname }: { nickname: string | null }) {
  const router = useRouter();
  const supabase = createClient();

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function signInWithKakao() {
    await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.refresh();
  }

  if (nickname) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="text-black/70 dark:text-white/70">{nickname}</span>
        <button
          onClick={signOut}
          className="text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white"
        >
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={signInWithGoogle}
        className="rounded-full border border-black/10 px-4 py-1.5 text-sm hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
      >
        구글로 로그인
      </button>
      <button
        onClick={signInWithKakao}
        className="rounded-full bg-[#FEE500] px-4 py-1.5 text-sm text-black/85 hover:brightness-95"
      >
        카카오로 로그인
      </button>
    </div>
  );
}
