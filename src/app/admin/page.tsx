import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  approveProposal,
  rejectProposal,
  addToPool,
  moveQueueItem,
} from "@/app/actions/admin";

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
  const [{ data: pending }, { data: queue }, { data: pool }] = await Promise.all([
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
            남은 풀 문장: {pool?.length ?? 0}개
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

      <div className="space-y-4">
        <p className="text-sm font-semibold">다음 순서 (대기열, {queue?.length ?? 0}개)</p>
        {queue && queue.length > 0 ? (
          <ol className="space-y-2">
            {queue.map((q, i) => {
              const profileInfo = Array.isArray(q.profiles) ? q.profiles[0] : q.profiles;
              return (
                <li
                  key={q.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-black/10 p-3 dark:border-white/10"
                >
                  <div className="min-w-0">
                    <p className="text-xs text-black/50 dark:text-white/50">
                      {i + 1}순위 · {profileInfo?.nickname ?? "풀"}
                    </p>
                    <p className="mt-1 truncate text-sm">{q.content}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <form action={moveQueueItem}>
                      <input type="hidden" name="id" value={q.id} />
                      <input type="hidden" name="direction" value="up" />
                      <button
                        type="submit"
                        disabled={i === 0}
                        className="rounded-full border border-black/10 px-2 py-1 text-xs disabled:opacity-30 dark:border-white/10"
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
                        className="rounded-full border border-black/10 px-2 py-1 text-xs disabled:opacity-30 dark:border-white/10"
                      >
                        아래로
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="text-sm text-black/50 dark:text-white/50">
            대기열이 비어 있습니다.
          </p>
        )}
      </div>

      <div className="space-y-4">
        <p className="text-sm font-semibold">
          사전 제작 풀 ({pool?.length ?? 0}개) — 대기열이 비면 이 순서대로 사용돼요
        </p>
        {pool && pool.length > 0 ? (
          <ol className="space-y-2">
            {pool.map((p, i) => (
              <li
                key={p.id}
                className="rounded-lg border border-black/10 p-3 text-sm dark:border-white/10"
              >
                <span className="mr-2 text-xs text-black/40 dark:text-white/40">
                  {i + 1}.
                </span>
                {p.content}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-black/50 dark:text-white/50">
            풀에 등록된 문장이 없습니다.
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
