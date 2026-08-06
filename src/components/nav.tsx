import Link from "next/link";

const links = [
  { href: "/", label: "오늘의 문장" },
  { href: "/yesterday", label: "어제의 결과" },
  { href: "/ranking", label: "랭킹" },
  { href: "/propose", label: "문장 제안하기" },
];

export function Nav() {
  return (
    <header className="border-b border-black/10 dark:border-white/10">
      <nav className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-semibold tracking-tight">
          아름다운 문장
        </Link>
        <ul className="flex gap-5 text-sm text-black/70 dark:text-white/70">
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="hover:text-black dark:hover:text-white">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
