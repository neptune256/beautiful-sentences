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
            <p className="font-bold">1. 오늘의 소재 단어</p>
            <p className="mt-1 text-[color-mix(in_srgb,var(--ink)_65%,transparent)]">
              매일 하나의 소재 단어가 주어져요. 서사나 줄거리 없이, 그
              단어에서 떠오르는 장면이나 감정을 자유롭게 담아 예쁜 문장 하나를
              써보세요. 분량도 짧게 쓰든 길게 풀어쓰든 자유예요.
            </p>
          </section>

          <section>
            <p className="font-bold">2. 하루 사이클</p>
            <p className="mt-1 text-[color-mix(in_srgb,var(--ink)_65%,transparent)]">
              자정에 그날의 소재 단어가 공개되고, 로그인 후 자정 전까지 몇
              번이든 자유롭게 고쳐 쓸 수 있어요. 자정이 되면 그 시점의
              최종본으로 마감돼요.
            </p>
          </section>

          <section>
            <p className="font-bold">3. 평가는 어떻게 되나요</p>
            <p className="mt-1 text-[color-mix(in_srgb,var(--ink)_65%,transparent)]">
              AI가 아니라 다른 참가자들이 직접 읽고 판단해요. 마감된 글은
              공개된 뒤 24시간 동안 &apos;피드&apos;에서 스와이프로 좋아요를
              받을 수 있고, 좋아요 하나당 작성자에게 즉시 +1점이 쌓여요.
              누적 좋아요 순위는 &apos;좋아요 랭킹&apos; 페이지에서 실시간으로
              확인할 수 있어요.
            </p>
          </section>

          <section>
            <p className="font-bold">4. 공개 범위</p>
            <p className="mt-1 text-[color-mix(in_srgb,var(--ink)_65%,transparent)]">
              베끼기 방지를 위해 당일에는 서로의 글을 볼 수 없어요. 마감된
              전날 글들은 누구나 열람할 수 있고, 그때부터 24시간 동안만
              좋아요를 받을 수 있어요.
            </p>
          </section>

          <section>
            <p className="font-bold">5. 포인트</p>
            <p className="mt-1 text-[color-mix(in_srgb,var(--ink)_65%,transparent)]">
              그날 글을 저장하면 +5점, 내 글이 좋아요를 받을 때마다 +1점,
              내가 제안한 소재 단어가 채택되면 +10점이 쌓여요. 누적 포인트는
              랭킹 페이지에서 확인할 수 있어요.
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
