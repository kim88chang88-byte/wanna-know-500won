# DESIGN.md — wanna-know-500won

> **Design System:** Romantic Retro Saju Vending  
> **Project ID:** `6387763815083544476`  
> **Design System Asset:** `assets/05900c14372846ac9acdbb38c2080412`  
> **Device Type:** Desktop (Mobile-first 기준)  
> **Color Mode:** Light

---

## 브랜드 & 스타일 개요

20~40대 여성을 타겟으로 한 로맨틱·복고풍 사주 자판기 서비스. 90~2000년대 한국 순정만화 웹툰 감성과 레트로 캡슐 뽑기 기계(가챠) 노스탤지어를 결합한다.

- **Romantic Webtoon Editorial** × **Tactile Retro-Kitsch** 두 무드를 혼합
- 벚꽃 꽃잎·망점 스파클·파스텔 비네트 그라디언트 등 시각적 질감 강조
- 500원 동전 자판기, 빈티지 티켓, 부적, 말풍선에서 모티프를 가져온 인터랙티브 컴포넌트
- 엄숙한 점술이 아닌, 꽃미남 꽃거지와의 봄날 대화 같은 감성

---

## 화면 목록 (Screens)

| # | 화면 ID | 제목 | 크기 |
|---|---------|------|------|
| 1 | `c5963148d1ab4f3cb2a68277f25f1b21` | 꽃거지 사주자판기 — 캡슐 폭발 & 벚꽃잎 인터랙션 모달 | 2560 × 5742 |
| 2 | `b22e9d715a014aaa8ac5eccb1aeece8c` | 꽃거지 사주자판기 — 500원 동전 짤랑 & 캡슐 폭발 사운드 모달 | 2560 × 5742 |
| 3 | `b9b08e26de424969b108f55a73762668` | 꽃거지 사주자판기 — 500원 캡슐 운세 결과 모달 | 2560 × 5742 |
| 4 | `0846df5bc72d4f8d858a43c8ff6b4fc1` | 꽃거지 사주자판기 — 캡슐 폭발 & 찰칵/팡! 사운드 토글 모달 | 2560 × 5742 |
| 5 | `e69af48510d1466590b580919a936206` | 꽃거지의 신비한 사주자판기 — 500원 즉석 & 2,990원 프리미엄 트윈 자판기 랜딩 | 2560 × 7956 |
| 6 | `c30d1b0b683146dbad359255073ad7e3` | 꽃거지 사주자판기 — 500원 동전 투입 흡입 모션 & 캡슐 폭발 모달 | 2560 × 5742 |

> **숨김 처리된 화면 (hidden):** `177360630f954f5bbd90e15a17a77594`, `1eb3734b102f4b2aa445869ef44e77a6`, `b0368ab918b142758a5824cdbe5a4727`

---

## 색상 (Colors)

### 핵심 브랜드 색상

| 역할 | 토큰 | Hex | 설명 |
|------|------|-----|------|
| Primary | `primary` | `#9c3e54` | 딥 체리 로즈 — 주요 액션·포커스 |
| Primary Container | `primary-container` | `#e87a90` | 체리블라썸 핑크 — 히어로 액션·키 액센트 |
| Inverse Primary | `inverse-primary` | `#ffb2be` | 라이트 핑크 |
| Secondary | `secondary` | `#674bb5` | 트와일라잇 라벤더 — 영적 액센트·태그 |
| Secondary Container | `secondary-container` | `#ab8ffe` | 소프트 퍼플 |
| Tertiary | `tertiary` | `#735c00` | 앤틱 골드 다크 |
| Tertiary Container | `tertiary-container` | `#cca72f` | 500원 앤틱 골드 — 동전·포춘 스탬프 |

### Override (디자인 시스템 씨드)

| 역할 | Hex |
|------|-----|
| Primary (override) | `#e87a90` |
| Secondary (override) | `#a78bfa` |
| Tertiary (override) | `#d4af37` |
| Neutral (override) | `#5a4e57` — Soft Cocoa Charcoal |

### 서피스 & 배경

| 토큰 | Hex | 용도 |
|------|-----|------|
| `background` | `#fff7f9` | 페이지 기본 배경 |
| `surface` | `#fff7f9` | 기본 서피스 |
| `surface-bright` | `#fff7f9` | 밝은 서피스 |
| `surface-dim` | `#e6d5e0` | 어두운 서피스 |
| `surface-container-lowest` | `#ffffff` | 카드 최하단 레이어 |
| `surface-container-low` | `#ffeff9` | 낮은 컨테이너 |
| `surface-container` | `#fbe9f4` | 기본 컨테이너 |
| `surface-container-high` | `#f5e3ee` | 높은 컨테이너 |
| `surface-container-highest` | `#efdee9` | 최상위 컨테이너 |
| `surface-variant` | `#efdee9` | 서피스 변형 |
| `surface-tint` | `#9c3e54` | 틴트 색상 |
| `inverse-surface` | `#382d36` | 다크 모드 서피스 |
| `inverse-on-surface` | `#feecf7` | 다크 서피스 위 텍스트 |

### 텍스트 & 아웃라인

| 토큰 | Hex |
|------|-----|
| `on-surface` | `#221920` |
| `on-surface-variant` | `#554245` |
| `on-background` | `#221920` |
| `on-primary` | `#ffffff` |
| `on-primary-container` | `#64132b` |
| `on-secondary` | `#ffffff` |
| `on-secondary-container` | `#3f1e8c` |
| `on-tertiary` | `#ffffff` |
| `on-tertiary-container` | `#4e3d00` |
| `outline` | `#877274` |
| `outline-variant` | `#dac0c3` |

### 고정 색상 (Fixed)

| 토큰 | Hex |
|------|-----|
| `primary-fixed` | `#ffd9de` |
| `primary-fixed-dim` | `#ffb2be` |
| `on-primary-fixed` | `#3f0015` |
| `on-primary-fixed-variant` | `#7e273d` |
| `secondary-fixed` | `#e8ddff` |
| `secondary-fixed-dim` | `#cebdff` |
| `on-secondary-fixed` | `#21005e` |
| `on-secondary-fixed-variant` | `#4f319c` |
| `tertiary-fixed` | `#ffe088` |
| `tertiary-fixed-dim` | `#e9c349` |
| `on-tertiary-fixed` | `#241a00` |
| `on-tertiary-fixed-variant` | `#574500` |

### 에러

| 토큰 | Hex |
|------|-----|
| `error` | `#ba1a1a` |
| `on-error` | `#ffffff` |
| `error-container` | `#ffdad6` |
| `on-error-container` | `#93000a` |

---

## 타이포그래피 (Typography)

**폰트 패밀리**
- 헤드라인: **Playfair Display** (serif, 로맨틱 만화 제목체)
- 바디 / UI: **Plus Jakarta Sans** (sans-serif, 가독성 우선)
- 레이블: **Plus Jakarta Sans**

### 타입 스케일

| 토큰 | 폰트 | 크기 | 굵기 | 행간 | 자간 |
|------|------|------|------|------|------|
| `display-hero` | Playfair Display | 48px | 700 | 58px | -0.02em |
| `display-hero-mobile` | Playfair Display | 34px | 700 | 42px | -0.01em |
| `headline-lg` | Playfair Display | 32px | 700 | 40px | — |
| `headline-lg-mobile` | Playfair Display | 26px | 600 | 34px | — |
| `headline-md` | Playfair Display | 24px | 600 | 32px | — |
| `headline-sm` | Plus Jakarta Sans | 20px | 700 | 28px | — |
| `body-lg` | Plus Jakarta Sans | 17px | 400 | 26px | — |
| `body-md` | Plus Jakarta Sans | 15px | 400 | 24px | — |
| `body-sm` | Plus Jakarta Sans | 13px | 400 | 20px | — |
| `label-lg` | Plus Jakarta Sans | 14px | 600 | 20px | 0.02em |
| `label-md` | Plus Jakarta Sans | 12px | 600 | 16px | 0.04em |
| `label-sm` | Plus Jakarta Sans | 11px | 500 | 14px | — |

**스타일 포인트:** 운세 결과 인용구·금언은 이탤릭 serif + 장식 따옴표 또는 별 글리프(`✧`, `✦`)로 처리.

---

## 간격 (Spacing)

| 토큰 | 값 |
|------|-----|
| `space-xs` | 0.25rem (4px) |
| `space-sm` | 0.5rem (8px) |
| `space-md` | 1rem (16px) |
| `space-lg` | 1.5rem (24px) |
| `space-xl` | 2.25rem (36px) |
| `gutter` | 1rem |
| `gutter-desktop` | 1.5rem |
| `margin` | 1rem |
| `margin-desktop` | 2.5rem |

---

## 모서리 반경 (Border Radius)

| 토큰 | 값 | 비고 |
|------|-----|------|
| `rounded-sm` | 0.25rem (4px) | — |
| `rounded` (DEFAULT) | 0.5rem (8px) | 기본값 |
| `rounded-md` | 0.75rem (12px) | — |
| `rounded-lg` | 1rem (16px) | 카드·패널 |
| `rounded-xl` | 1.5rem (24px) | 대형 컨테이너 |
| `rounded-full` | 9999px | 버튼·칩·코인 |

> **Roundness 설정:** `ROUND_EIGHT` (8px 기본)

---

## 레이아웃 & 그리드

### 기본 구조

- **Mobile-first:** 390px–480px 기준 스테이지
- **Desktop:** 최대 콘텐츠 캔버스 1080px, 12컬럼 반응형 그리드
- **데코레이션 사이드 레일:** 벚꽃 파티클 애니메이션 + 빈티지 프레임 보더 (데스크톱)

### 화면별 레이아웃 규칙

#### Screen 5: 트윈 자판기 랜딩 (`e69af48510d1466590b580919a936206`)
- 가장 긴 화면 (7956px) — 전체 서비스 진입점
- 500원 즉석 / 2,990원 프리미엄 자판기 두 개를 나란히 배치 (Twin Layout)
- 히어로 섹션: `display-hero` 타입 + 벚꽃 파티클 배경
- CTA 구역: 코인 투입 버튼 중앙 배치, 주변에 글로우 애니메이션

#### Screen 1–2, 4, 6: 동전 투입 & 캡슐 폭발 모달 (`c5963148...`, `b22e9d71...`, `0846df5b...`, `c30d1b0b...`)
- 모두 2560 × 5742 — 모달 오버레이 + 배경 랜딩 스크롤
- 중앙 모달: `rounded-xl` (24px), 프로스티드 글라스 (`backdrop-filter: blur(12px)`)
- 동전 투입 애니메이션 → 캡슐 폭발 → 벚꽃잎 파티클 순서 인터랙션
- 사운드 토글 위치: 모달 우측 상단 코너

#### Screen 3: 운세 결과 모달 (`b9b08e26de424969b108f55a73762668`)
- 사주 결과지 (결과지 레이아웃):
  - 배경: `#FFFDF9` 양피지 질감
  - 상단: 점선 tear-off 보더
  - 하단: 왁스 씰 / 500원 코인 스탬프
  - 운세 텍스트: `headline-md` (Playfair Display, italic)
  - 꽃거지 캐릭터 말풍선: 크림 배경 + `border-radius: 16px` + 핑크 그림자 + 말꼬리

### 모바일 플로우

- 무한 웹툰 캔버스처럼 수직 스크롤
- 섹션 간 구분: `space-xl` (2.25rem) 여백
- 카드 내부 패딩: `space-md` ~ `space-lg`
- 자판기 뷰잉 글라스 스타일 카드로 컨텐츠 구분

---

## 엘리베이션 & 깊이 (Elevation)

| 레이어 | 배경 | 그림자 / 효과 |
|--------|------|---------------|
| **Base (Ground)** | `#FDFBF7` | 방사형 비네트 `rgba(232, 122, 144, 0.08)` |
| **Card (Comic Panel)** | `#FFFFFF` | `border: 1px solid #F0E5EB` + `0 8px 24px -4px rgba(232, 122, 144, 0.12)` |
| **Interactive (Machine)** | 그라디언트 | `inset 0 2px 4px rgba(255,255,255,0.8), 0 4px 12px rgba(167,139,250,0.18)` |
| **Overlay (Speech/Fortune)** | `rgba(255,255,255,0.72)` | `backdrop-filter: blur(12px)` + `#D4AF37` 또는 `#E87A90` 아웃라인 |

---

## 컴포넌트 스타일

### 버튼

| 종류 | 스타일 |
|------|--------|
| **Primary** "500원 넣고 운세 뽑기" | `linear-gradient(135deg, #FF94A8 0%, #E87A90 100%)` · pill (`9999px`) · gold border `#D4AF37` · pressed: `scale(0.97)` |
| **Secondary** 공유/다시뽑기 | `background: rgba(167,139,250,0.12)` · label `#7C3AED` · pill shape |
| **Coin Button** | 원형 56px · 500원 동전 부조 · 금속 테두리 반사 · hover 스파클 파티클 |

### 카드 & 리딩 패널

| 종류 | 스타일 |
|------|--------|
| **Vending Window Card** | 가챠 기계 유리 쇼케이스 스타일 · 투명 반사 광택 · 파스텔 포춘 오브 플로팅 |
| **Fortune Result Paper** | `#FFFDF9` 양피지 · 빈티지 꽃 필리그리 테두리 · 상단 점선 tear-off · 하단 왁스 씰 스탬프 |

### 말풍선 (Speech Bubbles)

- 꽃거지 캐릭터 전용 대화 컨테이너
- 배경: 크림 · `border-radius: 16px` · 핑크 그림자
- 말꼬리: CSS `::after` 삼각형, 캐릭터 초상 방향 지시

### 입력 필드 & 생년월일 피커

- **사주 입력** (년/월/일/시/음양력): 캡슐형 세그먼트 선택기
- 기본 배경: 소프트 크림
- 포커스: `border: 1px solid #E87A90` 체리핑크 글로우
- 플레이스홀더: 파스텔 플로팅 레이블

### 칩 & 배지

- **운세 태그** (`#연애운`, `#대박재물운` 등)
- 배경: 소프트 라벤더 또는 블러쉬
- 앞에 `✧` 글리프 (앤틱 골드 `#D4AF37`)
- pill shape · `label-md` 텍스트

### 체크박스 & 라디오

- 동전 토글 모티프의 원형 스위치
- 활성 상태: `#9c3e54` 채움 + 벚꽃 꽃잎 아이콘 (일반 체크마크 대신)

---

## 이미지 에셋

| 파일명 | ID | 크기 |
|--------|-----|------|
| `Gemini_Generated_Image_bzsu11bzsu11bzsu.png` | `10269388057036569581` | 1024 × 1024 |
| `Gemini_Generated_Image_2bnbsh2bnbsh2bnb.png` | `10269388057036568667` | 832 × 1281 |
| `Gemini_Generated_Image_bik8mcbik8mcbik8.png` | `4309025702095425620` | 1024 × 1024 |
