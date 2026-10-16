# AI 풀이 (Claude API)

## 흐름
`POST /api/reading` → 호출 제한 확인 → `calculateSaju`(명식 계산) → `interpretSaju`(Claude 호출) → `toPublicReading`(공개 범위 선택) → 응답

응답: `{ chart, reading, readingStatus }`
- `readingStatus`: `"ok"` | `"unavailable"`(API 키 없음) | `"failed"`(풀이 실패). 실패해도 `chart`(네 기둥)는 항상 내려가요.

## 풀이 구조 (`src/lib/ai/reading.ts`)
| 필드 | 설명 |
|---|---|
| `keyword` | 오늘의 키워드 (20자 이내) |
| `total` | 총운: 점수 1~5 + 한 줄 요약 |
| `love` / `money` / `mind` | 연애운·금전운·마음운: 점수 1~5 + 1~2문장 |
| `kkotgeoji` | 꽃거지 한마디 (2~3문장, 300자 이내) |

Claude 구조화 출력(`output_config.format = json_schema`)으로 이 모양을 강제하고, 받은 뒤 `parseReading` 으로 한 번 더 검사해요. (점수 범위, 글자 수, 금지 표현)

## 무료 공개 범위 (`toPublicReading`)
- 무료: 키워드, 총운, 꽃거지 한마디, 연애·금전·마음운의 **점수**
- 잠금: 연애·금전·마음운의 **풀이 문장** — 화면에서 블러로 가리는 게 아니라 **서버가 응답에 넣지 않아요.** (블러만 하면 개발자 도구로 보임)
- 유료(500원) 공개는 결제 연결 후 `tier` 를 늘려서 구현합니다. 클라이언트가 보내는 값으로는 절대 바꾸지 않아요.

## 프롬프트 (`src/lib/ai/prompt.ts`)
- 말투·금지 사항(겁주기, 죽음/질병/이혼, 의료·법률·투자 조언 등)은 BRIEF.md 의 "뽑기 언어, 무섭지 않게" 방향을 따라요.
- 모델에는 **계산된 사실만** 넘깁니다: 일간, 오행 분포, 네 기둥, 고른 주제, 성별. 출생 연월일 자체는 보내지 않아요.
- 문구를 다듬고 싶으면 `SYSTEM_PROMPT` 만 고치면 됩니다. 바꾼 뒤에는 실제 키로 여러 사주를 뽑아 톤을 확인하세요.

## 설정
`.env.local`
```
ANTHROPIC_API_KEY=...        # 필수 (없으면 풀이 없이 네 기둥만 표시)
ANTHROPIC_MODEL=             # 선택. 기본 claude-haiku-5-5
```

## 비용과 남용 방지
- 모델 단가는 https://platform.claude.com/docs/en/models/overview 에서 확인하세요. 요청 1건당 입력 1천 토큰 안팎, 출력 수백 토큰으로 어림잡은 값이니, 실제 사용량은 Anthropic Console 에서 확인하세요.
- 지금은 서버 메모리 기준 "IP당 분당 6회" 제한만 있어요. 서버리스에서는 인스턴스마다 따로 세기 때문에 **완전한 방어가 아닙니다.**
- "매일 첫 1회 무료"는 아직 브라우저에만 저장돼서, 직접 API를 호출하면 우회할 수 있어요. 로그인·결제를 붙이면 계정 기준의 서버 쪽 횟수 관리와 월 예산 상한(알림)으로 바꿔야 합니다.

## 테스트
- `src/lib/ai/__tests__/` — 스키마 제약, 검사 규칙, 무료 공개 범위, 가짜 fetch 로 재시도/오류 처리
- 실제 API 호출은 테스트하지 않아요. 키를 넣은 뒤 `npm run dev` 로 직접 확인하세요.
