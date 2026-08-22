import { createClient } from "@/lib/supabase/server";
import { BoardCanvas } from "@/components/board-canvas";
import type { BoardPost } from "@/app/actions/board";

export default async function BoardPage() {
  const supabase = await createClient();

  const [{ data: user }, { data: posts }] = await Promise.all([
    supabase.auth.getUser().then((r) => ({ data: r.data.user })),
    supabase
      .from("board_posts")
      .select(
        "id, content, author_name, user_id, anon_token, x, y, rotation, color, likes_count, comments_count, expires_at, created_at",
      )
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: true }),
  ]);

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
    <BoardCanvas
      initialPosts={(posts ?? []) as BoardPost[]}
      currentUser={currentUser}
    />
  );
}
