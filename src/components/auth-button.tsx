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
      <div className="flex items-center gap-3 font-sans text-sm">
        <span className="font-bold text-[color-mix(in_srgb,var(--paper-cream)_92%,#fff)]">
          {nickname}
        </span>
        <button
          type="button"
          onClick={signOut}
          className="text-[color-mix(in_srgb,var(--paper-cream)_70%,transparent)] hover:text-[var(--paper-cream)]"
        >
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 font-sans text-sm font-bold">
      <button
        type="button"
        onClick={signInWithGoogle}
        className="rounded-full border-2 border-[var(--paper-cream)] px-4 py-1.5 text-[var(--paper-cream)] transition-transform hover:scale-105"
      >
        구글로 로그인
      </button>
      <button
        type="button"
        onClick={signInWithKakao}
        className="rounded-full bg-[#FEE500] px-4 py-1.5 text-black/85 transition-transform hover:scale-105"
      >
        카카오로 로그인
      </button>
    </div>
  );
}
