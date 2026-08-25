type CriterionScores = {
  imagery: number;
  rhythm: number;
  resonance: number;
  density: number;
  context: number;
};

type SingleEntryResult = {
  passedGate: boolean;
  gateIssue: string | null;
  scores: CriterionScores;
  note: string;
};

type TokenUsage = {
  model: string;
  promptTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export function totalScore(scores: CriterionScores) {
  return scores.imagery + scores.rhythm + scores.resonance + scores.density + scores.context;
}

const RUBRIC = [
  "## 1단계: 필수 통과 기준 (Pass/Fail)",
  "다음 두 기준을 모두 만족하지 못하면, 문장이 아무리 아름답고 시적이어도 통과시키지 마세요.",
  "",
  "1. 정보 및 상황의 등가성: 원문이 묘사하는 물리적 상황·행동·인물의 상태가 그대로 유지되었는가?",
  '   (예: 원문이 "비가 쏟아지는 날 그가 우산을 접었다"인데, "흐린 하늘 아래 그가 내리는 빗방울을 온몸으로 맞았다"처럼',
  "   '우산을 접는 행동'이라는 핵심 상황 자체를 빼버리면 실패입니다.)",
  "2. 서사적 기능의 유지: 그 문장이 소설 속에서 해야 하는 역할(긴장감 조성, 인물의 심리 대변, 배경 설명 등)을 그대로 수행하는가?",
  "   (예: 원문이 극심한 공포를 묘사하는 건조한 문장인데, 다시 쓴 문장이 지나치게 아름답고 낭만적으로 바뀌어",
  "   공포감이 사라졌다면 서사적 기능을 잃은 것으로 실패입니다.)",
  "",
  "## 2단계: 세부 평가 기준 (1단계 통과 여부와 무관하게 반드시 채점, 각 1~10점)",
  "1. imagery (이미지의 선명도): 추상적 서술 대신 감각적 묘사로 독자 머릿속에 생생한 그림을 그려내는가?",
  "2. rhythm (리듬과 운율): 조사·어미 활용이 매끄럽고, 문장의 호흡(단문/장문의 조화)이 감정선과 일치하는가?",
  "3. resonance (정서적 잔향): 감정을 직접 설명하지 않고도 문장이 끝난 뒤 여운과 정서를 남기는가?",
  "4. density (함축성과 참신함): 상투적 클리셰를 피하고, 짧은 문장 안에 깊은 의미와 신선한 은유를 담았는가?",
  "5. context (맥락적 부합성): 문체가 화려하더라도 소설 전체의 톤앤매너·인물의 성격과 어울리며 과시적이거나 감정 과잉이 아닌가?",
].join("\n");

function isCriterionScores(value: unknown): value is CriterionScores {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.imagery === "number" &&
    typeof v.rhythm === "number" &&
    typeof v.resonance === "number" &&
    typeof v.density === "number" &&
    typeof v.context === "number"
  );
}

async function callGeminiJson(
  model: string,
  apiKey: string,
  prompt: string,
): Promise<{ parsed: Record<string, unknown>; usage: TokenUsage }> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    },
  );

  if (!res.ok) {
    throw new Error(`Gemini API 오류 (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini 응답에 내용이 없습니다.");
  }

  const usageMetadata = data.usageMetadata ?? {};
  const usage: TokenUsage = {
    model,
    promptTokens: usageMetadata.promptTokenCount ?? 0,
    outputTokens: usageMetadata.candidatesTokenCount ?? 0,
    totalTokens: usageMetadata.totalTokenCount ?? 0,
  };

  return { parsed: JSON.parse(text), usage };
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Gemini 평가에 실패했습니다.");
}

function requireApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY가 설정되지 않았습니다.");
  const model = process.env.GEMINI_MODEL ?? "gemini-3.6-flash";
  return { apiKey, model };
}

/**
 * 글 한 편만 절대 채점한다 (다른 참가자와 비교하지 않음).
 * '최종 제출' 시 즉시 호출되거나, 자정 마감 때 그때까지 최종 제출하지 않은 글에 대해 호출된다.
 * 서로 다른 시점에 채점되므로, 여기서 나온 점수를 그대로 비교해 1위를 정한다.
 */
export async function evaluateSingleEntry(
  situation: string,
  content: string,
): Promise<SingleEntryResult & { usage: TokenUsage }> {
  const { apiKey, model } = requireApiKey();

  const prompt = [
    "당신은 소설 문장 창작 대회의 심사위원입니다.",
    "아래는 오늘의 상황 문장과, 한 참가자가 그 상황을 자신의 문체로 재구성한 글입니다.",
    "다른 참가자와 비교하지 말고, 이 글 자체를 아래 기준으로만 절대 평가하세요.",
    "",
    RUBRIC,
    "",
    `상황 문장: ${situation}`,
    "",
    `참가자 글:\n${content}`,
    "",
    "채점 절차:",
    "- 1단계 통과 여부(passed_gate)와, 탈락했다면 어떤 기준을 왜 위반했는지 한 문장(gate_issue)을 남기세요.",
    "- 1단계 탈락 여부와 무관하게 2단계 5개 기준 점수(각 1~10점)를 매기세요.",
    "- note에는 이 글에서 가장 아쉬운 점 하나만 한 문장으로 담백하게 쓰세요. 장점이나 칭찬은 넣지 마세요.",
    "",
    "다음 JSON 형식으로만 응답하세요:",
    '{"passed_gate": <boolean>, "gate_issue": <string 또는 null>, "scores": {"imagery": <1~10>, "rhythm": <1~10>, "resonance": <1~10>, "density": <1~10>, "context": <1~10>}, "note": "<가장 아쉬운 점 한 문장>"}',
  ].join("\n");

  return withRetry(async () => {
    const { parsed, usage } = await callGeminiJson(model, apiKey, prompt);
    if (
      typeof parsed.passed_gate !== "boolean" ||
      (parsed.gate_issue !== null && typeof parsed.gate_issue !== "string") ||
      !isCriterionScores(parsed.scores) ||
      typeof parsed.note !== "string"
    ) {
      throw new Error("Gemini 응답 형식이 올바르지 않습니다.");
    }
    return {
      passedGate: parsed.passed_gate,
      gateIssue: parsed.gate_issue as string | null,
      scores: parsed.scores,
      note: parsed.note,
      usage,
    };
  });
}

type BatchEntry = { index: number; content: string };
type BatchEntryResult = SingleEntryResult & { index: number };

function isBatchEntryResult(value: unknown): value is {
  index: number;
  passed_gate: boolean;
  gate_issue: string | null;
  scores: CriterionScores;
  note: string;
} {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.index === "number" &&
    typeof v.passed_gate === "boolean" &&
    (v.gate_issue === null || typeof v.gate_issue === "string") &&
    isCriterionScores(v.scores) &&
    typeof v.note === "string"
  );
}

/**
 * 자정까지 '최종 제출'하지 않은 글들을 한 번에 채점한다 (한 사람씩 개별 호출하면 크레딧 낭비이므로,
 * 이 그룹 안에서는 서로 비교하며 상대적으로 점수를 매기게 함). 승자는 여기서 정하지 않는다 —
 * 이미 개별 채점을 마친 '최종 제출' 글들과 점수를 합쳐 비교해야 하기 때문에, 승자 판정과 선정 이유는
 * writeWinnerReasoning으로 별도 처리한다.
 */
export async function evaluateBatch(
  situation: string,
  entries: BatchEntry[],
): Promise<{ results: BatchEntryResult[]; usage: TokenUsage }> {
  const { apiKey, model } = requireApiKey();

  const list = entries.map((e) => `[${e.index}]\n${e.content}`).join("\n\n");
  const prompt = [
    "당신은 소설 문장 창작 대회의 심사위원입니다.",
    "아래는 오늘의 상황 문장과, 참가자들이 그 상황을 각자의 문체로 재구성한 글입니다.",
    "서로 비교해가며 아래 기준으로 채점하세요. (단, 여기서 1위를 뽑지는 않습니다 — 채점만 하세요.)",
    "",
    RUBRIC,
    "",
    `상황 문장: ${situation}`,
    "",
    "참가자 글 (번호로만 구분, 익명):",
    list,
    "",
    "채점 절차:",
    "- 모든 글에 대해 1단계 통과 여부(passed_gate)와, 탈락했다면 어떤 기준을 왜 위반했는지 한 문장(gate_issue)을 남기세요.",
    "- 1단계 탈락 여부와 무관하게, 모든 글에 2단계 5개 기준 점수(각 1~10점)를 매기세요. 비교를 위해 탈락작도 채점합니다.",
    "- note에는 이 글에서 가장 아쉬운 점 하나만 한 문장으로 담백하게 쓰세요. 장점이나 칭찬은 넣지 마세요.",
    "",
    "다음 JSON 형식으로만 응답하세요:",
    '{"results": [{"index": <번호>, "passed_gate": <boolean>, "gate_issue": <string 또는 null>, "scores": {"imagery": <1~10>, "rhythm": <1~10>, "resonance": <1~10>, "density": <1~10>, "context": <1~10>}, "note": "<가장 아쉬운 점 한 문장>"}, ...]}',
  ].join("\n");

  return withRetry(async () => {
    const { parsed, usage } = await callGeminiJson(model, apiKey, prompt);
    if (!Array.isArray(parsed.results) || !parsed.results.every(isBatchEntryResult)) {
      throw new Error("Gemini 응답 형식이 올바르지 않습니다.");
    }
    const results: BatchEntryResult[] = (
      parsed.results as {
        index: number;
        passed_gate: boolean;
        gate_issue: string | null;
        scores: CriterionScores;
        note: string;
      }[]
    ).map((r) => ({
      index: r.index,
      passedGate: r.passed_gate,
      gateIssue: r.gate_issue,
      scores: r.scores,
      note: r.note,
    }));
    return { results, usage };
  });
}

/**
 * 이미 점수로 결정된 1위 글에 대해서만, "왜 오늘의 1위인지" 설명을 짧게 받아온다.
 * (개별 절대 채점 방식에서는 채점 시점에 아직 승자가 정해지지 않으므로, 1위가 확정된 뒤 별도로 요청한다.)
 */
export async function writeWinnerReasoning(
  situation: string,
  content: string,
  scores: CriterionScores,
): Promise<{ reasoning: string; usage: TokenUsage }> {
  const { apiKey, model } = requireApiKey();

  const prompt = [
    "당신은 소설 문장 창작 대회의 심사위원입니다.",
    "아래 글은 오늘의 상황 문장을 참가자가 자신의 문체로 재구성한 것이며, 이미 채점을 통과해 오늘의 1위로 결정되었습니다.",
    "이 글이 왜 뛰어난지, 아래 채점 기준을 참고해 참가자에게 보여줄 선정 이유를 작성하세요.",
    "",
    RUBRIC,
    "",
    `상황 문장: ${situation}`,
    "",
    `1위로 선정된 글:\n${content}`,
    "",
    `이 글이 받은 세부 점수: 이미지의 선명도 ${scores.imagery}/10, 리듬과 운율 ${scores.rhythm}/10, 정서적 잔향 ${scores.resonance}/10, 함축성과 참신함 ${scores.density}/10, 맥락적 부합성 ${scores.context}/10`,
    "",
    "reasoning은 1단계를 어떻게 통과했는지와 2단계 기준 중 특히 뛰어났던 점을 포함해 한국어로 4~6문장으로 쓰세요.",
    "",
    '다음 JSON 형식으로만 응답하세요: {"reasoning": "<1위 선정 이유>"}',
  ].join("\n");

  return withRetry(async () => {
    const { parsed, usage } = await callGeminiJson(model, apiKey, prompt);
    if (typeof parsed.reasoning !== "string") {
      throw new Error("Gemini 응답 형식이 올바르지 않습니다.");
    }
    return { reasoning: parsed.reasoning, usage };
  });
}
