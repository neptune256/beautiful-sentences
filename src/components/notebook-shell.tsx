"use client";

import { usePathname } from "next/navigation";

const HOLES = Array.from({ length: 15 });

// 가로 폭은 기존 그대로(컨테이너 폭 100%) 두고, 세로만 A4 비율(1:1.4142)에 맞춰 늘어난다.
// 노트 자체 크기는 줄이지 않되, 화면(특히 모바일/태블릿처럼 세로로 긴 화면)보다 내용이
// 길어지면 노트 안에서 세로로 스크롤해서 볼 수 있게 한다(마이페이지 출석 달력 등).
export function NotebookShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="relative w-full" style={{ perspective: "2000px" }}>
      <div className="relative pl-6">
        <div
          aria-hidden="true"
          className="absolute left-6 right-0 top-0 aspect-[1/1.4142] rounded-[0.15rem_0.5rem_0.5rem_0.15rem] bg-[color-mix(in_srgb,var(--paper-cream)_52%,var(--wood-shadow))]"
          style={{ transform: "translate(16px, 16px)" }}
        />
        <div
          aria-hidden="true"
          className="absolute left-6 right-0 top-0 aspect-[1/1.4142] rounded-[0.15rem_0.5rem_0.5rem_0.15rem] bg-[color-mix(in_srgb,var(--paper-cream)_64%,var(--wood-shadow))]"
          style={{ transform: "translate(12px, 12px)" }}
        />
        <div
          aria-hidden="true"
          className="absolute left-6 right-0 top-0 aspect-[1/1.4142] rounded-[0.15rem_0.5rem_0.5rem_0.15rem] bg-[color-mix(in_srgb,var(--paper-cream)_76%,var(--wood-shadow))]"
          style={{ transform: "translate(8px, 8px)" }}
        />
        <div
          aria-hidden="true"
          className="absolute left-6 right-0 top-0 aspect-[1/1.4142] rounded-[0.15rem_0.5rem_0.5rem_0.15rem] bg-[color-mix(in_srgb,var(--paper-cream)_88%,var(--wood-shadow))]"
          style={{ transform: "translate(4px, 4px)" }}
        />

        <div className="relative aspect-[1/1.4142] overflow-hidden rounded-[0.15rem_0.5rem_0.5rem_0.15rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.55)]">
          <div
            key={pathname}
            className="page-flip manuscript-bg relative h-full overflow-hidden"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[color-mix(in_srgb,var(--wood-shadow)_32%,transparent)] to-transparent"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-6 left-4 flex flex-col justify-between"
            >
              {HOLES.map((_, i) => (
                <span
                  key={i}
                  className="block h-2.5 w-2.5 rounded-full bg-[color-mix(in_srgb,var(--wood-shadow)_70%,#000)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"
                />
              ))}
            </div>
            {/* 스크롤바 자체는 노트의 진짜 오른쪽 끝에 붙게 하고, 내용만 안쪽 패딩으로 여백을 준다 */}
            <div className="relative h-full overflow-x-hidden overflow-y-auto py-8 pl-12 pr-6 sm:py-10 sm:pr-10">
              {children}
            </div>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-6 left-1.5 z-30 flex w-9 flex-col justify-between"
        >
          {HOLES.map((_, i) => (
            <div key={i} className="h-2.5">
              <div
                className="spring-coil h-full"
                style={{ transform: `rotate(${i % 2 ? 3 : -3}deg)` }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
