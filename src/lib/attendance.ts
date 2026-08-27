import type { createClient } from "@/lib/supabase/server";
import type { createAdminClient } from "@/lib/supabase/admin";
import { QUEST_FEATURE_LAUNCH_DATE } from "@/lib/quests";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export const STREAK_MILESTONES = [3, 7, 14, 30, 50, 100, 200, 365];

// 마일스톤 도달 시 지급하는 "다이아"(듀오링고 다이아에 대응하는 재화, 기존 점수와 별개) 개수.
export const STREAK_MILESTONE_REWARDS: Record<number, number> = {
  3: 10,
  7: 20,
  14: 35,
  30: 60,
  50: 100,
  100: 200,
  200: 400,
  365: 700,
};

/**
 * 오늘 출석이 확정되는 시점(문장 제출 또는 네 단어 퀘스트 완료, 둘 중 나중 것)마다 호출한다.
 * 방금 갱신된 연속 출석일수가 보상 마일스톤이면 다이아를 지급한다. diamond_transactions의
 * (user_id, reference_date, reason) 유니크 제약 덕분에 같은 날 여러 번 불려도 한 번만 지급된다.
 */
export async function awardStreakMilestoneIfNeeded(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  currentStreak: number,
  todayStr: string,
): Promise<number> {
  const reward = STREAK_MILESTONE_REWARDS[currentStreak];
  if (!reward) return 0;

  const { error } = await admin.from("diamond_transactions").insert({
    user_id: userId,
    amount: reward,
    reason: "streak_milestone",
    reference_date: todayStr,
  });

  if (error) {
    // 유니크 제약 위반 = 오늘 이미 지급됨. 그 외 에러는 조용히 무시(다이아는 부가 보상이라
    // 여기서 실패해도 출석/제출 자체는 이미 끝난 상태라 사용자에게 에러를 노출하지 않는다).
    return 0;
  }

  await admin.rpc("increment_diamonds", { p_user_id: userId, p_amount: reward });
  return reward;
}

/**
 * 그 라운드 날짜에 출석 인정을 위해 네 단어 글쓰기 퀘스트까지 요구하는지 여부.
 * 기능 출시 이전 날짜는 문장 제출만으로 이미 출석 처리된 기록이라 소급 적용하지 않는다.
 */
function requiresWordplayQuest(roundDate: string) {
  return roundDate >= QUEST_FEATURE_LAUNCH_DATE;
}

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
  const [{ data: subs }, { data: questLogs }] = await Promise.all([
    supabase
      .from("submissions")
      .select("daily_round_id")
      .eq("user_id", userId)
      .in("daily_round_id", roundIds),
    supabase
      .from("wordplay_quest_log")
      .select("quest_date")
      .eq("user_id", userId)
      .lte("quest_date", todayStr),
  ]);

  const submittedSet = new Set((subs ?? []).map((s) => s.daily_round_id));
  const wordplayDoneSet = new Set((questLogs ?? []).map((q) => q.quest_date));

  let currentStreak = 0;
  let longestStreak = 0;
  let totalDays = 0;
  let running = 0;
  let stillCounting = true;

  for (const r of rounds) {
    const attended =
      submittedSet.has(r.id) &&
      (!requiresWordplayQuest(r.round_date) || wordplayDoneSet.has(r.round_date));
    if (attended) {
      totalDays++;
      running++;
      if (stillCounting) currentStreak = running;
      longestStreak = Math.max(longestStreak, running);
    } else {
      running = 0;
      stillCounting = false;
    }
  }

  return { currentStreak, longestStreak, totalDays };
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
  const earliestRoundDate = rounds[rounds.length - 1].round_date;
  const [{ data: subs }, { data: questLogs }] = await Promise.all([
    supabase
      .from("submissions")
      .select("user_id, daily_round_id")
      .in("daily_round_id", roundIds),
    supabase
      .from("wordplay_quest_log")
      .select("user_id, quest_date")
      .gte("quest_date", earliestRoundDate)
      .lte("quest_date", todayStr),
  ]);

  const attendedByUser = new Map<string, Set<string>>();
  for (const s of subs ?? []) {
    let set = attendedByUser.get(s.user_id);
    if (!set) {
      set = new Set();
      attendedByUser.set(s.user_id, set);
    }
    set.add(s.daily_round_id);
  }

  const wordplayDoneByUser = new Map<string, Set<string>>();
  for (const q of questLogs ?? []) {
    let set = wordplayDoneByUser.get(q.user_id);
    if (!set) {
      set = new Set();
      wordplayDoneByUser.set(q.user_id, set);
    }
    set.add(q.quest_date);
  }

  const results: UserStreak[] = [];
  for (const [userId, submittedSet] of attendedByUser) {
    const wordplayDoneSet = wordplayDoneByUser.get(userId) ?? new Set<string>();
    let currentStreak = 0;
    let longestStreak = 0;
    let totalDays = 0;
    let running = 0;
    let stillCounting = true;

    for (const r of rounds) {
      const attended =
        submittedSet.has(r.id) &&
        (!requiresWordplayQuest(r.round_date) || wordplayDoneSet.has(r.round_date));
      if (attended) {
        totalDays++;
        running++;
        if (stillCounting) currentStreak = running;
        longestStreak = Math.max(longestStreak, running);
      } else {
        running = 0;
        stillCounting = false;
      }
    }

    results.push({ userId, currentStreak, longestStreak, totalDays });
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

  const [{ data: subs }, { data: questLogs }] = await Promise.all([
    supabase
      .from("submissions")
      .select("daily_round_id")
      .eq("user_id", userId)
      .in("daily_round_id", rounds.map((r) => r.id)),
    supabase
      .from("wordplay_quest_log")
      .select("quest_date")
      .eq("user_id", userId)
      .gte("quest_date", start)
      .lte("quest_date", end),
  ]);

  const submittedSet = new Set((subs ?? []).map((s) => s.daily_round_id));
  const wordplayDoneSet = new Set((questLogs ?? []).map((q) => q.quest_date));

  return rounds.map((r) => ({
    date: r.round_date,
    attended:
      submittedSet.has(r.id) &&
      (!requiresWordplayQuest(r.round_date) || wordplayDoneSet.has(r.round_date)),
    isHoliday: r.status === "holiday",
  }));
}
