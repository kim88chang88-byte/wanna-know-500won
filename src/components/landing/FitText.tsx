"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/**
 * 글이 한 줄에 딱 맞도록 글자 크기를 자동으로 줄이는 문단이에요. (최대 maxPx, 최소 minPx)
 * 칸 너비가 바뀌어도(화면 회전·창 크기) 다시 맞춰요. 최소 크기로도 넘치면 줄바꿈을 허용해요.
 */
export default function FitText({ children, maxPx = 16, minPx = 10, className = "", ...rest }: { children: ReactNode; maxPx?: number; minPx?: number; className?: string } & React.HTMLAttributes<HTMLParagraphElement>) {
  const box = useRef<HTMLParagraphElement>(null);
  const [size, setSize] = useState(maxPx);
  const [wrap, setWrap] = useState(false);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    function fit() {
      if (!el) return;
      el.style.whiteSpace = "nowrap";
      el.style.fontSize = `${maxPx}px`;
      const avail = el.clientWidth;
      const need = el.scrollWidth;
      if (avail <= 0) return;
      const next = need <= avail ? maxPx : Math.max(minPx, Math.floor(((maxPx * avail) / need) * 10) / 10);
      el.style.fontSize = `${next}px`;
      setSize(next);
      const mustWrap = next <= minPx && el.scrollWidth > avail;
      setWrap(mustWrap);
      el.style.whiteSpace = mustWrap ? "normal" : "nowrap";
    }
    fit();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(fit) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [children, maxPx, minPx]);

  return (
    <p ref={box} className={className} style={{ fontSize: size, whiteSpace: wrap ? "normal" : "nowrap" }} {...rest}>
      {children}
    </p>
  );
}
