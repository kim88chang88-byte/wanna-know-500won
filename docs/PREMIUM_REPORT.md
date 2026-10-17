# 프리미엄 사주 리포트 (ssaju)

자판기에서 생년월일시를 입력하면 결과창에 사주 리포트가 함께 나와요. `/premium` 화면에서 따로 볼 수도 있어요.

| 구분 | 레벨 | 보여주는 것 |
|------|------|------------|
| 일반 자판기 6종 | `basic` | 원국 4기둥(십성) · 오행 · 신강/신약(점수) |
| 프리미엄 카드 3종, `/premium` | `full` | 위 + 격국 · 용신 · 길흉신 · 구조 설명 · 올해 세운 · 대운 10칸 |

`basic` 일 때 격국·용신·대운 등은 **서버에서 비워서** 내려보내요. (화면에서 숨기기만 하는 게 아니에요) 레벨은 요청의 `level` 로 정하고, 지금은 결제가 없어 클라이언트 값을 그대로 따르니, 결제를 붙일 때 서버에서 권한을 확인하세요.

계산은 오픈소스 라이브러리 [golbin/ssaju](https://github.com/golbin/ssaju) (MIT, 의존성 0개)로 **서버 안에서 직접** 해요. API 키도, 외부 호출도, 월 호출 한도도 없어요.

## 파일 구조
| 파일 | 역할 |
|------|------|
| `src/lib/premium/types.ts` | 화면용 타입 |
| `src/lib/premium/report.ts` | 입력 검사 + `calculateSaju`(ssaju) → 화면용 데이터 (테스트 있음) |
| `src/app/api/premium/route.ts` | POST API. IP당 1분 20회 제한 |
| `src/components/premium/ManseReport.tsx` | 리포트 화면 |
| `src/components/premium/PremiumReportApp.tsx` | `/premium` 입력 폼 |
| `src/app/premium/page.tsx` | `/premium` 화면 |
| `src/components/landing/IntakeModal.tsx` | 모든 자판기에서 `/api/premium` 을 함께 호출 (프리미엄=full, 일반=basic) |

## 설치
```bash
npm install ssaju
```
(`package.json` 과 `package-lock.json` 변경을 커밋하세요. 배포(Vercel)는 이 의존성이 있어야 빌드돼요.)

## 알아둘 점
- **태어난 시간을 모르면** 시주를 비우고 오행은 보이는 세 기둥(6글자)만 세요. 다만 신강/신약·격국·용신은 ssaju 기본값(정오 12시)으로 계산돼서 달라질 수 있어요. 화면에 안내 문구가 나와요.
- 지역 평균시(출생지 경도 보정)는 쓰지 않아요. (`applyLocalMeanTime` 기본값 false)
- 신강/신약·격국·용신 같은 해석은 유파마다 달라서 정답이 없어요. 재미·참고용이라는 안내를 유지하세요.
- 라이브러리 버전이 올라가면 결과가 달라질 수 있어요. `package-lock.json` 으로 버전을 고정해 두세요.
- 입력 범위: 1900~2100년.

## 주제별 분석 (topic)
요청 본문에 `topic`(자판기 이름, 40자까지)을 보내면 응답 `report.topic`에 주제 맞춤 분석이 들어와요.
- 일반 자판기(basic): 성향·끌리는 사람/재물 방식 등 핵심 포인트만.
- 프리미엄(full): 여기에 올해 세운·현재 대운 기반 `timing`이 더해져요.
- 규칙 기반이라 AI 키가 없어도 동작하고, 재미·참고용이에요(건강운은 의학적 진단이 아니라는 안내 포함).

## 프리미엄 10페이지 리포트 (book)
`level: "full"` 일 때만 `report.book` 에 10페이지가 들어가요. basic 은 서버에서 빈 배열로 내려줘요.
1 한눈에 보기 · 2 명식 풀이 · 3 타고난 기질 · 4 오행 균형 · 5 십성 · 6 격국과 용신 · 7 주제 심층 분석 · 8 대운 · 9 세운·월별 · 10 신살과 행운 처방전.
- 코드: `src/lib/premium/book/index.ts`(구성), `book/dict.ts`(문장 사전). AI 호출 없이 규칙 기반이라 같은 입력이면 같은 결과예요.
- 화면: `src/components/premium/PremiumBook.tsx` (미드나잇+샴페인 골드, 한 페이지씩 넘겨 보기).
- 프리미엄 포토카드: `src/lib/card/drawPremiumCard.ts` (골드 프레임·메달리온·사주 네 기둥 플레이트). 일반은 파스텔 폴라로이드 그대로예요.
