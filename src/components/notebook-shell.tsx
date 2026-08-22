"use client";

import { usePathname } from "next/navigation";

const HOLES = Array.from({ length: 15 });

// v0 원본은 aspect-[1/1.414](A4) + overflow-hidden 고정 박스였지만,
// 실제 콘텐츠(랭킹 목록, 어제의 결과 등)는 길이가 들쭉날쭉해서 min-height로 바꾸고 넘치면 자연스럽게 늘어나게 함.
export function NotebookShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="relative w-full" style={{ perspective: "2000px" }}>
      <div className="relative pl-6">
        <div
          aria-hidden="true"
          className="absolute left-6 right-0 top-0 min-h-[36rem] rounded-[0.15rem_0.5rem_0.5rem_0.15rem] bg-[color-mix(in_srgb,var(--paper-cream)_52%,var(--wood-shadow))]"
          style={{ transform: "translate(16px, 16px)" }}
        />
        <div
          aria-hidden="true"
          className="absolute left-6 right-0 top-0 min-h-[36rem] rounded-[0.15rem_0.5rem_0.5rem_0.15rem] bg-[color-mix(in_srgb,var(--paper-cream)_64%,var(--wood-shadow))]"
          style={{ transform: "translate(12px, 12px)" }}
        />
        <div
          aria-hidden="true"
          className="absolute left-6 right-0 top-0 min-h-[36rem] rounded-[0.15rem_0.5rem_0.5rem_0.15rem] bg-[color-mix(in_srgb,var(--paper-cream)_76%,var(--wood-shadow))]"
          style={{ transform: "translate(8px, 8px)" }}
        />
        <div
          aria-hidden="true"
          className="absolute left-6 right-0 top-0 min-h-[36rem] rounded-[0.15rem_0.5rem_0.5rem_0.15rem] bg-[color-mix(in_srgb,var(--paper-cream)_88%,var(--wood-shadow))]"
          style={{ transform: "translate(4px, 4px)" }}
        />

        <div className="relative min-h-[36rem] overflow-hidden rounded-[0.15rem_0.5rem_0.5rem_0.15rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.55)]">
          <div
            key={pathname}
            className="page-flip manuscript-bg relative min-h-[36rem] py-8 pl-12 pr-6 sm:py-10 sm:pr-10"
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
            {children}
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
