"use client";

import { NicknameForm } from "@/components/nickname-form";

export function NicknameSetupModal({ defaultNickname }: { defaultNickname: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-lg border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-black">
        <h2 className="text-lg font-semibold tracking-tight">닉네임을 정해주세요</h2>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
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
