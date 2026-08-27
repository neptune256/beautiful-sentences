"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import {
  COMMISSION_RULES,
  COMMISSION_EXPIRE_DAYS,
  type CommissionType,
} from "@/lib/commission-constants";

const TITLE_MAX = 60;
const BODY_MAX = 4000;
const RESPONSE_MAX = 4000;

export type Commission = {
  id: string;
  requester_id: string;
  type: CommissionType;
  title: string;
  body: string;
  diamond_cost: number;
  reward_diamonds: number;
  status: "open" | "resolved" | "expired";
  response_count: number;
  winner_response_id: string | null;
  expires_at: string;
  resolved_at: string | null;
  created_at: string;
};

export type CommissionResponse = {
  id: string;
  commission_id: string;
  author_id: string;
  content: string;
  created_at: string;
};

async function requireProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname")
    .eq("id", user.id)
    .single();

  return { id: user.id, nickname: profile?.nickname ?? "익명" };
}

export async function createCommission(params: {
  type: CommissionType;
  title: string;
  body: string;
}): Promise<Commission> {
  const rule = COMMISSION_RULES[params.type];
  if (!rule) throw new Error("잘못된 의뢰 유형입니다.");

  const title = params.title.trim();
  const body = params.body.trim();
  if (!title) throw new Error("제목을 입력해 주세요.");
  if (Array.from(title).length > TITLE_MAX) {
    throw new Error(`제목은 ${TITLE_MAX}자 이내로 작성해 주세요.`);
  }
  if (!body) throw new Error("내용을 입력해 주세요.");
  if (Array.from(body).length > BODY_MAX) {
    throw new Error(`내용은 ${BODY_MAX}자 이내로 작성해 주세요.`);
  }

  const profile = await requireProfile();
  const admin = createAdminClient();

  const { data: spent, error: spendError } = await admin.rpc("spend_diamonds", {
    p_user_id: profile.id,
    p_amount: rule.cost,
  });
  if (spendError) throw new Error(spendError.message);
  if (!spent) throw new Error("다이아가 부족해요.");

  const { data, error } = await admin
    .from("commissions")
    .insert({
      requester_id: profile.id,
      type: params.type,
      title,
      body,
      diamond_cost: rule.cost,
      reward_diamonds: rule.reward,
      expires_at: new Date(
        Date.now() + COMMISSION_EXPIRE_DAYS * 24 * 3600 * 1000,
      ).toISOString(),
    })
    .select()
    .single();

  if (error) {
    // 삽입이 실패했다면 이미 차감한 다이아를 되돌린다.
    await admin.rpc("increment_diamonds", { p_user_id: profile.id, p_amount: rule.cost });
    throw new Error(error.message);
  }

  revalidatePath("/commission");
  return data as Commission;
}

export async function submitCommissionResponse(params: {
  commissionId: string;
  content: string;
}): Promise<CommissionResponse> {
  const content = params.content.trim();
  if (!content) throw new Error("내용을 입력해 주세요.");
  if (Array.from(content).length > RESPONSE_MAX) {
    throw new Error(`${RESPONSE_MAX}자 이내로 작성해 주세요.`);
  }

  const profile = await requireProfile();
  const admin = createAdminClient();

  const { data: commission, error: fetchError } = await admin
    .from("commissions")
    .select("id, requester_id, status")
    .eq("id", params.commissionId)
    .single();
  if (fetchError || !commission) throw new Error("의뢰를 찾을 수 없어요.");
  if (commission.status !== "open") throw new Error("이미 마감된 의뢰예요.");
  if (commission.requester_id === profile.id) {
    throw new Error("본인이 등록한 의뢰에는 응모할 수 없어요.");
  }

  const { data, error } = await admin
    .from("commission_responses")
    .insert({ commission_id: params.commissionId, author_id: profile.id, content })
    .select()
    .single();
  if (error) throw new Error(error.message);

  revalidatePath(`/commission/${params.commissionId}`);
  return data as CommissionResponse;
}

export async function adoptCommissionResponse(params: {
  commissionId: string;
  responseId: string;
}) {
  const profile = await requireProfile();
  const admin = createAdminClient();

  const { data, error } = await admin.rpc("adopt_commission_response", {
    p_commission_id: params.commissionId,
    p_response_id: params.responseId,
    p_requester_id: profile.id,
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("채택할 수 없어요. 이미 마감됐거나 잘못된 요청이에요.");

  revalidatePath(`/commission/${params.commissionId}`);
  revalidatePath("/commission");
}
