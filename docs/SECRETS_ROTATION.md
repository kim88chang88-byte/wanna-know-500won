# 비밀값 교체 (노출됐던 키 새로 만들기)

대화나 스크린샷에 한 번이라도 보인 비밀값은 **새로 만들고 예전 것은 폐기**하는 게 안전해요. 저장소가 공개(public)라서 더 중요해요.

## 원칙
1. **새 값 만들기 → Vercel에 넣기 → Redeploy → 로그인·뽑기 확인 → 예전 값 폐기** 순서로 해요. (폐기를 먼저 하면 그 사이 서비스가 멈춰요)
2. 새 값은 **채팅·코드·스크린샷에 붙여넣지 마세요.** 복사해서 바로 Vercel 입력칸에만 붙여넣으세요.
3. Vercel 환경변수는 값만 넣고(`이름=값` 통째로 X), 바꾼 뒤에는 반드시 **Redeploy** 해요.
4. 메뉴 이름은 각 서비스 화면에 따라 조금 다를 수 있어요.

## 교체 대상과 위치
| 값 | 어디서 | 바꾸면 생기는 일 |
|---|---|---|
| `AUTH_SECRET` | 터미널 `openssl rand -base64 32` 로 새로 만들어요 | **모든 로그인이 풀려요** (다시 로그인하면 돼요) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase > Project Settings > API Keys (새 secret key를 만들고 예전 것 삭제. 예전 방식 키만 있으면 JWT 설정에서 새로 생성) | 바꾸는 동안 DB 저장이 실패할 수 있어서, Vercel 교체 직후 바로 Redeploy 하세요 |
| `KAKAO_CLIENT_SECRET` | 카카오 개발자 > 내 애플리케이션 > 카카오 로그인 > 보안 > Client Secret **재발급** | 재발급 즉시 예전 값이 안 돼요 → Vercel 값을 바로 바꾸고 Redeploy |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console > API 및 서비스 > 사용자 인증 정보 > OAuth 클라이언트 > 새 secret 추가 후 예전 것 삭제 | 새 것을 먼저 추가하면 끊김 없이 바꿀 수 있어요 |
| `NAVER_CLIENT_SECRET` | 네이버 개발자센터 > 내 애플리케이션 > API 설정 > Client Secret **재발급** | 재발급 즉시 예전 값이 안 돼요 |
| `ANTHROPIC_API_KEY` | 아직 안 넣었다면 교체할 게 없어요. 넣을 때 **전용 새 키**로 (`docs/COST_GUARD.md`) | - |

(Client ID, redirect URI, Supabase URL은 비밀값이 아니라서 바꿀 필요 없어요.)

## 확인
- [ ] Vercel 값을 모두 바꾸고 Redeploy 했나요?
- [ ] 카카오/구글/네이버 각각 로그인이 되나요?
- [ ] 뽑기 후 Supabase `draws`에 새 줄이 생기나요?
- [ ] 예전 값은 각 서비스에서 폐기됐나요? (카카오·네이버는 재발급 시 자동 폐기)
- [ ] 비밀값이 `.env` 파일로 저장소에 올라간 적 없는지 확인했나요? (`.gitignore`가 `.env*`를 막고 있어요)
