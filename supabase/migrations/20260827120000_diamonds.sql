-- 연속 출석(스트릭) 마일스톤 보상용 재화 "다이아" (듀오링고 다이아에 대응, 기존 점수 시스템과 별개)

alter table profiles add column diamonds integer not null default 0;

-- points/is_admin과 같은 이유로 클라이언트 직접 수정을 막는다 (기존 트리거 함수에 diamonds만 추가).
create or replace function public.protect_privileged_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() is distinct from 'service_role' then
    new.points := old.points;
    new.is_admin := old.is_admin;
    new.diamonds := old.diamonds;
  end if;
  return new;
end;
$$;

create type diamond_reason as enum ('streak_milestone');

-- reference_date: 마일스톤을 달성한 그날(KST round_date). 같은 유저가 같은 날 같은 사유로
-- 중복 지급받지 않도록 유니크 제약을 건다 (임시저장을 여러 번 해도 한 번만 지급).
create table diamond_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  amount integer not null,
  reason diamond_reason not null,
  reference_date date not null,
  created_at timestamptz not null default now(),
  unique (user_id, reference_date, reason)
);

alter table diamond_transactions enable row level security;

create policy "users can view own diamond transactions" on diamond_transactions
  for select using (auth.uid() = user_id);

create or replace function public.increment_diamonds(p_user_id uuid, p_amount integer)
returns void
language sql
security definer
set search_path = public
as $$
  update profiles set diamonds = diamonds + p_amount where id = p_user_id;
$$;
