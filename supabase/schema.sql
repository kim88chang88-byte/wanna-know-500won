-- 도유 사주 : Supabase(Postgres) 테이블
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

-- ─────────────────────────────────────────────────────────────────────────────
-- AI 비용 방어: 하루에 AI 를 몇 번 불렀는지 세는 표와, 한도를 안 넘을 때만 1 올리는 함수예요.
-- 이 파일 전체를 다시 Run 하면 추가돼요. (코드를 배포하기 '전에' Run 하세요. 없으면 서버 메모리 임시 카운터로 동작해요)
-- 사용량 확인: select * from public.ai_usage order by day desc;
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.ai_usage (
  day date primary key,                          -- 한국 시간(KST) 기준 날짜
  calls int not null default 0
);
alter table public.ai_usage enable row level security;

create or replace function public.ai_usage_take(p_day date, p_cap int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare n int;
begin
  insert into public.ai_usage as u (day, calls) values (p_day, 1)
  on conflict (day) do update set calls = u.calls + 1 where u.calls < p_cap
  returning calls into n;
  return n is not null;
end;
$$;

revoke all on function public.ai_usage_take(date, int) from public, anon, authenticated;
grant execute on function public.ai_usage_take(date, int) to service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 속도 제한(여러 서버 공용): 일정 시간(창) 안에 같은 키가 몇 번 불렀는지 세요.
-- 이 파일 전체를 다시 Run 하면 추가돼요. (없으면 서버 메모리 제한만으로 동작해요)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.rate_limits (
  bucket text primary key,                       -- "이름:대상:창번호"
  hits int not null default 0,
  expires_at timestamptz not null
);
alter table public.rate_limits enable row level security;

-- 한도 안이면 0 을, 넘었으면 이 창이 끝날 때까지 남은 초를 돌려줘요.
create or replace function public.rate_limit_take(p_key text, p_window_sec int, p_limit int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  win bigint := floor(extract(epoch from now()) / p_window_sec);
  b text := p_key || ':' || win::text;
  n int;
  left_sec int := greatest(1, ceil((win + 1) * p_window_sec - extract(epoch from now()))::int);
begin
  if random() < 0.02 then
    delete from public.rate_limits where expires_at < now();   -- 가끔 오래된 줄 정리
  end if;
  insert into public.rate_limits as r (bucket, hits, expires_at)
    values (b, 1, now() + make_interval(secs => p_window_sec * 2))
  on conflict (bucket) do update set hits = r.hits + 1 where r.hits < p_limit
  returning hits into n;
  return case when n is null then left_sec else 0 end;
end;
$$;

revoke all on function public.rate_limit_take(text, int, int) from public, anon, authenticated;
grant execute on function public.rate_limit_take(text, int, int) to service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 내 보관함: 로그인한 회원이 본 풀이 결과를 그대로 저장해 두고, 다시 볼 때는 AI 를 부르지 않아요.
-- 회원을 지우면(탈퇴·카카오 연결 끊기) 함께 지워져요. 같은 결과를 두 번 저장하지 않게 payload_hash 로 걸러요.
-- 이 파일 전체를 다시 Run 하면 추가돼요. (코드를 배포하기 '전에' Run 하세요)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.vault_items (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users(id) on delete cascade,
  topic text not null default 'general',
  premium boolean not null default false,
  title text not null,
  summary text,
  payload jsonb not null,
  payload_hash text not null,
  created_at timestamptz not null default now(),
  unique (user_id, payload_hash)
);
create index if not exists vault_items_user_idx on public.vault_items (user_id, created_at desc);
alter table public.vault_items enable row level security;

-- ─────────────────────────────────────────────────────────────────────────────
-- 기억해 둔 다른 사람: 로그인한 회원이 "이 사람을 기억해 둘게요"에 동의했을 때만, 궁합 상대 등의
-- 생년월일시·성별을 별명과 함께 저장해요. (최대 10명, 회원이 지우거나 탈퇴하면 함께 삭제)
-- 이 파일 전체를 다시 Run 하면 추가돼요. (코드를 배포하기 '전에' Run 하세요. 없으면 이 기능만 조용히 꺼져 있어요)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.saved_people (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users(id) on delete cascade,
  label text not null,                           -- 별명(20자 이내). 실명 대신 쓰도록 안내해요
  calendar text not null check (calendar in ('solar', 'lunar')),
  year int not null,
  month int not null,
  day int not null,
  is_leap boolean not null default false,
  hour int,
  minute int,
  gender text not null check (gender in ('female', 'male')),
  consent_version text,
  consented_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists saved_people_user_idx on public.saved_people (user_id, created_at desc);
alter table public.saved_people enable row level security;

-- ─────────────────────────────────────────────────────────────────────────────
-- 후기 공개 동의: 이용자가 "메인 화면에 이름 없이 보여 줘도 좋아요"를 직접 고른 후기만 공개해요.
-- 이 파일 전체를 다시 Run 하면 추가돼요. (코드를 배포하기 '전에' Run 하세요. 기존 후기는 모두 비공개(false)로 남아요)
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.reviews add column if not exists public_ok boolean not null default false;
create index if not exists reviews_public_idx on public.reviews (id) where public_ok and not hidden;

-- ─────────────────────────────────────────────────────────────────────────────
-- 방문자 수(랜딩 "Today / Total"): 브라우저가 만든 무작위 ID 를 서버에서 한 번 더 해시해서 세요.
-- 이름·연락처·IP 는 저장하지 않아요. 이 파일 전체를 다시 Run 하면 추가돼요. (없으면 방문자 수 표시가 숨겨져요)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.visitors (
  vid text primary key,                          -- 해시된 방문자 ID
  first_day date not null
);
create table if not exists public.visit_days (
  day date not null,                             -- 한국 시간(KST) 기준 날짜
  vid text not null,
  primary key (day, vid)
);
alter table public.visitors enable row level security;
alter table public.visit_days enable row level security;

-- p_vid 가 있으면 오늘 방문으로 기록하고, 오늘 방문자 수와 누적 방문자 수를 돌려줘요.
create or replace function public.visit_hit(p_day date, p_vid text)
returns table (today int, total int)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_vid is not null and length(p_vid) between 8 and 128 then
    insert into public.visitors (vid, first_day) values (p_vid, p_day) on conflict do nothing;
    insert into public.visit_days (day, vid) values (p_day, p_vid) on conflict do nothing;
  end if;
  return query
    select (select count(*)::int from public.visit_days where day = p_day),
           (select count(*)::int from public.visitors);
end;
$$;

revoke all on function public.visit_hit(date, text) from public, anon, authenticated;
grant execute on function public.visit_hit(date, text) to service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 뽑기 코인(500원 무료 뽑기 1회권): 로그인 선물·추천·후기 보상을 한 곳에서 관리해요.
-- 이 파일 전체를 다시 Run 하면 추가돼요. (없으면 코인 기능만 꺼진 채로 서비스는 그대로 동작해요)
-- 지급은 (user_id, kind, ref) 가 같으면 한 번만 되어서, 새로고침·재시도로 두 번 받지 않아요.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.user_coins (
  user_id text primary key references public.users(id) on delete cascade,
  balance int not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);
create table if not exists public.coin_log (
  id bigint generated always as identity primary key,
  user_id text not null references public.users(id) on delete cascade,
  kind text not null,              -- login_bonus / spend / (이후) referral, review
  ref text not null,               -- 같은 지급을 구분하는 값
  delta int not null,              -- +지급 / -사용
  created_at timestamptz not null default now()
);
create unique index if not exists coin_log_grant_once on public.coin_log (user_id, kind, ref) where delta > 0;
alter table public.user_coins enable row level security;
alter table public.coin_log enable row level security;

-- 지급: 같은 (kind, ref) 는 한 번만. 새로 지급했으면 out_granted = true.
create or replace function public.coin_grant(p_user text, p_kind text, p_ref text, p_amount int)
returns table (out_granted boolean, out_balance int)
language plpgsql
security definer
set search_path = public
as $$
declare
  ins int;
  bal int;
begin
  if p_amount < 1 or p_amount > 10 then
    raise exception 'bad amount';
  end if;
  insert into public.coin_log (user_id, kind, ref, delta) values (p_user, p_kind, p_ref, p_amount) on conflict do nothing;
  get diagnostics ins = row_count;
  if ins > 0 then
    insert into public.user_coins (user_id, balance) values (p_user, p_amount)
      on conflict (user_id) do update set balance = public.user_coins.balance + p_amount, updated_at = now();
  end if;
  select c.balance into bal from public.user_coins c where c.user_id = p_user;
  return query select ins > 0, coalesce(bal, 0);
end;
$$;

-- 사용: 1장 쓰고 남은 장수를 돌려줘요. 잔액이 없으면 -1.
create or replace function public.coin_spend(p_user text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  bal int;
begin
  update public.user_coins set balance = balance - 1, updated_at = now()
    where user_id = p_user and balance >= 1
    returning balance into bal;
  if bal is null then
    return -1;
  end if;
  insert into public.coin_log (user_id, kind, ref, delta) values (p_user, 'spend', clock_timestamp()::text, -1);
  return bal;
end;
$$;

revoke all on function public.coin_grant(text, text, text, int) from public, anon, authenticated;
grant execute on function public.coin_grant(text, text, text, int) to service_role;
revoke all on function public.coin_spend(text) from public, anon, authenticated;
grant execute on function public.coin_spend(text) to service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 친구 초대(추천 코드): 친구가 내 코드를 입력하고 그 뒤 첫 풀이를 마치면 두 사람 모두 뽑기 코인 1장.
-- · 코드 입력은 가입 후 7일 안의 계정만 가능해요. (이미 뽑기를 해 본 계정도 입력할 수 있어요)
-- · 초대한 사람은 한 달(한국 시간)에 3번까지 받아요. 초대받은 친구는 항상 받아요.
-- 이 부분만 따로 Run 해도 되고, 파일 전체를 다시 Run 해도 안전해요. (코인 테이블이 먼저 있어야 해요)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.referral_codes (
  user_id text primary key references public.users(id) on delete cascade,
  code text not null unique
);
create table if not exists public.referrals (
  referee_id text primary key references public.users(id) on delete cascade,   -- 초대받은 친구 (한 사람당 한 번만)
  referrer_id text not null references public.users(id) on delete cascade,     -- 초대한 사람
  status text not null default 'pending',                                       -- pending: 코드 입력 / done: 첫 풀이 완료, 보상 지급
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists referrals_referrer_idx on public.referrals (referrer_id, status);
alter table public.referral_codes enable row level security;
alter table public.referrals enable row level security;

-- 내 추천 코드를 돌려줘요. 없으면 만들어요.
create or replace function public.referral_code_get(p_user text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  c text;
  tries int := 0;
begin
  select rc.code into c from public.referral_codes rc where rc.user_id = p_user;
  if c is not null then
    return c;
  end if;
  loop
    c := substr(upper(md5(random()::text || clock_timestamp()::text || p_user)), 1, 8);
    begin
      insert into public.referral_codes (user_id, code) values (p_user, c);
      return c;
    exception when unique_violation then
      select rc.code into c from public.referral_codes rc where rc.user_id = p_user;
      if c is not null then
        return c;
      end if;
      tries := tries + 1;
      if tries > 5 then
        raise exception 'code failed';
      end if;
    end;
  end loop;
end;
$$;

-- 친구 코드 입력. 결과: ok / bad_code / self / already / too_old
create or replace function public.referral_redeem(p_user text, p_code text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  ref text;
  made timestamptz;
begin
  select rc.user_id into ref from public.referral_codes rc where rc.code = upper(trim(p_code));
  if ref is null then
    return 'bad_code';
  end if;
  if ref = p_user then
    return 'self';
  end if;
  if exists (select 1 from public.referrals r where r.referee_id = p_user) then
    return 'already';
  end if;
  select u.created_at into made from public.users u where u.id = p_user;
  if made is null or made < now() - interval '7 days' then
    return 'too_old';
  end if;
  -- 이미 뽑기를 해 본 계정도 입력할 수 있어요. (보상은 코드를 입력한 뒤의 첫 풀이를 마칠 때 지급돼요)
  insert into public.referrals (referee_id, referrer_id) values (p_user, ref) on conflict do nothing;
  return 'ok';
end;
$$;

-- 코드를 입력한 친구가 그 뒤 첫 풀이를 마쳤을 때 호출: 보상을 한 번만 지급해요.
create or replace function public.referral_complete(p_user text)
returns table (out_referee boolean, out_referrer boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  cnt int;
  month_start timestamptz;
  gave boolean := false;
begin
  select * into r from public.referrals where referee_id = p_user and status = 'pending' for update;
  if not found then
    return query select false, false;
    return;
  end if;
  update public.referrals set status = 'done', completed_at = now() where referee_id = p_user;
  perform public.coin_grant(p_user, 'referral_join', r.referrer_id, 1);
  month_start := date_trunc('month', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul';
  select count(*) into cnt from public.coin_log
    where user_id = r.referrer_id and kind = 'referral_invite' and created_at >= month_start;
  if cnt < 3 then
    perform public.coin_grant(r.referrer_id, 'referral_invite', p_user, 1);
    gave := true;
  end if;
  return query select true, gave;
end;
$$;

revoke all on function public.referral_code_get(text) from public, anon, authenticated;
grant execute on function public.referral_code_get(text) to service_role;
revoke all on function public.referral_redeem(text, text) from public, anon, authenticated;
grant execute on function public.referral_redeem(text, text) to service_role;
revoke all on function public.referral_complete(text) from public, anon, authenticated;
grant execute on function public.referral_complete(text) to service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 후기 보상: 같은 종류(kind)의 지급을 한 달(한국 시간)에 p_cap 번까지만 해 줘요.
-- 결과: out_reason = ok(지급) / cap(이번 달 한도) / dup(이미 받은 후기)
-- 코인 테이블·coin_grant 가 먼저 있어야 해요. 이 부분만 따로 Run 해도 안전해요.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.coin_grant_capped(p_user text, p_kind text, p_ref text, p_amount int, p_cap int)
returns table (out_granted boolean, out_balance int, out_reason text)
language plpgsql
security definer
set search_path = public
as $$
declare
  cnt int;
  month_start timestamptz;
  r record;
begin
  month_start := date_trunc('month', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul';
  select count(*) into cnt from public.coin_log
    where user_id = p_user and kind = p_kind and delta > 0 and created_at >= month_start;
  if cnt >= p_cap then
    return query select false, coalesce((select c.balance from public.user_coins c where c.user_id = p_user), 0), 'cap'::text;
    return;
  end if;
  select * into r from public.coin_grant(p_user, p_kind, p_ref, p_amount);
  return query select r.out_granted, r.out_balance, (case when r.out_granted then 'ok' else 'dup' end)::text;
end;
$$;

revoke all on function public.coin_grant_capped(text, text, text, int, int) from public, anon, authenticated;
grant execute on function public.coin_grant_capped(text, text, text, int, int) to service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- AI 비용 점검용: ① 날짜·모델별 호출 횟수/토큰 기록(관리자 화면에 표시)  ② 관리자 테스트 캐시
-- 이 파일 전체를 다시 Run 하면 추가돼요. (없어도 사이트는 그대로 동작하고, 기록·캐시만 빠져요)
-- 사용량 확인: select * from public.ai_cost order by day desc;
-- 캐시 비우기: delete from public.ai_cache;
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.ai_cost (
  day date not null,                             -- 한국 시간(KST) 기준 날짜
  model text not null,
  calls int not null default 0,                  -- 실제로 AI 를 부른 횟수
  cache_hits int not null default 0,             -- 캐시로 대신해서 비용이 안 든 횟수
  input_tokens bigint not null default 0,
  output_tokens bigint not null default 0,
  primary key (day, model)
);
alter table public.ai_cost enable row level security;

create or replace function public.ai_cost_add(p_day date, p_model text, p_calls int, p_hits int, p_in bigint, p_out bigint)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.ai_cost as c (day, model, calls, cache_hits, input_tokens, output_tokens)
  values (p_day, p_model, p_calls, p_hits, p_in, p_out)
  on conflict (day, model) do update set
    calls = c.calls + p_calls,
    cache_hits = c.cache_hits + p_hits,
    input_tokens = c.input_tokens + p_in,
    output_tokens = c.output_tokens + p_out;
$$;

revoke all on function public.ai_cost_add(date, text, int, int, bigint, bigint) from public, anon, authenticated;
grant execute on function public.ai_cost_add(date, text, int, int, bigint, bigint) to service_role;

create table if not exists public.ai_cache (
  key text primary key,                          -- 모델+프롬프트+입력의 해시
  model text not null,
  payload text not null,                         -- AI 가 돌려준 JSON 글
  created_at timestamptz not null default now()
);
alter table public.ai_cache enable row level security;

-- ─────────────────────────────────────────────────────────────────────────────
-- 도리 상담방 질문 횟수: 회원마다·범위(scope)마다 무료 질문과 동전으로 산 질문을 따로 세요.
-- · 오늘의 한마디 카드에서 들어오면 하루 3번, 결과서(500원·1,000원)에서 들어오면 그 결과마다 한 달에 10번 무료예요.
-- · 뽑기 코인 1장으로 질문 5개를 더할 수 있어요 (chat_buy).
-- 이 부분만 따로 Run 해도 되고, 파일 전체를 다시 Run 해도 안전해요. (코인 테이블이 먼저 있어야 해요)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.chat_credits (
  user_id text not null references public.users(id) on delete cascade,
  scope text not null,                                  -- 예: d:2026-11-02 / r:2026-11:해시
  free_left int not null default 0 check (free_left >= 0),
  extra_left int not null default 0 check (extra_left >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, scope)
);
alter table public.chat_credits enable row level security;

-- 남은 질문 수. 아직 한 번도 안 물었으면 무료 p_free 개로 시작해요.
create or replace function public.chat_quota(p_user text, p_scope text, p_free int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  f int;
  e int;
begin
  select c.free_left, c.extra_left into f, e from public.chat_credits c where c.user_id = p_user and c.scope = p_scope;
  if f is null then
    return p_free;
  end if;
  return f + e;
end;
$$;

-- 질문 1개 사용(무료 먼저, 그다음 산 것). 사용한 뒤 남은 수를 돌려주고, 남은 게 없으면 -1.
create or replace function public.chat_take(p_user text, p_scope text, p_free int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  f int;
  e int;
begin
  insert into public.chat_credits (user_id, scope, free_left) values (p_user, p_scope, p_free) on conflict do nothing;
  update public.chat_credits set free_left = free_left - 1, updated_at = now()
    where user_id = p_user and scope = p_scope and free_left >= 1
    returning free_left, extra_left into f, e;
  if f is null then
    update public.chat_credits set extra_left = extra_left - 1, updated_at = now()
      where user_id = p_user and scope = p_scope and extra_left >= 1
      returning free_left, extra_left into f, e;
  end if;
  if f is null then
    return -1;
  end if;
  return f + e;
end;
$$;

-- AI 가 답하지 못했을 때 질문 1개를 돌려줘요.
create or replace function public.chat_refund(p_user text, p_scope text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.chat_credits set extra_left = extra_left + 1, updated_at = now() where user_id = p_user and scope = p_scope;
$$;

-- 뽑기 코인 1장을 써서 질문 p_amount 개를 더해요. 코인이 없으면 out_left = -1.
create or replace function public.chat_buy(p_user text, p_scope text, p_free int, p_amount int)
returns table (out_left int, out_coins int)
language plpgsql
security definer
set search_path = public
as $$
declare
  bal int;
  f int;
  e int;
begin
  if p_amount < 1 or p_amount > 20 then
    raise exception 'bad amount';
  end if;
  update public.user_coins set balance = balance - 1, updated_at = now()
    where user_id = p_user and balance >= 1
    returning balance into bal;
  if bal is null then
    return query select -1, 0;
    return;
  end if;
  insert into public.coin_log (user_id, kind, ref, delta) values (p_user, 'chat_buy', clock_timestamp()::text, -1);
  insert into public.chat_credits (user_id, scope, free_left, extra_left) values (p_user, p_scope, p_free, p_amount)
    on conflict (user_id, scope) do update set extra_left = public.chat_credits.extra_left + p_amount, updated_at = now();
  select c.free_left, c.extra_left into f, e from public.chat_credits c where c.user_id = p_user and c.scope = p_scope;
  return query select f + e, bal;
end;
$$;

revoke all on function public.chat_quota(text, text, int) from public, anon, authenticated;
revoke all on function public.chat_take(text, text, int) from public, anon, authenticated;
revoke all on function public.chat_refund(text, text) from public, anon, authenticated;
revoke all on function public.chat_buy(text, text, int, int) from public, anon, authenticated;
grant execute on function public.chat_quota(text, text, int) to service_role;
grant execute on function public.chat_take(text, text, int) to service_role;
grant execute on function public.chat_refund(text, text) to service_role;
grant execute on function public.chat_buy(text, text, int, int) to service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 방문 출처·핵심 행동(퍼널): 어디서 왔는지(src)와 어디까지 해 봤는지(event)를 익명 ID(해시)로만 세요.
-- 방문자 ID 와 회원 번호는 연결하지 않아요. 생일·고민 글·이름 같은 입력값은 저장하지 않아요.
-- 행동 기록은 90일이 지나면 지워요. 이 파일 전체를 다시 Run 하면 추가돼요. (없으면 퍼널 숫자만 안 쌓이고 서비스는 그대로예요)
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.visitors add column if not exists src text;   -- 처음 온 경로(direct / friend / utm:xxx / web:도메인)

create table if not exists public.visit_events (
  day date not null,                             -- 한국 시간(KST) 기준 날짜
  vid text not null,                             -- 해시된 방문자 ID
  event text not null,                           -- 정해진 이름만(서버가 확인해요)
  primary key (day, vid, event)                  -- 같은 날 같은 행동은 한 번만 세요
);
alter table public.visit_events enable row level security;

-- 처음 온 경로를 한 번만 기록해요. (이미 있으면 그대로 둬요)
create or replace function public.visit_attr(p_vid text, p_src text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_vid is not null and length(p_vid) between 8 and 128 and p_src is not null and length(p_src) <= 80 then
    update public.visitors set src = p_src where vid = p_vid and src is null;
  end if;
end;
$$;

-- 핵심 행동을 하루 한 번 기록해요. 가끔(약 1%) 90일 지난 기록도 지워요.
create or replace function public.visit_event(p_day date, p_vid text, p_event text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_vid is not null and length(p_vid) between 8 and 128 and p_event ~ '^[a-z_]{3,24}$' then
    insert into public.visit_events (day, vid, event) values (p_day, p_vid, p_event) on conflict do nothing;
  end if;
  if random() < 0.01 then
    delete from public.visit_events where day < p_day - 90;
  end if;
end;
$$;

-- 출처별로 방문자 수와 행동별 사람 수를 돌려줘요. (관리자 화면용)
create or replace function public.visit_funnel(p_since date)
returns table (src text, event text, n int)
language sql
security definer
set search_path = public
as $$
  select coalesce(v.src, 'direct'), 'visit'::text, count(distinct d.vid)::int
    from public.visit_days d join public.visitors v on v.vid = d.vid
   where d.day >= p_since
   group by 1
  union all
  select coalesce(v.src, 'direct'), e.event, count(distinct e.vid)::int
    from public.visit_events e join public.visitors v on v.vid = e.vid
   where e.day >= p_since
   group by 1, 2;
$$;

revoke all on function public.visit_attr(text, text) from public, anon, authenticated;
revoke all on function public.visit_event(date, text, text) from public, anon, authenticated;
revoke all on function public.visit_funnel(date) from public, anon, authenticated;
grant execute on function public.visit_attr(text, text) to service_role;
grant execute on function public.visit_event(date, text, text) to service_role;
grant execute on function public.visit_funnel(date) to service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 일별 방문 추이(관리자 화면): 하루 방문자 수와 그중 처음 온 사람 수. 이 파일 전체를 다시 Run 하면 추가돼요.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.visit_daily(p_since date)
returns table (day date, visitors int, fresh int)
language sql
security definer
set search_path = public
as $$
  select d.day, count(*)::int, count(*) filter (where v.first_day = d.day)::int
    from public.visit_days d join public.visitors v on v.vid = d.vid
   where d.day >= p_since
   group by d.day
   order by d.day;
$$;

revoke all on function public.visit_daily(date) from public, anon, authenticated;
grant execute on function public.visit_daily(date) to service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 도리 상담실 대화방: 로그인한 회원의 대화방(방마다 한 줄)을 서버에 한 부 두어요. 마지막 대화 후 30일이 지나면
-- 불러올 때 함께 지워지고, 회원을 지우면(탈퇴) 함께 지워져요. 이 파일 전체를 다시 Run 하면 추가돼요.
-- (코드를 배포하기 '전에' Run 하세요. 없으면 이 기능만 조용히 꺼져 있고 대화는 이 기기에만 저장돼요)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.chat_rooms (
  user_id text not null references public.users(id) on delete cascade,
  room_id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, room_id)
);
create index if not exists chat_rooms_updated_idx on public.chat_rooms (updated_at);
alter table public.chat_rooms enable row level security;
