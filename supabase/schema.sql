-- 꽃거지의 신묘한 사주 : Supabase(Postgres) 테이블
-- Supabase 대시보드 > SQL Editor 에서 이 파일 전체를 붙여넣고 Run 하세요. (여러 번 실행해도 안전해요)

-- 회원: 카카오 회원번호와 닉네임만 저장해요. (이메일·프로필 사진·연락처는 받지 않아요)
create table if not exists public.users (
  id text primary key,                          -- 카카오 회원번호
  nickname text,
  created_at timestamptz not null default now(),
  last_login_at timestamptz not null default now()
);

-- 뽑기 기록: 날짜(한국 시간 기준)와 주제만 남겨요. 생년월일시·풀이 내용은 저장하지 않아요.
create table if not exists public.draws (
  id bigint generated always as identity primary key,
  user_id text not null references public.users(id) on delete cascade,  -- 회원을 지우면 기록도 함께 지워져요
  day date not null,                            -- 한국 시간(KST) 기준 날짜
  topic text not null default 'general',
  created_at timestamptz not null default now()
);

create index if not exists draws_user_day_idx on public.draws (user_id, day);

-- 보안: 브라우저(공개 키)에서는 두 테이블에 아무것도 못 하게 잠가요.
-- 정책(policy)을 만들지 않았기 때문에, 서버에서 쓰는 service_role 키로만 읽고 쓸 수 있어요.
alter table public.users enable row level security;
alter table public.draws enable row level security;

-- ─────────────────────────────────────────────────────────────────────────────
-- 아래 두 테이블은 '이용자가 직접 동의(선택)한 경우에만' 채워져요.
-- Supabase 대시보드 > SQL Editor 에서 이 파일 전체를 다시 Run 하면 추가돼요. (기존 데이터는 그대로예요)
-- ─────────────────────────────────────────────────────────────────────────────

-- 저장된 생년월일시: 로그인한 회원이 "도리가 기억하게 할래요"에 동의했을 때만 저장해요. 회원당 1줄이고, 회원을 지우면 함께 지워져요.
create table if not exists public.profiles (
  user_id text primary key references public.users(id) on delete cascade,
  calendar text not null check (calendar in ('solar', 'lunar')),
  year int not null,
  month int not null,
  day int not null,
  is_leap boolean not null default false,
  hour int,                                      -- 태어난 시간을 모르면 null
  minute int,
  gender text not null check (gender in ('female', 'male')),
  updated_at timestamptz not null default now()
);

-- 고민 통계: 이용자가 "고민 내용을 통계에 써도 좋아요"에 동의했을 때만 한 줄씩 쌓여요.
-- 생년월일은 담지 않고 나이대(예: 20s)와 성별만 남겨요. 로그인한 경우에만 user_id 를 남겨서, 탈퇴하면 함께 지워져요.
create table if not exists public.concern_logs (
  id bigint generated always as identity primary key,
  user_id text references public.users(id) on delete cascade,
  day date not null,                             -- 한국 시간(KST) 기준 날짜
  topic text not null default 'general',
  tags text[] not null default '{}',             -- 고른 추천 버튼 id
  concern_text text,                             -- 직접 쓴 글(200자 이내)
  gender text,
  age_band text,
  created_at timestamptz not null default now()
);

create index if not exists concern_logs_day_idx on public.concern_logs (day);

alter table public.profiles enable row level security;
alter table public.concern_logs enable row level security;

-- ─────────────────────────────────────────────────────────────────────────────
-- 사용후기: 결과 화면에서 이용자가 직접 남긴 별점과 한 줄 후기예요. (로그인하지 않아도 남길 수 있어요)
-- Supabase 대시보드 > SQL Editor 에서 이 파일 전체를 다시 Run 하면 추가돼요. (기존 데이터는 그대로예요)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.reviews (
  id bigint generated always as identity primary key,
  user_id text references public.users(id) on delete cascade,  -- 로그인한 경우에만. 탈퇴하면 함께 지워져요
  rating int not null check (rating between 1 and 5),
  review_text text,                              -- 한 줄 후기(200자 이내, 선택)
  reasons text[] not null default '{}',          -- 별점이 낮을 때 고른 아쉬운 점
  topic text not null default 'general',
  premium boolean not null default false,
  hidden boolean not null default false,         -- 관리자가 숨긴 후기
  created_at timestamptz not null default now()
);

create index if not exists reviews_created_idx on public.reviews (created_at);

alter table public.reviews enable row level security;

-- ─────────────────────────────────────────────────────────────────────────────
-- 동의 기록: 선택 동의(생년월일시 기억하기·고민 통계) 때 '언제, 어떤 문구 버전에' 동의했는지 남겨요.
-- 이 파일 전체를 다시 Run 하면 추가돼요. (기존 행은 null 로 남아요)
-- ※ 코드를 배포하기 '전에' 먼저 Run 해주세요. (컬럼이 없으면 저장이 실패해요)
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.profiles add column if not exists consent_version text;
alter table public.profiles add column if not exists consented_at timestamptz;
alter table public.concern_logs add column if not exists consent_version text;
alter table public.concern_logs add column if not exists consented_at timestamptz;
create index if not exists reviews_created_idx on public.reviews (created_at);
create index if not exists concern_logs_created_idx on public.concern_logs (created_at);
