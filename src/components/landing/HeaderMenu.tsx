"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

export interface MenuItem {
  /** "#아이디" 는 같은 페이지 안으로 이동(부드럽게 스크롤), 그 밖에는 다른 페이지 */
  href: string;
  label: string;
  /** 글머리 이모지 (선택) */
  emoji?: string;
}

export interface MenuGroup {
  heading?: string;
  items: readonly MenuItem[];
}

/**
 * 헤더 오른쪽의 동그란 메뉴 버튼 하나와 그 아래로 열리는 패널이에요. ('?' 안내 메뉴, '≡' 자판기 메뉴가 같이 써요)
 * 패널은 헤더(sticky) 기준으로 오른쪽 끝에 맞춰 열려요. 바깥을 누르거나 Esc 를 누르면 닫히고, 닫히면 버튼으로 포커스가 돌아와요.
 * 다른 메뉴를 열면(바깥 클릭) 이 메뉴는 저절로 닫혀요.
 */
export default function HeaderMenu({
  id,
  buttonLabel,
  panelLabel,
  icon,
  groups,
  testId,
}: {
  id: string;
  buttonLabel: string;
  panelLabel: string;
  icon: ReactNode;
  groups: readonly MenuGroup[];
  testId?: string;
}) {
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

  const itemClass = "flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-600";

  return (
    <div ref={wrapRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={buttonLabel}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={id}
        data-testid={testId}
        className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-brand-50 hover:bg-brand-100/70 border border-brand-200/60 shadow-sm flex items-center justify-center text-brand-600 transition-colors"
      >
        {icon}
      </button>

      {open && (
        <nav
          id={id}
          aria-label={panelLabel}
          className="absolute right-3 sm:right-6 lg:right-8 top-full mt-2 z-50 w-60 max-h-[70vh] overflow-y-auto rounded-2xl bg-white border border-brand-100 shadow-xl py-2"
        >
          {groups.map((g, gi) => (
            <div key={g.heading ?? gi} className={gi > 0 ? "mt-1 pt-1 border-t border-brand-100" : ""}>
              {g.heading && <p className="px-4 pt-2 pb-1 text-[11px] font-bold text-brand-500">{g.heading}</p>}
              {g.items.map((item) => {
                const content = (
                  <>
                    {item.emoji && <span aria-hidden="true">{item.emoji}</span>}
                    <span>{item.label}</span>
                  </>
                );
                return item.href.startsWith("#") ? (
                  <a key={item.href} href={item.href} onClick={() => setOpen(false)} className={itemClass}>
                    {content}
                  </a>
                ) : (
                  <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={itemClass}>
                    {content}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      )}
    </div>
  );
}
