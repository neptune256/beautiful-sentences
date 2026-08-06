-- 아름다운 문장: 초기 스키마

create extension if not exists "pgcrypto";

create type situation_sentence_status as enum (
  'pending_review', -- 사용자 제안, Ivy 승인 대기
  'pool',           -- Ivy 사전 제작 풀, 미사용
  'queued',         -- 승인된 사용자 제안, 대기열(선착순)
  'used',           -- 이미 그날의 문장으로 사용됨
  'rejected'        -- Ivy가 반려함
);

create type daily_round_status as enum ('open', 'closed', 'holiday');

create type point_reason as enum (
  'daily_submission',   -- 그날 글 최종 제출 (+5)
  'daily_winner',       -- 심사 결과 1위 (+50)
  'proposal_adopted'    -- 제안한 문장이 채택되어 게시 (+10)
);

-- profiles: auth.users 1:1 확장 (닉네임, 누적 포인트)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  points integer not null default 0,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- situation_sentences: 상황 문장 (사전 제작 풀 + 사용자 제안)
create table situation_sentences (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  status situation_sentence_status not null default 'pool',
  proposed_by uuid references profiles(id) on delete set null,
  approved_at timestamptz,
  used_on date,
  created_at timestamptz not null default now()
);

create index situation_sentences_status_idx on situation_sentences (status, approved_at);
create unique index situation_sentences_used_on_idx on situation_sentences (used_on) where used_on is not null;

-- daily_rounds: 하루 사이클 1건 (상황 문장 + 진행 상태)
create table daily_rounds (
  id uuid primary key default gen_random_uuid(),
  round_date date not null unique,
  situation_sentence_id uuid references situation_sentences(id),
  status daily_round_status not null default 'open',
  evaluated_at timestamptz,
  created_at timestamptz not null default now()
);

-- submissions: 참가자별 그날의 글 (자정까지 자유롭게 수정, 유저당 라운드당 1건)
create table submissions (
  id uuid primary key default gen_random_uuid(),
  daily_round_id uuid not null references daily_rounds(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (daily_round_id, user_id)
);

-- evaluations: Gemini 평가 결과 (라운드당 1건)
create table evaluations (
  id uuid primary key default gen_random_uuid(),
  daily_round_id uuid not null unique references daily_rounds(id) on delete cascade,
  winner_submission_id uuid references submissions(id),
  reasoning text not null,
  raw_response jsonb,
  created_at timestamptz not null default now()
);

-- proposal_tickets: 공유로 획득한 상황 문장 제안권
create table proposal_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  granted_at timestamptz not null default now(),
  used_at timestamptz,
  used_sentence_id uuid references situation_sentences(id)
);

-- point_transactions: 포인트 지급 내역 원장 (감사/디버깅용)
create table point_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  amount integer not null,
  reason point_reason not null,
  reference_id uuid,
  created_at timestamptz not null default now()
);
