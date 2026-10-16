"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getBrowserStorage, readCounts, recordDraw, type DrawCounts } from "@/lib/drawCounter";
import IntakeModal, { type IntakeTarget } from "./IntakeModal";
import { LoginModal } from "./Modals";
import { useAuth } from "./useAuth";
import {
  Footer,
  Header,
  HeroSection,
  PremiumSection,
  SampleSection,
  ShowcaseSection,
  SlotsSection,
  TrustSection,
} from "./Sections";

const LEVER_ANIMATION_MS = 600;
const MODAL_DELAY_MS = 350;

export default function Landing() {
  const { user, result: loginResult, clearResult, logout } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [intake, setIntake] = useState<IntakeTarget | null>(null);
  const [spinningKey, setSpinningKey] = useState<string | null>(null);
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
    (key: string, fortune: string, price: string) => {
      setSpinningKey(key);
      timers.current.push(window.setTimeout(() => setSpinningKey(null), LEVER_ANIMATION_MS));
      timers.current.push(window.setTimeout(() => setIntake({ fortune, price }), MODAL_DELAY_MS));
    },
    [],
  );

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
  const completeDraw = useCallback(() => {
    applyCounts(recordDraw(getBrowserStorage(), new Date(), countsRef.current));
  }, [applyCounts]);

  return (
    <>
      <Header onOpenLogin={openLogin} user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <HeroSection counts={counts} />
        <ShowcaseSection onSpin={handleSpin} spinningKey={spinningKey} />
        <SampleSection />
        <SlotsSection onSpin={handleSpin} spinningKey={spinningKey} />
        <PremiumSection onSpin={handleSpin} spinningKey={spinningKey} />
        <TrustSection />
      </main>

      <Footer />

      {loginOpen && <LoginModal onClose={closeLogin} user={user} result={loginResult} onLogout={logout} />}
      {intake && <IntakeModal target={intake} onClose={closeIntake} onComplete={completeDraw} />}
    </>
  );
}
