import Link from "next/link";
import type React from "react";
import { SERVICE_NAME } from "@/lib/siteInfo";
import type { AuthUser } from "./useAuth";
import { FAQ_ITEMS } from "./faq";
import { FREE_PRICE_LABEL, MACHINES, PREMIUM_CARDS } from "./data";
import { MachineMenuButton } from "./MenuButton";
import { HERO_IMAGE, IMAGES, LOGO_IMAGE } from "./images";
import SafeImage from "./SafeImage";
import FreeCountdown from "./FreeCountdown";
import WalletBar, { type WalletValues } from "./WalletBar";
import BrandLink from "./BrandLink";
import DoriIcon from "./DoriIcon";
import ReviewsSection from "./ReviewsSection";
import ShareSiteBar from "./ShareSiteBar";

export type SpinHandler = (key: string, fortune: string, price: string, premium?: boolean) => void;

interface SpinProps {
  onSpin: SpinHandler;
}

/** 카드 모서리에 비스듬히 붙는 "HOT" 스티커. (카드는 relative 여야 해요) */
function Sticker({ text, testId }: { text: string; testId?: string }) {
  const isNew = text === "NEW";
  return (
    <div
      data-testid={testId}
      className={`absolute -top-2.5 -right-2 flex items-center gap-0.5 px-2 sm:px-2.5 py-0.5 rounded-full text-white font-sans font-black tracking-wide text-[11px] sm:text-xs leading-tight ${isNew ? "bg-gradient-to-r from-sky-500 to-indigo-500 shadow-[0_2px_6px_rgba(59,130,246,0.4)]" : "bg-gradient-to-r from-rose-500 to-orange-400 shadow-[0_2px_6px_rgba(244,63,94,0.4)]"} ring-2 ring-white z-10 whitespace-nowrap pointer-events-none`}
    >
      <span aria-hidden="true">{isNew ? "✨" : "🔥"}</span>
      {text}
    </div>
  );
}

/** 카드를 키보드(Enter·Space)로도 열 수 있게 해요. */
function activateOnKey(e: React.KeyboardEvent, run: () => void) {
  if (e.target !== e.currentTarget) return;
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    run();
  }
}

/* ------------------------------------------------------------------ 헤더 */

/** 닉네임의 첫 글자. 이모지처럼 글자 하나가 두 칸을 차지하는 문자도 깨지지 않게 Array.from 으로 나눠요. */
export function firstGlyph(nickname: string | null | undefined): string {
  return Array.from((nickname ?? "").trim())[0] ?? "❄️";
}

export function Header({ onOpenLogin, user = null, bubble = null, strip = null }: { onOpenLogin: () => void; user?: AuthUser | null; bubble?: React.ReactNode; strip?: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-brand-100 shadow-[0_2px_15px_rgba(128,87,224,0.06)]">
        <div className="max-w-[34rem] lg:max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-2 sm:gap-3">
          {/* 왼쪽 위: 로고 + Beta 스티커 */}
          <div className="flex flex-col items-start gap-1 min-w-0">
            <BrandLink overlayBeta />
          </div>

          {/* 오른쪽 위: 로그인 전에는 "로그인" 버튼, 로그인 후에는 닉네임(마이페이지) + "?" 안내 메뉴 + 햄버거(자판기) 메뉴. 둘 다 같은 창(로그인/내 정보)을 열어 */}
          <div className="relative shrink-0 flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={onOpenLogin}
              type="button"
              aria-haspopup="dialog"
              data-testid="mypage-button"
              data-logged-in={user ? "true" : "false"}
              aria-label={user ? `${user.nickname ? `${user.nickname}님` : "회원님"} 로그인됨 · 내 정보 보기` : undefined}
              className={`group relative flex items-center gap-1.5 sm:gap-2 rounded-full border transition-all text-left shadow-sm ${
                user
                  ? "p-0.5 bg-emerald-50 hover:bg-emerald-100/70 border-emerald-300/70"
                  : "p-1 pr-2.5 sm:px-3.5 sm:py-1.5 bg-brand-600 hover:bg-brand-700 border-brand-600 text-white"
              }`}
            >
              <div
                className={`relative w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-full bg-white flex items-center justify-center group-hover:scale-105 transition-transform ${
                  user ? "text-emerald-700 font-bold text-sm sm:h-9 sm:w-9" : "text-brand-600"
                }`}
              >
                {user ? (
                  <span aria-hidden="true">{firstGlyph(user.nickname)}</span>
                ) : (
                  <span aria-hidden="true" className="material-symbols-outlined text-[20px]">person</span>
                )}
                {user && (
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white"
                  />
                )}
              </div>
              {user ? (
                // 로그인된 상태는 동그란 아바타(머리글자 + 초록 점)만 보여요. 닉네임은 화면 낭독기용으로만 남겨 둬요.
                <span data-testid="mypage-name" className="sr-only">
                  {user.nickname ? `${user.nickname}님` : "회원님"} 로그인됨
                </span>
              ) : (
                // 로그인 전에는 작은 화면에서도 "로그인" 글자가 보이게 해요
                <div>
                  <span data-testid="login-label" className="block text-xs font-bold text-white leading-tight">
                    로그인
                  </span>
                  <span className="hidden sm:block text-[10px] text-brand-100 leading-tight">카카오·구글·네이버</span>
                </div>
              )}
            </button>
            <MachineMenuButton />
            {bubble}
          </div>
        </div>
        {/* 로고 줄 아래에 같이 고정되는 줄: 방문자 수 + 내 지갑 */}
        {strip}
      </header>

    </>
  );
}

/* ------------------------------------------------------------------ 히어로 */

/** 로고 줄 아래에 같이 고정되는 한 줄: 방문자 수(왼쪽) + 내 진주·조약돌·무료 뽑기(오른쪽, 로그인한 회원만). 둘 다 없으면 아무것도 안 그려요. */
export function HeaderStrip({ visitors = null, wallet = null, onBuy }: { visitors?: { today: number; total: number } | null; wallet?: WalletValues | null; onBuy?: () => void }) {
  if (!visitors && !wallet) return null;
  return (
    <div data-testid="header-strip" className="border-t border-brand-50 bg-gradient-to-b from-[#f9f1fd]/95 to-[#f4eefc]/95">
      <div className="max-w-[34rem] lg:max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between gap-2">
        {visitors ? (
          <div data-testid="visitors" className="inline-flex items-center gap-1.5 rounded-full bg-white/80 border border-brand-100 px-3 py-1 text-xs text-gray-500 shadow-sm shrink-0">
            <span>
              <b className="font-bold text-brand-500">Today</b> <span data-testid="visitors-today">{visitors.today.toLocaleString("ko-KR")}</span>
              <span className="hidden min-[400px]:inline">명</span>
            </span>
            <span aria-hidden="true" className="h-3 w-px bg-brand-200" />
            <span>
              <b className="font-bold text-indigo-800">Total</b> <span data-testid="visitors-total">{visitors.total.toLocaleString("ko-KR")}</span>
              <span className="hidden min-[400px]:inline">명</span>
            </span>
          </div>
        ) : (
          <span />
        )}
        {wallet && <WalletBar {...wallet} onBuy={onBuy} />}
      </div>
    </div>
  );
}

export function HeroSection({ tickets = 0, wallet = null, onRefill }: { tickets?: number; wallet?: WalletValues | null; onRefill?: () => void }) {
  return (
    <section className="text-left mb-3">
      {tickets > 0 && (
        <p data-testid="ticket-badge" className="mt-1 text-right text-[11px] font-bold leading-tight text-rose-600">
          🎟 보너스 뽑기 {tickets}장 <span className="hidden text-[10px] font-medium text-rose-400 min-[420px]:inline">· 무료 소진 후 자동 사용</span>
        </p>
      )}
      {wallet && wallet.free <= 0 ? (
        // 무료 뽑기를 다 썼을 때: 다음 충전(한국 시간 00시)까지 남은 시간
        <FreeCountdown onElapsed={onRefill} />
      ) : (
        wallet && wallet.pearls + wallet.pebbles > 0 && (
          <p data-testid="coin-note" className="mt-1 text-right text-[11px] leading-tight text-slate-500">
            {tickets > 0 ? "그다음 조약돌이 자동으로 쓰여" : "무료 뽑기를 다 쓰면 조약돌이 자동으로 쓰여"}
          </p>
        )
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ 수달 도사 소개 */

export function ShowcaseSection() {
  return (
    <section id="hero-showcase" className="rounded-[2.5rem] bg-gradient-to-b from-white via-sky-50/40 to-white border border-brand-200/70 p-3 sm:p-5 mb-6 shadow-[0_12px_40px_rgba(128,87,224,0.06)] relative overflow-hidden">
      <div className="pointer-events-none absolute -top-16 -right-16 w-80 h-80 rounded-full bg-sky-200/35 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-indigo-100/40 blur-3xl" aria-hidden="true" />

      <div className="relative w-full max-w-5xl mx-auto rounded-3xl shadow-[0_14px_34px_rgba(128,87,224,0.12)] bg-white p-3 sm:p-5 border-2 border-sky-200 overflow-hidden z-10">
        <div className="grid grid-cols-1 gap-3 sm:gap-4 items-center">
          <div className="relative w-full max-w-3xl lg:max-w-4xl mx-auto aspect-[16/9] rounded-2xl overflow-hidden bg-sky-50 flex items-center justify-center border border-sky-100 shadow-sm">
            <SafeImage
              src={HERO_IMAGE}
              alt="수달 도사 도리와 오행 친구들이 말해: 궁금행? 궁금하면 500원!!"
              className="w-full h-full object-cover"
              fallback="🦦"
              fallbackClass="text-8xl"
              eager
            />
          </div>
        </div>
      </div>

    </section>
  );
}

/* ------------------------------------------------------------------ 6대 운명의 자판기 */

export function MachinesSection({ onSpin, lastKey = null }: SpinProps & { lastKey?: string | null }) {
  return (
    <section id="machines" className="mb-8 relative z-10 scroll-mt-20">
      <div className="flex items-end justify-between gap-2 px-1 mb-2">
        <div>
          <div className="flex items-center gap-1 text-brand-600">
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">wb_sunny</span>
            <span className="text-[11px] font-bold uppercase tracking-wider">Daily Special</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900">하루 1번, 골라서 무료</h3>
        </div>
        <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] text-gray-500">기본 500원 · 궁합 1,000원</span>
      </div>

      {/* 폰에서는 2열로 아래로 내려 보여요. 맨 위 카드(새해운)만 가로로 크게. (큰 화면에서는 3열로 펼쳐져) */}
      <div data-testid="machine-grid" className="grid grid-cols-2 gap-x-3 gap-y-4 pb-4 pt-3 lg:grid-cols-3 lg:gap-4">
        {MACHINES.map((m, idx) => (
          <div key={m.key} className={`relative ${idx === 0 ? "col-span-2 lg:col-span-1" : ""}`}>
            {m.sticker && <Sticker text={m.sticker} testId="machine-sticker" />}
            {lastKey === m.key && (
              <span data-testid="last-drawn" className="absolute -top-2 left-3 z-10 rounded-full bg-white border border-sky-300 px-2 py-0.5 text-[10px] font-bold text-sky-700 shadow-sm">
                지난번에 뽑았어
              </span>
            )}
            <div
              id={m.key}
              data-testid="machine-card"
              role="button"
              tabIndex={0}
              aria-label={`${m.name} 운세 보기`}
              onClick={() => onSpin(m.key, m.fortune, m.price ?? FREE_PRICE_LABEL, m.premium)}
              onKeyDown={(e) => activateOnKey(e, () => onSpin(m.key, m.fortune, m.price ?? FREE_PRICE_LABEL, m.premium))}
              className={`scroll-mt-24 relative flex h-full cursor-pointer select-none overflow-hidden rounded-3xl p-2.5 transition-shadow lg:p-3 ${idx === 0 ? "max-lg:flex-row max-lg:items-center max-lg:gap-3 flex-col gap-2.5" : "flex-col gap-2 lg:gap-2.5"} hover:shadow-lg group focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-300 ${m.card}`}
            >
              <span aria-hidden="true" className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-50 blur-xl ${m.blob}`} />
              <div className={`relative flex w-full items-center justify-center overflow-hidden rounded-2xl border p-1.5 ${idx === 0 ? "aspect-[4/3] max-lg:w-[44%] max-lg:shrink-0" : "aspect-[16/10] lg:aspect-[4/3]"} ${m.imageBox}`}>
                <SafeImage
                  src={IMAGES[m.image]}
                  alt={m.name}
                  className="h-full w-auto max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
                  fallback={m.emoji}
                />
              </div>

              <div className="relative min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <h4 className={`font-cute font-normal ${idx === 0 ? "text-base" : "text-[15px] lg:text-base"} ${m.titleClass}`}>{m.name}</h4>
                  {m.chip && <span className="shrink-0 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700">{m.chip}</span>}
                </div>
                <p className={`line-clamp-2 text-xs leading-relaxed text-slate-600 ${idx === 0 ? "min-h-[2.6rem]" : "min-h-[2.4rem] text-[11.5px] lg:min-h-[2.6rem] lg:text-xs"}`}>{m.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ 프리미엄 심층 사주서 */

export function PremiumSection({ onSpin }: SpinProps) {
  return (
    <section id="premium" className="mb-8 relative z-10 scroll-mt-20">
      <div className="flex items-end justify-between gap-2 px-1 mb-2">
        <div>
          <div className="flex items-center gap-1 text-brand-600">
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">workspace_premium</span>
            <span className="text-[11px] font-bold uppercase tracking-wider">Premium Report</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900">신통방통 프리미엄 종합 사주</h3>
        </div>
        <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] text-gray-500">심층 리포트</span>
      </div>
      <div
        className="card-water-glow rounded-[2.5rem] p-2.5 sm:p-4 bg-[#2a1a5e] border-2 border-brand-300 shadow-[0_12px_36px_rgba(80,40,160,0.35)] relative overflow-hidden"
        style={{ backgroundImage: "url(/images/premium-bg.webp)", backgroundSize: "cover", backgroundPosition: "80% top" }}
      >
        <div className="relative z-10 pt-1 pb-1">
          {PREMIUM_CARDS.map((p) => (
            <div key={p.key} className="relative mx-auto w-full max-w-[460px] lg:max-w-[560px] transition-transform hover:-translate-y-1 active:scale-[0.98]">
            {p.ribbon && <Sticker text={p.ribbon} testId={"premium-sticker"} />}
            <div
              id={p.key}
              data-testid={"premium-card"}
              role="button"
              tabIndex={0}
              aria-label={`${p.title} 보기`}
              onClick={() => onSpin(p.key, p.fortune, "진주 3개 + 조약돌 1개", true)}
              onKeyDown={(e) => activateOnKey(e, () => onSpin(p.key, p.fortune, "진주 3개 + 조약돌 1개", true))}
              className={`scroll-mt-24 card-water-glow relative flex flex-col justify-between rounded-3xl p-3.5 h-full bg-white cursor-pointer select-none hover:shadow-lg transition-shadow group focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-300 ${p.card}`}
            >
              <div>
                <div className={`w-full aspect-[16/9] rounded-2xl flex items-center justify-center overflow-hidden mb-3.5 border ${p.imageBox}`}>
                  <SafeImage
                    src={IMAGES[p.image]}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    fallback={p.emoji}
                  />
                </div>

                <p className="text-center text-[10.5px] font-bold tracking-[0.32em] text-[#a07d2c]">THE PREMIUM EDITION</p>
                <h4 className="mt-1.5 text-center font-serifKr text-[20px] font-bold text-gray-900">나만을 위한 한 권의 사주서</h4>
                <div aria-hidden="true" className="mx-auto my-2.5 h-px w-3/5 bg-gradient-to-r from-transparent via-[#d9b765] to-transparent" />
                <p className="text-center text-[13px] leading-relaxed text-slate-500">{p.desc}</p>
                <p className="mt-2 text-center">
                  <span className="inline-block rounded-full border border-[#e6c887] px-2.5 py-0.5 text-[11.5px] text-[#a07d2c]">20page 분량</span>
                </p>
              </div>
              <span className="prem-btn relative mt-4 flex items-center justify-center gap-2.5 overflow-hidden rounded-2xl border border-[#e6c887]/70 px-3 py-3.5 text-[15px] font-extrabold text-[#fff3c8]">
                <span aria-hidden="true">✦</span>
                <span>한 권 열어 보기</span>
                <span className="flex items-center gap-1.5 rounded-full bg-black/20 px-2.5 py-0.5 text-xs">
                  <img src="/images/pearl-3000.webp" alt="" className="h-4 w-4 object-contain" />
                  진주 3
                  <img src="/images/coin-500.webp" alt="" className="h-4 w-4 object-contain" />
                  조약돌 1
                </span>
              </span>
            </div>
            </div>
          ))}
        </div>
        <div className="relative z-10 mt-3 text-center">
          <Link href="/premium" data-testid="premium-report-link" className="text-sm font-bold text-pink-200 hover:text-white underline underline-offset-4">
            프리미엄 사주 체험 미리보기 →
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ 풀이 예시 */

export function SampleSection() {
  return <ReviewsSection />;
}

/* ------------------------------------------------------------------ 소개 (후기 자리) */

const TRUST_POINTS = [
  { title: "500원", desc: "조약돌 하나면 한 번 봐줄게!", titleClass: "text-amber-600" },
  { title: "매일 첫 1회 무료", desc: "오늘 운은 도리가 공짜로 ❄️", titleClass: "text-brand-500" },
  { title: "내 보관함", desc: "도리가 잘 챙겨둘게!", titleClass: "text-indigo-600" },
] as const;

export function TrustSection() {
  return (
    <section className="rounded-[2rem] bg-white border border-sky-100 px-4 py-3.5 sm:p-6 mb-4 shadow-sm relative z-10">
      <div className="inline-flex items-center gap-1.5 text-brand-500 font-bold text-xs">
        <span className="material-symbols-outlined text-[18px]">verified</span>
        <span>찾아갈 필요 없는 사주</span>
      </div>
      <h3 className="font-cute text-xl sm:text-3xl font-normal text-gray-900 leading-snug mt-1.5">
        철학관 찾아가지 않아도,
        <br />
        <span className="text-brand-500">조약돌 하나</span>로 제대로 된 사주.
      </h3>
      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-1.5">
        예약도 대기도 없이, 내 사주를 꼼꼼하게 풀어낸 풀이를 500원 조약돌 하나로 받아봐. 마음에 드는 결과는 보관함에 남겨두고 언제든 다시 볼 수 있어.
      </p>
      <div className="grid grid-cols-3 mt-3 pt-3 border-t border-sky-100">
        {TRUST_POINTS.map((t, i) => (
          <div key={t.title} className={`min-w-0 px-1.5 text-center ${i === 0 ? "" : "border-l border-sky-100"}`}>
            <div className={`font-cute text-[13.5px] sm:text-xl font-normal leading-tight ${t.titleClass}`}>{t.title}</div>
            <div className="text-[11px] sm:text-xs text-slate-600 mt-1 leading-snug">{t.desc}</div>
          </div>
        ))}
      </div>
      {/* 실제 이용 후기가 쌓이면 이 자리에 보여줘. (지어낸 후기나 만족도·적중률 수치는 넣지 않아) */}
    </section>
  );
}

/* ------------------------------------------------------------------ 자주 묻는 질문 */

export function FaqSection() {
  return (
    <section id="faq" data-testid="faq-section" className="rounded-[2.5rem] bg-white border border-sky-100 p-4 sm:p-6 mb-4 shadow-sm relative z-10 scroll-mt-20">
      <h3 className="font-cute text-xl sm:text-2xl font-normal text-gray-900 mb-2 px-1">자주 묻는 질문</h3>
      <div className="divide-y divide-sky-100">
        {FAQ_ITEMS.map((f) => (
          <details key={f.q} className="group py-1">
            <summary className="cursor-pointer list-none flex items-center justify-between gap-3 px-1 py-3 text-sm font-bold text-gray-900">
              <span>{f.q}</span>
              <span aria-hidden="true" className="text-gray-400 transition-transform group-open:rotate-180">⌄</span>
            </summary>
            <p className="px-1 pb-3 text-xs sm:text-sm text-slate-600 leading-relaxed">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ 푸터 */

export function Footer() {
  return (
    <footer className="relative z-10 bg-white border-t border-brand-100 pt-5 pb-24 sm:pb-8 text-center text-xs text-gray-500">
      <div className="max-w-[34rem] lg:max-w-5xl mx-auto px-4 flex flex-col items-center gap-2">
        <div className="flex items-center gap-1.5 text-brand-500 font-cute font-normal">
          <DoriIcon className="!mr-0" /> {SERVICE_NAME} <span aria-hidden="true">❄️</span>
        </div>
        <p className="text-gray-400">“궁금하면 500원! 퐁당, 오늘의 운을 뽑아봐.”</p>
        <ShareSiteBar />
        <div className="flex items-center gap-3 text-gray-400 mt-2">
          <Link href="/terms" className="hover:text-brand-500">
            이용약관
          </Link>
          <span aria-hidden="true">•</span>
          <Link href="/privacy" className="hover:text-brand-500">
            개인정보처리방침
          </Link>
          <span aria-hidden="true">•</span>
          <Link href="/refund" className="hover:text-brand-500">
            환불 안내
          </Link>
        </div>
        <div className="text-[11px] text-gray-400 mt-1">
          © <span suppressHydrationWarning>{new Date().getFullYear()}</span> {SERVICE_NAME}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
