@AGENTS.md

# 아름다운 문장 — 프로젝트 컨텍스트

매일 하나의 "상황 문장"이 제시되면 참가자들이 자신만의 문체로 재구성해 제출하고,
자정에 Gemini API가 비교 평가해 1위를 선정하는 소설 창작 커뮤니티.
Next.js 16(App Router) + Supabase + Gemini API + Vercel Cron.

## 배포 위치

- **서비스 URL**: https://beautiful-sentences.vercel.app
- **GitHub**: https://github.com/neptune256/beautiful-sentences (Public)
- **Vercel**: neptune256's projects / beautiful-sentences
- **Supabase**: 프로젝트명 beautiful-sentences, 리전 ap-northeast-2(서울)
  - project ref: `nbcbdfkuzqxiiamqiqqx`
  - Dashboard: https://supabase.com/dashboard/project/nbcbdfkuzqxiiamqiqqx
- **로컬 경로**: `C:\Users\eanbi\dev\beautiful-sentences`
- 모두 GitHub/Supabase/Vercel 계정 neptune256으로 연결돼 있음

## 환경변수

실제 값은 로컬 `.env.local`에 있음 (git에는 안 올라감, `.env.local.example`이 목록만 보여줌).
배포판은 Vercel 프로젝트 Settings → Environment Variables에 동일하게 등록돼 있음.
**이 저장소는 Public이므로 실제 키 값을 커밋된 파일에 절대 적지 말 것.**

- `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY` (Google AI Studio 발급, `AQ.`로 시작하는 신형 키가 정상. 결제 등록 필요했음),
  `GEMINI_MODEL` (현재 `gemini-3.6-flash` — 구글이 모델을 자주 폐기하므로 404 뜨면
  `GET https://generativelanguage.googleapis.com/v1beta/models?key=...`로 사용 가능한 모델 확인 후 교체)
- `RESEND_API_KEY` / `NOTIFY_EMAIL_TO` — Ivy 알림 이메일용, 아직 미설정 (없으면 콘솔 로그만 남기고 조용히 스킵됨, `src/lib/email.ts`)
- `CRON_SECRET` — Vercel Cron 인증용 Bearer 토큰. 수동 트리거 예시:
  `curl https://beautiful-sentences.vercel.app/api/cron/close-round -H "Authorization: Bearer $CRON_SECRET"`

## 계정

- 관리자 테스트 계정: 닉네임 "do hyun" (`profiles.is_admin = true`)

## DB 스키마 (`supabase/migrations/`에 순서대로 있음)

- `profiles` — 닉네임, 누적 포인트, is_admin (구글 로그인 시 트리거로 자동 생성)
- `situation_sentences` — 상황 문장. `status`: pending_review/pool/queued/used/rejected.
  `queue_position`으로 대기열 순서 관리(관리자가 위/아래로 조정 가능)
- `daily_rounds` — 하루 라운드. `status`: open/closed/holiday
- `submissions` — 참가자 글, 라운드당 유저당 1건(upsert로 자정까지 자유 수정)
- `evaluations` — Gemini 평가 결과 (winner_submission_id, reasoning)
- `proposal_tickets` — 공유 시 발급되는 1회용 제안권
- `point_transactions` — 포인트 지급 내역 원장
- `increment_points(uuid, int)` RPC — 포인트 원자적 증가(동시 마감 경쟁 방지용)

## 자동화 — GitHub Actions로 트리거 (매일 UTC 15:00 / 15:05 = KST 00:00 / 00:05)

Vercel Hobby 플랜 내장 크론은 정시 실행을 보장하지 않아(최대 1시간 지연 가능) 걷어내고,
`.github/workflows/cron-trigger.yml`이 정해진 시각에 API를 직접 `curl`로 호출하는 방식으로 대체함
(`vercel.json`에는 크론 미등록 — 두 트리거가 겹치면 같은 라운드가 이중 마감/채점될 위험이 있어서 하나만 유지).
GitHub repo secret `CRON_SECRET`이 Vercel의 `CRON_SECRET` 값과 동일하게 등록돼 있어야 동작함.

- `/api/cron/open-round` — 대기열(queue_position 순) → 풀(created_at 순) → 없으면 휴일, 순으로 오늘 라운드 오픈.
  이미 오늘 라운드가 있으면 스킵(멱등)
- `/api/cron/close-round` — round_date가 지난 open 라운드를 마감, 참여 +5점,
  Gemini 평가로 1위 +50점(재시도 3회, 실패해도 마감은 유지). status가 이미 closed면 다시 안 걸리므로 멱등.

## 페이지 구성

- `/` — 오늘의 상황 문장 + 로그인 시 글쓰기 폼
- `/yesterday` — 가장 최근 마감된 라운드: 전원 글 공개 + 1위 + 평가 이유
- `/ranking` — 누적 포인트 순위
- `/propose` — 사이트 공유 → 제안권 획득 → 상황 문장 제안
- `/admin` — 관리자 전용(`is_admin` 게이트): 제안 승인/반려, 대기열 순서 조정,
  풀 목록 확인·대기열로 이동, 대기열/풀 문장 내용 수정, 풀에 새 문장 추가

## 알아두면 좋은 것들

- **Next.js 16**: 미들웨어가 `proxy.ts`로 이름이 바뀜(`middleware.ts` 아님). 코드 작성 전
  `node_modules/next/dist/docs/`에서 최신 컨벤션 확인 권장(AGENTS.md 참고, 훈련 데이터와 다를 수 있음).
- **RLS 함정**: `insert().select()`는 내부적으로 `INSERT ... RETURNING`이라 SELECT 정책도 있어야
  방금 넣은 행을 본인도 읽어올 수 있음(안 그러면 "new row violates row-level security policy" 에러).
  관리자처럼 "모든 유저 데이터 조회"가 필요한 곳은 세션 클라이언트(`src/lib/supabase/server.ts`) 대신
  서비스 롤 클라이언트(`src/lib/supabase/admin.ts`)를 써야 함.
- **Supabase SQL Editor 자동화**: 브라우저로 조작할 때 ctrl+a 전체선택이 잘 안 먹을 때가 있음 —
  새 쿼리 탭을 여는 편이 안전함. DDL(ALTER TABLE 등)은 REST API로 불가, SQL Editor 로그인 필요.
- **Supabase 무료 플랜**은 장기간 미사용 시 프로젝트가 자동 일시정지됨(대시보드에서 Restore 필요).
- Gemini/Supabase 서비스 롤 키 같은 민감값은 REST API(`curl` + service role key)로 직접 검증하는 게
  브라우저 자동화보다 훨씬 안정적임 — 이 프로젝트에서 반복적으로 그렇게 확인해 왔음.

## 다음에 이어서 할 만한 것

- 이메일 알림(Ivy용) 실제 연동 — Resend API 키 미설정 상태
- 부적절한 표현 필터링 (원 기획서에 "미정" 항목으로 남아있음)
- 닉네임 커스터마이징 UI(현재는 구글 계정 이름 그대로 사용)
