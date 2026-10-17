# SAZU 프리미엄 리포트 (사주 원국 · 오행 · 신강/신약)

`/premium` 화면에서 생년월일시를 입력하면 SAZU 만세력 API(v2 `readings.manse`)로 사주 원국 4기둥, 오행 분포, 신강·신약을 보여줘요.

## 파일 구조
| 순서 | 파일 | 역할 |
|------|------|------|
| 1 | `src/lib/sazu/types.ts` | 입력·화면용 타입 |
| 2 | `src/lib/sazu/report.ts` | 입력 검사 + SDK 응답 → 화면용 데이터 변환 (순수 함수, 테스트 있음) |
| 3 | `src/lib/sazu/client.ts` | **서버 전용.** `SazuClient` 생성(`SAZU_API_KEY`), `readings.manse` 호출, `SazuApiError` 분기 |
| 4 | `src/app/api/sazu/route.ts` | POST API. 검사 → 호출 → 변환. IP당 1분 5회 제한 |
| 5 | `src/components/premium/ManseReport.tsx` | 4기둥 카드 · 오행 막대 · 신강/신약 박스 |
| 6 | `src/components/premium/PremiumReportApp.tsx` | 입력 폼(클라이언트) → `/api/sazu` 호출 |
| 7 | `src/app/premium/page.tsx` | 화면 |

API 키는 `client.ts`(서버)에서만 읽어요. 브라우저로는 변환된 결과만 내려가요.

## 설정
```bash
npm install @sazuapp/client
```
`.env.local` 에 추가 (따옴표·공백 없이, `NEXT_PUBLIC_` 금지):
```
SAZU_API_KEY=sazu_free_...
```
Vercel 에도 같은 이름으로 넣고 **Redeploy** 해야 반영돼요.

```bash
npm run dev
# http://localhost:3000/premium  (포트가 다르면 터미널에 나온 주소)
```

## 주의
- **Free 키는 고정 샘플 프로필 5종에만 응답**해요. 실제 생년월일은 유료 키에서 계산돼요. Free 키로 다른 날짜를 넣으면 오류(`SAMPLE_PROFILE_REQUIRED` 등)가 날 수 있어요. 샘플 목록: `GET /v2/sazu/samples`.
- 월 호출 한도(Free 500회, 분당 10회)가 있고 테스트 호출도 차감돼요.
- `birthMonth` 는 1~12 예요. 시간을 모르면 `birthHour: null`.
- 에러: `SazuApiError` 의 `isAuthError`(키 문제 → 503) · `isRateLimited`(429) · `isTransient`(502) · 그 외(400).
- 유료 플랜에서 격국·용신·세운 등 모듈이 늘어나면 `report.ts` 에 변환을 추가하고 `ManseReport.tsx` 에 카드를 더하면 돼요.

## 프리미엄 자판기 결과창 연동
프리미엄 자판기(2,990원 카드)에서 레버를 돌려 생년월일시를 입력하면, 결과창에 `/api/sazu` 결과(4기둥·오행·신강/신약)가 함께 나와요.
- 출생 도시는 묻지 않고 `서울`로 보내요. (`IntakeModal.tsx` 의 `DEFAULT_BIRTH_CITY`)
- SAZU 호출이 실패해도 기본 풀이는 그대로 보이고, 그 자리에 안내 문구가 나와요.
- 일반 자판기는 SAZU 를 호출하지 않아요. (월 호출 한도 보호)
