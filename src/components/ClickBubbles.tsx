"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * 화면을 톡 누르면 눈꽃송이가 살짝 튀어 올랐다가 떨어져요. 모든 화면에 한 번만 붙어 있어요.
 *  - 사주 풀이를 읽는 영역(data-no-click-fx 표시가 있는 곳)과 관리자 화면에서는 터지지 않아요.
 *  - 스크롤하려고 손을 대는 것은 세지 않도록 pointerdown 이 아니라 click(탭)에만 반응해요.
 *  - 움직임 줄이기 설정이면 만들지 않아요.
 * 새 풀이 화면을 만들 때는 그 화면의 맨 바깥 요소에 data-no-click-fx="" 를 달아 주세요.
 */
export default function ClickBubbles() {
  const path = usePathname() ?? "";
  const off = path.startsWith("/admin");

  useEffect(() => {
    if (off || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target;
      if (t instanceof Element && t.closest("[data-no-click-fx]")) return;
      // 키보드로 누른 클릭(좌표 0,0)은 건너뛰어요
      if (e.clientX === 0 && e.clientY === 0) return;
      for (let i = 0; i < 6; i++) {
        const el = document.createElement("span");
        const size = 9 + Math.random() * 11;
        el.className = "click-snow";
        el.style.width = el.style.height = `${size}px`;
        el.style.left = `${e.clientX}px`;
        el.style.top = `${e.clientY}px`;
        el.style.setProperty("--dx", `${(Math.random() - 0.5) * 80}px`);
        el.style.setProperty("--dy", `${-22 - Math.random() * 34}px`);
        el.style.setProperty("--rot", `${(Math.random() - 0.5) * 360}deg`);
        el.setAttribute("aria-hidden", "true");
        document.body.appendChild(el);
        window.setTimeout(() => el.remove(), 950);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [off]);

  return null;
}
