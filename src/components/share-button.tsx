"use client";

import { useState, useTransition } from "react";
import Script from "next/script";
import { grantShareTicket } from "@/app/actions/propose";

declare global {
  interface Window {
    Kakao?: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Share: {
        sendDefault: (options: Record<string, unknown>) => void;
      };
    };
  }
}

const KAKAO_JS_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;

export function ShareButton() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function initKakao() {
    if (KAKAO_JS_KEY && window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init(KAKAO_JS_KEY);
    }
  }

  function shareViaKakao() {
    if (!window.Kakao?.isInitialized()) return false;

    window.Kakao.Share.sendDefault({
      objectType: "text",
      text: "아름다운 문장 — 매일 하나의 상황 문장을 나만의 문체로 다시 써보세요.",
      link: {
        mobileWebUrl: window.location.origin,
        webUrl: window.location.origin,
      },
    });
    return true;
  }

  function handleShare() {
    setError(null);

    const sharedViaKakao = shareViaKakao();

    if (!sharedViaKakao) {
      if (navigator.share) {
        navigator
          .share({ title: "아름다운 문장", url: window.location.origin })
          .catch(() => {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(window.location.origin).catch(() => {});
      }
    }

    startTransition(async () => {
      try {
        await grantShareTicket();
      } catch (e) {
        setError(e instanceof Error ? e.message : "제안권 발급에 실패했습니다.");
      }
    });
  }

  return (
    <div className="space-y-2">
      {KAKAO_JS_KEY && (
        <Script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js"
          strategy="afterInteractive"
          onLoad={initKakao}
        />
      )}
      <button
        onClick={handleShare}
        disabled={isPending}
        className="rounded-full bg-black px-4 py-1.5 text-sm text-white disabled:opacity-40 dark:bg-white dark:text-black"
      >
        {isPending ? "처리 중..." : KAKAO_JS_KEY ? "카카오톡으로 공유하기" : "사이트 공유하기"}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
