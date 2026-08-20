"use client";

import { useEffect, useState } from "react";
import { IntroModal } from "@/components/intro-modal";
import { EvaluationCriteriaModal } from "@/components/evaluation-criteria-modal";

const INTRO_KEY = "intro_dismissed_date";
const CRITERIA_KEY = "eval_criteria_v1_seen";

function todayKst() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

type Step = "intro" | "criteria" | null;

export function OnboardingModals() {
  const [step, setStep] = useState<Step>(null);

  useEffect(() => {
    if (localStorage.getItem(INTRO_KEY) !== todayKst()) {
      setStep("intro");
    } else if (!localStorage.getItem(CRITERIA_KEY)) {
      setStep("criteria");
    }
  }, []);

  function afterIntro() {
    setStep(localStorage.getItem(CRITERIA_KEY) ? null : "criteria");
  }

  if (step === "intro") {
    return (
      <IntroModal
        onClose={afterIntro}
        onCloseForToday={() => {
          localStorage.setItem(INTRO_KEY, todayKst());
          afterIntro();
        }}
      />
    );
  }

  if (step === "criteria") {
    return (
      <EvaluationCriteriaModal
        onClose={() => {
          localStorage.setItem(CRITERIA_KEY, "1");
          setStep(null);
        }}
      />
    );
  }

  return null;
}
