# DESIGN.md — 도리 운세 사주 (wanna-know-500won)

> **Design System:** Dori Water Otter — 퐁당 수달 도사 운세자판기
> **Device Type:** Mobile-first, Desktop 대응
> **Color Mode:** Light
> **구현 위치:** `tailwind.config.ts`, `src/app/globals.css`, `src/components/landing/*`


> **2026-10-19 테마 개편:** 파란 물빛 톤에서 **깜찍 파스텔(연보라 + 말랑 핑크)** 로 바꿨어요.
> - `brand`(연보라, 주 색상 `brand-500 #8057e0`)와 `sky`(Tailwind 하늘색 자리에 연핑크를 넣음)를 `tailwind.config.ts` 한 곳에서 정의해요. 아래 색상표의 파란 값은 예전 값이에요.
> - 제목·버튼·배지는 둥글둥글한 **주아체(`font-cute`)**, 본문은 기존 산세리프예요. 주아체는 굵기가 하나뿐이라 `font-normal` 로 써요.
> - 바탕은 연분홍 → 연보라 → 연하늘 그라데이션(`globals.css` 의 `body`), 물방울은 분홍·보라 비누방울 느낌이에요.
> - 6대 자판기는 동물 캐릭터별 색: 성공운 용(앰버), 재물운 토끼(핑크), 연애운 팬더(브랜드 보라, BEST), 결혼운 팬더(푸크시아), 건강운 여우(에메랄드), 학업운 수달(블루).

---

## 1. 브랜드 & 스타일 개요

물가에 사는 수달 도사 **"도리"** 가 500원 동전 하나로 오늘의 운을 뽑아 주는 운세자판기. 엄숙한 점술이 아니라 맑은 물가에서 나누는 가벼운 수다 같은 분위기를 낸다.

- 무드: **Fresh Water Playful** × **Retro Vending Kitsch**
- 모티프: 물방울(bubble), 물결 빛, 조개·샘물·연못, 수달 캐릭터, 동전, 레버, 캡슐
- 말투: 친근한 해요체. 단정적 예언 대신 "~할 수 있어요", "~해 보세요".
- 서비스명: **도리 운세 사주** (`SERVICE_NAME` in `src/lib/siteInfo.ts`)
- 슬로건: "궁금하면 500원! 퐁당, 오늘의 운을 뽑아봐."

### 정직성 규칙 (디자인에도 적용)
- 가짜 통계·후기·순위·실시간 이용자 수·할인율·취소선 정가를 쓰지 않는다.
- 문구 예시는 반드시 **"예시"** 라벨을 붙인다.
- 무료 안내 문구는 **"매일 첫 1회 무료"** 로 통일한다.
- 프리미엄 심층 리포트는 준비 중임을 화면에 밝힌다.
- `src/components/landing/__tests__/data.test.ts` 가 위 규칙을 자동 검사한다.

---

## 2. 화면 구성 (Landing 순서)

| # | 섹션 | 컴포넌트 | 설명 |
|---|------|----------|------|
| 0 | 배경 | `BubbleBackground` | 떠오르는 물방울 12개(장식, `aria-hidden`) |
| 1 | 헤더 | `Header` | 로고 이미지 + 🌙 도리 운세 사주 + "✨ 퐁당" 배지 + 로그인/마이페이지 |
| 2 | 히어로 | `HeroSection` | 오늘/이번 달 뽑은 횟수 + "퐁당퐁당 수달 '도리'의 신비한 운세 자판기 🦦" |
| 3 | 쇼케이스 | `ShowcaseSection` | 도리 일러스트 + 속삭임 카드 |
| 4 | 운세 자판기 | `MachinesSection` | 6종 500원 자판기 카드 (레버 돌리기) |
| 5 | 프리미엄 | `PremiumSection` | 심층 리포트 3종 (준비 중 안내) |
| 6 | 예시 | `SampleSection` | "이런 물빛 운세 캡슐이 나와요" — 예시 문구 3개 |
| 7 | 신뢰 | `TrustSection` | 500원 / 매일 첫 1회 무료 / 결과지 카드 |
| 8 | 푸터 | `Footer` | 약관·개인정보·환불 안내 |
| 모달 | 로그인 | `LoginModal` | Kakao / Google / Naver |
| 모달 | 입력 | `IntakeModal` | 생년월일시·성별 입력 → 결과 `ResultCard` |

### 6종 자판기 (data.ts `MACHINES`)
| key | 이름 | fortune(짧은 라벨) | 색 테마 | 비고 |
|-----|------|--------------------|---------|------|
| machineSuccess | 물길 트이는 성공운 | 성공운 | cyan | |
| machineMoney | 황금 조개 재물운 | 재물운 | amber | |
| machineLove | 달빛 로맨스 연애운 | 연애운 | sky / primary | 인기 BEST, 강조 카드 |
| machineMarriage | 백년가약 인연운 | 결혼운 | purple | |
| machineHealth | 맑은 샘물 건강운 | 건강운 | emerald | |
| machineStudy | 지혜의 연못 학업운 | 학업운 | indigo | |

> `fortune` 값은 서버의 `normalizeTopic` 이 `성공운/재물운/연애운/결혼운/건강운/학업운` 포함 여부로 분류하므로 짧은 라벨을 유지해야 한다.

---

## 3. 색상 (Colors)

### 3.1 Otter 팔레트 (`tailwind.config.ts` → `otter`, `brand` 는 별칭)

| 토큰 | 값 | 용도 |
|------|-----|------|
| `otter-50` | `#f0f7ff` | 아주 옅은 배경 |
| `otter-100` | `#e0effe` | 칩·아이콘 배경 |
| `otter-200` | `#bae0fd` | 테두리 |
| `otter-300` | `#7ecbfb` | 물방울·하이라이트 |
| `otter-400` | `#3baaf5` | 보조 포인트 |
| `otter-500` | `#225eaa` | **브랜드 기본** (버튼, 링크, 강조) |
| `otter-600` | `#1b4d8d` | hover |
| `otter-700` | `#163e72` | pressed, 짙은 제목 |
| `otter-800` | `#14355f` | 결과 카드 어두운 면 |
| `otter-900` | `#152d4f` | 본문 강조 |

### 3.2 Material 스타일 토큰 (Stitch 시안 기준)

| 역할 | 값 |
|------|-----|
| primary | `#225eaa` |
| primary-container | `#76a9fa` |
| secondary | `#625595` |
| secondary-container | `#c6b7ff` |
| tertiary | `#6d5e00` |
| tertiary-container | `#c1a700` |
| background / surface | `#f7f9ff` |
| surface-variant | `#e0e2e8` |
| outline | `#727782` |
| outline-variant | `#c2c6d3` |
| on-surface | `#181c20` |
| error | `#ba1a1a` |

### 3.3 페이지 기본값
- 배경 `#F4F8FD`, 본문 `#1E293B` (`layout.tsx` body)
- 골드(`gold`)는 BEST 배지·프리미엄 테두리에만 소량 사용

### 3.4 자판기별 색 테마
cyan(성공) · amber(재물) · sky/primary(연애, BEST) · purple(결혼) · emerald(건강) · indigo(학업). 카드 배경은 해당 색 50~100, 배지는 100/700, 버튼은 500~600 계열.

### 3.5 결과 카드(캔버스, `drawCard.ts`)
파란 양피지 톤. 브랜드 `#225EAA`, 짙은 면 `#163E72`, 문구 "도리 운세 사주" / "도리의 한마디".

---

## 4. 타이포그래피

- 헤드라인: **Noto Serif KR** (`font-serifKr`), 700
- 본문/UI: **Plus Jakarta Sans** + 시스템 한글 폰트
- 아이콘: **Material Symbols Outlined**
- 인용·한마디: 세리프 이탤릭 + 따옴표(“ ”) 또는 ✧ ✦

| 토큰 | 크기 | 굵기 | 행간 |
|------|------|------|------|
| display-hero | 48px (모바일 32px) | 700 | 1.2 |
| headline-lg | 32px (모바일 26px) | 700 | 1.25 |
| headline-md | 24px | 600 | 1.3 |
| headline-sm | 20px | 700 | 1.4 |
| body-lg | 17px | 400 | 1.6 |
| body-md | 15px | 400 | 1.6 |
| body-sm | 13px | 400 | 1.5 |
| label | 11~14px | 600 | 1.3 |

---

## 5. 간격 · 모서리 · 레이아웃

- 컨테이너: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`, 섹션 간 세로 간격 48~80px
- 카드 내부 패딩 20~32px, 그리드 gap 16~24px
- 모서리: 카드 `rounded-3xl` (큰 패널 `rounded-[2.5rem]`), 버튼·칩 `rounded-full`, 입력 `rounded-2xl`
- 자판기 그리드: 모바일 1열 → `sm` 2열 → `lg` 3열
- 프리미엄 3종: 모바일 1열 → `md` 3열
- 터치 영역 최소 44px

---

## 6. 엘리베이션 & 효과

| 효과 | 클래스 / 키프레임 | 설명 |
|------|-------------------|------|
| 떠오르는 물방울 | `.bubble-item` / `bubbleRise` | 배경 물방울 상승 |
| 떠다니기 | `.floating-anim` / `floatBubble` | 일러스트 살랑거림 |
| 클릭 팝 | `.click-bubble` / `popOut` | 화면을 누르면 물방울 4개가 톡 |
| 수달 오라 | `.otter-bubble-aura` / `waterShimmer` | 일러스트 뒤 물빛 일렁임 |
| 물빛 글로우 | `.card-water-glow` | 카드 hover 시 푸른 그림자 |
| 레버 | 카드 내 레버 `rotate` 600ms | 눌렀을 때 회전 후 입력 모달 |

- 그림자는 푸른 계열(`shadow-[0_8px_30px_rgba(34,94,170,0.12)]`) 사용.
- **움직임 줄이기**(`prefers-reduced-motion`) 설정이면 물방울·클릭 팝을 숨기거나 만들지 않는다.

---

## 7. 컴포넌트 스타일

### 버튼
- 기본(Primary): `bg-otter-500 text-white rounded-full font-bold`, hover `otter-600`
- 레버 버튼: 카드 색 테마 버튼, `aria-label="{자판기 이름} 레버 돌리기"`, `data-testid` 로 테스트
- 보조(Ghost): 흰 배경 + `otter-200` 테두리

### 카드
- 흰 배경(또는 색 테마 50), 1px 테두리, `rounded-3xl`, 푸른 그림자
- BEST 카드는 primary 테두리 2px + 상단 배지
- 프리미엄 카드는 골드 테두리, 리본 "👑 도리 추천"

### 칩 & 배지
- 태그: "매일 첫 1회 무료", "인기 BEST", "예시", "준비 중"
- 배지: `rounded-full px-3 py-1 text-xs font-bold`, 색 테마 100/700

### 말풍선 · 속삭임 카드
- 도리의 한마디는 둥근 카드 + 세리프 이탤릭, 왼쪽에 🦦 아이콘

### 입력 모달
- 생년월일시·성별·고민 입력, 제출 버튼은 `from-brand-500 to-indigo-600` 그라디언트
- 오류 문구는 `error` 색, 중립적 안내 (인증 미설정 시 "아직 열리지 않았어요")

### 결과 카드(9:16)
- 파란 양피지 + 도리 말풍선, 저장/공유 지원 (`docs/RESULT_CARD.md`)

---

## 8. 이미지 에셋

`src/components/landing/imageManifest.json` 이 11개 키를 관리한다.

`logo, hero, machineSuccess, machineMoney, machineLove, machineMarriage, machineHealth, machineStudy, premiumDohwa, premiumFortune, premiumCompat`

- 기본은 Stitch 원격 URL. 영구 보관하려면 `npm run fetch-images` 또는 `public/images/<key>.png` 로 직접 저장하면 로컬 경로가 우선된다.
- `SafeImage` 는 로드 실패 시 이모지로 대체한다 (`alt` 필수).
- 기존 `public/images/hobo.png`, `machine.jpg`, `premiumMachine.jpg` 는 더 이상 쓰지 않는다.

---

## 9. 접근성

- 장식 요소(물방울, 클릭 팝)는 `aria-hidden="true"`
- 본문 대비 4.5:1 이상 (`#1E293B` on `#F4F8FD`)
- 모든 버튼에 텍스트 또는 `aria-label`
- 모션 줄이기 설정 존중
