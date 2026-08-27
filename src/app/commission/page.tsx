import { createClient } from "@/lib/supabase/server";
import { CommissionBoard } from "@/components/commission-board";
import type { Commission } from "@/app/actions/commissions";

type CommissionRow = Commission & { profiles: { nickname: string } | null };

export default async function CommissionPage() {
  const supabase = await createClient();

  const [{ data: user }, { data: commissions }] = await Promise.all([
    supabase.auth.getUser().then((r) => ({ data: r.data.user })),
    supabase
      .from("commissions")
      .select(
        "id, requester_id, type, title, body, diamond_cost, reward_diamonds, status, response_count, winner_response_id, expires_at, resolved_at, created_at, profiles(nickname)",
      )
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  let currentUser: { id: string; nickname: string; diamonds: number } | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("nickname, diamonds")
      .eq("id", user.id)
      .single();
    currentUser = {
      id: user.id,
      nickname: profile?.nickname ?? "익명",
      diamonds: profile?.diamonds ?? 0,
    };
  }

  const rows = (commissions ?? []) as unknown as CommissionRow[];
  const list = rows.map((row) => ({
    ...row,
    requester_nickname: row.profiles?.nickname ?? "익명",
  }));

  return <CommissionBoard initialCommissions={list} currentUser={currentUser} />;
}
