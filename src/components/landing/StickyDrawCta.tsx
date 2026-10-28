"use client";

import { useEffect, useState } from "react";

/**
 * 첫 화면의 "오늘의 운 뽑으러 가기" 버튼이 화면 밖으로 나가고, 운세 카드 고르는 곳도 아직 안 보일 때만
 * 화면 아래에 따라오는 작은 버튼이에요. (맨 아래 푸터가 보이면 링크를 가리지 않도록 숨겨요) 누르면 운세 카드 고르는 곳으로 올라가요.
 * 입력창·로그인 창이 열려 있을 때는 숨겨요.
 */
export default function StickyDrawCta({ hidden = false }: { hidden?: boolean }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("hero-cta");
    const machines = document.getElementById("machines");
    const footer = document.querySelector("footer");
    if (!hero || !machines || typeof IntersectionObserver === "undefined") return;
    const seen = { hero: true, machines: false, footer: false };
    const update = () => setShow(!seen.hero && !seen.machines && !seen.footer);
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === hero) seen.hero = e.isIntersecting;
        if (e.target === machines) seen.machines = e.isIntersecting;
        if (e.target === footer) seen.footer = e.isIntersecting;
      }
      update();
    });
    io.observe(hero);
    io.observe(machines);
    if (footer) io.observe(footer); // 맨 아래 이용약관·개인정보처리방침 링크를 가리지 않게, 푸터가 보이면 숨겨요
    return () => io.disconnect();
  }, []);

  if (hidden || !show) return null;
  return (
    <a
      href="#machines"
      data-testid="sticky-cta"
      className="fixed bottom-4 left-1/2 z-40 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-fuchsia-500 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-brand-500/40 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-300"
    >
      <span aria-hidden="true">🪙</span>
      오늘의 운 뽑으러 가기
    </a>
  );
}
