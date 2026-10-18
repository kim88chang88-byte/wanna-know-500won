"use client";

import HeaderMenu, { type MenuGroup } from "./HeaderMenu";
import { MACHINES, PREMIUM_CARDS } from "./data";

// 개발용 계산 화면(/saju)은 배포(production)에서는 메뉴에도, 주소로도 열리지 않아요.
const SHOW_DEV_LINKS = process.env.NODE_ENV === "development";

const HELP_GROUPS: readonly MenuGroup[] = [
  {
    items: [
      { href: "/", label: "처음으로" },
      ...(SHOW_DEV_LINKS ? [{ href: "/saju", label: "사주 계산해보기 (개발용)" }] : []),
      { href: "/terms", label: "이용약관" },
      { href: "/privacy", label: "개인정보처리방침" },
      { href: "/refund", label: "환불 안내" },
    ],
  },
];

/** 도리 운세 사주에서 즐길 수 있는 자판기들. 누르면 그 자판기 카드로 스크롤해요. */
const MACHINE_GROUPS: readonly MenuGroup[] = [
  {
    heading: "🌊 6대 운명의 자판기 (매일 첫 1회 무료)",
    items: MACHINES.map((m) => ({ href: `#${m.key}`, label: m.name, emoji: m.emoji })),
  },
  {
    heading: "👑 프리미엄 심층 리포트",
    items: PREMIUM_CARDS.map((p) => ({ href: `#${p.key}`, label: p.title, emoji: p.emoji })),
  },
];

/** 헤더의 '?' 안내 메뉴 (처음으로·이용약관·개인정보처리방침·환불 안내) */
export function HelpMenuButton() {
  return (
    <HeaderMenu
      id="site-menu"
      testId="help-menu-button"
      buttonLabel="안내 메뉴 열기"
      panelLabel="안내 메뉴"
      groups={HELP_GROUPS}
      icon={<span aria-hidden="true" className="font-black text-lg leading-none">?</span>}
    />
  );
}

/** 헤더의 햄버거(≡) 메뉴: 즐길 수 있는 자판기 목록 */
export function MachineMenuButton() {
  return (
    <HeaderMenu
      id="machine-menu"
      testId="machine-menu-button"
      buttonLabel="자판기 메뉴 열기"
      panelLabel="자판기 메뉴"
      groups={MACHINE_GROUPS}
      icon={
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      }
    />
  );
}
