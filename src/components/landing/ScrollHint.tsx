"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 스크롤이 되는 창(모달) 안에서, 아래에 더 볼 내용이 있으면 "아래로 스크롤" 안내를 띄워요.
 * 맨 아래까지 내려오면 사라져요. 스크롤 컨테이너(overflow-y-auto) 안의 마지막 자식으로 넣어 주세요.
 * 화면 아래에 붙어 따라다니고(sticky), 눌러도 아래 내용을 가리지 않도록 클릭은 통과시켜요.
 */
export default function ScrollHint({ label }: { label: string }) {
  const end = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState(false);

  useEffect(() => {
    const el = end.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    // 맨 아래 표시(sentinel)가 화면에 안 보이면 = 아래에 더 있다는 뜻이에요.
    const io = new IntersectionObserver(([entry]) => setMore(!entry.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <div ref={end} aria-hidden="true" className="h-px" />
      <div className="sticky bottom-2 h-0 flex justify-center pointer-events-none">
        {more && (
          <span
            data-testid="scroll-hint"
            className="-translate-y-full inline-flex items-center gap-1 rounded-full bg-brand-600/95 px-3.5 py-1.5 text-[11px] font-bold text-white shadow-lg motion-safe:animate-bounce"
          >
            <span className="material-symbols-outlined text-[16px] leading-none" aria-hidden="true">
              keyboard_arrow_down
            </span>
            {label}
          </span>
        )}
      </div>
    </>
  );
}
