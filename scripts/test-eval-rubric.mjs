// 수동 QA 스크립트: 실제 Gemini 평가 프롬프트(src/lib/gemini.ts)를 새 상황 문장 없이도
// 검증해볼 수 있도록, 미래 날짜(round_date)의 테스트 라운드를 만들고 5개의 가상 제출을 넣어
// 실제 마감(close-round) 로직과 동일한 절차로 평가를 돌린다.
// 오늘 실제 진행 중인 라운드는 건드리지 않으며, --cleanup으로 만든 데이터를 전부 되돌릴 수 있다.
//
// buildPrompt()는 src/lib/gemini.ts의 것과 동일하게 유지해야 한다 (수동 동기화 필요).
//
// 사용법:
//   node scripts/test-eval-rubric.mjs                 # 시드 + 평가 실행
//   node scripts/test-eval-rubric.mjs --cleanup <round_id> <sentence_id> <user_id1,user_id2,...>

import { readFileSync } from "node:fs";
import path from "node:path";

const ENV_PATH = path.join(import.meta.dirname, "..", ".env.local");
const envText = readFileSync(ENV_PATH, "utf8");
const env = {};
for (const line of envText.split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_API_KEY = env.GEMINI_API_KEY;
const GEMINI_MODEL = env.GEMINI_MODEL || "gemini-3.6-flash";

const TEST_TAG = "eval-rubric-test";
const TEST_DATE = "2026-08-21"; // 아직 쓰이지 않은 미래 날짜. '어제의 결과'에서 가장 최근 마감 라운드로 노출된다.
const SITUATION = "작은 별 위에 살던 어린왕자를 정면에서 힘껏 밀쳤다";

function rest(path, opts = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: opts.prefer || "return=representation",
      ...(opts.headers || {}),
    },
  });
}

async function restJson(path, opts) {
  const res = await rest(path, opts);
  const text = await res.text();
  if (!res.ok) throw new Error(`${path} -> ${res.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

async function createTestUser(i) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: `${TEST_TAG}-${i}-${Date.now()}@example.com`,
      password: crypto.randomUUID(),
      email_confirm: true,
      user_metadata: { full_name: `평가테스트${i}`, [TEST_TAG]: true },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`create user ${i} failed: ${JSON.stringify(data)}`);
  return data.id;
}

// src/lib/gemini.ts의 buildPrompt()와 동일 — 수정 시 함께 반영할 것
function buildPrompt(situation, entries) {
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

async function callGemini(prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(`Gemini error ${res.status}: ${JSON.stringify(data)}`);
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  const parsed = JSON.parse(text);
  return { winnerIndex: parsed.winner_index, reasoning: parsed.reasoning, raw: data };
}

// 새 2단계 기준(정보/상황 등가성, 서사적 기능 유지, 이미지의 선명도, 리듬과 운율,
// 정서적 잔향, 함축성과 참신함, 맥락적 부합성)이 실제로 변별력 있게 작동하는지 보려고
// 일부러 품질을 계단식으로 설계한 5개 글.
const ENTRIES_TEXT = [
  // 1: 1단계 탈락 — "밀쳤다"라는 핵심 상황/행동 자체가 사라짐
  "어린왕자는 작은 별 위에 앉아 장미와 도란도란 이야기를 나누고 있었다. 노을이 천천히 별의 능선을 타고 번지고 있었다.",
  // 2: 1단계 통과, 밋밋하고 진부함 — 이미지의 선명도 낮음
  "작은 별에 살던 어린왕자를 누군가 세게 앞으로 밀었다. 그는 깜짝 놀랐다.",
  // 3: 1단계 통과, 평균 수준
  "그가 서 있던 작은 별의 가장자리에서, 누군가의 손이 어린왕자의 가슴팍을 정면으로 힘껏 떠밀었다. 발밑의 별빛이 순간 휘청였다.",
  // 4: 1단계 통과, 고품질 — 선명한 이미지·리듬·정서적 잔향·참신한 은유
  "어린왕자가 딛고 선 별의 표면이 채 흔들리기도 전에, 누군가의 두 손이 그의 가슴을 정면으로 밀어냈다. 별은 자전을 멈춘 듯 고요했고, 오직 그의 몸만 허공으로 기울었다. 놀람도 비명도 없이, 그저 중력을 잃은 자의 침묵만이 별의 궤도를 따라 흩어졌다.",
  // 5: 1단계 통과하지만 톤이 코믹하게 어긋남 — 맥락적 부합성/서사적 기능 테스트
  "작은 별에서 조용히 지내던 어린왕자, 누군가 다가와 앞에서 있는 힘껏 밀었다. 순간 붕 뜬 몸이 우스꽝스럽게 허공에서 허우적댔다.",
];

async function main() {
  console.log("1. 테스트 상황 문장 생성...");
  const [sentence] = await restJson("situation_sentences", {
    method: "POST",
    body: JSON.stringify({
      content: SITUATION,
      status: "used",
      used_on: TEST_DATE,
      approved_at: new Date().toISOString(),
    }),
  });
  console.log("   ->", sentence.id);

  console.log("2. 테스트 라운드 생성 (round_date=" + TEST_DATE + ")...");
  const [round] = await restJson("daily_rounds", {
    method: "POST",
    body: JSON.stringify({
      round_date: TEST_DATE,
      situation_sentence_id: sentence.id,
      status: "open",
    }),
  });
  console.log("   ->", round.id);

  console.log("3. 테스트 유저 5명 생성...");
  const userIds = [];
  for (let i = 1; i <= 5; i++) {
    const id = await createTestUser(i);
    userIds.push(id);
    console.log(`   -> 유저${i}: ${id}`);
  }

  console.log("4. 제출 5건 생성...");
  const submissions = [];
  for (let i = 0; i < 5; i++) {
    const [sub] = await restJson("submissions", {
      method: "POST",
      body: JSON.stringify({
        daily_round_id: round.id,
        user_id: userIds[i],
        content: ENTRIES_TEXT[i],
      }),
    });
    submissions.push(sub);
  }
  console.log("   -> submissions:", submissions.map((s) => s.id).join(", "));

  console.log("5. 참여 포인트(+5) 지급...");
  for (const sub of submissions) {
    await restJson("point_transactions", {
      method: "POST",
      body: JSON.stringify({ user_id: sub.user_id, amount: 5, reason: "daily_submission", reference_id: sub.id }),
    });
    await restJson("rpc/increment_points", {
      method: "POST",
      body: JSON.stringify({ p_user_id: sub.user_id, p_amount: 5 }),
    });
  }

  console.log("6. Gemini 평가 호출...");
  const entries = submissions.map((s, i) => ({ index: i + 1, content: s.content }));
  const prompt = buildPrompt(SITUATION, entries);
  const { winnerIndex, reasoning, raw } = await callGemini(prompt);
  console.log("   -> winner_index:", winnerIndex);
  console.log("   -> reasoning:", reasoning);

  const winnerSub = submissions[winnerIndex - 1];
  if (!winnerSub) throw new Error("winner_index가 범위를 벗어남: " + winnerIndex);

  console.log("7. evaluations 기록...");
  await restJson("evaluations", {
    method: "POST",
    body: JSON.stringify({
      daily_round_id: round.id,
      winner_submission_id: winnerSub.id,
      reasoning,
      raw_response: raw,
    }),
  });

  console.log("8. 1위 포인트(+50) 지급...");
  await restJson("point_transactions", {
    method: "POST",
    body: JSON.stringify({ user_id: winnerSub.user_id, amount: 50, reason: "daily_winner", reference_id: winnerSub.id }),
  });
  await restJson("rpc/increment_points", {
    method: "POST",
    body: JSON.stringify({ p_user_id: winnerSub.user_id, p_amount: 50 }),
  });

  console.log("9. 라운드 마감 처리...");
  await rest(`daily_rounds?id=eq.${round.id}`, {
    method: "PATCH",
    prefer: "return=minimal",
    body: JSON.stringify({ status: "closed", evaluated_at: new Date().toISOString() }),
  });

  console.log("\n=== 완료 ===");
  console.log("winner entry index:", winnerIndex, "-> content:", winnerSub.content);
  console.log("round_id:", round.id, "sentence_id:", sentence.id);
  console.log("user_ids:", userIds.join(","));
  console.log("\n정리하려면: node scripts/test-eval-rubric.mjs --cleanup " + round.id + " " + sentence.id + " " + userIds.join(","));
}

async function cleanup(roundId, sentenceId, userIds) {
  console.log("라운드 삭제(제출/평가 cascade)...");
  await rest(`daily_rounds?id=eq.${roundId}`, { method: "DELETE", prefer: "return=minimal" });
  console.log("상황 문장 삭제...");
  await rest(`situation_sentences?id=eq.${sentenceId}`, { method: "DELETE", prefer: "return=minimal" });
  for (const id of userIds) {
    console.log("테스트 유저 삭제:", id);
    await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${id}`, {
      method: "DELETE",
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    });
  }
  console.log("정리 완료");
}

const args = process.argv.slice(2);
if (args[0] === "--cleanup") {
  await cleanup(args[1], args[2], args[3].split(","));
} else {
  await main();
}
