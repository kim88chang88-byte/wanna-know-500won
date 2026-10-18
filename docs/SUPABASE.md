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

## 생년월일시 기억하기 · 고민 통계 (선택 동의)

`supabase/schema.sql` 에 테이블 두 개가 추가됐어요. **배포 전에 Supabase 대시보드 > SQL Editor 에서 이 파일 전체를 한 번 더 Run** 해 주세요. (여러 번 실행해도 안전하고, 기존 데이터는 그대로예요)

| 테이블 | 언제 쌓이나 | 담는 것 | 지워지는 때 |
| --- | --- | --- | --- |
| `profiles` | 로그인한 회원이 "생년월일시를 기억해 주세요"(선택)에 동의했을 때 | 양력/음력, 연·월·일, 윤달 여부, 시·분(모르면 null), 성별 (회원당 1줄) | 로그인 창의 "기억한 정보 지우기" 또는 회원 탈퇴 |
| `concern_logs` | "고민을 통계에 써도 좋아요"(선택)에 동의했을 때 (로그인 여부 무관) | 고른 고민 버튼 id, 직접 쓴 글(200자), 나이대(예: 30s), 성별, 날짜, 주제 — **생년월일은 없어요** | 로그인 상태로 동의한 행은 탈퇴 시 삭제. 비로그인 동의 행은 `user_id` 가 null 이라 누구 것인지 알 수 없어 개별 삭제가 어려워요 |

- 두 동의는 질문지 마지막 단계에서 따로 받고, 기본값은 둘 다 꺼짐이에요. 이미 저장해 둔 회원이 정보를 고칠 때만 "기억하기"가 켜진 채로 보여요.
- 저장은 `/api/reading` 안에서 해요. 실패해도 풀이는 그대로 나가요. (`profileSaved` 로 결과를 알려줘요)
- `/api/auth/me` 는 로그인한 본인의 저장된 생년월일시만 내려줘요. 읽기에 실패해도(테이블을 아직 안 만든 경우 등) 로그인 확인은 그대로 성공해요.
- `DELETE /api/profile` 은 로그인한 본인의 저장 정보만 지워요.

통계 예시 (SQL Editor 에서 실행):

```sql
-- 최근 30일 많이 고른 고민 버튼
select tag, count(*) from public.concern_logs, unnest(tags) as tag
where day >= current_date - 30 group by tag order by count(*) desc;

-- 나이대 × 고민
select age_band, tag, count(*) from public.concern_logs, unnest(tags) as tag
group by age_band, tag order by age_band, count(*) desc;
```
