import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ExpandableText } from "@/components/expandable-text";
import { todayKst } from "@/lib/date";
import {
  approveProposal,
  rejectProposal,
  addToPool,
  moveQueueItem,
  moveToQueue,
  updateSentenceContent,
  updateGeminiBudget,
  upsertGeminiPricing,
  useSentenceToday,
  writeSentenceToday,
} from "@/app/actions/admin";

const HISTORY_PAGE_SIZE = 3;

const TABS = [
  { key: "sentences", label: "문장 관리" },
  { key: "credit", label: "Gemini 크레딧" },
  { key: "history", label: "과거 이력" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

type CriterionScores = {
  imagery: number;
  rhythm: number;
  resonance: number;
  density: number;
  context: number;
};

const CRITERION_LABELS: Record<keyof CriterionScores, string> = {
  imagery: "선명도",
  rhythm: "운율",
  resonance: "잔향",
  density: "함축성",
  context: "맥락",
};

function totalScore(scores: CriterionScores) {
  return Object.values(scores).reduce((sum, v) => sum + v, 0);
}

function singleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminPage(props: PageProps<"/admin">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("is_admin").eq("id", user.id).single()
    : { data: null };

  if (!user || !profile?.is_admin) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm text-black/50">관리자 전용</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Ivy 대시보드</h1>
        </div>
        <p className="text-black/70">관리자만 접근할 수 있습니다.</p>
      </div>
    );
  }

  const searchParams = await props.searchParams;
  const tabParam = singleParam(searchParams.tab);
  const tab: TabKey = TABS.some((t) => t.key === tabParam) ? (tabParam as TabKey) : "sentences";

  const admin = createAdminClient();
  const today = todayKst();
  const [
    { data: pending },
    { data: queue },
    { data: pool },
    { data: todayRound },
    { data: budgetRow },
    { data: pricing },
    { data: usageLog },
  ] = await Promise.all([
    admin
      .from("situation_sentences")
      .select("id, content, created_at, profiles(nickname)")
      .eq("status", "pending_review")
      .order("created_at", { ascending: true }),
    admin
      .from("situation_sentences")
      .select("id, content, profiles(nickname)")
      .eq("status", "queued")
      .order("queue_position", { ascending: true }),
    admin
      .from("situation_sentences")
      .select("id, content, created_at")
      .eq("status", "pool")
      .order("created_at", { ascending: true }),
    admin
      .from("daily_rounds")
      .select("id, status, situation_sentences(content)")
      .eq("round_date", today)
      .maybeSingle(),
    admin.from("gemini_credit_budget").select("amount_usd").eq("id", 1).single(),
    admin
      .from("gemini_model_pricing")
      .select("model, input_price_per_million, output_price_per_million")
      .order("model", { ascending: true }),
    admin
      .from("gemini_usage_log")
      .select("id, created_at, model, total_tokens, estimated_cost_usd")
      .order("created_at", { ascending: false }),
  ]);

  const needsTodaySentence = !todayRound || todayRound.status === "holiday";
  const currentModel = process.env.GEMINI_MODEL ?? "gemini-3.6-flash";
  const budgetUsd = Number(budgetRow?.amount_usd ?? 0);
  const spentUsd = (usageLog ?? []).reduce(
    (sum, u) => sum + Number(u.estimated_cost_usd),
    0,
  );
  const totalTokens = (usageLog ?? []).reduce((sum, u) => sum + u.total_tokens, 0);
  const remainingUsd = budgetUsd - spentUsd;
  const hasPricingForCurrentModel = (pricing ?? []).some((p) => p.model === currentModel);

  const requestedHistoryPage = Math.max(
    1,
    parseInt(singleParam(searchParams.historyPage) ?? "1", 10) || 1,
  );

  const { count: closedRoundsCount } = await admin
    .from("daily_rounds")
    .select("id", { count: "exact", head: true })
    .eq("status", "closed");

  const historyTotalPages = Math.max(
    1,
    Math.ceil((closedRoundsCount ?? 0) / HISTORY_PAGE_SIZE),
  );
  const historyPage = Math.min(requestedHistoryPage, historyTotalPages);
  const historyFrom = (historyPage - 1) * HISTORY_PAGE_SIZE;
  const historyTo = historyFrom + HISTORY_PAGE_SIZE - 1;

  const { data: historyRoundsRaw } =
    tab === "history"
      ? await admin
          .from("daily_rounds")
          .select(
            "id, round_date, situation_sentences(content), evaluations(reasoning, submissions(content, eval_scores, profiles(nickname)))",
          )
          .eq("status", "closed")
          .order("round_date", { ascending: false })
          .range(historyFrom, historyTo)
      : { data: [] };

  const history = await Promise.all(
    (historyRoundsRaw ?? []).map(async (r) => {
      const { count } = await admin
        .from("submissions")
        .select("id", { count: "exact", head: true })
        .eq("daily_round_id", r.id);

      const situationInfo = Array.isArray(r.situation_sentences)
        ? r.situation_sentences[0]
        : r.situation_sentences;
      const evaluation = Array.isArray(r.evaluations) ? r.evaluations[0] : r.evaluations;
      const winnerSubmission = evaluation
        ? Array.isArray(evaluation.submissions)
          ? evaluation.submissions[0]
          : evaluation.submissions
        : null;
      const winnerProfile = winnerSubmission
        ? Array.isArray(winnerSubmission.profiles)
          ? winnerSubmission.profiles[0]
          : winnerSubmission.profiles
        : null;

      return {
        id: r.id,
        roundDate: r.round_date,
        situationContent: situationInfo?.content ?? "",
        submissionCount: count ?? 0,
        reasoning: evaluation?.reasoning ?? null,
        winnerNickname: winnerProfile?.nickname ?? null,
        winnerContent: winnerSubmission?.content ?? null,
        winnerScores: (winnerSubmission?.eval_scores as CriterionScores | null) ?? null,
      };
    }),
  );

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-black/50">관리자 전용</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Ivy 대시보드</h1>
      </div>

      <nav className="flex gap-1 border-b border-black/10">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === "sentences" ? "/admin" : `/admin?tab=${t.key}`}
            className={`-mb-px rounded-t-md border-b-2 px-4 py-2 text-sm font-semibold ${
              tab === t.key
                ? "border-black text-black"
                : "border-transparent text-black/50 hover:text-black"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "sentences" && (
        <div className="space-y-10">
          {needsTodaySentence && (
            <div className="space-y-3 rounded-lg border border-amber-600/40 bg-amber-600/5 p-4">
              <p className="text-sm font-semibold text-amber-800">
                {todayRound
                  ? "오늘은 휴일로 지정돼 있어요 — 대기열/풀이 비어서 자동으로 쉬는 날이 됐어요."
                  : "오늘의 라운드가 아직 없어요."}{" "}
                아래에서 문장을 골라 바로 오늘의 문장으로 올릴 수 있어요.
              </p>

              {queue && queue.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-black/50">대기열에서 선택</p>
                  <ul className="space-y-1">
                    {queue.map((q) => (
                      <li
                        key={q.id}
                        className="flex items-center justify-between gap-2 rounded-md border border-black/10 bg-white p-2 text-xs"
                      >
                        <span className="min-w-0 flex-1 truncate">{q.content}</span>
                        <form action={useSentenceToday} className="shrink-0">
                          <input type="hidden" name="id" value={q.id} />
                          <button
                            type="submit"
                            className="rounded-full bg-black px-3 py-1 text-xs text-white"
                          >
                            오늘 문장으로
                          </button>
                        </form>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {pool && pool.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-black/50">풀에서 선택</p>
                  <ul className="space-y-1">
                    {pool.slice(0, 5).map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center justify-between gap-2 rounded-md border border-black/10 bg-white p-2 text-xs"
                      >
                        <span className="min-w-0 flex-1 truncate">{p.content}</span>
                        <form action={useSentenceToday} className="shrink-0">
                          <input type="hidden" name="id" value={p.id} />
                          <button
                            type="submit"
                            className="rounded-full bg-black px-3 py-1 text-xs text-white"
                          >
                            오늘 문장으로
                          </button>
                        </form>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-1">
                <p className="text-xs font-semibold text-black/50">
                  새로 문장을 써서 바로 사용
                </p>
                <form action={writeSentenceToday} className="flex gap-2">
                  <input
                    type="text"
                    name="content"
                    placeholder="오늘의 상황 문장을 입력하세요"
                    className="flex-1 rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/30"
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-black px-4 py-2 text-sm text-white"
                  >
                    오늘 문장으로 사용
                  </button>
                </form>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-semibold">제안 승인 대기 ({pending?.length ?? 0})</p>
              <p className="text-sm text-black/50">남은 풀 문장: {pool?.length ?? 0}개</p>
            </div>

            {pending && pending.length > 0 ? (
              <ul className="space-y-3">
                {pending.map((p) => {
                  const profileInfo = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
                  return (
                    <li key={p.id} className="rounded-lg border border-black/10 p-4">
                      <p className="text-xs text-black/50">{profileInfo?.nickname ?? "익명"}</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                        {p.content}
                      </p>
                      <div className="mt-3 flex gap-2">
                        <form action={approveProposal}>
                          <input type="hidden" name="id" value={p.id} />
                          <button
                            type="submit"
                            className="rounded-full bg-black px-3 py-1 text-xs text-white"
                          >
                            승인
                          </button>
                        </form>
                        <form action={rejectProposal}>
                          <input type="hidden" name="id" value={p.id} />
                          <button
                            type="submit"
                            className="rounded-full border border-black/10 px-3 py-1 text-xs"
                          >
                            반려
                          </button>
                        </form>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-black/50">승인 대기 중인 제안이 없습니다.</p>
            )}
          </div>

          <div className="space-y-4">
            <p className="text-sm font-semibold">다음 순서 (대기열, {queue?.length ?? 0}개)</p>
            {queue && queue.length > 0 ? (
              <ol className="space-y-2">
                {queue.map((q, i) => {
                  const profileInfo = Array.isArray(q.profiles) ? q.profiles[0] : q.profiles;
                  return (
                    <li key={q.id} className="space-y-2 rounded-lg border border-black/10 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-black/50">
                          {i + 1}순위 · {profileInfo?.nickname ?? "풀"}
                        </p>
                        <div className="flex shrink-0 gap-1">
                          <form action={moveQueueItem}>
                            <input type="hidden" name="id" value={q.id} />
                            <input type="hidden" name="direction" value="up" />
                            <button
                              type="submit"
                              disabled={i === 0}
                              className="rounded-full border border-black/10 px-2 py-1 text-xs disabled:opacity-30"
                            >
                              위로
                            </button>
                          </form>
                          <form action={moveQueueItem}>
                            <input type="hidden" name="id" value={q.id} />
                            <input type="hidden" name="direction" value="down" />
                            <button
                              type="submit"
                              disabled={i === queue.length - 1}
                              className="rounded-full border border-black/10 px-2 py-1 text-xs disabled:opacity-30"
                            >
                              아래로
                            </button>
                          </form>
                        </div>
                      </div>
                      <form action={updateSentenceContent} className="flex gap-2">
                        <input type="hidden" name="id" value={q.id} />
                        <input
                          type="text"
                          name="content"
                          defaultValue={q.content}
                          className="flex-1 rounded-md border border-black/10 bg-transparent px-2 py-1 text-sm outline-none focus:border-black/30"
                        />
                        <button
                          type="submit"
                          className="shrink-0 rounded-full border border-black/10 px-3 py-1 text-xs"
                        >
                          저장
                        </button>
                      </form>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="text-sm text-black/50">대기열이 비어 있습니다.</p>
            )}
          </div>

          <div className="space-y-4">
            <p className="text-sm font-semibold">
              사전 제작 풀 ({pool?.length ?? 0}개) — 대기열이 비면 이 순서대로 사용돼요
            </p>
            {pool && pool.length > 0 ? (
              <ol className="space-y-2">
                {pool.map((p, i) => (
                  <li key={p.id} className="space-y-2 rounded-lg border border-black/10 p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-black/40">{i + 1}.</span>
                      <form action={moveToQueue} className="shrink-0">
                        <input type="hidden" name="id" value={p.id} />
                        <button
                          type="submit"
                          className="rounded-full border border-black/10 px-2 py-1 text-xs"
                        >
                          대기열로 이동
                        </button>
                      </form>
                    </div>
                    <form action={updateSentenceContent} className="flex gap-2">
                      <input type="hidden" name="id" value={p.id} />
                      <input
                        type="text"
                        name="content"
                        defaultValue={p.content}
                        className="flex-1 rounded-md border border-black/10 bg-transparent px-2 py-1 text-sm outline-none focus:border-black/30"
                      />
                      <button
                        type="submit"
                        className="shrink-0 rounded-full border border-black/10 px-3 py-1 text-xs"
                      >
                        저장
                      </button>
                    </form>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-black/50">풀에 등록된 문장이 없습니다.</p>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold">문장 풀에 추가</p>
            <form action={addToPool} className="flex gap-2">
              <input
                type="text"
                name="content"
                placeholder="상황 문장을 입력하세요"
                className="flex-1 rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30"
              />
              <button
                type="submit"
                className="rounded-full bg-black px-4 py-2 text-sm text-white"
              >
                추가
              </button>
            </form>
          </div>
        </div>
      )}

      {tab === "credit" && (
        <div className="space-y-4">
          <div className="space-y-2 rounded-lg border border-black/10 p-4">
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-semibold">${remainingUsd.toFixed(2)}</p>
              <p className="text-xs text-black/50">/ ${budgetUsd.toFixed(2)} 중 남음</p>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-black/10">
              <div
                className="h-full bg-black"
                style={{
                  width: `${budgetUsd > 0 ? Math.min(100, (spentUsd / budgetUsd) * 100) : 0}%`,
                }}
              />
            </div>
            <p className="text-xs text-black/50">
              누적 사용 ${spentUsd.toFixed(4)} · 호출 {usageLog?.length ?? 0}회 · 토큰{" "}
              {totalTokens.toLocaleString()}개
            </p>
            {!hasPricingForCurrentModel && (
              <p className="text-xs text-amber-700">
                현재 모델({currentModel})의 단가가 등록되지 않아 최근 사용분은 비용이 0으로
                집계돼요. 아래에서 단가를 입력해주세요.
              </p>
            )}
            <p className="text-xs text-black/40">
              구글이 API 키 단위 실시간 크레딧 조회를 제공하지 않아, 응답 토큰 수 × 아래 단가로
              추정한 값이에요. 실제 청구액과 오차가 있을 수 있습니다.
            </p>
            <form action={updateGeminiBudget} className="flex items-center gap-2 pt-2">
              <span className="text-xs text-black/50">구매한 크레딧 총액(USD)</span>
              <input
                type="number"
                step="0.01"
                min="0"
                name="amount_usd"
                defaultValue={budgetUsd}
                className="w-28 rounded-md border border-black/10 bg-transparent px-2 py-1 text-sm outline-none focus:border-black/30"
              />
              <button
                type="submit"
                className="rounded-full border border-black/10 px-3 py-1 text-xs"
              >
                저장
              </button>
            </form>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-black/50">모델별 단가 (백만 토큰당 USD)</p>
            {pricing && pricing.length > 0 && (
              <ul className="space-y-2">
                {pricing.map((p) => (
                  <li key={p.model} className="rounded-lg border border-black/10 p-3">
                    <form
                      action={upsertGeminiPricing}
                      className="flex flex-wrap items-center gap-2 text-sm"
                    >
                      <input type="hidden" name="model" value={p.model} />
                      <span className="min-w-0 flex-1 truncate font-mono text-xs">{p.model}</span>
                      <span className="text-xs text-black/50">입력</span>
                      <input
                        type="number"
                        step="0.0001"
                        min="0"
                        name="input_price_per_million"
                        defaultValue={p.input_price_per_million}
                        className="w-24 rounded-md border border-black/10 bg-transparent px-2 py-1 text-xs outline-none focus:border-black/30"
                      />
                      <span className="text-xs text-black/50">출력</span>
                      <input
                        type="number"
                        step="0.0001"
                        min="0"
                        name="output_price_per_million"
                        defaultValue={p.output_price_per_million}
                        className="w-24 rounded-md border border-black/10 bg-transparent px-2 py-1 text-xs outline-none focus:border-black/30"
                      />
                      <button
                        type="submit"
                        className="rounded-full border border-black/10 px-3 py-1 text-xs"
                      >
                        저장
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
            <form
              action={upsertGeminiPricing}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-black/20 p-3 text-sm"
            >
              <input
                type="text"
                name="model"
                placeholder={`모델명 (예: ${currentModel})`}
                className="min-w-0 flex-1 rounded-md border border-black/10 bg-transparent px-2 py-1 text-xs outline-none focus:border-black/30"
              />
              <span className="text-xs text-black/50">입력</span>
              <input
                type="number"
                step="0.0001"
                min="0"
                name="input_price_per_million"
                placeholder="0.00"
                className="w-24 rounded-md border border-black/10 bg-transparent px-2 py-1 text-xs outline-none focus:border-black/30"
              />
              <span className="text-xs text-black/50">출력</span>
              <input
                type="number"
                step="0.0001"
                min="0"
                name="output_price_per_million"
                placeholder="0.00"
                className="w-24 rounded-md border border-black/10 bg-transparent px-2 py-1 text-xs outline-none focus:border-black/30"
              />
              <button type="submit" className="rounded-full bg-black px-3 py-1 text-xs text-white">
                추가
              </button>
            </form>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-black/50">최근 호출 내역</p>
            {usageLog && usageLog.length > 0 ? (
              <ul className="space-y-1 text-xs">
                {usageLog.slice(0, 10).map((u) => (
                  <li
                    key={u.id}
                    className="flex items-center justify-between gap-2 border-b border-black/5 py-1"
                  >
                    <span className="text-black/50">
                      {new Date(u.created_at).toLocaleDateString("ko-KR")}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-mono">{u.model}</span>
                    <span className="shrink-0">{u.total_tokens.toLocaleString()} 토큰</span>
                    <span className="shrink-0">${Number(u.estimated_cost_usd).toFixed(4)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-black/50">아직 기록된 호출이 없습니다.</p>
            )}
          </div>
        </div>
      )}

      {tab === "history" && (
        <div className="space-y-4">
          <p className="text-sm font-semibold">과거 문장 이력 ({closedRoundsCount ?? 0}일)</p>
          {history.length > 0 ? (
            <ul className="space-y-3">
              {history.map((h) => (
                <li key={h.id} className="space-y-2 rounded-lg border border-black/10 p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-xs text-black/50">{h.roundDate}</p>
                    <p className="text-xs text-black/50">참가 {h.submissionCount}명</p>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {h.situationContent}
                  </p>
                  {h.winnerNickname ? (
                    <div className="rounded-md border border-black/10 bg-black/[0.02] p-3 text-xs">
                      <p className="font-semibold">1위 · {h.winnerNickname}</p>
                      {h.winnerContent && (
                        <ExpandableText
                          text={h.winnerContent}
                          clampLines={4}
                          className="mt-1 text-black/70"
                        >
                          {h.winnerScores && (
                            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-black/60">
                              {(
                                Object.keys(CRITERION_LABELS) as (keyof CriterionScores)[]
                              ).map((key) => (
                                <span key={key}>
                                  {CRITERION_LABELS[key]} {h.winnerScores![key]}
                                </span>
                              ))}
                              <span className="font-semibold text-black">
                                총점 {totalScore(h.winnerScores)}/50
                              </span>
                            </div>
                          )}
                          {h.reasoning && <p className="mt-2 text-black/50">{h.reasoning}</p>}
                        </ExpandableText>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-black/40">
                      평가 결과가 없습니다 (참가자 없음 또는 평가 실패).
                    </p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-black/50">아직 마감된 라운드가 없습니다.</p>
          )}

          {historyTotalPages > 1 && (
            <nav className="flex items-center justify-center gap-6 text-sm">
              {historyPage > 1 ? (
                <Link href={`/admin?tab=history&historyPage=${historyPage - 1}`} className="underline">
                  ◂ 이전
                </Link>
              ) : (
                <span className="text-black/30">◂ 이전</span>
              )}
              <span className="text-xs text-black/50">
                {historyPage} / {historyTotalPages}
              </span>
              {historyPage < historyTotalPages ? (
                <Link href={`/admin?tab=history&historyPage=${historyPage + 1}`} className="underline">
                  다음 ▸
                </Link>
              ) : (
                <span className="text-black/30">다음 ▸</span>
              )}
            </nav>
          )}
        </div>
      )}
    </div>
  );
}
