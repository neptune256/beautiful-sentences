import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AuthButton } from "@/components/auth-button";
import { NicknameSetupModal } from "@/components/nickname-setup-modal";

const links = [
  { href: "/", label: "오늘의 문장" },
  { href: "/yesterday", label: "어제의 결과" },
  { href: "/ranking", label: "랭킹" },
  { href: "/propose", label: "문장 제안하기" },
];

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
    <header className="border-b border-black/10 dark:border-white/10">
      {needsNicknameSetup && nickname && (
        <NicknameSetupModal defaultNickname={nickname} />
      )}
      <nav className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-semibold tracking-tight">
          아름다운 문장
        </Link>
        <div className="flex items-center gap-6">
          <ul className="flex gap-5 text-sm text-black/70 dark:text-white/70">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-black dark:hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
            {user && (
              <li>
                <Link href="/mypage" className="hover:text-black dark:hover:text-white">
                  마이페이지
                </Link>
              </li>
            )}
          </ul>
          <AuthButton nickname={nickname} />
        </div>
      </nav>
    </header>
  );
}
