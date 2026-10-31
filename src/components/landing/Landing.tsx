"use client";

import StickyDrawCta from "./StickyDrawCta";
import BirthdayTeaser from "./BirthdayTeaser";
import BottomTabs from "./BottomTabs";
import CoinRitual from "./CoinRitual";
import { useCallback, useEffect, useRef, useState } from "react";
import { dayKey, getBrowserStorage, readCounts, recordDraw, type DrawCounts } from "@/lib/drawCounter";
import { readVisitDays, recordVisit } from "@/lib/streak";
import { grantTickets, readTickets, spendTicket, STREAK_FOR_TICKET } from "@/lib/stampReward";
import { FREE_PER_DAY } from "@/lib/db/config";
import { clearRef, isFinalRedeem, readRef, redeemMessage, refFromSearch, saveMyCode, saveRef } from "@/lib/referral";
import { DailyLineCard } from "./DailyLineCard";
import { FollowupCard } from "./FollowupCard";
import { VaultFollowupCard } from "./VaultFollowupCard";
import IntakeModal, { type IntakeTarget } from "./IntakeModal";
import { LoginModal } from "./Modals";
import { useAuth } from "./useAuth";
import BubbleBackground from "./BubbleBackground";
import {
  FaqSection,
  Footer,
  Header,
  HeroSection,
  MachinesSection,
  PremiumSection,
  SampleSection,
  ShowcaseSection,
  TrustSection,
} from "./Sections";

const MODAL_DELAY_MS = 150;
const RITUAL_MS = 2000;
const LAST_KEY = "wanna500:last:v1";
const VISITOR_KEY = "wanna500:vid:v1";

export default function Landing() {
  const { user, profile, setProfile, deleteProfile, serverCounts, setServerCounts, result: loginResult, clearResult, justLoggedIn, clearWelcome, logout, withdraw } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [intake, setIntake] = useState<IntakeTarget | null>(null);
  const [counts, setCounts] = useState<DrawCounts>({ today: 0, month: 0 });
  // 화면에 보이는 최신 횟수. (상태 업데이터 안에서 저장소에 쓰면 개발 모드에서 두 번 실행되어 2씩 늘어나서 ref 를 씁니다)
  const countsRef = useRef<DrawCounts>(counts);
  const timers = useRef<number[]>([]);
  const [ritual, setRitual] = useState(false);
  const [ritualBill, setRitualBill] = useState(false);
  const [tickets, setTickets] = useState(0);
  // 서버에 쌓인 뽑기 코인(로그인 선물 등)과, 방금 선물을 받았는지
  const [coins, setCoins] = useState(0);
  const [gift, setGift] = useState(false);
  // 친구 초대 코드 적용 결과 안내
  const [notice, setNotice] = useState<string | null>(null);
  const refreshCoins = useCallback(async () => {
    try {
      const res = await fetch("/api/coins", { method: "POST" });
      if (!res.ok) return;
      const d = (await res.json()) as { balance?: unknown; granted?: unknown };
      setCoins(typeof d.balance === "number" && d.balance > 0 ? d.balance : 0);
      if (d.granted === true) setGift(true);
    } catch {
      // 코인 확인이 안 돼도 뽑기는 그대로 돼요
    }
  }, []);
  const [visitors, setVisitors] = useState<{ today: number; total: number } | null>(null);
  const bonusRef = useRef(false);
  // 도장 연속 3일이면 보너스 뽑기를 지급하고, 안내에 쓸 값을 새로 읽어요.
  const syncReward = useCallback(() => {
    const st = getBrowserStorage();
    const today = dayKey(new Date());
    const days = readVisitDays(st);
    const g = grantTickets(st, days, today);
    setTickets(g.balance);
  }, []);
  const [lastKey, setLastKey] = useState<string | null>(null);
  const spinKey = useRef<string | null>(null);

  const applyCounts = useCallback((next: DrawCounts) => {
    countsRef.current = next;
    setCounts(next);
  }, []);

  // 서버가 만든 HTML 과 맞추기 위해 첫 화면은 0 으로 두고, 브라우저에서 저장된 횟수를 읽어 옵니다.
  useEffect(() => {
    applyCounts(readCounts(getBrowserStorage(), new Date()));
    syncReward();
    // 방문자 수: 이 브라우저의 무작위 ID(이름·연락처 아님)를 보내 오늘·누적 방문자를 세요. 실패하면 숫자를 숨겨요.
    void (async () => {
      try {
        const st = getBrowserStorage();
        let vid = st?.getItem(VISITOR_KEY) ?? "";
        if (!/^[A-Za-z0-9-]{16,64}$/.test(vid)) {
          vid = crypto.randomUUID();
          try {
            st?.setItem(VISITOR_KEY, vid);
          } catch {
            // 저장이 막혀 있으면 이번 방문만 센 값으로 보여줘요
          }
        }
        const res = await fetch("/api/visit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ vid }) });
        const d = (await res.json().catch(() => null)) as { today?: number; total?: number } | null;
        if (res.ok && typeof d?.today === "number" && typeof d?.total === "number") setVisitors({ today: d.today, total: d.total });
      } catch {
        // 숫자를 못 받으면 그냥 숨겨요
      }
    })();
    try {
      setLastKey(getBrowserStorage()?.getItem(LAST_KEY) ?? null);
    } catch {
      /* 읽기 실패는 무시 */
    }
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
  }, [applyCounts, syncReward]);

  const handleSpin = useCallback(
    (key: string, fortune: string, price: string, premium?: boolean) => {
      spinKey.current = key;
      // 오늘 무료 뽑기를 이미 썼고 보너스 뽑기가 있으면, 보너스로 한 번 더 뽑아요.
      const bonus = countsRef.current.today >= FREE_PER_DAY && readTickets(getBrowserStorage()) > 0;
      bonusRef.current = bonus;
      const open = () => setIntake({ fortune, price, premium: premium === true, bonus });
      const calm = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (calm) {
        timers.current.push(window.setTimeout(open, MODAL_DELAY_MS));
        return;
      }
      // 1,000원 카드(둘의 궁합)는 동전 대신 지폐가 들어가요.
      setRitualBill(price.startsWith("1,000"));
      setRitual(true);
      timers.current.push(
        window.setTimeout(() => {
          setRitual(false);
          open();
        }, RITUAL_MS),
      );
    },
    [],
  );

  // 로그인한 상태면 코인을 확인하고, 처음이면 로그인 선물을 받아요. (로그아웃하면 0장)
  const loggedIn = Boolean(user);
  useEffect(() => {
    if (loggedIn) void refreshCoins();
    else {
      setCoins(0);
      setGift(false);
    }
  }, [loggedIn, refreshCoins]);
  // 친구 초대 링크(?ref=코드)로 들어왔으면 코드를 기억해 두고 주소창은 깔끔하게 정리해요.
  useEffect(() => {
    const c = refFromSearch(window.location.search);
    if (!c) return;
    saveRef(getBrowserStorage(), c);
    try {
      const u = new URL(window.location.href);
      u.searchParams.delete("ref");
      window.history.replaceState(null, "", u.toString());
    } catch {
      // 주소 정리는 못 해도 괜찮아요
    }
  }, []);
  // 로그인하면 기억해 둔 초대 코드를 자동으로 적용하고, 내 코드도 받아 둬요. (공유 링크에 붙여요)
  useEffect(() => {
    if (!loggedIn) return;
    const st = getBrowserStorage();
    let alive = true;
    void (async () => {
      const code = readRef(st);
      if (code) {
        try {
          const res = await fetch("/api/referral", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
          const d = (await res.json().catch(() => null)) as { result?: unknown } | null;
          const r = typeof d?.result === "string" ? d.result : "failed";
          if (isFinalRedeem(r)) clearRef(st);
          if (alive && r !== "failed") setNotice(redeemMessage(r).text);
        } catch {
          // 네트워크 문제면 코드를 남겨 두고 다음에 다시 시도해요
        }
      }
      try {
        const res = await fetch("/api/referral", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
        const d = (await res.json().catch(() => null)) as { code?: unknown } | null;
        if (typeof d?.code === "string") saveMyCode(st, d.code);
      } catch {
        // 내 코드를 못 받아도 공유는 코드 없이 그대로 돼요
      }
    })();
    return () => {
      alive = false;
    };
  }, [loggedIn]);
  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 7000);
    return () => window.clearTimeout(t);
  }, [notice]);
  useEffect(() => {
    if (!gift) return;
    const t = window.setTimeout(() => setGift(false), 6000);
    return () => window.clearTimeout(t);
  }, [gift]);

  // 로그인 직후 환영 안내는 4초 뒤 사라져요.
  useEffect(() => {
    if (!justLoggedIn) return;
    const t = window.setTimeout(clearWelcome, 4000);
    return () => window.clearTimeout(t);
  }, [justLoggedIn, clearWelcome]);

  // 화면을 누르면 작은 물방울이 톡 터져요. (움직임 줄이기 설정이면 만들지 않아요)
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const onPointerDown = (e: PointerEvent) => {
      for (let i = 0; i < 4; i++) {
        const el = document.createElement("span");
        const size = 8 + Math.random() * 10;
        el.className = "click-bubble";
        el.style.width = el.style.height = `${size}px`;
        el.style.left = `${e.clientX}px`;
        el.style.top = `${e.clientY}px`;
        el.style.setProperty("--dx", `${(Math.random() - 0.5) * 70}px`);
        el.style.setProperty("--dy", `${-20 - Math.random() * 40}px`);
        el.setAttribute("aria-hidden", "true");
        document.body.appendChild(el);
        window.setTimeout(() => el.remove(), 800);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const openLogin = useCallback(() => setLoginOpen(true), []);
  const closeLogin = useCallback(() => {
    setLoginOpen(false);
    clearResult();
  }, [clearResult]);
  // 카카오에서 돌아왔는데 실패·취소였다면 로그인 창을 다시 열어 이유를 알려줘요.
  useEffect(() => {
    if (loginResult) setLoginOpen(true);
  }, [loginResult]);
  const closeIntake = useCallback(() => setIntake(null), []);
  // 생년월일시 입력이 끝나 결과를 받았을 때만 뽑기 횟수를 올려요. (입력창만 열고 닫은 건 세지 않아요)
  // 로그인 회원이고 서버가 횟수를 세어 줬다면 그 값을 쓰고, 아니면 이 브라우저에서만 세요.
  const completeDraw = useCallback(
    (fromServer?: { today: number; month: number } | null) => {
      // 오늘을 방문한 날로 기록해서 연속 방문 '물길'을 이어요. (이 기기에서만 세요)
      recordVisit(getBrowserStorage(), dayKey(new Date()));
      if (bonusRef.current) {
        spendTicket(getBrowserStorage());
        bonusRef.current = false;
      }
      syncReward();
      // 서버가 코인을 썼을 수 있어서 남은 장수를 다시 읽어요.
      if (loggedIn) void refreshCoins();
      if (spinKey.current) {
        setLastKey(spinKey.current);
        try {
          getBrowserStorage()?.setItem(LAST_KEY, spinKey.current);
        } catch {
          /* 저장 실패는 무시 */
        }
      }
      if (fromServer) {
        setServerCounts(fromServer);
        applyCounts(fromServer);
        return;
      }
      applyCounts(recordDraw(getBrowserStorage(), new Date(), countsRef.current));
    },
    [applyCounts, setServerCounts, syncReward, loggedIn, refreshCoins],
  );

  // 로그인 직후엔 서버가 센 횟수를, 로그아웃·탈퇴 후엔 이 브라우저의 횟수를 보여줘요.
  useEffect(() => {
    if (serverCounts) applyCounts(serverCounts);
    else if (!user) applyCounts(readCounts(getBrowserStorage(), new Date()));
  }, [serverCounts, user, applyCounts]);

  return (
    <>
      <BubbleBackground />
      <Header onOpenLogin={openLogin} user={user} wallet={user ? { bills: 0, coins: coins + tickets, free: Math.max(0, FREE_PER_DAY - counts.today) } : null} />

      <main className="relative z-10 max-w-[34rem] lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-5 pb-20 sm:pb-24">
        <HeroSection visitors={visitors} tickets={tickets + coins} />
        <ShowcaseSection />
        {!user && <BirthdayTeaser />}
        {/* 도리의 소식 카드들은 첫 화면의 "뽑으러 가기" 버튼 아래로 옮겼어요. (첫 화면에서 눌러야 할 것이 하나만 보이게) */}
        {user && profile && <DailyLineCard onOpened={() => {
          recordVisit(getBrowserStorage(), dayKey(new Date()));
          syncReward();
        }} />}
        {user && <VaultFollowupCard />}
        <FollowupCard />
        <MachinesSection onSpin={handleSpin} lastKey={lastKey} />
        <PremiumSection onSpin={handleSpin} />
        <SampleSection />
        <TrustSection />
        <FaqSection />
      </main>

      <Footer />
      <div aria-hidden="true" className="h-16 lg:hidden" />
      <BottomTabs />

      {ritual && <CoinRitual bill={ritualBill} />}
      <StickyDrawCta hidden={Boolean(intake) || loginOpen || ritual} />

      {((justLoggedIn && user) || gift || notice) && (
        <div
          role="status"
          data-testid="welcome-toast"
          className="fixed left-1/2 -translate-x-1/2 top-20 z-[60] w-[calc(100%-2rem)] max-w-sm rounded-2xl bg-emerald-600 text-white shadow-xl px-4 py-3 text-sm font-bold flex items-center justify-between gap-3"
        >
          <span>
            {notice
              ? notice
              : gift
              ? `🎁 ${user?.nickname ? `${user.nickname}님, ` : ""}로그인 선물로 500원 무료 뽑기 1회가 도착했어요!`
              : `🫧 ${user?.nickname ? `${user.nickname}님, ` : ""}로그인됐어요! 매일 첫 1회는 무료예요.`}
          </span>
          <button type="button" onClick={() => { clearWelcome(); setGift(false); setNotice(null); }} aria-label="알림 닫기" className="shrink-0 text-white/80 hover:text-white">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {loginOpen && <LoginModal onClose={closeLogin} user={user} result={loginResult} onLogout={logout} onWithdraw={withdraw} profile={profile} onDeleteProfile={deleteProfile} />}
      {intake && (
        <IntakeModal
          target={intake}
          onClose={closeIntake}
          onComplete={completeDraw}
          loggedIn={Boolean(user)}
          nickname={user?.nickname ?? null}
          savedProfile={profile}
          onRequestLogin={() => {
            setIntake(null);
            setLoginOpen(true);
          }}
          onProfileSaved={setProfile}
        />
      )}
    </>
  );
}
