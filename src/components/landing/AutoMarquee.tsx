"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface Props {
  /** 한 벌(copy)을 그리는 함수. dup 은 몇 번째 복사본인지 (0 이 진짜, 나머지는 끊김 없는 반복용 복사본) */
  children: (dup: number) => ReactNode;
  /** 초당 흐르는 거리(px). 왼쪽에서 오른쪽으로 흘러요 */
  speed?: number;
  testId?: string;
  className?: string;
}

const IDLE_MS = 1800;

/**
 * 카드 줄을 왼쪽에서 오른쪽으로 천천히 흘려 보내면서, 손가락·트랙패드·마우스 드래그로 직접 넘겨 볼 수도 있어요.
 * 직접 만지는 동안에는 멈추고, 손을 떼고 잠시 뒤에 다시 흘러가요. 마우스를 올려 두면 멈춰요.
 * 움직임 줄이기 설정이면 흐르지 않고 직접 밀어서만 볼 수 있어요.
 */
export default function AutoMarquee({ children, speed = 48, testId, className = "" }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const first = useRef<HTMLDivElement>(null);
  const [copies, setCopies] = useState(4);
  const [still, setStill] = useState(false);

  // 한 벌이 화면보다 짧으면 복사본을 더 이어 붙여요.
  useEffect(() => {
    const calm = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    setStill(calm);
    if (calm) {
      setCopies(1);
      return;
    }
    const measure = () => {
      const w = first.current?.offsetWidth ?? 0;
      const vw = box.current?.clientWidth ?? 0;
      if (w > 0) setCopies(Math.max(3, Math.ceil(vw / w) + 2));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    const el = box.current;
    if (!el || still) return;
    let raf = 0;
    let last = performance.now();
    let pos = 0;
    let lastIdle = 0; // 마지막으로 직접 만진 시각
    let hovering = false;
    let dragging = false;
    let dragMoved = 0;
    let startX = 0;
    let startLeft = 0;

    const copyW = () => (first.current?.offsetWidth ?? 0) + 0;
    /** 한 벌 길이 안에서 맴돌게 해서 끝이 없는 줄처럼 보이게 해요. (복사본 사이에서 위치만 옮기니 화면은 그대로예요) */
    const wrap = (v: number) => {
      const w = copyW();
      if (w <= 0) return v;
      if (v < w) return v + w;
      if (v >= 2 * w) return v - w;
      return v;
    };

    const init = () => {
      const w = copyW();
      if (w > 0) {
        pos = w;
        el.scrollLeft = pos;
      }
    };
    init();
    const initTimer = window.setTimeout(init, 300); // 이미지가 자리를 잡은 뒤 한 번 더

    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const idle = now - lastIdle > IDLE_MS;
      if (!hovering && !dragging && idle && !document.hidden) {
        pos = wrap(pos - speed * dt); // 내용이 오른쪽으로 흐르려면 스크롤 위치는 줄어들어요
        el.scrollLeft = pos;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const onScroll = () => {
      // 내가 둔 위치와 다르면 사용자가 민 거예요.
      if (Math.abs(el.scrollLeft - pos) > 1.5) {
        lastIdle = performance.now();
        const wrapped = wrap(el.scrollLeft);
        if (wrapped !== el.scrollLeft) el.scrollLeft = wrapped;
        pos = wrapped;
      }
    };
    const touch = () => {
      lastIdle = performance.now();
    };
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType === "mouse") hovering = true;
    };
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType === "mouse") {
        hovering = false;
        lastIdle = performance.now() - IDLE_MS + 500;
      }
    };
    const onDown = (e: PointerEvent) => {
      lastIdle = performance.now();
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      dragging = true;
      dragMoved = 0;
      startX = e.clientX;
      startLeft = el.scrollLeft;
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      dragMoved = Math.max(dragMoved, Math.abs(dx));
      if (dragMoved > 5) {
        el.scrollLeft = wrap(startLeft - dx);
        pos = el.scrollLeft;
        lastIdle = performance.now();
      }
    };
    const onUp = () => {
      dragging = false;
    };
    // 끌어서 넘긴 뒤에는 카드가 눌린 것으로 처리하지 않아요.
    const onClickCapture = (e: MouseEvent) => {
      if (dragMoved > 5) {
        e.stopPropagation();
        e.preventDefault();
        dragMoved = 0;
      }
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("wheel", touch, { passive: true });
    el.addEventListener("touchstart", touch, { passive: true });
    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    el.addEventListener("click", onClickCapture, true);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(initTimer);
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("wheel", touch);
      el.removeEventListener("touchstart", touch);
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      el.removeEventListener("click", onClickCapture, true);
    };
  }, [speed, still, copies]);

  return (
    <div ref={box} data-testid={testId} className={`sample-marquee no-scrollbar select-none overflow-x-auto overflow-y-hidden ${className}`}>
      <div className="flex w-max">
        {Array.from({ length: copies }, (_, dup) => (
          <div key={dup} ref={dup === 0 ? first : undefined} className="flex shrink-0 items-stretch" aria-hidden={dup > 0 ? true : undefined}>
            {children(dup)}
          </div>
        ))}
      </div>
    </div>
  );
}
