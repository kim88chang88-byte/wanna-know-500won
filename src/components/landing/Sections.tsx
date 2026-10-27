import Link from "next/link";
import type React from "react";
import type { DrawCounts } from "@/lib/drawCounter";
import type { WeekStamp } from "@/lib/streak";
import { SERVICE_NAME } from "@/lib/siteInfo";
import type { AuthUser } from "./useAuth";
import { FAQ_ITEMS } from "./faq";
import { FREE_PRICE_LABEL, MACHINES, PREMIUM_CARDS } from "./data";
import { HelpMenuButton, MachineMenuButton } from "./MenuButton";
import { HERO_IMAGE, IMAGES, LOGO_IMAGE } from "./images";
import SafeImage from "./SafeImage";
import ReviewsSection from "./ReviewsSection";
import ShareSiteBar from "./ShareSiteBar";

export type SpinHandler = (key: string, fortune: string, price: string, premium?: boolean) => void;

interface SpinProps {
  onSpin: SpinHandler;
}

/** 카드 모서리에 비스듬히 붙는 "HOT" 스티커. (카드는 relative 여야 해요) */
function Sticker({ text, testId }: { text: string; testId: string }) {
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

const BETA_NOTICE_TEXT = (
  <>
    * &apos;{SERVICE_NAME}&apos;는 지금 <strong>Beta 테스트 중</strong>이라 결제 없이 이용할 수 있어요. (표시된 금액은 정식 오픈 후 기준이에요)
  </>
);

/* ------------------------------------------------------------------ 헤더 */

/** 닉네임의 첫 글자. 이모지처럼 글자 하나가 두 칸을 차지하는 문자도 깨지지 않게 Array.from 으로 나눠요. */
export function firstGlyph(nickname: string | null | undefined): string {
  return Array.from((nickname ?? "").trim())[0] ?? "🫧";
}

export function Header({ onOpenLogin, user = null }: { onOpenLogin: () => void; user?: AuthUser | null }) {
  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-brand-100 shadow-[0_2px_15px_rgba(128,87,224,0.06)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-2 sm:gap-3">
          {/* 왼쪽 위: 로고 + 베타 안내 (좁은 화면에서는 아래 띠로 따로 보여줘요) */}
          <div className="flex flex-col items-start gap-1 min-w-0">
            <Link href="/" aria-label={`${SERVICE_NAME} 홈으로`} data-testid="home-link" className="flex items-center gap-2 sm:gap-2.5">
              <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-full overflow-hidden border-2 border-brand-500/40 shadow-sm shrink-0 bg-sky-50 flex items-center justify-center">
                <SafeImage
                  src={LOGO_IMAGE}
                  alt="도리 운세 사주 로고"
                  className="w-full h-full object-cover"
                  fallback="🦦"
                  fallbackClass="text-2xl"
                />
              </div>
              <h1 className="font-cute font-normal text-[19px] min-[400px]:text-[22px] sm:text-[30px] leading-none whitespace-nowrap tracking-normal bg-gradient-to-r from-brand-500 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent inline-flex items-center gap-1.5">
                &apos;도리&apos;운세사주
                <span className="hidden sm:inline text-xs text-amber-600 font-sans font-bold px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200/80">
                  ✨ 퐁당
                </span>
              </h1>
            </Link>
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-brand-500 text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping" aria-hidden="true" />
              <span>{BETA_NOTICE_TEXT}</span>
            </div>
          </div>

          {/* 오른쪽 위: 로그인 전에는 "로그인" 버튼, 로그인 후에는 닉네임(마이페이지) + "?" 안내 메뉴 + 햄버거(자판기) 메뉴. 둘 다 같은 창(로그인/내 정보)을 열어요 */}
          <div className="shrink-0 flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={onOpenLogin}
              type="button"
              aria-haspopup="dialog"
              data-testid="mypage-button"
              data-logged-in={user ? "true" : "false"}
              className={`group flex items-center gap-1.5 sm:gap-2 p-1 pr-2.5 sm:px-3.5 sm:py-1.5 rounded-full border transition-all text-left shadow-sm ${
                user
                  ? "bg-emerald-50 hover:bg-emerald-100/70 border-emerald-300/70"
                  : "bg-brand-600 hover:bg-brand-700 border-brand-600 text-white"
              }`}
            >
              <div
                className={`relative w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-full bg-white flex items-center justify-center group-hover:scale-105 transition-transform ${
                  user ? "text-emerald-700 font-bold text-sm" : "text-brand-600"
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
                // 로그인된 상태는 작은 화면에서도 닉네임이 보이게 해요 (길면 말줄임)
                <div className="min-w-0">
                  <span data-testid="mypage-name" className="block max-w-[3.5rem] min-[400px]:max-w-[5.5rem] sm:max-w-[9rem] truncate text-xs font-bold text-gray-800">
                    {user.nickname ? `${user.nickname}님` : "회원님"}
                  </span>
                  <span className="sr-only sm:not-sr-only sm:block text-[10px] font-medium text-emerald-700">로그인됨</span>
                </div>
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
            <HelpMenuButton />
            <MachineMenuButton />
          </div>
        </div>
      </header>

      <div className="sm:hidden bg-sky-50 border-b border-sky-200 px-4 py-1.5 text-center text-[11px] font-medium text-brand-500">
        {BETA_NOTICE_TEXT}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ 히어로 */

export function HeroSection({ counts, streakText = null, stamps = [] }: { counts: DrawCounts; streakText?: string | null; stamps?: WeekStamp[] }) {
  return (
    <section className="text-left mb-3">
      {/* 뽑기 횟수: 한 줄짜리 작은 알약 (로그인했다면 서버가, 아니라면 이 기기에서 센 값) */}
      <div className="inline-flex flex-wrap items-center justify-start gap-x-3 gap-y-1 rounded-full bg-white/80 border border-brand-100 px-4 py-1.5 text-xs shadow-sm">
        <span className="inline-flex items-center gap-1 text-gray-500">
          <span className="material-symbols-outlined text-brand-500 text-[16px]">water_drop</span>
          오늘
          <b className="font-bold text-brand-500" data-testid="count-today">
            {counts.today}번 뽑았어요{" "}
            {counts.today === 0 && <span className="font-normal text-sky-600">(무료 1회 남음 ✦)</span>}
          </b>
        </span>
        <span aria-hidden="true" className="h-3 w-px bg-brand-200" />
        <span className="inline-flex items-center gap-1 text-gray-500">
          <span className="material-symbols-outlined text-indigo-600 text-[16px]">auto_awesome</span>
          이번달
          <b className="font-bold text-indigo-800" data-testid="count-month">
            {counts.month}번 뽑았어요 ✧
          </b>
        </span>
      </div>
      {streakText && (
        <p data-testid="streak-line" className="mt-2 text-xs font-semibold text-sky-700">
          {streakText}
        </p>
      )}
      {stamps.some((d) => d.done) && (
        <div data-testid="week-stamps" className="mt-1.5 flex items-center gap-1.5" aria-label="최근 7일 방문 도장">
          {stamps.map((d) => (
            <span
              key={d.day}
              title={d.day}
              className={`h-4 w-4 rounded-full border text-[9px] leading-[14px] text-center ${d.done ? "bg-sky-400 border-sky-400 text-white" : "bg-white/70 border-brand-200 text-transparent"} ${d.today ? "ring-2 ring-brand-300" : ""}`}
            >
              {d.done ? "✓" : "·"}
            </span>
          ))}
          <span className="text-[10px] text-gray-400 ml-1">이번 주 도장</span>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ 수달 도사 소개 */

export function ShowcaseSection() {
  return (
    <section className="rounded-[2.5rem] bg-gradient-to-b from-white via-sky-50/40 to-white border border-brand-200/70 p-3 sm:p-5 mb-6 shadow-[0_12px_40px_rgba(128,87,224,0.06)] relative overflow-hidden">
      <div className="pointer-events-none absolute -top-16 -right-16 w-80 h-80 rounded-full bg-sky-200/35 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-indigo-100/40 blur-3xl" aria-hidden="true" />

      <div className="relative w-full max-w-5xl mx-auto rounded-3xl shadow-[0_14px_34px_rgba(128,87,224,0.12)] bg-white p-3 sm:p-5 border-2 border-sky-200 overflow-hidden z-10">
        {/* 둥둥 떠 있는 물방울 장식 */}
        <div aria-hidden="true" className="pointer-events-none absolute -top-4 -left-3 w-9 h-9 rounded-full bg-gradient-to-br from-white via-sky-100 to-sky-300/40 border border-white/80 shadow-md otter-bubble-aura flex items-center justify-center text-sm z-20">
          🫧
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute top-12 -right-3 w-8 h-8 rounded-full bg-gradient-to-br from-white via-blue-100 to-indigo-200/50 border border-white/80 shadow-sm otter-bubble-aura z-20" style={{ animationDelay: "1.5s" }} />
        <div aria-hidden="true" className="pointer-events-none absolute bottom-12 -left-2 w-6 h-6 rounded-full bg-white/70 border border-sky-200 shadow-sm otter-bubble-aura z-20" style={{ animationDelay: "2.7s" }} />

        <div className="grid grid-cols-1 gap-3 sm:gap-4 items-center">
          <div className="relative w-full max-w-3xl mx-auto aspect-[16/9] rounded-2xl overflow-hidden bg-sky-50 flex items-center justify-center border border-sky-100 shadow-sm">
            <SafeImage
              src={HERO_IMAGE}
              alt="수달 도사 도리와 오행 친구들이 말해요: 궁금행? 궁금하면 500원!!"
              className="w-full h-full object-cover"
              fallback="🦦"
              fallbackClass="text-8xl"
            />
            {/* 반복 영상: 소리 없이 자동 재생해요. 움직임 줄이기 설정이면 위의 그림만 보여요. */}
            <video
              data-testid="hero-video"
              className="absolute inset-0 h-full w-full object-cover motion-reduce:hidden"
              src="/images/hero-loop.mp4"
              poster={HERO_IMAGE}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              aria-hidden="true"
              tabIndex={-1}
            />
          </div>

          {/* 버튼처럼 보이지 않게, 테두리·배경 없이 그림 아래 설명 글처럼만 보여줘요 */}
          <p className="mx-auto max-w-3xl px-2 text-center text-[13px] leading-relaxed text-slate-500 break-keep">
            <span aria-hidden="true" className="mr-1.5 text-brand-300">✦</span>
            어려운 사주 용어 없이, 쉬운 말로 말랑말랑 풀어 드려요
            <span aria-hidden="true" className="ml-1.5 text-brand-300">✦</span>
          </p>
        </div>
      </div>

      <div className="relative z-10 mt-3 text-center">
        {/* 첫 화면에서 눌러야 할 것은 이 버튼 하나예요. 누르면 아래 운세 카드 고르는 곳으로 내려가요. */}
        <a
          href="#machines"
          id="hero-cta"
          data-testid="scroll-cue"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-fuchsia-500 px-7 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-brand-500/30 transition-transform hover:brightness-105 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-300 sm:text-base"
        >
          <span aria-hidden="true">🪙</span>
          <span>오늘의 운 뽑으러 가기</span>
          <span className="material-symbols-outlined text-[22px] leading-none motion-safe:animate-bounce" aria-hidden="true">
            arrow_downward
          </span>
        </a>
        <p className="mt-2 text-[11px] text-slate-500">가입 없이도 볼 수 있어요 · 매일 첫 1회 무료</p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ 6대 운명의 자판기 */

export function MachinesSection({ onSpin, lastKey = null }: SpinProps & { lastKey?: string | null }) {
  return (
    <section id="machines" className="mb-8 relative z-10 scroll-mt-20">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
        <h3 className="sr-only">6대 운세 카드</h3>
        <span className="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-sky-50 text-brand-500 border border-sky-200">
          아래 운세는 <strong className="underline font-bold">매일 첫 1회는 무료</strong>예요! (이후 500원)
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 max-w-7xl mx-auto items-stretch">
        {MACHINES.map((m) => (
          <div key={m.key} className="relative h-full transition-transform hover:-translate-y-1.5 active:scale-[0.98]">
            {m.sticker && <Sticker text={m.sticker} testId="machine-sticker" />}
            {lastKey === m.key && (
              <span data-testid="last-drawn" className="absolute -top-2 left-3 z-10 rounded-full bg-white border border-sky-300 px-2 py-0.5 text-[10px] font-bold text-sky-700 shadow-sm">
                지난번에 뽑았어요
              </span>
            )}
          <div
            id={m.key}
            data-testid="machine-card"
            role="button"
            tabIndex={0}
            aria-label={`${m.name} 운세 보기`}
            onClick={() => onSpin(m.key, m.fortune, FREE_PRICE_LABEL)}
            onKeyDown={(e) => activateOnKey(e, () => onSpin(m.key, m.fortune, FREE_PRICE_LABEL))}
            className={`scroll-mt-24 card-water-glow relative flex flex-col justify-between rounded-3xl p-3 sm:p-6 h-full cursor-pointer select-none hover:shadow-xl transition-shadow group focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-300 ${m.card}`}
          >
            <div>
              <div className="flex flex-wrap items-center justify-between gap-1 mb-2.5 sm:mb-3.5">
                <span className={`text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 rounded-full flex items-center gap-1 ${m.badgeClass}`}>
                  <span aria-hidden="true">{m.emoji}</span> {m.badge}
                </span>
                <span className={`text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 rounded-full ${m.tagClass}`}>{m.tag}</span>
              </div>

              <div className={`w-full h-32 sm:h-56 rounded-2xl p-2 sm:p-2.5 flex items-center justify-center overflow-hidden mb-3 sm:mb-4 border ${m.imageBox}`}>
                <SafeImage
                  src={IMAGES[m.image]}
                  alt={m.name}
                  className="h-full w-auto max-w-full object-contain group-hover:scale-105 transition-transform duration-500"
                  fallback={m.emoji}
                />
              </div>

              <h4 className={`font-cute font-normal text-sm sm:text-lg text-center mb-1.5 ${m.titleClass}`}>{m.name}</h4>
              <p className="text-xs sm:text-[13px] text-slate-600 text-center leading-relaxed sm:min-h-[40px]">{m.desc}</p>
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
      <div
        className="card-water-glow rounded-[2.5rem] p-4 sm:p-6 bg-[#2a1a5e] border-2 border-brand-300 shadow-[0_12px_36px_rgba(80,40,160,0.35)] relative overflow-hidden"
        style={{ backgroundImage: "url(/images/premium-bg.webp)", backgroundSize: "cover", backgroundPosition: "80% top" }}
      >
        <div className="text-center max-w-2xl mx-auto mb-5 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-pink-100 text-pink-700 text-xs font-bold mb-2">
            <span aria-hidden="true">👑</span>
            <span>수달 도사 '도리'의 심층 리포트</span>
            <span className="bg-brand-500 text-white text-[10px] px-2 py-0.5 rounded-full font-sans">SPECIAL</span>
          </div>
          <h3 className="font-cute text-2xl sm:text-3xl font-normal text-white leading-snug drop-shadow-[0_2px_8px_rgba(40,20,90,0.6)]">
            9,900원 프리미엄 3대 테마 리포트
          </h3>
          <p className="text-xs sm:text-sm text-white/85 mt-2 leading-relaxed">
            간단 풀이로는 아쉬운 날을 위한 <strong>20쪽 분량의 심층 리포트</strong>예요.<br />
            흐름과 조언을 차분하게 담았어요.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto relative z-10">
          {PREMIUM_CARDS.map((p) => (
            <div key={p.key} className="relative h-full transition-transform hover:-translate-y-1 active:scale-[0.98]">
            {p.ribbon && <Sticker text={p.ribbon} testId="premium-sticker" />}
            <div
              id={p.key}
              data-testid="premium-card"
              role="button"
              tabIndex={0}
              aria-label={`${p.title} 보기`}
              onClick={() => onSpin(p.key, p.fortune, "9,900원", true)}
              onKeyDown={(e) => activateOnKey(e, () => onSpin(p.key, p.fortune, "9,900원", true))}
              className={`scroll-mt-24 card-water-glow relative flex flex-col justify-between rounded-3xl p-6 h-full bg-white cursor-pointer select-none hover:shadow-lg transition-shadow group focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-300 ${p.card}`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${p.tagClass}`}>{p.tag}</span>
                  <span className="text-xs text-slate-400">20쪽 리포트</span>
                </div>

                <div className={`w-full aspect-[16/9] rounded-2xl flex items-center justify-center overflow-hidden mb-3.5 border ${p.imageBox}`}>
                  <SafeImage
                    src={IMAGES[p.image]}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    fallback={p.emoji}
                  />
                </div>

                <h4 className="font-cute font-normal text-base text-gray-900 text-center mb-1">{p.title}</h4>
                <p className="text-xs text-slate-500 text-center leading-relaxed">{p.desc}</p>
              </div>
              <div className={`mt-4 pt-3 border-t flex items-center justify-center ${p.divider}`}>
                <span className={`text-sm font-extrabold ${p.priceClass}`}>9,900원</span>
              </div>
            </div>
            </div>
          ))}
        </div>
        <div className="relative z-10 mt-6 text-center">
          <Link href="/premium" data-testid="premium-report-link" className="text-sm font-bold text-pink-200 hover:text-white underline underline-offset-4">
            프리미엄 사주서 미리보기 →
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
  { title: "500원", desc: "동전 하나면 충분한 1회", titleClass: "text-amber-600", box: "border-amber-300" },
  { title: "매일 첫 1회 무료", desc: "가벼운 마음으로 오늘의 운 뽑아보기", titleClass: "text-brand-500", box: "border-pink-300" },
  { title: "내 보관함", desc: "본 풀이를 저장해 두고 언제든 다시 보기", titleClass: "text-indigo-600", box: "border-indigo-300" },
] as const;

export function TrustSection() {
  return (
    <section className="rounded-[2.5rem] bg-white border border-sky-100 p-4 sm:p-6 mb-4 shadow-sm relative z-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="inline-flex items-center gap-1.5 text-brand-500 font-bold text-xs">
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span>500원짜리 동전 하나의 온기</span>
          </div>
          <h3 className="font-cute text-2xl sm:text-3xl font-normal text-gray-900 leading-snug">
            철학관 대신,
            <br />
            <span className="text-brand-500">동전 하나</span>면 충분해요.
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            무거운 분위기도, 예약도 없이 500원 동전 하나로 오늘의 운을 뽑아요. 출퇴근길에 가볍게 뽑아보고,
            마음에 드는 결과는 내 보관함에 남겨보세요.
          </p>
        </div>

        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {TRUST_POINTS.map((t) => (
            <div key={t.title} className={`pl-4 py-1 border-l-[3px] flex flex-col justify-center ${t.box}`}>
              <div className={`font-cute text-xl font-normal ${t.titleClass}`}>{t.title}</div>
              <div className="text-xs text-slate-600 mt-2 leading-relaxed">{t.desc}</div>
            </div>
          ))}
        </div>
      </div>
      {/* 실제 이용 후기가 쌓이면 이 자리에 보여주세요. (지어낸 후기나 만족도·적중률 수치는 넣지 않아요) */}
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
    <footer className="relative z-10 bg-white border-t border-brand-100 py-5 text-center text-xs text-gray-500">
      <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-2">
        <div className="flex items-center gap-1.5 text-brand-500 font-cute font-normal">
          <span aria-hidden="true">🦦</span> {SERVICE_NAME} <span aria-hidden="true">🫧</span>
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
