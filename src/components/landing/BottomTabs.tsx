"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getBrowserStorage } from "@/lib/drawCounter";
import { markNavSeen, NAV_EVENT, readNavDots, type NavDots } from "@/lib/navDots";

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

/** 새 항목이 있을 때 아이콘 오른쪽 위에 붙는 빨간 점 (숫자 없음) */
const Dot = () => <i data-testid="nav-dot" aria-hidden="true" className="absolute left-[calc(50%+10px)] top-1 h-[10px] w-[10px] rounded-full border-2 border-white bg-red-500 box-content" />;

/**
 * 휴대폰·태블릿 아래에 붙는 4칸 메뉴. (큰 화면에서는 숨겨요)
 * page 모드(도유상담실 목록 등 다른 화면)에서는 홈·운세 뽑기가 첫 화면으로 이동하는 링크가 돼요.
 */
export default function BottomTabs({ page = false, onChatLogin }: { page?: "chat" | "vault" | false; onChatLogin?: () => void }) {
  const [active, setActive] = useState<TabKey>("home");
  const [dots, setDots] = useState<NavDots>({ draw: false, chat: false, vault: false });
  // 도유 상담실을 열어 둔 계정인지 (아직 아니면 눌렀을 때 "곧 열려요"만 알려요)
  const [chatOn, setChatOn] = useState(false);
  // 로그인 상태 (서버에 물어본 뒤에야 알 수 있어서, 그 전에는 null)
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [soon, setSoon] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch("/api/chat", { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<{ enabled?: boolean; loggedIn?: boolean }>) : null))
      .then((d) => {
        if (!alive) return;
        setChatOn(d?.enabled === true);
        setLoggedIn(typeof d?.loggedIn === "boolean" ? d.loggedIn : null);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);
  // 빨간 점: 이 기기에 적어 둔 값으로 계산해요
  const refresh = useCallback(() => setDots(readNavDots(getBrowserStorage(), chatOn, new Date())), [chatOn]);
  useEffect(() => {
    refresh();
    window.addEventListener(NAV_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(NAV_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);
  const seen = (k: keyof NavDots) => {
    markNavSeen(getBrowserStorage(), k, new Date());
    refresh();
  };
  useEffect(() => {
    if (!soon) return;
    const t = setTimeout(() => setSoon(false), 2400);
    return () => clearTimeout(t);
  }, [soon]);

  // 지금 화면에 걸쳐 있는 구역에 맞춰 칸을 밝혀 줘요.
  useEffect(() => {
    if (page || typeof IntersectionObserver === "undefined") return;
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
  }, [page]);

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
        {page ? (
          <Link href="/" className={`${base} ${off}`}>
            <HomeIcon />홈
          </Link>
        ) : (
          <button type="button" className={tab("home")} aria-current={active === "home" ? "page" : undefined} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            {bar("home")}
            <HomeIcon />홈
          </button>
        )}
        {page ? (
          <Link href="/#machines" className={`${base} ${off}`} onClick={() => seen("draw")}>
            <SparkIcon on={false} />
            {dots.draw && <Dot />}
            운세 뽑기
          </Link>
        ) : (
          <button
            type="button"
            className={tab("theme")}
            onClick={() => {
              seen("draw");
              scrollToId("machines");
            }}
          >
            {bar("theme")}
            <SparkIcon on={active === "theme"} />
            {dots.draw && <Dot />}
            운세 뽑기
          </button>
        )}
        {chatOn || page === "chat" ? (
          <Link href="/chat" className={`${base} ${page === "chat" ? "text-brand-600" : off}`} aria-current={page === "chat" ? "page" : undefined} onClick={() => seen("chat")}>
            {page === "chat" && <i aria-hidden="true" className="absolute -top-3 left-1/2 h-[5px] w-11 -translate-x-1/2 rounded-b-md bg-brand-600" />}
            <ChatIcon />
            {dots.chat && <Dot />}
            도유상담실
          </Link>
        ) : (
          <button
            type="button"
            className={`${base} ${off}`}
            // 로그인하지 않았다면 로그인 창을 띄우고(로그인하고 돌아오면 상담실로 이동), 로그인했는데 아직 안 열린 계정이면 "곧 열려요"만 알려요.
            onClick={() => (loggedIn === false && onChatLogin ? onChatLogin() : setSoon(true))}
          >
            <ChatIcon />
            도유상담실
          </button>
        )}
        <Link href="/vault" className={`${base} ${page === "vault" ? "text-brand-600" : off}`} aria-current={page === "vault" ? "page" : undefined} onClick={() => seen("vault")}>
          {page === "vault" && <i aria-hidden="true" className="absolute -top-3 left-1/2 h-[5px] w-11 -translate-x-1/2 rounded-b-md bg-brand-600" />}
          <VaultIcon />
          {dots.vault && <Dot />}
          보관함
        </Link>
      </div>
      {soon && (
        <p role="status" className="absolute -top-11 left-1/2 w-max -translate-x-1/2 rounded-full bg-gray-900/90 px-4 py-2 text-xs text-white shadow-lg">
          도유 상담실은 곧 열려요 ❄️
        </p>
      )}
    </nav>
  );
}
