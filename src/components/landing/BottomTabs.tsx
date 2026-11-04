"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type TabKey = "home" | "theme";

/** 해당 구역으로 부드럽게 내려가요. */
function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

const base = "relative flex flex-1 flex-col items-center gap-1 pt-1.5 text-[12.5px] font-bold transition-colors";

const svg = "h-[30px] w-[30px] stroke-current stroke-[1.8] [stroke-linecap:round] [stroke-linejoin:round]";

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className={`${svg} fill-none`} aria-hidden="true">
      <path d="M3.5 11 12 3.8 20.5 11v8.2a1.3 1.3 0 0 1-1.3 1.3H4.8a1.3 1.3 0 0 1-1.3-1.3z" />
      <path d="M9.5 20.5v-6h5v6" />
    </svg>
  );
}
function SparkIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`${svg} ${on ? "fill-current" : "fill-none"}`} aria-hidden="true">
      <path d="M12 2.8c.6 4.6 3.2 7.2 8.2 9.2-5 2-7.6 4.6-8.2 9.2-.6-4.6-3.2-7.2-8.2-9.2 5-2 7.6-4.6 8.2-9.2z" />
    </svg>
  );
}
function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" className={`${svg} fill-none`} aria-hidden="true">
      <path d="M4 11.5a8 7.2 0 1 1 3.6 6l-4 1.6 1.1-3.7A7.2 7.2 0 0 1 4 11.5z" />
      <path d="M8.8 11.6h.1M12 11.6h.1M15.2 11.6h.1" strokeWidth="2.6" />
    </svg>
  );
}
function VaultIcon() {
  return (
    <svg viewBox="0 0 24 24" className={`${svg} fill-none`} aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M4 9.5h16M10 13.5h4" />
    </svg>
  );
}

/** 휴대폰·태블릿 아래에 붙는 4칸 메뉴. (큰 화면에서는 숨겨요) */
export default function BottomTabs({ freeLeft = false }: { freeLeft?: boolean }) {
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

  const off = "text-[#7a7f98] hover:text-brand-600";
  const tab = (key: TabKey) => `${base} ${active === key ? "text-brand-600" : off}`;
  // 선택된 칸 위에 보라색 막대
  const bar = (key: TabKey) => (active === key ? <i aria-hidden="true" className="absolute -top-3 left-1/2 h-[5px] w-11 -translate-x-1/2 rounded-b-md bg-brand-600" /> : null);

  return (
    <nav
      data-testid="bottom-tabs"
      aria-label="하단 메뉴"
      className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[34rem] px-3 pb-[max(10px,env(safe-area-inset-bottom,0px))] lg:hidden"
    >
      <div className="relative flex items-stretch rounded-[22px] bg-white/95 px-1 pb-2.5 pt-3 shadow-[0_6px_24px_rgba(59,42,138,0.16)] backdrop-blur-xl">
        <button type="button" className={tab("home")} aria-current={active === "home" ? "page" : undefined} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          {bar("home")}
          <HomeIcon />홈
        </button>
        <button type="button" className={tab("theme")} onClick={() => scrollToId("machines")}>
          {bar("theme")}
          <SparkIcon on={active === "theme"} />
          {freeLeft && <i aria-hidden="true" className="absolute left-[calc(50%+11px)] top-1 h-2 w-2 rounded-full bg-pink-500" />}
          운세 뽑기
        </button>
        {chatOn ? (
          <Link href="/chat" className={`${base} ${off}`}>
            <ChatIcon />
            <span aria-hidden="true" className="absolute -top-1.5 left-[calc(50%-4px)] rounded-full border border-brand-100 bg-brand-50 px-1.5 text-[10.5px] font-extrabold leading-4 text-brand-600">1:1</span>
            도리상담실
          </Link>
        ) : (
          <button type="button" className={`${base} ${off}`} onClick={() => setSoon(true)}>
            <ChatIcon />
            <span aria-hidden="true" className="absolute -top-1.5 left-[calc(50%-4px)] rounded-full border border-brand-100 bg-brand-50 px-1.5 text-[10.5px] font-extrabold leading-4 text-brand-600">1:1</span>
            도리상담실
          </button>
        )}
        <Link href="/vault" className={`${base} ${off}`}>
          <VaultIcon />보관함
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
