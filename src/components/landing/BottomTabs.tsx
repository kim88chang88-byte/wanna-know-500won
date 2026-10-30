"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type TabKey = "home" | "daily" | "theme" | "premium";

/** 먼저 찾아지는 칸으로 부드럽게 내려가요. (비회원은 생일 입력, 회원은 오늘의 한마디 카드) */
function scrollToFirst(ids: string[]) {
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
  }
}

const base = "flex h-14 w-1/5 flex-col items-center justify-center gap-0.5 text-[10.5px] transition-colors";

/** 휴대폰·태블릿 아래에 붙는 5칸 메뉴. (큰 화면에서는 숨겨요) */
export default function BottomTabs() {
  const [active, setActive] = useState<TabKey>("home");

  // 지금 화면에 걸쳐 있는 구역에 맞춰 칸을 밝혀 줘요.
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const targets: Array<[string, TabKey]> = [
      ["machines", "theme"],
      ["premium", "premium"],
    ];
    const seen = new Map<string, boolean>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set(e.target.id, e.isIntersecting);
        const hit = targets.find(([id]) => seen.get(id));
        setActive(hit ? hit[1] : window.scrollY < 80 ? "home" : "daily");
      },
      { rootMargin: "-35% 0px -45% 0px" },
    );
    for (const [id] of targets) {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    }
    const onScroll = () => {
      if (![...seen.values()].some(Boolean)) setActive(window.scrollY < 80 ? "home" : "daily");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const tab = (key: TabKey) => `${base} ${active === key ? "font-bold text-brand-600" : "text-gray-500 hover:text-brand-600"}`;
  const icon = "material-symbols-outlined text-[22px]";

  return (
    <nav
      data-testid="bottom-tabs"
      aria-label="하단 메뉴"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-brand-100 bg-white/90 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-2px_16px_rgba(108,92,231,0.08)] backdrop-blur-xl lg:hidden"
    >
      <div className="mx-auto flex max-w-xl items-center justify-around px-1">
        <button type="button" className={tab("home")} aria-current={active === "home" ? "page" : undefined} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <span className={icon} aria-hidden="true">auto_awesome</span>홈
        </button>
        <button type="button" className={tab("daily")} onClick={() => scrollToFirst(["daily-today", "daily-try", "machines"])}>
          <span className={icon} aria-hidden="true">wb_twilight</span>오늘운세
        </button>
        <button type="button" className={tab("theme")} onClick={() => scrollToFirst(["machines"])}>
          <span className={icon} aria-hidden="true">magic_button</span>테마사주
        </button>
        <button type="button" className={tab("premium")} onClick={() => scrollToFirst(["premium"])}>
          <span className={icon} aria-hidden="true">menu_book</span>프리미엄
        </button>
        <Link href="/vault" className={`${base} text-gray-500 hover:text-brand-600`}>
          <span className={icon} aria-hidden="true">folder_special</span>보관함
        </Link>
      </div>
    </nav>
  );
}
