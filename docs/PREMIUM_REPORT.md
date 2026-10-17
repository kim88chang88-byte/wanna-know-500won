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
