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
      <div className="flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <span className="font-sans text-xs font-bold tracking-[0.3em] text-[color-mix(in_srgb,var(--ink)_55%,transparent)]">
            문장 제안하기
          </span>
          <h1 className="font-serif text-xl tracking-wide text-[var(--ink)] sm:text-2xl">
            로그인이 필요합니다
          </h1>
        </header>
        <p className="font-serif text-base leading-relaxed text-[color-mix(in_srgb,var(--ink)_70%,transparent)]">
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
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <span className="font-sans text-xs font-bold tracking-[0.3em] text-[color-mix(in_srgb,var(--ink)_55%,transparent)]">
          문장 제안하기
        </span>
        <h1 className="font-serif text-xl tracking-wide text-[var(--ink)] sm:text-2xl">
          내일의 &ldquo;오늘의 문장&rdquo;을 제안해보세요.
        </h1>
        <p className="font-serif text-base leading-relaxed text-[color-mix(in_srgb,var(--ink)_70%,transparent)]">
          채택되면 포인트가 적립되고, 당신의 문장이 모두의 원고지에 오릅니다.
        </p>
      </header>

      {ticket ? (
        <ProposalForm ticketId={ticket.id} />
      ) : (
        <section className="flex flex-col gap-3">
          <p className="font-serif text-base leading-relaxed text-[color-mix(in_srgb,var(--ink)_70%,transparent)]">
            공유 버튼을 누르면 상황 문장 제안권 1회가 지급됩니다.
          </p>
          <ShareButton />
        </section>
      )}
    </div>
  );
}
