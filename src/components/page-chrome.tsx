"use client";

import { usePathname } from "next/navigation";
import { NotebookShell } from "@/components/notebook-shell";

// /board는 자유 배치 코르크보드라 노트 페이지의 좁은 폭·overflow-hidden 클리핑과 맞지 않아
// 노트 프레임 없이 전체 화면을 쓴다. 그 외 페이지는 기존 노트 페이지 그대로.
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
      <div className="w-full max-w-6xl">
        {nav}
        <div className="mt-4">{children}</div>
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
