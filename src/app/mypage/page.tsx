import { createClient } from "@/lib/supabase/server";
import { NicknameForm } from "@/components/nickname-form";

export default async function MyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm text-black/50 dark:text-white/50">마이페이지</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            로그인이 필요합니다
          </h1>
        </div>
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname, points")
    .eq("id", user.id)
    .single();

  return (
    <div className="space-y-10">
      <div>
        <p className="text-sm text-black/50 dark:text-white/50">마이페이지</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {profile?.nickname}
        </h1>
      </div>

      <div>
        <p className="text-sm text-black/50 dark:text-white/50">누적 포인트</p>
        <p className="mt-1 text-xl font-semibold">{profile?.points ?? 0}점</p>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold">닉네임 변경</p>
        <NicknameForm defaultNickname={profile?.nickname ?? ""} />
      </div>
    </div>
  );
}
