import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { approveProposal, rejectProposal, addToPool } from "@/app/actions/admin";

export default async function AdminPage() {
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
          <p className="text-sm text-black/50 dark:text-white/50">관리자 전용</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Ivy 대시보드
          </h1>
        </div>
        <p className="text-black/70 dark:text-white/70">
          관리자만 접근할 수 있습니다.
        </p>
      </div>
    );
  }

  const admin = createAdminClient();
  const [{ data: pending }, { count: poolCount }] = await Promise.all([
    admin
      .from("situation_sentences")
      .select("id, content, created_at, profiles(nickname)")
      .eq("status", "pending_review")
      .order("created_at", { ascending: true }),
    admin
      .from("situation_sentences")
      .select("id", { count: "exact", head: true })
      .eq("status", "pool"),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <p className="text-sm text-black/50 dark:text-white/50">관리자 전용</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Ivy 대시보드
        </h1>
      </div>

      <div className="space-y-4">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-semibold">제안 승인 대기 ({pending?.length ?? 0})</p>
          <p className="text-sm text-black/50 dark:text-white/50">
            남은 풀 문장: {poolCount ?? 0}개
          </p>
        </div>

        {pending && pending.length > 0 ? (
          <ul className="space-y-3">
            {pending.map((p) => {
              const profileInfo = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
              return (
                <li
                  key={p.id}
                  className="rounded-lg border border-black/10 p-4 dark:border-white/10"
                >
                  <p className="text-xs text-black/50 dark:text-white/50">
                    {profileInfo?.nickname ?? "익명"}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                    {p.content}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <form action={approveProposal}>
                      <input type="hidden" name="id" value={p.id} />
                      <button
                        type="submit"
                        className="rounded-full bg-black px-3 py-1 text-xs text-white dark:bg-white dark:text-black"
                      >
                        승인
                      </button>
                    </form>
                    <form action={rejectProposal}>
                      <input type="hidden" name="id" value={p.id} />
                      <button
                        type="submit"
                        className="rounded-full border border-black/10 px-3 py-1 text-xs dark:border-white/10"
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
          <p className="text-sm text-black/50 dark:text-white/50">
            승인 대기 중인 제안이 없습니다.
          </p>
        )}
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold">문장 풀에 추가</p>
        <form action={addToPool} className="flex gap-2">
          <input
            type="text"
            name="content"
            placeholder="상황 문장을 입력하세요"
            className="flex-1 rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/10 dark:focus:border-white/30"
          />
          <button
            type="submit"
            className="rounded-full bg-black px-4 py-2 text-sm text-white dark:bg-white dark:text-black"
          >
            추가
          </button>
        </form>
      </div>
    </div>
  );
}
