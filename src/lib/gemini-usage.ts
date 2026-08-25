import type { createAdminClient } from "@/lib/supabase/admin";

type TokenUsage = {
  model: string;
  promptTokens: number;
  outputTokens: number;
  totalTokens: number;
};

// 관리자가 입력해둔 모델별 단가로 비용을 추정해 gemini_usage_log에 남긴다.
// 단가가 아직 등록되지 않은 모델이면 비용은 0으로 기록되며, 관리자 대시보드에서
// 토큰 사용량은 그대로 보이니 이후 단가를 입력하면 된다.
export async function logGeminiUsage(
  admin: ReturnType<typeof createAdminClient>,
  dailyRoundId: string | null,
  usage: TokenUsage,
) {
  const { data: pricing } = await admin
    .from("gemini_model_pricing")
    .select("input_price_per_million, output_price_per_million")
    .eq("model", usage.model)
    .maybeSingle();

  const estimatedCostUsd = pricing
    ? (usage.promptTokens / 1_000_000) * pricing.input_price_per_million +
      (usage.outputTokens / 1_000_000) * pricing.output_price_per_million
    : 0;

  await admin.from("gemini_usage_log").insert({
    daily_round_id: dailyRoundId,
    model: usage.model,
    prompt_tokens: usage.promptTokens,
    output_tokens: usage.outputTokens,
    total_tokens: usage.totalTokens,
    estimated_cost_usd: estimatedCostUsd,
  });
}
