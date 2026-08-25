-- Gemini API 사용량/비용 추정 트래킹.
-- 구글이 API 키 단위로 실시간 크레딧 잔액을 조회할 수 있는 공개 API를 제공하지 않으므로,
-- evaluateSubmissions 호출마다 응답의 usageMetadata(토큰 수)를 기록해두고,
-- 관리자가 입력한 모델별 단가로 비용을 추정해 누적하는 방식으로 대체한다.
-- 실제 Google Cloud 청구액과는 반올림/미과금 항목 등으로 오차가 있을 수 있는 추정치.

create table gemini_usage_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  daily_round_id uuid references daily_rounds(id) on delete set null,
  model text not null,
  prompt_tokens integer not null default 0,
  output_tokens integer not null default 0,
  total_tokens integer not null default 0,
  estimated_cost_usd numeric(12, 4) not null default 0
);

create index gemini_usage_log_created_at_idx on gemini_usage_log (created_at desc);

-- 모델별 단가(백만 토큰당 USD). 구글이 모델을 자주 교체/폐기하고 가격도 바뀌므로
-- 코드에 하드코딩하지 않고 관리자가 대시보드에서 직접 입력/수정한다.
create table gemini_model_pricing (
  model text primary key,
  input_price_per_million numeric(10, 4) not null,
  output_price_per_million numeric(10, 4) not null,
  updated_at timestamptz not null default now()
);

-- 구매해둔 크레딧 총액(USD). 단일 행만 존재.
create table gemini_credit_budget (
  id smallint primary key default 1,
  amount_usd numeric(12, 2) not null,
  updated_at timestamptz not null default now(),
  constraint gemini_credit_budget_single_row check (id = 1)
);

insert into gemini_credit_budget (id, amount_usd) values (1, 15000);

alter table gemini_usage_log enable row level security;
alter table gemini_model_pricing enable row level security;
alter table gemini_credit_budget enable row level security;

-- 세 테이블 모두 cron/관리자 서버 액션의 서비스 롤 클라이언트로만 접근한다.
-- 서비스 롤은 RLS를 우회하므로, 별도 정책을 두지 않는 것이 곧 일반 클라이언트 전면 차단이다.
