"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "intro_dismissed_date";

function todayKst() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

export function IntroModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dismissedDate = localStorage.getItem(STORAGE_KEY);
    if (dismissedDate !== todayKst()) {
      setOpen(true);
    }
  }, []);

  function close() {
    setOpen(false);
  }

  function closeForToday() {
    localStorage.setItem(STORAGE_KEY, todayKst());
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-black">
        <h2 className="text-lg font-semibold tracking-tight">
          아름다운 문장은 이렇게 진행돼요
        </h2>

        <div className="mt-5 space-y-5 text-sm leading-relaxed text-black/80 dark:text-white/80">
          <section>
            <p className="font-medium">1. 오늘의 상황 문장</p>
            <p className="mt-1 text-black/60 dark:text-white/60">
              매일 하나의 상황 문장이 주어져요. 그 상황만 그대로 유지한 채,
              등장인물의 감정·묘사·문체는 완전히 자유롭게 다시 써보세요.
              분량도 짧게 쓰든 길게 풀어쓰든 자유예요.
            </p>
          </section>

          <section>
            <p className="font-medium">2. 하루 사이클</p>
            <p className="mt-1 text-black/60 dark:text-white/60">
              자정에 그날의 문장이 공개되고, 로그인 후 자정 전까지 몇 번이든
              자유롭게 고쳐 쓸 수 있어요. 자정이 되면 그 시점의 최종본으로
              마감돼요.
            </p>
          </section>

          <section>
            <p className="font-medium">3. 평가는 어떻게 되나요</p>
            <p className="mt-1 text-black/60 dark:text-white/60">
              마감 직후 AI(Gemini)가 그날 제출된 모든 글을 문장력·상황
              충실도·창의성 기준으로 비교 평가해서 1위를 선정하고, 선정
              이유를 함께 남겨요. 결과는 다음 날 &apos;어제의 결과&apos;
              페이지에서 확인할 수 있어요.
            </p>
          </section>

          <section>
            <p className="font-medium">4. 공개 범위</p>
            <p className="mt-1 text-black/60 dark:text-white/60">
              베끼기 방지를 위해 당일에는 서로의 글을 볼 수 없어요. 평가가
              끝난 전날 글들은 누구나 열람할 수 있어요.
            </p>
          </section>

          <section>
            <p className="font-medium">5. 포인트</p>
            <p className="mt-1 text-black/60 dark:text-white/60">
              그날 글을 최종 제출하면 +5점, 1위로 선정되면 +50점, 내가 제안한
              상황 문장이 채택되면 +10점이 쌓여요. 누적 포인트는 랭킹
              페이지에서 확인할 수 있어요.
            </p>
          </section>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={closeForToday}
            className="text-sm text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white"
          >
            오늘 하루 보지 않기
          </button>
          <button
            onClick={close}
            className="rounded-full bg-black px-4 py-1.5 text-sm text-white dark:bg-white dark:text-black"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
