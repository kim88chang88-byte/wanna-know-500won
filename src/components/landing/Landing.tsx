"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getBrowserStorage, readCounts, recordDraw, type DrawCounts } from "@/lib/drawCounter";
import IntakeModal, { type IntakeTarget } from "./IntakeModal";
import { LoginModal } from "./Modals";
import { useAuth } from "./useAuth";
import BubbleBackground from "./BubbleBackground";
import {
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

export default function Landing() {
  const { user, profile, setProfile, deleteProfile, serverCounts, setServerCounts, result: loginResult, clearResult, justLoggedIn, clearWelcome, logout, withdraw } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [intake, setIntake] = useState<IntakeTarget | null>(null);
  const [counts, setCounts] = useState<DrawCounts>({ today: 0, month: 0 });
  // 화면에 보이는 최신 횟수. (상태 업데이터 안에서 저장소에 쓰면 개발 모드에서 두 번 실행되어 2씩 늘어나서 ref 를 씁니다)
  const countsRef = useRef<DrawCounts>(counts);
  const timers = useRef<number[]>([]);

  const applyCounts = useCallback((next: DrawCounts) => {
    countsRef.current = next;
    setCounts(next);
  }, []);

  // 서버가 만든 HTML 과 맞추기 위해 첫 화면은 0 으로 두고, 브라우저에서 저장된 횟수를 읽어 옵니다.
  useEffect(() => {
    applyCounts(readCounts(getBrowserStorage(), new Date()));
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
  }, [applyCounts]);

  const handleSpin = useCallback(
    (_key: string, fortune: string, price: string, premium?: boolean) => {
      timers.current.push(window.setTimeout(() => setIntake({ fortune, price, premium: premium === true }), MODAL_DELAY_MS));
    },
    [],
  );

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
      if (fromServer) {
        setServerCounts(fromServer);
        applyCounts(fromServer);
        return;
      }
      applyCounts(recordDraw(getBrowserStorage(), new Date(), countsRef.current));
    },
    [applyCounts, setServerCounts],
  );

  // 로그인 직후엔 서버가 센 횟수를, 로그아웃·탈퇴 후엔 이 브라우저의 횟수를 보여줘요.
  useEffect(() => {
    if (serverCounts) applyCounts(serverCounts);
    else if (!user) applyCounts(readCounts(getBrowserStorage(), new Date()));
  }, [serverCounts, user, applyCounts]);

  return (
    <>
      <BubbleBackground />
      <Header onOpenLogin={openLogin} user={user} />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-5">
        <HeroSection counts={counts} />
        <ShowcaseSection />
        <MachinesSection onSpin={handleSpin} />
        <PremiumSection onSpin={handleSpin} />
        <SampleSection />
        <TrustSection />
      </main>

      <Footer />

      {justLoggedIn && user && (
        <div
          role="status"
          data-testid="welcome-toast"
          className="fixed left-1/2 -translate-x-1/2 top-20 z-[60] w-[calc(100%-2rem)] max-w-sm rounded-2xl bg-emerald-600 text-white shadow-xl px-4 py-3 text-sm font-bold flex items-center justify-between gap-3"
        >
          <span>
            🫧 {user.nickname ? `${user.nickname}님, ` : ""}로그인됐어요! 매일 첫 1회는 무료예요.
          </span>
          <button type="button" onClick={clearWelcome} aria-label="알림 닫기" className="shrink-0 text-white/80 hover:text-white">
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
