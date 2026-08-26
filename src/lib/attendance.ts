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

export type UserStreak = {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
};

/**
 * 전체 유저의 연속 출석일수를 한 번에 계산한다. computeStreakInfo와 같은 로직을
 * 라운드/제출 목록을 한 번만 불러와 모든 유저에 대해 반복하는 방식으로 처리한다.
 * 마감된(closed) 라운드만 대상으로 한다 — 오늘처럼 아직 열려있는 라운드는 베끼기
 * 방지 정책상 본인 글만 보이므로(RLS), 공개 랭킹 계산에 포함하면 다들 "오늘 미제출"로
 * 잘못 집계되어 연속 기록이 끊긴 것처럼 보인다.
 */
export async function computeAllStreaks(
  supabase: SupabaseServerClient,
  todayStr: string,
): Promise<UserStreak[]> {
  const { data: rounds } = await supabase
    .from("daily_rounds")
    .select("id, round_date")
    .eq("status", "closed")
    .lte("round_date", todayStr)
    .order("round_date", { ascending: false })
    .limit(400);

  if (!rounds || rounds.length === 0) return [];

  const roundIds = rounds.map((r) => r.id);
  const { data: subs } = await supabase
    .from("submissions")
    .select("user_id, daily_round_id")
    .in("daily_round_id", roundIds);

  const attendedByUser = new Map<string, Set<string>>();
  for (const s of subs ?? []) {
    let set = attendedByUser.get(s.user_id);
    if (!set) {
      set = new Set();
      attendedByUser.set(s.user_id, set);
    }
    set.add(s.daily_round_id);
  }

  const results: UserStreak[] = [];
  for (const [userId, submittedSet] of attendedByUser) {
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

    results.push({ userId, currentStreak, longestStreak, totalDays: submittedSet.size });
  }

  return results;
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
