"use client";

import { usePathname } from "next/navigation";

const HOLES = Array.from({ length: 15 });

// 폭을 그냥 고정값으로 두면 노트 높이(=폭*A4비율)도 항상 똑같아지는데, 실제 보이는
// 화면 높이(브라우저 확대 비율/노트북 해상도마다 다름)는 제각각이라 "얼마나 잘리는지"가
// 기기마다 들쭉날쭉해진다. 그래서 폭을 뷰포트 높이에서 nav+여백(--nb-vpad, 실측치)을 뺀
// 만큼으로 역산해서, 화면이 넉넉하면 원래(자연스러운 최대) 폭 그대로, 화면이 부족할 때만
// 딱 필요한 만큼 작아지게 한다 — 그러면 어떤 기기/배율에서도 잘리는 부분 없이 항상
// 한 화면에 온전히 들어간다(잘리는 비율이 기기마다 다르지 않고 한결같이 0%).
//
// --nb-w는 모든 레이어(absolute 그림자 4장 + 일반 흐름 본문 1장)가 그대로 공유해서 쓴다.
// %(퍼센트)는 absolute 요소와 일반 흐름 요소가 서로 다른 기준(패딩 박스 vs 콘텐츠 박스)으로
// 해석해서 두 종류가 미묘하게 어긋나므로 쓰지 않고, vw/rem처럼 요소 위치와 무관하게 항상
// 똑같이 계산되는 단위만 사용한다. 42rem(컨테이너 최대폭) - 1.5rem(pl-6)이 자연스러운
// 최대 폭, 100vw - 3.5rem(body px-4 2rem + pl-6 1.5rem)이 화면 폭 제약이고, 나머지 하나가
// 화면 높이에서 역산한 폭이다.
const pageBoxStyle: React.CSSProperties = {
  width:
    "min(calc(42rem - 1.5rem), calc(100vw - 3.5rem), calc((100dvh - var(--nb-vpad)) / 1.4142))",
  aspectRatio: "1 / 1.4142",
};

export function NotebookShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div
      className="relative w-full [--nb-vpad:15rem] lg:[--nb-vpad:13rem]"
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
