"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * 위쪽 고정 헤더: 아래로 스크롤하면 슬쩍 위로 숨고, 위로 조금만 올려도 다시 나타나요.
 * 맨 위 근처에서는 항상 보이고, 안쪽 메뉴/말풍선에 포커스가 있을 때도 숨지 않아요.
 */
export default function HideOnScrollHeader({ children, className }: { children: ReactNode; className: string }) {
  const [hidden, setHidden] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    let last = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const y = window.scrollY;
        const d = y - last;
        if (y < 80) setHidden(false);
        else if (d > 8 && !ref.current?.matches(":focus-within")) setHidden(true);
        else if (d < -8) setHidden(false);
        if (Math.abs(d) > 8) last = y;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header ref={ref} data-hidden={hidden ? "true" : "false"} className={`${className} transition-transform duration-300 ${hidden ? "-translate-y-full" : "translate-y-0"}`}>
      {children}
    </header>
  );
}
