"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = { href: string; label: string; rotate: string; depth: number };

const TABS: Tab[] = [
  { href: "/", label: "오늘의 문장", rotate: "-1.5deg", depth: 8 },
  { href: "/yesterday", label: "어제의 결과", rotate: "1.2deg", depth: 20 },
  { href: "/ranking", label: "랭킹", rotate: "-0.8deg", depth: 12 },
  { href: "/propose", label: "문장 제안하기", rotate: "1.6deg", depth: 22 },
  { href: "/board", label: "자유 게시판", rotate: "-1.4deg", depth: 16 },
];

const MYPAGE_TAB: Tab = { href: "/mypage", label: "마이페이지", rotate: "-1.2deg", depth: 14 };

export function PostitNav({ loggedIn }: { loggedIn: boolean }) {
  const pathname = usePathname();

  // /board는 노트 밖의 코르크보드라 페이지 인덱스 탭(포스트잇 형식) 대신
  // 보드 상단의 "노트로 돌아가기" 버튼으로 이동한다.
  if (pathname?.startsWith("/board")) return null;

  const tabs = loggedIn ? [...TABS, MYPAGE_TAB] : TABS;

  return (
    <nav
      aria-label="페이지 인덱스"
      className="flex flex-row flex-wrap justify-center gap-2 lg:absolute lg:left-full lg:top-24 lg:z-0 lg:ml-4 lg:flex-col lg:items-start lg:gap-4"
    >
      {tabs.map((tab) => {
        const isActive = tab.href === pathname;
        const tuck = isActive ? 0 : tab.depth;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            style={
              {
                "--postit-x": `-${tuck}px`,
                "--postit-r": isActive ? "0deg" : tab.rotate,
              } as React.CSSProperties
            }
            className={[
              "group relative select-none whitespace-nowrap py-2 pl-6 pr-3 font-sans text-sm font-bold transition-transform duration-200",
              "[transform:rotate(var(--postit-r))] lg:[transform:translateX(var(--postit-x))_rotate(var(--postit-r))]",
              "lg:hover:[transform:translateX(calc(var(--postit-x)+8px))_rotate(var(--postit-r))]",
              "rounded-[3px_6px_6px_3px] lg:rounded-[0_6px_6px_0]",
              isActive ? "lg:scale-105" : "",
              "shadow-[2px_4px_8px_rgba(0,0,0,0.28)] lg:shadow-[4px_5px_12px_rgba(0,0,0,0.35)]",
              'before:absolute before:inset-y-0 before:left-0 before:w-3 before:rounded-l-[3px] before:bg-[color-mix(in_srgb,var(--wood-shadow)_30%,transparent)] before:content-[""] lg:before:hidden',
              !isActive &&
                'lg:after:pointer-events-none lg:after:absolute lg:after:inset-y-0 lg:after:left-0 lg:after:w-4 lg:after:rounded-l-none lg:after:bg-gradient-to-r lg:after:from-[rgba(0,0,0,0.32)] lg:after:to-transparent lg:after:content-[""]',
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--stamp-red)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--wood-base)]",
              isActive
                ? "z-20 bg-[var(--postit-active)] text-[color-mix(in_srgb,var(--ink)_88%,#fff)]"
                : "bg-[var(--postit-yellow)] text-[var(--ink)]",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <span className="relative z-10">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
