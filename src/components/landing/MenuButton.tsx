"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// 개발용 계산 화면(/saju)은 배포(production)에서는 메뉴에도, 주소로도 열리지 않아요.
const SHOW_DEV_LINKS = process.env.NODE_ENV !== "production";

const MENU_ITEMS: readonly { href: string; label: string }[] = [
  { href: "/", label: "처음으로" },
  ...(SHOW_DEV_LINKS ? [{ href: "/saju", label: "사주 계산해보기 (개발용)" }] : []),
  { href: "/terms", label: "이용약관" },
  { href: "/privacy", label: "개인정보처리방침" },
  { href: "/refund", label: "환불 안내" },
];

/** 헤더의 햄버거 메뉴. (패널은 헤더(sticky) 기준으로 오른쪽 끝에 맞춰 열려요.) 바깥을 누르거나 Esc 를 누르면 닫히고, 닫히면 버튼으로 포커스가 돌아와요. */
export default function MenuButton() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    // 헤더는 backdrop-blur 때문에 fixed 요소의 기준이 되어 버려서, 전체 화면 덮개 대신 바깥 클릭을 직접 감지해요.
    const onPointerDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  return (
    <div ref={wrapRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="메뉴 열기"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="site-menu"
        className="w-11 h-11 rounded-full bg-brand-50 hover:bg-brand-100/70 border border-brand-200/60 shadow-sm flex items-center justify-center text-brand-600 transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <>
          <nav
            id="site-menu"
            aria-label="사이트 메뉴"
            className="absolute right-4 sm:right-6 lg:right-8 top-full mt-2 z-50 w-56 rounded-2xl bg-white border border-brand-100 shadow-xl py-2"
          >
            {MENU_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-600"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </>
      )}
    </div>
  );
}
