# Supabase 설정 (회원·뽑기 기록 DB)

로그인한 회원의 "매일 첫 1회 무료"를 서버에서 세고, 회원 탈퇴를 처리하기 위한 DB예요.
`SUPABASE_URL` 과 `SUPABASE_SERVICE_ROLE_KEY` 가 **없으면 DB 없이 동작**해요(예전처럼 브라우저 카운터만 사용).

## 1. 프로젝트 만들기
1. https://supabase.com 에 GitHub 로 가입 → **New project**
2. 이름: `wanna-know-500won`, Database Password: 아무 안전한 값(따로 적어 두세요, 코드에는 안 써요)
3. **Region: Northeast Asia (Seoul)** ← 개인정보처리방침이 "서울 리전 저장"으로 적혀 있어요. 다른 지역을 고르면 방침을 고쳐야 해요.
4. Create (1~2분 기다려요)

## 2. 테이블 만들기
1. 왼쪽 **SQL Editor → New query**
2. 저장소의 `supabase/schema.sql` 내용을 전부 붙여넣고 **Run**
3. **Table Editor** 에 `users`, `draws` 두 테이블이 생기면 성공이에요. 각 테이블에 "RLS enabled" 가 보여야 해요.

## 3. 키 복사
**Project Settings(톱니) → API** (또는 *API Keys*)
- **Project URL** → `SUPABASE_URL`
- **service_role** 키(Reveal 눌러서 복사) → `SUPABASE_SERVICE_ROLE_KEY`
  - 이 키는 DB 전체 권한이에요. 채팅·git·브라우저 코드에 절대 올리지 마세요. (`anon` 키는 쓰지 않아요)
  - 새 콘솔에서 키 이름이 `secret` 키(`sb_secret_…`)로 보이면 그 값을 같은 자리에 쓰면 돼요.

## 4. 환경변수에 넣기
`.env.local` (로컬) 과 Vercel > Settings > Environment Variables (배포) 에 똑같이:
```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=키 값
DAILY_FREE_LIMIT_ENFORCED=        # 비워 두면 "기록만" (베타). 결제를 열 때 true
```
Vercel 은 값을 바꾼 뒤 **Redeploy** 해야 반영돼요.

## 5. 동작
- 로그인 시 `users` 에 회원번호·닉네임 저장/갱신
- 풀이가 정상으로 나갈 때마다 `draws` 에 (회원번호, 한국 날짜, 주제) 1줄 기록. AI 키(`ANTHROPIC_API_KEY`)가 없어 한마디를 쓰지 않는 상태에서도 사주 리포트가 나가면 기록해요. (AI 호출이 일시적으로 실패한 요청은 세지 않아요) 생년월일시·성별·풀이 내용은 저장하지 않아요.
- 랜딩의 "오늘/이번 달 뽑기 횟수"는 로그인 상태면 서버 값을 보여줘요.
- `DAILY_FREE_LIMIT_ENFORCED=true` 이면 오늘 1회를 쓴 로그인 회원은 결제 없이 더 못 뽑아요(안내 문구 표시). 결제 기능이 생기기 전에는 켜지 마세요 — 베타 사용자가 막혀요.
- 로그인 화면의 **회원 탈퇴** → `users` 행 삭제(→ `draws` 도 연쇄 삭제) + 로그인 쿠키 삭제.
- DB 가 잠깐 안 돼도 로그인·풀이는 계속돼요(횟수 제한만 건너뜀).

## 6. 알아둘 점
- "하루"는 **한국 시간 0시** 기준이에요.
- 로그인하지 않고 뽑으면 서버 집계가 없어요(브라우저 카운터만). 정식으로 "무료 1회"를 강제하려면 뽑기 전에 로그인을 요구하도록 바꾸는 게 좋아요.
- 뽑기를 동시에 여러 번 누르면 아주 드물게 무료가 한 번 더 나갈 수 있어요(비용이 큰 문제는 아니라 지금은 허용).
- 카카오 콘솔의 "웹훅(연결 해제)"을 설정하면, 카카오 쪽에서 연결을 끊은 회원도 자동 삭제할 수 있어요. (선택, 다음 단계)
