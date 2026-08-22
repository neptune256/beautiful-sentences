"use client";

type Props = {
  onClose: () => void;
  onCloseForToday: () => void;
};

export function IntroModal({ onClose, onCloseForToday }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--wood-shadow)]/70 p-4">
      <div className="manuscript-bg max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-sm border border-[var(--paper-grid)] p-6 shadow-2xl">
        <h2 className="font-serif text-lg font-bold text-[var(--ink)]">
          아름다운 문장은 이렇게 진행돼요
        </h2>

        <div className="mt-5 space-y-5 font-sans text-sm leading-relaxed text-[color-mix(in_srgb,var(--ink)_85%,transparent)]">
          <section>
            <p className="font-bold">1. 오늘의 상황 문장</p>
            <p className="mt-1 text-[color-mix(in_srgb,var(--ink)_65%,transparent)]">
              매일 하나의 상황 문장이 주어져요. 그 상황만 그대로 유지한 채,
              등장인물의 감정·묘사·문체는 완전히 자유롭게 다시 써보세요.
              분량도 짧게 쓰든 길게 풀어쓰든 자유예요.
            </p>
          </section>

          <section>
            <p className="font-bold">2. 하루 사이클</p>
            <p className="mt-1 text-[color-mix(in_srgb,var(--ink)_65%,transparent)]">
              자정에 그날의 문장이 공개되고, 로그인 후 자정 전까지 몇 번이든
              자유롭게 고쳐 쓸 수 있어요. 자정이 되면 그 시점의 최종본으로
              마감돼요.
            </p>
          </section>

          <section>
            <p className="font-bold">3. 평가는 어떻게 되나요</p>
            <p className="mt-1 text-[color-mix(in_srgb,var(--ink)_65%,transparent)]">
              마감 직후 AI(Gemini)가 그날 제출된 모든 글을 비교 평가해서 1위를
              선정하고, 선정 이유를 함께 남겨요. 결과는 다음 날
              &apos;어제의 결과&apos; 페이지에서 확인할 수 있어요. 자세한
              평가 기준은 잠시 후 안내에서 확인해 주세요.
            </p>
          </section>

          <section>
            <p className="font-bold">4. 공개 범위</p>
            <p className="mt-1 text-[color-mix(in_srgb,var(--ink)_65%,transparent)]">
              베끼기 방지를 위해 당일에는 서로의 글을 볼 수 없어요. 평가가
              끝난 전날 글들은 누구나 열람할 수 있어요.
            </p>
          </section>

          <section>
            <p className="font-bold">5. 포인트</p>
            <p className="mt-1 text-[color-mix(in_srgb,var(--ink)_65%,transparent)]">
              그날 글을 최종 제출하면 +5점, 1위로 선정되면 +50점, 내가 제안한
              상황 문장이 채택되면 +10점이 쌓여요. 누적 포인트는 랭킹
              페이지에서 확인할 수 있어요.
            </p>
          </section>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 font-sans">
          <button
            type="button"
            onClick={onCloseForToday}
            className="text-sm text-[color-mix(in_srgb,var(--ink)_55%,transparent)] hover:text-[var(--ink)]"
          >
            오늘 하루 보지 않기
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm bg-[var(--stamp-red)] px-4 py-1.5 text-sm font-bold text-[var(--paper-cream)]"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
