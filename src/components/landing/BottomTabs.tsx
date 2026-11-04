"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type TabKey = "home" | "theme";

/** 해당 구역으로 부드럽게 내려가요. */
function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

const base = "flex h-14 w-1/4 flex-col items-center justify-center gap-0.5 text-[10.5px] transition-colors";

/** 휴대폰·태블릿 아래에 붙는 4칸 메뉴. (큰 화면에서는 숨겨요) */
export default function BottomTabs() {
  const [active, setActive] = useState<TabKey>("home");
  // 도리 상담실을 열어 둔 계정인지 (아직 아니면 눌렀을 때 "곧 열려요"만 알려요)
  const [chatOn, setChatOn] = useState(false);
  const [soon, setSoon] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch("/api/chat", { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<{ enabled?: boolean }>) : null))
      .then((d) => alive && setChatOn(d?.enabled === true))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    if (!soon) return;
    const t = setTimeout(() => setSoon(false), 2400);
    return () => clearTimeout(t);
  }, [soon]);

  // 지금 화면에 걸쳐 있는 구역에 맞춰 칸을 밝혀 줘요.
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const targets: Array<[string, TabKey]> = [
      ["machines", "theme"],
    ];
    const seen = new Map<string, boolean>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set(e.target.id, e.isIntersecting);
        const hit = targets.find(([id]) => seen.get(id));
        setActive(hit ? hit[1] : "home");
      },
      { rootMargin: "-35% 0px -45% 0px" },
    );
    for (const [id] of targets) {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, []);

  const tab = (key: TabKey) => `${base} ${active === key ? "font-bold text-brand-600" : "text-gray-500 hover:text-brand-600"}`;
  const icon = "material-symbols-outlined text-[22px]";

  return (
    <nav
      data-testid="bottom-tabs"
      aria-label="하단 메뉴"
      className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[34rem] rounded-t-2xl border-x border-t border-brand-100 bg-white/90 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-2px_16px_rgba(108,92,231,0.08)] backdrop-blur-xl lg:hidden"
    >
      <div className="mx-auto flex items-center justify-around px-1">
        <button type="button" className={tab("home")} aria-current={active === "home" ? "page" : undefined} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <span className={icon} aria-hidden="true">home</span>홈
        </button>
        <button type="button" className={tab("theme")} onClick={() => scrollToId("machines")}>
          <span className={icon} aria-hidden="true">magic_button</span>운세 뽑기
        </button>
        {chatOn ? (
          <Link href="/chat" className={`${base} text-gray-500 hover:text-brand-600`}>
            <span className={icon} aria-hidden="true">forum</span>도리상담실
          </Link>
        ) : (
          <button type="button" className={`${base} text-gray-500 hover:text-brand-600`} onClick={() => setSoon(true)}>
            <span className={icon} aria-hidden="true">forum</span>도리상담실
          </button>
        )}
        <Link href="/vault" className={`${base} text-gray-500 hover:text-brand-600`}>
          <span className={icon} aria-hidden="true">folder_special</span>보관함
        </Link>
      </div>
      {soon && (
        <p role="status" className="absolute -top-11 left-1/2 w-max -translate-x-1/2 rounded-full bg-gray-900/90 px-4 py-2 text-xs text-white shadow-lg">
          도리 상담실은 곧 열려요 ❄️
        </p>
      )}
    </nav>
  );
}
