-- 구글 OAuth로 신규 가입 시 profiles 행을 자동 생성한다.
-- 닉네임 기본값은 구글 표시 이름(full_name) 또는 이메일 아이디 부분.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nickname)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
