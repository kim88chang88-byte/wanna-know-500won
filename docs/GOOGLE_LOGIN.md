# 구글 로그인 설정

## 1. 구글 클라우드 프로젝트
1. https://console.cloud.google.com 접속 → 상단 프로젝트 선택 → **새 프로젝트** (이름 예: `wanna-know-500won`)
2. **API 및 서비스 → OAuth 동의 화면** (새 콘솔: *Google Auth Platform → 브랜딩/대상*)
   - 앱 이름: 꽃거지의 신묘한 사주 / 지원 이메일: 본인 이메일
   - 대상(User type): **외부(External)**
   - 승인된 도메인: 배포 도메인 (예: `vercel.app` 은 등록 불가일 수 있어요. 비워도 테스트는 됩니다)
   - 개인정보처리방침 링크: `https://<도메인>/privacy`, 서비스 약관 링크: `https://<도메인>/terms`
   - 범위(Scopes): 기본(`openid`, `profile`)만. 민감한 범위는 추가하지 마세요.
3. **테스트 중** 상태에서는 "테스트 사용자"로 추가한 구글 계정만 로그인돼요. 누구나 쓰게 하려면 **앱 게시(프로덕션으로 이동)** 를 누르세요. 기본 범위만 쓰면 별도 심사 없이 게시돼요.

## 2. OAuth 클라이언트 만들기
**사용자 인증 정보 → 사용자 인증 정보 만들기 → OAuth 클라이언트 ID**
- 애플리케이션 유형: **웹 애플리케이션**
- **승인된 리디렉션 URI** (정확히 일치해야 해요. 끝에 슬래시 없음):
  - `http://localhost:3000/api/auth/google/callback`
  - `https://wanna-know-500won.vercel.app/api/auth/google/callback`
- 만들면 나오는 **클라이언트 ID** 와 **클라이언트 보안 비밀번호** 를 복사해요 (채팅에 붙여넣지 마세요).

## 3. 환경변수
`.env.local` 과 Vercel(Settings → Environment Variables)에 넣고 Vercel 은 Redeploy:
```
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=...
```
(`AUTH_SECRET` 은 카카오 로그인과 같은 값을 그대로 써요.)

## 4. 동작
- 받는 정보: 구글 계정 고유번호(sub)와 이름. 이메일·사진은 요청하지 않아요. 토큰은 저장하지 않아요.
- 회원 ID 는 `g_<고유번호>` 로 저장돼서 카카오 회원번호와 겹치지 않아요.
- 같은 사람이 카카오와 구글로 각각 로그인하면 **서로 다른 회원**이에요(무료 횟수도 따로). 계정 합치기는 이메일 수집이 필요해서 지금은 하지 않아요.
- 오류가 나면: `redirect_uri_mismatch` → 2번의 리디렉션 URI 를 다시 확인, `access_denied`/403 → 테스트 사용자 등록 또는 앱 게시 확인.
