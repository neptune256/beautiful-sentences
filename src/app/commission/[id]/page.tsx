import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CommissionDetail } from "@/components/commission-detail";
import type { Commission, CommissionResponse } from "@/app/actions/commissions";

type CommissionRow = Commission & { profiles: { nickname: string } | null };
type ResponseRow = CommissionResponse & { profiles: { nickname: string } | null };

export default async function CommissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: user }, { data: commission }, { data: responses }] = await Promise.all([
    supabase.auth.getUser().then((r) => ({ data: r.data.user })),
    supabase
      .from("commissions")
      .select(
        "id, requester_id, type, title, body, diamond_cost, reward_diamonds, status, response_count, winner_response_id, expires_at, resolved_at, created_at, profiles(nickname)",
      )
      .eq("id", id)
      .single(),
    supabase
      .from("commission_responses")
      .select("id, commission_id, author_id, content, created_at, profiles(nickname)")
      .eq("commission_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (!commission) notFound();

  const commissionRow = commission as unknown as CommissionRow;
  const responseRows = (responses ?? []) as unknown as ResponseRow[];

  let currentUser: { id: string; nickname: string } | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("nickname")
      .eq("id", user.id)
      .single();
    currentUser = { id: user.id, nickname: profile?.nickname ?? "익명" };
  }

  return (
    <CommissionDetail
      commission={{
        ...commissionRow,
        requester_nickname: commissionRow.profiles?.nickname ?? "익명",
      }}
      responses={responseRows.map((r) => ({
        ...r,
        author_nickname: r.profiles?.nickname ?? "익명",
      }))}
      currentUser={currentUser}
    />
  );
}
