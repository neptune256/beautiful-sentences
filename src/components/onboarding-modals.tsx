"use client";

import { useEffect, useState } from "react";
import { IntroModal } from "@/components/intro-modal";

const INTRO_KEY = "intro_dismissed_date";

function todayKst() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

export function OnboardingModals() {
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(INTRO_KEY) !== todayKst()) {
      setShowIntro(true);
    }
  }, []);

  if (!showIntro) return null;

  return (
    <IntroModal
      onClose={() => setShowIntro(false)}
      onCloseForToday={() => {
        localStorage.setItem(INTRO_KEY, todayKst());
        setShowIntro(false);
      }}
    />
  );
}
