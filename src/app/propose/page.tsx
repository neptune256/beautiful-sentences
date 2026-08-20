import { createClient } from "@/lib/supabase/server";
import { ShareButton } from "@/components/share-button";
import { ProposalForm } from "@/components/proposal-form";

export default async function ProposePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm text-black/50 dark:text-white/50">상황 문장 제안하기</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            로그인이 필요합니다
          </h1>
        </div>
        <p className="text-black/70 dark:text-white/70">
          로그인 후 사이트를 공유하면 제안권을 받을 수 있어요.
        </p>
      </div>
    );
  }

  const { data: ticket } = await supabase
    .from("proposal_tickets")
    .select("id")
    .eq("user_id", user.id)
    .is("used_at", null)
    .order("granted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-black/50 dark:text-white/50">상황 문장 제안하기</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          사이트를 공유하고 제안권을 받아보세요
        </h1>
      </div>

      {ticket ? (
        <ProposalForm ticketId={ticket.id} />
      ) : (
        <div className="space-y-3">
          <p className="text-black/70 dark:text-white/70">
            공유 버튼을 누르면 상황 문장 제안권 1회가 지급됩니다.
          </p>
          <ShareButton />
        </div>
      )}
    </div>
  );
}
