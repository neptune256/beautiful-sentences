-- 포인트를 원자적으로 증가시키는 함수 (동시 라운드 마감 시 경쟁 조건 방지)

create or replace function public.increment_points(p_user_id uuid, p_amount integer)
returns void
language sql
security definer
set search_path = public
as $$
  update profiles set points = points + p_amount where id = p_user_id;
$$;
