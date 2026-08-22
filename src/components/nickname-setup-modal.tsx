"use client";

import { NicknameForm } from "@/components/nickname-form";

export function NicknameSetupModal({ defaultNickname }: { defaultNickname: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--wood-shadow)]/70 p-4">
      <div className="manuscript-bg w-full max-w-sm rounded-sm border border-[var(--paper-grid)] p-6 shadow-2xl">
        <h2 className="font-serif text-lg font-bold text-[var(--ink)]">닉네임을 정해주세요</h2>
        <p className="mt-1 font-sans text-sm text-[color-mix(in_srgb,var(--ink)_65%,transparent)]">
          다른 참가자들에게 이 닉네임으로 보여요. 나중에 마이페이지에서 언제든
          바꿀 수 있어요.
        </p>
        <div className="mt-4">
          <NicknameForm defaultNickname={defaultNickname} submitLabel="시작하기" />
        </div>
      </div>
    </div>
  );
}
