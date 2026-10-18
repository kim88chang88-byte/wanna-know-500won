# 배포 가이드 (Vercel)

## 0. 배포 전에 꼭 할 일 (내 Mac, 프로젝트 폴더)
1. **랜딩 이미지를 저장소에 넣기** — 자판기 이미지는 아직 외부(구글) 주소예요. 만료·차단될 수 있으니 내려받아서 커밋해요.
   ```bash
   npm run fetch-images
   git status          # public/images/ 에 새 파일, src/components/landing/imageManifest.json 변경이 보여야 해요
   git add public/images src/components/landing/imageManifest.json
   git commit -m "랜딩 이미지 로컬화"
   git push
   ```
2. **Next.js 보안 업데이트** — 설치할 때 `12 vulnerabilities` 경고가 있었고 Next 가 "outdated" 로 표시돼요. 같은 15 버전 안에서 최신으로 올려요.
   ```bash
   npm install next@^15 react@^19 react-dom@^19
   npm run build        # 에러 없이 끝나야 해요
   npm test
   ```
   `npm audit fix --force` 는 쓰지 마세요. (버전이 크게 바뀔 수 있어요)
3. **로컬에서 배포용 빌드 확인**
   ```bash
   npm run build && npm start
   ```
   `http://localhost:3000` 에서 랜딩 → 로그인 → 뽑기까지 한 번 해봐요. (배포 모드에서는 `/saju` 개발용 화면이 열리지 않는 게 정상이에요)

## 1. Vercel
1. https://vercel.com 에서 GitHub 로 가입 → **Add New > Project** → `wanna-know-500won` 저장소 선택 → Import
2. Framework 는 Next.js 로 자동 인식돼요. 설정은 그대로 두고 **환경변수를 먼저** 넣어요. (아래 2번)
3. Deploy

## 2. 환경변수 (Vercel > Project > Settings > Environment Variables)
| 이름 | 값 |
|---|---|
| `ANTHROPIC_API_KEY` | Anthropic Console 키 |
| `ANTHROPIC_MODEL` | (비워도 돼요) |
| `KAKAO_CLIENT_ID` | 카카오 REST API 키 |
| `KAKAO_CLIENT_SECRET` | Client secret (켰다면) |
| `KAKAO_REDIRECT_URI` | `https://배포주소/api/auth/kakao/callback` |
| `AUTH_SECRET` | 32자 이상 무작위 값. **로컬과 다른 새 값**을 만들어 쓰세요 (`openssl rand -base64 32`) |
| `NEXT_PUBLIC_SITE_URL` | `https://배포주소` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI` | 구글 로그인 (`docs/GOOGLE_LOGIN.md`) |
| `NAVER_CLIENT_ID` / `NAVER_CLIENT_SECRET` / `NAVER_REDIRECT_URI` | 네이버 로그인 (`docs/NAVER_LOGIN.md`) |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | DB 연결 (`docs/SUPABASE.md`). service_role 키는 서버 전용이라 절대 공개 금지 |
| `ADMIN_USER_IDS` | 관리자 화면(/admin)에 들어갈 회원번호 목록 (쉼표로 구분, `docs/ADMIN.md`) |
| `DAILY_FREE_LIMIT_ENFORCED` | `true` 면 하루 무료 횟수를 서버에서 강제해요. 결제 연동 전에는 비워 두세요 |
| `PREMIUM_UNLOCK_ALL` | `true` 면 프리미엄 리포트가 전부 열려요. **베타 전용**, 결제를 열 때 반드시 비우세요 |

> DB 스키마(`supabase/schema.sql`)는 **코드를 배포하기 전에** 먼저 Supabase SQL Editor 에서 Run 하세요. 새 컬럼이 없으면 저장이 실패해요.

값은 이름 칸/값 칸에 **값만** 넣어요 (`이름=값` 통째로 붙여넣지 않기). 환경변수를 바꾼 뒤에는 **Redeploy** 해야 반영돼요.
배포 주소는 처음에는 `프로젝트이름.vercel.app` 이에요. 도메인을 연결하면 아래 3번의 주소들을 새 도메인으로 바꿔요.

## 3. 카카오 개발자 콘솔에 배포 주소 등록
- **카카오 로그인 > 일반 > 리다이렉트 URI** 에 `https://배포주소/api/auth/kakao/callback` 추가 (로컬 주소는 그대로 둬도 돼요)
- **앱 > 일반(플랫폼) > Web** 사이트 도메인에 `https://배포주소` 추가
- 앱이 **개발 중** 상태면 팀원(역할이 있는 계정)만 로그인돼요. 일반 사용자가 쓰려면 앱 **서비스 전환(운영)** 이 필요해요. 닉네임만 받는 기본 설정은 심사 없이 전환되는 경우가 많아요. 콘솔 안내를 확인하세요.

## 4. 도메인 연결 (선택)
Vercel > Settings > Domains 에서 도메인 추가 → 안내대로 DNS(CNAME/A)를 등록. 연결 후 위 2·3번의 주소를 새 도메인으로 바꾸고 Redeploy.

## 5. 배포 직후 점검표
- [ ] 랜딩이 열리고 자판기 이미지가 보인다
- [ ] 마이페이지 → 카카오 로그인 → 돌아와서 닉네임이 보인다
- [ ] 뽑기 → 생년월일 입력 → 결과 카드가 나온다 (키가 없으면 "풀이 준비 중" 안내)
- [ ] 결과 카드 이미지 저장·공유가 된다 (휴대폰 브라우저로도 확인)
- [ ] `/terms`, `/privacy`, `/refund` 가 열린다
- [ ] `/saju` 는 404 가 나온다
- [ ] 카카오톡으로 링크를 보냈을 때 미리보기가 나온다

## 6. 비용·안전
- **Anthropic Console 에서 월 사용 한도(spend limit)를 꼭 설정**하세요. 풀이 요청마다 비용이 들어요.
- 호출 제한(IP당 1분 6회)은 서버 한 대(인스턴스) 메모리 기준이라, 배포 환경에서는 느슨할 수 있어요. 트래픽이 늘면 Upstash Redis 같은 저장소 기반으로 바꾸는 걸 권장해요.
- "매일 첫 1회 무료"는 아직 브라우저에만 저장돼서 지우면 초기화돼요. 계정별 서버 집계(DB)를 붙이기 전까지는 베타로 안내하세요.
- 결제를 열기 전에 이용약관·개인정보처리방침·환불 안내의 법률 검토가 필요해요.
