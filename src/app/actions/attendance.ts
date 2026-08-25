"use server";

import { createClient } from "@/lib/supabase/server";
import { todayKst } from "@/lib/date";
import {
  computeStreakInfo,
  getMonthAttendanceDays,
  type AttendanceDay,
  type StreakInfo,
} from "@/lib/attendance";

export async function getStreakInfo(): Promise<StreakInfo> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { currentStreak: 0, longestStreak: 0, totalDays: 0 };

  return computeStreakInfo(supabase, user.id, todayKst());
}

export async function getAttendanceMonth(
  year: number,
  month: number,
): Promise<AttendanceDay[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  return getMonthAttendanceDays(supabase, user.id, year, month);
}
