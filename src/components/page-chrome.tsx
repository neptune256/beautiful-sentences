"use client";

import { usePathname } from "next/navigation";
import { NotebookShell } from "@/components/notebook-shell";

// /board는 코르크보드에 포스트잇을 붙이는 느낌이라 노트 페이지의 좁은 폭이나 여백과 맞지 않아
// 노트 프레임 없이 화면 전체(=책상 표면)를 보드로 쓰고, 메뉴/설명은 위쪽 얇은 바에 둔다.
// 그 외 페이지는 기존 노트 페이지 그대로.
export function PageChrome({
  nav,
  children,
}: {
  nav: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isBoard = pathname?.startsWith("/board");

  if (isBoard) {
    return (
      <div className="desk-surface fixed inset-0 z-0 flex flex-col overflow-hidden">
        <div className="shrink-0 px-4 pt-4 sm:px-6 sm:pt-5">{nav}</div>
        <div className="min-h-0 flex-1">{children}</div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-2xl" style={{ perspective: "2000px" }}>
      {nav}
      <NotebookShell>{children}</NotebookShell>
    </div>
  );
}
