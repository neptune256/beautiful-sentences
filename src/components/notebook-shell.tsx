"use client";

import { usePathname } from "next/navigation";

const HOLES = Array.from({ length: 15 });

// A4 비율(1:1.4142) 고정 + overflow-hidden. 세로 스크롤은 절대 만들지 않고,
// 뷰포트 높이가 부족하면 --nb-vpad(상단 nav+여백 예상치)를 뺀 나머지로 폭을 역산해서
// 노트 전체가 항상 한 화면 안에 들어오게 한다. 넘치는 내용은 늘어나지 않고 그대로 잘린다.
const pageBoxStyle: React.CSSProperties = {
  width: "min(100%, calc((100dvh - var(--nb-vpad)) / 1.4142))",
  aspectRatio: "1 / 1.4142",
};

export function NotebookShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div
      className="relative w-full [--nb-vpad:17rem] lg:[--nb-vpad:13rem]"
      style={{ perspective: "2000px" }}
    >
      <div className="relative pl-6">
        <div
          aria-hidden="true"
          className="absolute left-6 top-0 rounded-[0.15rem_0.5rem_0.5rem_0.15rem] bg-[color-mix(in_srgb,var(--paper-cream)_52%,var(--wood-shadow))]"
          style={{ ...pageBoxStyle, transform: "translate(16px, 16px)" }}
        />
        <div
          aria-hidden="true"
          className="absolute left-6 top-0 rounded-[0.15rem_0.5rem_0.5rem_0.15rem] bg-[color-mix(in_srgb,var(--paper-cream)_64%,var(--wood-shadow))]"
          style={{ ...pageBoxStyle, transform: "translate(12px, 12px)" }}
        />
        <div
          aria-hidden="true"
          className="absolute left-6 top-0 rounded-[0.15rem_0.5rem_0.5rem_0.15rem] bg-[color-mix(in_srgb,var(--paper-cream)_76%,var(--wood-shadow))]"
          style={{ ...pageBoxStyle, transform: "translate(8px, 8px)" }}
        />
        <div
          aria-hidden="true"
          className="absolute left-6 top-0 rounded-[0.15rem_0.5rem_0.5rem_0.15rem] bg-[color-mix(in_srgb,var(--paper-cream)_88%,var(--wood-shadow))]"
          style={{ ...pageBoxStyle, transform: "translate(4px, 4px)" }}
        />

        <div
          className="relative overflow-hidden rounded-[0.15rem_0.5rem_0.5rem_0.15rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.55)]"
          style={pageBoxStyle}
        >
          <div
            key={pathname}
            className="page-flip manuscript-bg relative h-full overflow-hidden py-8 pl-12 pr-6 sm:py-10 sm:pr-10"
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
            <div className="relative h-full overflow-hidden">{children}</div>
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
