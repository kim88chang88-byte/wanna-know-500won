# 네이버 로그인 설정

## 1. 애플리케이션 등록
1. https://developers.naver.com → 로그인 → **Application → 애플리케이션 등록**
2. 애플리케이션 이름: `꽃거지의 신묘한 사주` (로그인 동의 화면에 보여요)
3. **사용 API**: `네이버 로그인` 선택
4. **제공 정보 선택** (받을 정보): 필수 항목에 **별명(닉네임)** 만 체크해요. 이메일·이름·연락처는 체크하지 마세요. (개인정보처리방침에 적힌 범위가 닉네임뿐이에요)
5. **환경 추가 → PC 웹**
   - 서비스 URL: `https://wanna-know-500won.vercel.app`
   - **Callback URL** (정확히 일치해야 해요, 여러 개 가능):
     - `http://localhost:3000/api/auth/naver/callback`
     - `http://localhost:3005/api/auth/naver/callback`
     - `https://wanna-know-500won.vercel.app/api/auth/naver/callback`
6. 등록하면 **Client ID** 와 **Client Secret** 이 나와요. (채팅에 붙여넣지 마세요)

## 2. 환경변수
`.env.local` 과 Vercel 환경변수(Production 포함)에 넣고 Vercel 은 Redeploy:
```
NAVER_CLIENT_ID=...
NAVER_CLIENT_SECRET=...
```
`AUTH_SECRET` 은 카카오·구글과 같은 값을 써요.

## 3. 개발 중 / 검수
- 등록 직후는 **개발 중** 상태라서 **멤버관리**에 등록한 네이버 계정(본인 포함)만 로그인돼요. 애플리케이션 → **멤버관리** 에서 테스트할 네이버 아이디를 추가하세요.
- 누구나 쓰게 하려면 **API 설정 → 검수 요청**을 해야 해요(서비스 소개, 화면 캡처, 개인정보처리방침 URL 등). 승인까지 며칠 걸릴 수 있어요.

## 4. 동작
- 받는 정보: 네이버 회원 고유 ID(앱마다 다른 값)와 별명. 토큰은 저장하지 않아요.
- 회원 ID 는 `n_<고유ID>` 로 저장돼서 카카오·구글과 겹치지 않아요.
- 같은 사람이 여러 방식으로 로그인하면 서로 다른 회원이에요.
- 오류가 나면: 네이버 화면의 오류 → Callback URL 확인(200 없이 끝에 슬래시 없음), 로그인 후 "아직 열리지 않았어요" → 환경변수 누락 또는 Redeploy 안 함.
