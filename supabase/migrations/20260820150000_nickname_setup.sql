-- 구글 로그인 직후엔 구글 표시 이름이 임시 닉네임으로 들어가는데, 신규 가입자는
-- 최초 1회 닉네임을 직접 확인/변경하도록 유도한다. nickname_set이 false인 동안만
-- 첫 로그인 안내 모달이 뜬다. 기존 유저는 이미 닉네임을 쓰고 있으니 true로 채워
-- 다시 귀찮게 하지 않는다.

alter table profiles add column nickname_set boolean not null default false;
update profiles set nickname_set = true;

-- 클라이언트(로그인 세션)에서 본인 프로필을 수정할 수 있게 해뒀는데(users can update own profile),
-- 닉네임 변경 UI를 노출하는 김에 points/is_admin까지 같은 경로로 조작되지 않도록 잠가둔다.
-- 서비스 롤(관리자 액션, increment_points RPC 등)은 auth.role() = 'service_role'이라 영향 없음.

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
  end if;
  return new;
end;
$$;

create trigger protect_privileged_profile_fields
  before update on profiles
  for each row execute function public.protect_privileged_profile_fields();
