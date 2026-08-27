"use client";

import { useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { submitFeedback } from "@/app/actions/feedback";

const MAX_LENGTH = 1000;

export function FeedbackButton() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function close() {
    setIsOpen(false);
    setContent("");
    setError(null);
    setIsSent(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        await submitFeedback(content, pathname ?? "/");
        setIsSent(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "전송에 실패했습니다.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 z-40 rounded-full bg-[var(--stamp-red)] px-4 py-2.5 font-sans text-sm font-bold text-[var(--paper-cream)] shadow-lg transition-transform duration-150 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--stamp-red)] focus-visible:ring-offset-2"
      >
        피드백
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--wood-shadow)]/70 p-4"
          onClick={close}
        >
          <div
            className="manuscript-bg w-full max-w-md rounded-sm border border-[var(--paper-grid)] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {isSent ? (
              <div className="space-y-4 font-sans">
                <h2 className="font-serif text-lg font-bold text-[var(--ink)]">
                  피드백이 전달됐어요
                </h2>
                <p className="text-sm text-[color-mix(in_srgb,var(--ink)_65%,transparent)]">
                  소중한 의견 감사합니다. 검토 후 반영할게요.
                </p>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={close}
                    className="rounded-sm bg-[var(--stamp-red)] px-4 py-1.5 text-sm font-bold text-[var(--paper-cream)]"
                  >
                    닫기
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 font-sans">
                <h2 className="font-serif text-lg font-bold text-[var(--ink)]">
                  피드백 보내기
                </h2>
                <p className="text-sm text-[color-mix(in_srgb,var(--ink)_65%,transparent)]">
                  버그, 불편한 점, 원하는 기능 무엇이든 편하게 남겨주세요.
                </p>
                <textarea
                  autoFocus
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  maxLength={MAX_LENGTH}
                  rows={5}
                  placeholder="여기에 적어주세요"
                  className="w-full resize-none rounded-sm border border-[var(--paper-grid)] bg-[var(--paper-cream)] p-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--stamp-red)]"
                />
                {error && <p className="text-xs text-[var(--stamp-red)]">{error}</p>}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={close}
                    className="text-sm text-[color-mix(in_srgb,var(--ink)_55%,transparent)] hover:text-[var(--ink)]"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isPending || content.trim().length === 0}
                    className="rounded-sm bg-[var(--stamp-red)] px-4 py-1.5 text-sm font-bold text-[var(--paper-cream)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isPending ? "전송 중..." : "보내기"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
