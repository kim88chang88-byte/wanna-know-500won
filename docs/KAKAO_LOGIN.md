# 카카오 로그인 설정

코드는 이미 들어 있어요. 아래 값만 채우면 켜집니다. (값이 비어 있으면 로그인 버튼이 "아직 열리지 않았어요"로 안내해요)

## 1. 카카오 개발자 콘솔에서 할 일 (https://developers.kakao.com)
1. 앱 만들기 → **앱 키**의 **REST API 키** 확인
2. **카카오 로그인** 활성화 ON
3. **Redirect URI** 등록 (정확히 일치해야 해요)
   - 로컬: `http://localhost:3000/api/auth/kakao/callback`
   - 배포 후: `https://내도메인/api/auth/kakao/callback`
4. **동의항목**: `닉네임`만 켜기 (이메일·프로필 사진은 받지 않아요 — 개인정보처리방침과 같아야 해요)
5. **보안 > Client secret** 을 켰다면 값 확인
6. 플랫폼에 사이트 도메인 등록 (로컬 `http://localhost:3000`)

## 2. `.env.local`
```
KAKAO_CLIENT_ID=REST API 키
KAKAO_CLIENT_SECRET=Client secret (켰을 때만)
KAKAO_REDIRECT_URI=http://localhost:3000/api/auth/kakao/callback
AUTH_SECRET=openssl rand -base64 32 로 만든 값 (32자 이상)
```
키와 비밀키는 채팅이나 git에 올리지 마세요.

## 3. 동작
- `/api/auth/kakao` → 카카오 로그인 화면 (state 를 쿠키에 심어 CSRF 방지)
- `/api/auth/kakao/callback` → state 확인 → 코드로 토큰 교환 → `회원번호·닉네임`만 꺼내고 토큰은 버림 → 서명된 httpOnly 쿠키(30일) 발급
- `/api/auth/me` 로그인 여부·닉네임, `/api/auth/logout` 쿠키 삭제
- 사용자 DB는 아직 없어요. (쿠키만으로 동작) "매일 첫 1회 무료"를 서버에서 세려면 저장소가 필요해요.

## 4. 알아둘 점
- 카카오 앱이 "비즈 앱"이 아니면 이메일 등은 못 받아요. 닉네임은 기본 동의항목이에요.
- 서비스 로그아웃은 이 사이트 쿠키만 지워요. 카카오 계정은 로그아웃되지 않아요.
- 회원 탈퇴·연결 끊기(unlink)는 아직 없어요. 계정 정보를 서버에 저장하게 되면 함께 만들어야 해요.
