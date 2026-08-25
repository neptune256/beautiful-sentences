import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export const STREAK_MILESTONES = [3, 7, 14, 30, 50, 100, 200, 365];

export type StreakInfo = {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
};

/**
 * 연속 출석일수 계산: 오늘(KST) 이전까지의 휴일이 아닌 라운드를 최신순으로 훑어서
 * 글을 제출한 라운드가 끊기지 않고 이어진 구간을 센다. 휴일 라운드는 애초에 목록에서
 * 빠지므로 연속 기록을 끊지 않는다.
 */
export async function computeStreakInfo(
  supabase: SupabaseServerClient,
  userId: string,
  todayStr: string,
): Promise<StreakInfo> {
  const { data: rounds } = await supabase
    .from("daily_rounds")
    .select("id, round_date")
    .neq("status", "holiday")
    .lte("round_date", todayStr)
    .order("round_date", { ascending: false })
    .limit(400);

  if (!rounds || rounds.length === 0) {
    return { currentStreak: 0, longestStreak: 0, totalDays: 0 };
  }

  const roundIds = rounds.map((r) => r.id);
  const { data: subs } = await supabase
    .from("submissions")
    .select("daily_round_id")
    .eq("user_id", userId)
    .in("daily_round_id", roundIds);

  const submittedSet = new Set((subs ?? []).map((s) => s.daily_round_id));

  let currentStreak = 0;
  let longestStreak = 0;
  let running = 0;
  let stillCounting = true;

  for (const r of rounds) {
    if (submittedSet.has(r.id)) {
      running++;
      if (stillCounting) currentStreak = running;
      longestStreak = Math.max(longestStreak, running);
    } else {
      running = 0;
      stillCounting = false;
    }
  }

  return { currentStreak, longestStreak, totalDays: submittedSet.size };
}

export type AttendanceDay = {
  date: string;
  attended: boolean;
  isHoliday: boolean;
};

export async function getMonthAttendanceDays(
  supabase: SupabaseServerClient,
  userId: string,
  year: number,
  month: number,
): Promise<AttendanceDay[]> {
  const mm = String(month).padStart(2, "0");
  const start = `${year}-${mm}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${mm}-${String(lastDay).padStart(2, "0")}`;

  const { data: rounds } = await supabase
    .from("daily_rounds")
    .select("id, round_date, status")
    .gte("round_date", start)
    .lte("round_date", end)
    .order("round_date", { ascending: true });

  if (!rounds || rounds.length === 0) return [];

  const { data: subs } = await supabase
    .from("submissions")
    .select("daily_round_id")
    .eq("user_id", userId)
    .in("daily_round_id", rounds.map((r) => r.id));

  const submittedSet = new Set((subs ?? []).map((s) => s.daily_round_id));

  return rounds.map((r) => ({
    date: r.round_date,
    attended: submittedSet.has(r.id),
    isHoliday: r.status === "holiday",
  }));
}
