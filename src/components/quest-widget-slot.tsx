"use client";

import { usePathname } from "next/navigation";

// /board는 노트 폭 제약 없이 nav가 화면 전체 너비를 쓰기 때문에 닉네임/스트릭 배지가
// 우측 끝까지 붙는다. 그 외 페이지는 nav가 max-w-2xl 안에 있어 화면 우측에 여백이 남는다.
export function QuestWidgetSlot({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBoard = pathname?.startsWith("/board");

  return (
    <div
      className={
        isBoard
          ? "fixed right-3 top-16 z-30 sm:right-6 sm:top-20"
          : "fixed right-3 top-3 z-30 sm:right-6 sm:top-6"
      }
    >
      {children}
    </div>
  );
}
