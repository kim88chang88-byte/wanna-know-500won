"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/** 옆으로 넘기는 카드 줄: 좌우 화살표 · 가장자리 흐림 · 점 표시 · 안내 문구를 함께 보여 줘. (카드가 한눈에 펼쳐지는 큰 화면에서는 모두 숨겨) */
export default function MachineScroller({ children, count }: { children: ReactNode; count: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState(false);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [index, setIndex] = useState(0);
  const [moved, setMoved] = useState(false);

  const stepOf = useCallback(() => {
    const first = ref.current?.firstElementChild as HTMLElement | null;
    return first ? first.offsetWidth + 12 : 220;
  }, []);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanScroll(max > 4);
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft >= max - 4);
    setIndex(Math.min(count - 1, Math.max(0, Math.round(el.scrollLeft / stepOf()))));
    if (el.scrollLeft > 20) setMoved(true);
  }, [count, stepOf]);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update]);

  const go = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * stepOf(), behavior: "smooth" });

  const arrow =
    "absolute top-[42%] z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-brand-700 shadow-lg transition hover:scale-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-300 lg:hidden";

  return (
    <div>
      <div className="relative">
        <div
          ref={ref}
          onScroll={update}
          data-testid="machine-scroller"
          className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-4 pt-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-4 lg:overflow-visible lg:px-0"
        >
          {children}
        </div>
        {canScroll && !atStart && (
          <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 -left-4 z-10 w-8 bg-gradient-to-r from-white/90 to-transparent sm:-left-6 lg:hidden" />
        )}
        {canScroll && !atEnd && (
          <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 -right-4 z-10 w-8 bg-gradient-to-l from-white/90 to-transparent sm:-right-6 lg:hidden" />
        )}
        {canScroll && !atStart && (
          <button type="button" data-testid="machine-prev" aria-label="이전 카드 보기" onClick={() => go(-1)} className={`${arrow} left-1`}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
        )}
        {canScroll && !atEnd && (
          <button type="button" data-testid="machine-next" aria-label="다음 카드 보기" onClick={() => go(1)} className={`${arrow} right-1`}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
          </button>
        )}
      </div>
      {canScroll && (
        <div className="lg:hidden">
          <div className="flex justify-center gap-1.5" aria-hidden="true">
            {Array.from({ length: count }, (_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === index ? "w-4 bg-brand-500" : "w-1.5 bg-gray-300"}`} />
            ))}
          </div>
          {!moved && <p className="mt-1.5 text-center text-[11px] text-gray-500">‹ › 버튼을 누르거나 옆으로 밀어 봐 · 컴퓨터에선 Shift + 마우스 휠</p>}
        </div>
      )}
    </div>
  );
}
