type Entry = { index: number; content: string };
type EvaluationResult = { winnerIndex: number; reasoning: string };

export async function evaluateSubmissions(
  situation: string,
  entries: Entry[],
): Promise<EvaluationResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY가 설정되지 않았습니다.");
  }

  const model = process.env.GEMINI_MODEL ?? "gemini-3.6-flash";
  const prompt = buildPrompt(situation, entries);

  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await callGemini(model, apiKey, prompt);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Gemini 평가에 실패했습니다.");
}

async function callGemini(
  model: string,
  apiKey: string,
  prompt: string,
): Promise<EvaluationResult> {
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

  const parsed = JSON.parse(text);
  if (
    typeof parsed.winner_index !== "number" ||
    typeof parsed.reasoning !== "string"
  ) {
    throw new Error("Gemini 응답 형식이 올바르지 않습니다.");
  }

  return { winnerIndex: parsed.winner_index, reasoning: parsed.reasoning };
}

function buildPrompt(situation: string, entries: Entry[]) {
  const list = entries.map((e) => `[${e.index}]\n${e.content}`).join("\n\n");

  return [
    "당신은 소설 문장 창작 대회의 심사위원입니다.",
    "아래는 오늘의 상황 문장과, 참가자들이 그 상황을 각자의 문체로 재구성한 글입니다.",
    "평가는 반드시 아래 1단계 → 2단계 순서로 진행하세요.",
    "",
    "## 1단계: 필수 통과 기준 (Pass/Fail)",
    "다음 두 기준을 모두 만족하지 못하는 글은, 문장이 아무리 아름답고 시적이어도 1위로 선정하지 마세요.",
    "",
    "1. 정보 및 상황의 등가성: 원문이 묘사하는 물리적 상황·행동·인물의 상태가 그대로 유지되었는가?",
    '   (예: 원문이 "비가 쏟아지는 날 그가 우산을 접었다"인데, "흐린 하늘 아래 그가 내리는 빗방울을 온몸으로 맞았다"처럼',
    "   '우산을 접는 행동'이라는 핵심 상황 자체를 빼버리면 실패입니다.)",
    "2. 서사적 기능의 유지: 그 문장이 소설 속에서 해야 하는 역할(긴장감 조성, 인물의 심리 대변, 배경 설명 등)을 그대로 수행하는가?",
    "   (예: 원문이 극심한 공포를 묘사하는 건조한 문장인데, 다시 쓴 문장이 지나치게 아름답고 낭만적으로 바뀌어",
    "   공포감이 사라졌다면 서사적 기능을 잃은 것으로 실패입니다.)",
    "",
    "## 2단계: 세부 평가 기준 (1단계를 통과한 글에 한해 적용)",
    "1. 이미지의 선명도: 추상적 서술 대신 감각적 묘사로 독자 머릿속에 생생한 그림을 그려내는가?",
    "2. 리듬과 운율: 조사·어미 활용이 매끄럽고, 문장의 호흡(단문/장문의 조화)이 감정선과 일치하는가?",
    "3. 정서적 잔향: 감정을 직접 설명하지 않고도 문장이 끝난 뒤 여운과 정서를 남기는가?",
    "4. 함축성과 참신함: 상투적 클리셰를 피하고, 짧은 문장 안에 깊은 의미와 신선한 은유를 담았는가?",
    "5. 맥락적 부합성: 문체가 화려하더라도 소설 전체의 톤앤매너·인물의 성격과 어울리며 과시적이거나 감정 과잉이 아닌가?",
    "",
    `상황 문장: ${situation}`,
    "",
    "참가자 글 (번호로만 구분, 익명):",
    list,
    "",
    "1단계를 통과한 글 중에서 2단계 기준으로 가장 뛰어난 글 1개를 선정하세요.",
    "(전원이 1단계를 통과하지 못했다면, 원문의 상황과 기능을 가장 덜 훼손한 글을 선정하세요.)",
    '다음 JSON 형식으로만 응답하세요: {"winner_index": <선정된 글의 번호>, "reasoning": "<선정 이유. 1단계를 어떻게 통과했는지와 2단계 기준 중 특히 뛰어났던 점을 포함해 한국어로 4~6문장>"}',
  ].join("\n");
}
