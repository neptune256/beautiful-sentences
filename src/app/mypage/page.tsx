import { createClient } from "@/lib/supabase/server";
import { NicknameForm } from "@/components/nickname-form";
import { AttendanceCalendar } from "@/components/attendance-calendar";
import { todayKst } from "@/lib/date";
import { computeStreakInfo, getMonthAttendanceDays } from "@/lib/attendance";

export default async function MyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <span className="font-sans text-xs font-bold tracking-[0.3em] text-[color-mix(in_srgb,var(--ink)_55%,transparent)]">
            마이페이지
          </span>
          <h1 className="font-serif text-xl tracking-wide text-[var(--ink)] sm:text-2xl">
            로그인이 필요합니다
          </h1>
        </header>
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname, points, diamonds")
    .eq("id", user.id)
    .single();

  const today = todayKst();
  const [year, month] = today.split("-").map(Number);

  const [streakInfo, attendanceDays] = await Promise.all([
    computeStreakInfo(supabase, user.id, today),
    getMonthAttendanceDays(supabase, user.id, year, month),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <span className="font-sans text-xs font-bold tracking-[0.3em] text-[color-mix(in_srgb,var(--ink)_55%,transparent)]">
          마이페이지
        </span>
        <h1 className="font-serif text-xl tracking-wide text-[var(--ink)] sm:text-2xl">
          {profile?.nickname}
        </h1>
      </header>

      <section className="-mt-2 flex items-center gap-6 rounded-sm border border-[var(--paper-grid)] bg-[color-mix(in_srgb,var(--paper-cream)_90%,#fff)] px-5 py-3">
        <div className="flex flex-col">
          <span className="font-sans text-xs font-bold tracking-[0.2em] text-[color-mix(in_srgb,var(--ink)_55%,transparent)]">
            누적 포인트
          </span>
          <span className="font-serif text-3xl font-bold text-[var(--stamp-red)]">
            {(profile?.points ?? 0).toLocaleString()}
            <span className="ml-1 text-base text-[var(--ink)]">점</span>
          </span>
        </div>
        <div className="flex flex-col border-l border-[var(--paper-grid)] pl-6">
          <span className="font-sans text-xs font-bold tracking-[0.2em] text-[color-mix(in_srgb,var(--ink)_55%,transparent)]">
            다이아
          </span>
          <span className="font-serif text-3xl font-bold text-[#3B82C4]">
            💎 {(profile?.diamonds ?? 0).toLocaleString()}
          </span>
        </div>
      </section>

      <section className="-mt-2 flex flex-col gap-3 rounded-sm border border-[var(--paper-grid)] bg-[color-mix(in_srgb,var(--paper-cream)_90%,#fff)] px-5 py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-sans text-xs font-bold tracking-[0.2em] text-[color-mix(in_srgb,var(--ink)_55%,transparent)]">
            출석 현황
          </span>
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-serif text-sm text-[var(--ink)]">
              🔥 <span className="text-lg font-bold text-[var(--stamp-red)]">{streakInfo.currentStreak}</span>일 연속
            </span>
            <span className="font-serif text-sm text-[var(--ink)]">
              최장 <span className="font-bold">{streakInfo.longestStreak}</span>일
            </span>
            <span className="font-serif text-sm text-[var(--ink)]">
              총 <span className="font-bold">{streakInfo.totalDays}</span>일 출석
            </span>
          </div>
        </div>

        <AttendanceCalendar
          initialYear={year}
          initialMonth={month}
          initialDays={attendanceDays}
          todayStr={today}
          currentStreak={streakInfo.currentStreak}
        />
      </section>

      <section className="-mt-2 flex flex-col gap-0.5">
        <span className="font-sans text-xs font-bold tracking-[0.3em] text-[color-mix(in_srgb,var(--ink)_55%,transparent)]">
          닉네임 변경
        </span>
        <NicknameForm defaultNickname={profile?.nickname ?? ""} />
      </section>
    </div>
  );
}
