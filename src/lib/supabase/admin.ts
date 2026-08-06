import { createClient } from "@supabase/supabase-js";

// RLS를 우회하는 관리자 클라이언트. 서버 전용 코드(cron, 관리자 API)에서만 사용한다.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
