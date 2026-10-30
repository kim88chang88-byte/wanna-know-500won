# AI 비용 방어

AI(Anthropic)를 부르는 곳은 `/api/reading` 한 곳뿐이에요. (프리미엄 리포트는 규칙 기반이라 AI 비용이 없어요)
방어는 **세 겹**으로 해요. `ANTHROPIC_API_KEY`를 Vercel에 넣기 **전에** 1)을 먼저 하세요.

## 1) Anthropic 콘솔: 사용 한도 (가장 바깥쪽 안전망)
1. https://console.anthropic.com 로그인 → **Settings(설정) > Limits(한도)**
2. **월 지출 한도(Spend limit)** 를 작게 잡아요. 예) 첫 달은 $10~20. 한도에 닿으면 Anthropic이 호출을 막아요.
3. 알림(Notifications)이 있으면 한도의 50%/80%에 켜 두세요.
4. 이 서비스 전용 **API 키를 따로 만들어서** 쓰세요. (키 이름 예: `dori-prod`) 문제가 생기면 이 키만 지우면 돼요.
(메뉴 이름은 콘솔 화면에 따라 조금 다를 수 있어요.)

## 2) 서버 하루 상한 (코드)
- `AI_DAILY_CAP`: 하루(한국 시간)에 서버 전체에서 AI를 부를 수 있는 횟수. 비우면 300.
- 한도에 닿으면 AI 한마디만 빠지고 사주 리포트는 그대로 나가요. (키가 없을 때와 같은 모습이고, 뽑기는 정상으로 세요)
- 횟수는 Supabase `ai_usage` 표에 적혀요. 확인: `select * from public.ai_usage order by day desc;`
- 호출 1번 = 뽑기 1번이에요. 답변 형식이 어긋나 자동으로 한 번 더 부르는 경우는 따로 세지 않아서, 실제 호출은 최대 2배까지 갈 수 있어요.
- DB가 잠깐 안 될 때는 서버 메모리 카운터로 대신해요. (서버가 여러 개면 느슨하지만 무제한은 아니에요)
- 값 정하기: `하루 상한 × 한 번당 비용(약 몇 원) × 2(재시도) ≤ 하루에 쓰고 싶은 돈`. 모델은 기본 `claude-haiku-5-5`예요.

## 3) 비상 차단 스위치
- Vercel > Settings > Environment Variables 에 `AI_DISABLED` = `true` 추가 → **Redeploy**.
- 바로 AI 호출이 멈추고 사주 리포트만 나가요. 다시 켜려면 값을 지우고 Redeploy.
- Redeploy 버튼에서 재인증(인증 앱·패스키)이 막히면, `main`에 새 커밋을 올려도 새 배포가 만들어져 같은 환경변수가 적용돼요.
- 더 급하면 Anthropic 콘솔에서 해당 API 키를 삭제하세요. (즉시 막혀요)

## 점검 체크리스트 (키를 켜기 전)
- [ ] Supabase에 `supabase/schema.sql`의 `ai_usage` 부분을 Run 했나요?
- [ ] Anthropic 콘솔에 월 지출 한도를 걸었나요?
- [ ] 전용 키를 만들었고, 키를 대화·코드·스크린샷에 붙여넣지 않았나요?
- [ ] Vercel에 `ANTHROPIC_API_KEY`, `AI_DAILY_CAP` 입력 후 Redeploy 했나요?
- [ ] 몇 번 뽑아 본 뒤 `ai_usage`의 `calls`가 늘었나요?
