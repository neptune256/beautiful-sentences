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

  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
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
    "문장력, 상황 충실도, 창의성을 기준으로 가장 뛰어난 글 1개를 선정하고 이유를 설명하세요.",
    "",
    `상황 문장: ${situation}`,
    "",
    "참가자 글 (번호로만 구분, 익명):",
    list,
    "",
    '다음 JSON 형식으로만 응답하세요: {"winner_index": <선정된 글의 번호>, "reasoning": "<선정 이유, 한국어로 3~5문장>"}',
  ].join("\n");
}
