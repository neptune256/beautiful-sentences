-- 의뢰소: 다이아를 걸고 합평(비평) 또는 집필(글쓰기)을 요청하면, 의뢰게시판에 올라간 의뢰에
-- 사람들이 응답을 달고, 의뢰자가 그중 하나를 채택한다(네이버 지식인 채택 방식).
-- 채택자에게는 보상 다이아만 지급하고 나머지(합평 100→50, 집필 200→150)는 플랫폼이 회수해
-- 재화 인플레이션을 억제한다. 응답이 없거나 채택 없이 7일이 지나면 자동 만료되며 전액 환불된다.

create type commission_type as enum ('critique', 'writing');
create type commission_status as enum ('open', 'resolved', 'expired');

create table commissions (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references profiles(id) on delete cascade,
  type commission_type not null,
  title text not null,
  body text not null,
  diamond_cost integer not null,
  reward_diamonds integer not null,
  status commission_status not null default 'open',
  response_count integer not null default 0,
  winner_response_id uuid,
  expires_at timestamptz not null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index commissions_status_idx on commissions (status, created_at desc);
create index commissions_expires_at_idx on commissions (expires_at) where status = 'open';

create table commission_responses (
  id uuid primary key default gen_random_uuid(),
  commission_id uuid not null references commissions(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index commission_responses_commission_id_idx on commission_responses (commission_id, created_at);

alter table commissions add constraint commissions_winner_response_fk
  foreign key (winner_response_id) references commission_responses(id) on delete set null;

alter table commissions enable row level security;
alter table commission_responses enable row level security;

-- board_posts와 같은 패턴: 읽기는 전원 공개, 쓰기는 서버 액션의 서비스 롤 클라이언트로만 수행
-- (본인 의뢰/응답인지는 애플리케이션 코드와 RPC에서 확인).
create policy "commissions_select_all" on commissions for select using (true);
create policy "commission_responses_select_all" on commission_responses for select using (true);

-- 응답이 달릴 때 commissions.response_count를 자동으로 맞춘다.
create or replace function public.bump_commission_response_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update commissions set response_count = response_count + 1 where id = new.commission_id;
  return new;
end;
$$;

create trigger commission_responses_count_trigger
after insert on commission_responses
for each row execute function bump_commission_response_count();

-- 다이아 차감(잔액 부족 시 아무 것도 하지 않고 false 반환). 의뢰 등록 시 사용.
create or replace function public.spend_diamonds(p_user_id uuid, p_amount integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer;
begin
  update profiles set diamonds = diamonds - p_amount
    where id = p_user_id and diamonds >= p_amount;
  get diagnostics v_rows = row_count;
  return v_rows > 0;
end;
$$;

revoke all on function public.spend_diamonds(uuid, integer) from public;
grant execute on function public.spend_diamonds(uuid, integer) to service_role;

-- 응답 채택: 의뢰를 resolved로 바꾸고 채택된 응답 작성자에게 보상 다이아를 지급한다.
-- 요청자 본인이 아니거나, 이미 마감됐거나, 응답이 해당 의뢰 소속이 아니면 false를 반환하며
-- 아무 것도 바꾸지 않는다(이중 채택 방지는 status='open' 조건으로 원자적으로 보장).
create or replace function public.adopt_commission_response(
  p_commission_id uuid,
  p_response_id uuid,
  p_requester_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reward integer;
  v_author uuid;
  v_rows integer;
begin
  select reward_diamonds into v_reward from commissions
    where id = p_commission_id and requester_id = p_requester_id and status = 'open';
  if v_reward is null then
    return false;
  end if;

  select author_id into v_author from commission_responses
    where id = p_response_id and commission_id = p_commission_id;
  if v_author is null then
    return false;
  end if;

  update commissions set status = 'resolved', winner_response_id = p_response_id, resolved_at = now()
    where id = p_commission_id and status = 'open';
  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    return false;
  end if;

  update profiles set diamonds = diamonds + v_reward where id = v_author;
  return true;
end;
$$;

revoke all on function public.adopt_commission_response(uuid, uuid, uuid) from public;
grant execute on function public.adopt_commission_response(uuid, uuid, uuid) to service_role;

-- 마감 cron(close-round)에 얹어서 하루에 한 번 호출: 채택 없이 기한이 지난 의뢰를 만료 처리하고
-- 지불했던 다이아를 요청자에게 전액 환불한다.
create or replace function public.expire_commissions()
returns integer
language sql
security definer
set search_path = public
as $$
  with expired as (
    update commissions set status = 'expired'
      where status = 'open' and expires_at < now()
      returning requester_id, diamond_cost
  ), refund as (
    select requester_id, sum(diamond_cost) as total from expired group by requester_id
  ), applied as (
    update profiles p set diamonds = p.diamonds + r.total
      from refund r where p.id = r.requester_id
      returning p.id
  )
  select count(*)::integer from expired;
$$;

revoke all on function public.expire_commissions() from public;
grant execute on function public.expire_commissions() to service_role;

alter publication supabase_realtime add table commissions;
alter publication supabase_realtime add table commission_responses;
