"use client";

type Props = {
  onClose: () => void;
};

export function EvaluationCriteriaModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-black">
        <h2 className="text-lg font-semibold tracking-tight">
          AI 평가 기준이 더 꼼꼼해졌어요
        </h2>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          앞으로 자정 마감 평가는 아래 두 단계로 진행돼요.
        </p>

        <div className="mt-5 space-y-5 text-sm leading-relaxed text-black/80 dark:text-white/80">
          <section>
            <p className="text-xs font-medium uppercase tracking-wide text-black/40 dark:text-white/40">
              1단계 · 필수 통과 기준
            </p>
            <p className="mt-1 text-black/60 dark:text-white/60">
              아래 두 가지를 지키지 못하면, 문장이 아무리 아름다워도 1위가
              될 수 없어요.
            </p>

            <div className="mt-3 space-y-3">
              <div>
                <p className="font-medium">1. 정보 및 상황의 등가성</p>
                <p className="mt-1 text-black/60 dark:text-white/60">
                  원문이 그리는 물리적 상황·행동·인물의 상태를 그대로
                  유지해야 해요. 예를 들어 원문이 &quot;비가 쏟아지는 날
                  그가 우산을 접었다&quot;인데 &quot;흐린 하늘 아래 그가
                  내리는 빗방울을 온몸으로 맞았다&quot;로 바꾸면,
                  &apos;우산을 접는 행동&apos;이라는 핵심 상황이 사라져
                  탈락이에요.
                </p>
              </div>
              <div>
                <p className="font-medium">2. 서사적 기능의 유지</p>
                <p className="mt-1 text-black/60 dark:text-white/60">
                  그 문장이 원래 맡은 역할(긴장감 조성, 인물의 심리 대변,
                  배경 설명 등)을 그대로 수행해야 해요. 극심한 공포를
                  그린 건조한 문장을 지나치게 낭만적으로 바꿔 공포감이
                  사라지면 탈락이에요.
                </p>
              </div>
            </div>
          </section>

          <section>
            <p className="text-xs font-medium uppercase tracking-wide text-black/40 dark:text-white/40">
              2단계 · 세부 평가 기준
            </p>
            <p className="mt-1 text-black/60 dark:text-white/60">
              1단계를 통과한 글만 아래 다섯 기준으로 비교돼요.
            </p>

            <div className="mt-3 space-y-3">
              <div>
                <p className="font-medium">1. 이미지의 선명도</p>
                <p className="mt-1 text-black/60 dark:text-white/60">
                  추상적인 설명 대신 감각적 묘사로 장면이 눈앞에
                  그려지는가.
                </p>
              </div>
              <div>
                <p className="font-medium">2. 리듬과 운율</p>
                <p className="mt-1 text-black/60 dark:text-white/60">
                  조사·어미 활용이 매끄럽고, 단문과 장문의 호흡이 감정선과
                  맞아떨어지는가.
                </p>
              </div>
              <div>
                <p className="font-medium">3. 정서적 잔향</p>
                <p className="mt-1 text-black/60 dark:text-white/60">
                  감정을 직접 설명하지 않아도 문장이 끝난 뒤 여운이
                  남는가.
                </p>
              </div>
              <div>
                <p className="font-medium">4. 함축성과 참신함</p>
                <p className="mt-1 text-black/60 dark:text-white/60">
                  뻔한 클리셰를 넘어선 신선한 은유로, 낭비되는 단어 없이
                  깊은 의미를 담았는가.
                </p>
              </div>
              <div>
                <p className="font-medium">5. 맥락적 부합성</p>
                <p className="mt-1 text-black/60 dark:text-white/60">
                  아무리 화려한 문장이라도 소설 전체의 톤앤매너와
                  인물의 성격을 해치지 않는가.
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-6 flex items-center justify-end">
          <button
            onClick={onClose}
            className="rounded-full bg-black px-4 py-1.5 text-sm text-white dark:bg-white dark:text-black"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
