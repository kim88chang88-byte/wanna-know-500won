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
