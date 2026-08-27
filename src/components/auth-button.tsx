"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AuthButton({
  nickname,
  streak = 0,
  diamonds = 0,
}: {
  nickname: string | null;
  streak?: number;
  diamonds?: number;
}) {
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
        <span className="flex items-center gap-1.5">
          <span className="font-bold text-[color-mix(in_srgb,var(--paper-cream)_92%,#fff)]">
            {nickname}
          </span>
          {streak > 0 && (
            <span
              key={streak}
              aria-label={`연속 출석 ${streak}일째`}
              className="pop-in flex items-center gap-0.5 rounded-full bg-[var(--postit-active)] px-2 py-0.5 font-mono text-xs font-bold text-[var(--wood-shadow)]"
            >
              <span className="flame-flicker inline-block" aria-hidden>
                🔥
              </span>
              {streak}
            </span>
          )}
          {diamonds > 0 && (
            <span
              key={diamonds}
              aria-label={`다이아 ${diamonds}개`}
              className="pop-in flex items-center gap-0.5 rounded-full bg-[color-mix(in_srgb,#3B82C4_25%,var(--paper-cream))] px-2 py-0.5 font-mono text-xs font-bold text-[var(--wood-shadow)]"
            >
              💎{diamonds}
            </span>
          )}
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
