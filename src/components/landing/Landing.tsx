"use client";

import StickyDrawCta from "./StickyDrawCta";
import BirthdayTeaser from "./BirthdayTeaser";
import BottomTabs from "./BottomTabs";
import CoinRitual from "./CoinRitual";
import { splitPearls } from "@/lib/currency";
import PurchaseModal from "@/components/pay/PurchaseModal";
import BetaOpenPopup from "./BetaOpenPopup";
import PremiumSoonPopup from "./PremiumSoonPopup";
import { PREMIUM_SOON } from "@/lib/premiumSoon";
import PaywallPopup, { type PaywallInfo } from "./PaywallPopup";
import { readingCoinCost } from "@/lib/spendPlan";
import { useCallback, useEffect, useRef, useState } from "react";
import { dayKey, getBrowserStorage, readCounts, recordDraw, type DrawCounts } from "@/lib/drawCounter";
import { readVisitDays, recordVisit } from "@/lib/streak";
import { pingNav, writeDrawAvail } from "@/lib/navDots";
import { REFILL_KEY, checkRefill, kstDayOf, parseRefill } from "@/lib/freeRefill";
import { grantTickets, readTickets, spendTicket, STREAK_FOR_TICKET } from "@/lib/stampReward";
import { FREE_PER_DAY } from "@/lib/db/config";
import { ensureVid, track } from "@/lib/track";
import { clearPendingDraw, savePendingDraw, takePendingDraw } from "@/lib/pendingDraw";
import { clearAfterLoginChat, saveAfterLoginChat, saveAfterLoginGoChat, takeAfterLoginChat, takeAfterLoginGoChat } from "@/lib/afterLoginChat";
import { saveChatCtx, type ChatCtx } from "@/lib/chatContext";
import { useRouter } from "next/navigation";
import { clearRef, isFinalRedeem, readRef, redeemMessage, refFromSearch, saveMyCode, saveRef } from "@/lib/referral";
import { DailyLineCard } from "./DailyLineCard";
import { FollowupCard } from "./FollowupCard";
import { VaultFollowupBubble } from "./VaultFollowupBubble";
import dynamic from "next/dynamic";
import type { IntakeTarget } from "./IntakeModal";

// 입력·결과 창은 코드가 커서, 처음 화면에는 싣지 않고 따로 받아요. (아래에서 화면이 한가할 때 미리 받아 둬서 열 때 기다리지 않아요)
const IntakeModal = dynamic(() => import("./IntakeModal"), { ssr: false });
import { LoginModal } from "./Modals";
import { useAuth } from "./useAuth";
import SnowBackground from "./SnowBackground";
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

export default function Landing() {
  const router = useRouter();
  const { user, profile, setProfile, deleteProfile, serverCounts, setServerCounts, result: loginResult, clearResult, justLoggedIn, clearWelcome, logout, withdraw } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  // 비회원이 뽑기를 누르면 로그인 창을 열면서, 왜 열렸는지 한 줄로 알려줘요.
  const [loginReason, setLoginReason] = useState<string | null>(null);
  const [vaultAsk, setVaultAsk] = useState(false); // 보관함 안부 말풍선이 있으면 다른 안부 카드는 숨겨요
  const [vaultDot, setVaultDot] = useState(false); // 말풍선을 닫았고 아직 대답 전이면 닉네임 버튼에 빨간 점
  const userRef = useRef<typeof user>(null);
  userRef.current = user;
  const [intake, setIntake] = useState<IntakeTarget | null>(null);
  const [counts, setCounts] = useState<DrawCounts>({ today: 0, month: 0 });
  // 화면에 보이는 최신 횟수. (상태 업데이터 안에서 저장소에 쓰면 개발 모드에서 두 번 실행되어 2씩 늘어나서 ref 를 씁니다)
  const countsRef = useRef<DrawCounts>(counts);
  const timers = useRef<number[]>([]);
  const [ritual, setRitual] = useState(false);
  const [ritualBig, setRitualBig] = useState(false);
  const [ritualTwo, setRitualTwo] = useState(false);
  const [tickets, setTickets] = useState(0);
  // 서버에 쌓인 뽑기 코인(로그인 선물 등)과, 방금 선물을 받았는지
  const [coins, setCoins] = useState(0);
  const [payOpen, setPayOpen] = useState(false);
  // 프리미엄·궁합 카드를 눌렀는데 조약돌이 모자랄 때 먼저 보여주는 안내창, 그리고 거기서 열린 충전 화면
  const [premiumSoon, setPremiumSoon] = useState(false);
  const [paywall, setPaywall] = useState<PaywallInfo | null>(null);
  const [paywallPay, setPaywallPay] = useState<PaywallInfo | null>(null);
  const coinsRef = useRef(0);
  const [gift, setGift] = useState(false);
  // 친구 초대 코드 적용 결과 안내
  const [notice, setNotice] = useState<string | null>(null);
  const refreshCoins = useCallback(async (): Promise<number | null> => {
    try {
      const res = await fetch("/api/coins", { method: "POST" });
      if (!res.ok) return null;
      const d = (await res.json()) as { balance?: unknown; granted?: unknown };
      const bal = typeof d.balance === "number" && d.balance > 0 ? d.balance : 0;
      coinsRef.current = bal;
      setCoins(bal);
      // granted: 처음 로그인한 회원 (조약돌 선물은 없어요. 신규 가입 집계만 남겨요)
      if (d.granted === true) track("signup");
      return bal;
    } catch {
      // 코인 확인이 안 돼도 뽑기는 그대로 돼요
      return null;
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
        const vid = ensureVid();
        const utm = new URLSearchParams(window.location.search).get("utm_source") ?? "";
        const friend = Boolean(refFromSearch(window.location.search));
        const res = await fetch("/api/visit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ vid, utm, friend, ref: document.referrer }) });
        const d = (await res.json().catch(() => null)) as { today?: number; total?: number } | null;
        if (res.ok && typeof d?.today === "number" && typeof d?.total === "number") setVisitors({ today: d.today, total: d.total });
      } catch {
        // 숫자를 못 받으면 그냥 숨겨요
      }
    })();
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
  }, [applyCounts, syncReward]);

  const handleSpin = useCallback(
    (key: string, fortune: string, price: string, premium?: boolean) => {
      // 프리미엄 종합 사주는 아직 공개 전이라 "준비 중" 안내만 보여줘요. (궁합은 그대로 열려 있어요)
      if (premium === true && PREMIUM_SOON && !fortune.includes("궁합")) {
        setPremiumSoon(true);
        return;
      }
      // 운세 뽑기는 로그인한 회원만 할 수 있어요. 비회원은 로그인 창으로 안내해요.
      if (!userRef.current) {
        track("login_click");
        // 로그인하고 돌아오면 이 카드를 이어서 열어 주려고, 어떤 카드였는지만 적어 둬요.
        savePendingDraw(getBrowserStorage(), { key, fortune, price, premium: premium === true });
        setLoginReason(`${fortune} 뽑기는 로그인하고 이용할 수 있어요 ❄️`);
        setLoginOpen(true);
        return;
      }
      // 프리미엄(종합 사주·궁합)은 조약돌로만 열려요. 조약돌이 모자라면 입력 전에 안내창을 먼저 보여줘요.
      if (premium === true) {
        const need = readingCoinCost(true, fortune.includes("궁합"));
        const info: PaywallInfo = { fortune, price, premium: true, need, have: coinsRef.current, compat: fortune.includes("궁합") };
        if (coinsRef.current < need) {
          // 조약돌을 아직 못 읽었을 수 있어서, 한 번 새로 읽고 판단해요.
          void refreshCoins().then((bal) => {
            const have = bal ?? coinsRef.current;
            if (have < need) setPaywall({ ...info, have });
            else begin();
          });
          return;
        }
      }
      // 일반 풀이(조약돌 1개): 오늘 무료 뽑기도, 보너스 뽑기권도, 조약돌도 없으면 입력 전에 "잔액이 부족해요" 안내창을 먼저 보여줘요.
      if (premium !== true) {
        const noFree = countsRef.current.today >= FREE_PER_DAY && readTickets(getBrowserStorage()) <= 0;
        if (noFree && coinsRef.current < 1) {
          void refreshCoins().then((bal) => {
            const have = bal ?? coinsRef.current;
            if (have < 1) setPaywall({ fortune, price, premium: false, need: 1, have, compat: false });
            else begin();
          });
          return;
        }
      }
      begin();
      return;
      function begin() {
      spinKey.current = key;
      track("draw_start");
      // 오늘 무료 뽑기를 이미 썼고 보너스 뽑기가 있으면, 보너스로 한 번 더 뽑아요.
      // (프리미엄·궁합은 보너스 뽑기권으로 열 수 없어서 제외해요)
      const bonus = premium !== true && countsRef.current.today >= FREE_PER_DAY && readTickets(getBrowserStorage()) > 0;
      bonusRef.current = bonus;
      const open = () => setIntake({ fortune, price, premium: premium === true, bonus });
      const calm = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (calm) {
        timers.current.push(window.setTimeout(open, MODAL_DELAY_MS));
        return;
      }
      // 프리미엄 종합 사주(진주 3개 + 조약돌 1개)는 진주가, 그 밖의 풀이는 조약돌이 떨어져요.
      const big = premium === true && !fortune.includes("궁합");
      setRitualBig(big);
      setRitualTwo(premium === true && fortune.includes("궁합")); // 궁합은 조약돌 2개가 떨어져요
      setRitual(true);
      timers.current.push(
        window.setTimeout(() => {
          setRitual(false);
          open();
        }, RITUAL_MS),
      );
      }
    },
    [refreshCoins],
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
  // 후기 보상 등으로 코인이 늘어난 순간(다른 화면에서 알려줘요) 잔액을 새로 읽어요.
  useEffect(() => {
    const on = () => void refreshCoins();
    window.addEventListener("wanna500:coins", on);
    return () => window.removeEventListener("wanna500:coins", on);
  }, [refreshCoins]);
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

  // 로그인하고 돌아왔는데 누르려던 카드가 있었다면, 환영 인사를 잠깐 보여 준 뒤 그 카드를 이어서 열어요.
  const resumedRef = useRef(false);
  useEffect(() => {
    if (!justLoggedIn || !user || resumedRef.current) return;
    resumedRef.current = true;
    // "로그인하고 도리에게 더 물어보기"로 들어왔다면, 상담실이 열려 있는 경우 곧바로 상담실로 가요.
    const chatCtx = takeAfterLoginChat(getBrowserStorage());
    if (chatCtx) {
      fetch("/api/chat", { cache: "no-store" })
        .then((r) => r.json() as Promise<{ enabled?: boolean }>)
        .then((d) => {
          if (d.enabled !== true) return;
          saveChatCtx(chatCtx);
          router.push("/chat");
        })
        .catch(() => undefined);
      return;
    }
    // 하단 메뉴의 "도유상담실"을 눌러 로그인했다면 상담실로 가요. (아직 안 열린 계정이면 안내만 해요)
    if (takeAfterLoginGoChat(getBrowserStorage())) {
      fetch("/api/chat", { cache: "no-store" })
        .then((r) => r.json() as Promise<{ enabled?: boolean }>)
        .then((d) => {
          if (d.enabled === true) router.push("/chat");
          else setNotice("도유 상담실은 곧 열려요 ❄️");
        })
        .catch(() => undefined);
      return;
    }
    const d = takePendingDraw(getBrowserStorage());
    if (!d) return;
    setLoginOpen(false);
    setLoginReason(null);
    const t = window.setTimeout(() => handleSpin(d.key, d.fortune, d.price, d.premium), 900);
    timers.current.push(t);
  }, [justLoggedIn, user, handleSpin, router]);

  const openLogin = useCallback(() => {
    clearPendingDraw(getBrowserStorage()); // 머리말의 로그인 버튼으로 들어간 경우엔 이어서 열 카드가 없어요
    clearAfterLoginChat(getBrowserStorage());
    track("login_click");
    setLoginOpen(true);
  }, []);
  // 하단 메뉴 "도유상담실"을 비로그인으로 눌렀을 때: 로그인 창을 띄우고, 로그인하고 돌아오면 상담실로 보내요.
  const openChatTabLogin = useCallback(() => {
    clearPendingDraw(getBrowserStorage());
    clearAfterLoginChat(getBrowserStorage());
    saveAfterLoginGoChat(getBrowserStorage());
    track("chat_login_click");
    setLoginReason("도유 상담실은 로그인하고 이용할 수 있어요 ❄️");
    setLoginOpen(true);
  }, []);
  const openChatLogin = useCallback((chat: ChatCtx) => {
    track("chat_login_click");
    clearAfterLoginChat(getBrowserStorage()); // 하단 메뉴로 남긴 이동 표시가 있었다면 지우고, 이 한마디로 이어가요
    saveAfterLoginChat(getBrowserStorage(), chat);
    setLoginOpen(true);
  }, []);
  // 로그인 완료(방문자 ID 와 회원 번호는 연결하지 않고, '완료했다'는 표시만 남겨요)
  useEffect(() => {
    if (justLoggedIn && user) track("login_done");
  }, [justLoggedIn, user]);
  const closeLogin = useCallback(() => {
    clearPendingDraw(getBrowserStorage()); // 로그인하지 않고 닫으면 이어서 열지 않아요
    clearAfterLoginChat(getBrowserStorage());
    setLoginOpen(false);
    setLoginReason(null);
    clearResult();
  }, [clearResult]);
  // 카카오에서 돌아왔는데 실패·취소였다면 로그인 창을 다시 열어 이유를 알려줘요.
  useEffect(() => {
    if (loginResult) setLoginOpen(true);
  }, [loginResult]);
  // 첫 화면이 다 그려지고 한가해지면 입력 창 코드를 미리 받아 둬요.
  useEffect(() => {
    const preload = () => {
      void import("./IntakeModal");
    };
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(preload, { timeout: 5000 });
      return () => window.cancelIdleCallback(id);
    }
    const t = window.setTimeout(preload, 2500);
    return () => window.clearTimeout(t);
  }, []);

  const closeIntake = useCallback(() => setIntake(null), []);
  // 생년월일시 입력이 끝나 결과를 받았을 때만 뽑기 횟수를 올려요. (입력창만 열고 닫은 건 세지 않아요)
  // 로그인 회원이고 서버가 횟수를 세어 줬다면 그 값을 쓰고, 아니면 이 브라우저에서만 세요.
  const completeDraw = useCallback(
    (fromServer?: { today: number; month: number } | null) => {
      // 오늘을 방문한 날로 기록해서 연속 방문 '물길'을 이어요. (이 기기에서만 세요)
      recordVisit(getBrowserStorage(), dayKey(new Date()));
      track("draw_done");
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
          // 계정별로 기억해요: 같은 브라우저에서 다른 계정으로 로그인하면 이 표시는 보이지 않아요
          if (userTagRef.current) getBrowserStorage()?.setItem(LAST_KEY, `${userTagRef.current}:${spinKey.current}`);
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

  // "지난번에 뽑았어요" 표시: 로그인한 계정이 직접 뽑은 것만 보여줘요 (이 브라우저에 남은 다른 사람 것은 숨겨요)
  const userTag = user?.tag ?? null;
  const userTagRef = useRef<string | null>(null);
  userTagRef.current = userTag;
  useEffect(() => {
    if (!userTag) {
      setLastKey(null);
      return;
    }
    try {
      const v = getBrowserStorage()?.getItem(LAST_KEY) ?? "";
      const i = v.indexOf(":");
      setLastKey(i > 0 && v.slice(0, i) === userTag ? v.slice(i + 1) : null);
    } catch {
      /* 읽기 실패는 무시 */
    }
  }, [userTag]);

  // 로그인 직후엔 서버가 센 횟수를, 로그아웃·탈퇴 후엔 이 브라우저의 횟수를 보여줘요.
  useEffect(() => {
    if (serverCounts) applyCounts(serverCounts);
    else if (!user) applyCounts(readCounts(getBrowserStorage(), new Date()));
  }, [serverCounts, user, applyCounts]);

  // 어제 무료 뽑기를 다 쓰고 간 회원이 새 날에 다시 들어오면 "충전됐어요" 알림을 한 번만 보여줘요 (이 기기에만 기억)
  useEffect(() => {
    if (!user || !serverCounts) return;
    const st = getBrowserStorage();
    let raw: string | null = null;
    try {
      raw = st?.getItem(REFILL_KEY) ?? null;
    } catch {
      /* 읽기 실패는 알림만 건너뛰어요 */
    }
    const r = checkRefill(parseRefill(raw), user.tag ?? "me", kstDayOf(Date.now()), serverCounts.today >= FREE_PER_DAY);
    try {
      st?.setItem(REFILL_KEY, JSON.stringify(r.next));
    } catch {
      /* 저장이 막힌 환경이면 알림만 안 기억해요 */
    }
    if (r.show) setNotice("🎁 무료 뽑기 1회가 충전됐어요! 오늘의 운세, 지금 뽑아볼까요?");
  }, [user, serverCounts]);

  // 하단 메뉴 "운세 뽑기" 빨간 점: 오늘 무료 뽑기나 조약돌이 남아 있는지 적어 둬요 (메뉴를 열면 꺼져요)
  useEffect(() => {
    writeDrawAvail(getBrowserStorage(), Math.max(0, FREE_PER_DAY - counts.today) + tickets + coins > 0, coins, new Date());
    pingNav();
  }, [counts.today, tickets, coins]);

  // 한국 시간 00시를 넘겼을 때: 모달을 보고 있지 않으면 새 날의 횟수를 받으려고 화면을 새로 불러와요
  const onFreeElapsed = useCallback(() => {
    if (!intake && !loginOpen && !ritual && !payOpen && !paywall && !paywallPay) window.location.reload();
  }, [intake, loginOpen, ritual, payOpen, paywall, paywallPay]);

  return (
    <>
      <SnowBackground />
      <Header onOpenLogin={openLogin} user={user} dot={Boolean(user) && vaultDot} bubble={user ? <VaultFollowupBubble onShow={setVaultAsk} onDot={setVaultDot} /> : null} />

      <main className="relative z-10 max-w-[34rem] lg:max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-5 pb-20 sm:pb-24">
        <HeroSection visitors={visitors} tickets={tickets} onBuy={user ? () => router.push("/wallet") : undefined} onRefill={onFreeElapsed} wallet={user ? { ...splitPearls(coins), free: Math.max(0, FREE_PER_DAY - counts.today) + tickets } : null} />
        <ShowcaseSection />
        {!user && <BirthdayTeaser onOpenLogin={openChatLogin} />}
        {/* 도리의 소식 카드들은 첫 화면의 "뽑으러 가기" 버튼 아래로 옮겼어요. (첫 화면에서 눌러야 할 것이 하나만 보이게) */}
        {user && profile && <DailyLineCard birth={profile} onOpened={() => {
          recordVisit(getBrowserStorage(), dayKey(new Date()));
          syncReward();
        }} />}
        {!(user && vaultAsk) && <FollowupCard />}
        <MachinesSection onSpin={handleSpin} lastKey={lastKey} />
        <PremiumSection onSpin={handleSpin} />
        <SampleSection />
        <TrustSection />
        <FaqSection />
      </main>

      <Footer />
      <div aria-hidden="true" className="h-24 lg:hidden" />
      <BottomTabs onChatLogin={openChatTabLogin} />

      <BetaOpenPopup />
      {premiumSoon && <PremiumSoonPopup onClose={() => setPremiumSoon(false)} />}
      {payOpen && <PurchaseModal onClose={() => { setPayOpen(false); void refreshCoins(); }} />}
      {paywall && (
        <PaywallPopup
          info={paywall}
          onClose={() => setPaywall(null)}
          onCharge={() => {
            setPaywallPay(paywall);
            setPaywall(null);
          }}
        />
      )}
      {paywallPay && (
        <PurchaseModal
          preselect={paywallPay.premium && !paywallPay.compat ? "pack22" : "pack2"}
          onClose={() => {
            setPaywallPay(null);
            void refreshCoins();
          }}
          onContinue={() => {
            const ctx = paywallPay;
            setPaywallPay(null);
            // 충전 직후 조약돌을 새로 읽어서, 충분하면 바로 풀이 입력으로 이어가요.
            void refreshCoins().then((bal) => {
              if ((bal ?? 0) >= ctx.need) handleSpin(`paywall-${ctx.fortune}`, ctx.fortune, ctx.price, ctx.premium);
              else setPaywall({ ...ctx, have: bal ?? 0 });
            });
          }}
        />
      )}
      {ritual && <CoinRitual big={ritualBig} two={ritualTwo} />}
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
              : `❄️ ${user?.nickname ? `${user.nickname}님, ` : ""}로그인됐어요! 매일 첫 1회는 무료예요.`}
          </span>
          <button type="button" onClick={() => { clearWelcome(); setGift(false); setNotice(null); }} aria-label="알림 닫기" className="shrink-0 text-white/80 hover:text-white">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {loginOpen && <LoginModal onClose={closeLogin} reason={loginReason} user={user} result={loginResult} onLogout={logout} onWithdraw={withdraw} profile={profile} onDeleteProfile={deleteProfile} />}
      {intake && (
        <IntakeModal
          target={intake}
          wallet={user ? { freeLeft: Math.max(0, FREE_PER_DAY - counts.today), tickets, coins } : null}
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
