import Link from "next/link";
import type { DrawCounts } from "@/lib/drawCounter";
import { SERVICE_NAME } from "@/lib/siteInfo";
import type { AuthUser } from "./useAuth";
import { FREE_PRICE_LABEL, MACHINES, PREMIUM_CARDS, SAMPLE_CAPSULES } from "./data";
import { HelpMenuButton, MachineMenuButton } from "./MenuButton";
import { HERO_IMAGE, IMAGES, LOGO_IMAGE } from "./images";
import SafeImage from "./SafeImage";

export type SpinHandler = (key: string, fortune: string, price: string, premium?: boolean) => void;

interface SpinProps {
  onSpin: SpinHandler;
  spinningKey: string | null;
}

const BETA_NOTICE_TEXT = (
  <>
    * &apos;{SERVICE_NAME}&apos; 서비스는 현재 <strong>Beta 테스트 버전</strong>으로 과금이 발생하지 않습니다.
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
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-brand-100 shadow-[0_2px_15px_rgba(34,94,170,0.06)]">
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
              <h1 className="font-serifKr font-black text-[15px] min-[400px]:text-lg sm:text-2xl whitespace-nowrap tracking-tight bg-gradient-to-r from-brand-500 via-blue-600 to-indigo-600 bg-clip-text text-transparent inline-flex items-center gap-1.5">
                {SERVICE_NAME}
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

export function HeroSection({ counts }: { counts: DrawCounts }) {
  return (
    <section className="text-left mb-3">
      {/* 뽑기 횟수: 한 줄짜리 작은 알약 (로그인했다면 서버가, 아니라면 이 기기에서 센 값) */}
      <div className="inline-flex flex-wrap items-center justify-start gap-x-3 gap-y-1 rounded-full bg-white/80 border border-brand-100 px-4 py-1.5 text-xs shadow-sm">
        <span className="inline-flex items-center gap-1 text-gray-500">
          <span className="material-symbols-outlined text-brand-500 text-[16px]">water_drop</span>
          오늘
          <b className="font-bold text-brand-500" data-testid="count-today">
            {counts.today}회 참여{" "}
            {counts.today === 0 && <span className="font-normal text-sky-600">(무료 1회 잔여 ✦)</span>}
          </b>
        </span>
        <span aria-hidden="true" className="h-3 w-px bg-brand-200" />
        <span className="inline-flex items-center gap-1 text-gray-500">
          <span className="material-symbols-outlined text-indigo-600 text-[16px]">auto_awesome</span>
          이번달
          <b className="font-bold text-indigo-800" data-testid="count-month">
            {counts.month}회 참여 ✧
          </b>
        </span>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ 수달 도사 소개 */

export function ShowcaseSection() {
  return (
    <section className="rounded-[2.5rem] bg-gradient-to-b from-white via-sky-50/40 to-white border border-brand-200/70 p-3 sm:p-5 mb-6 shadow-[0_12px_40px_rgba(34,94,170,0.06)] relative overflow-hidden">
      <div className="pointer-events-none absolute -top-16 -right-16 w-80 h-80 rounded-full bg-sky-200/35 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-indigo-100/40 blur-3xl" aria-hidden="true" />

      <div className="relative w-full max-w-5xl mx-auto rounded-3xl shadow-[0_14px_34px_rgba(34,94,170,0.12)] bg-white p-3 sm:p-5 border-2 border-sky-200 overflow-hidden z-10">
        {/* 둥둥 떠 있는 물방울 장식 */}
        <div aria-hidden="true" className="pointer-events-none absolute -top-4 -left-3 w-9 h-9 rounded-full bg-gradient-to-br from-white via-sky-100 to-sky-300/40 border border-white/80 shadow-md otter-bubble-aura flex items-center justify-center text-sm z-20">
          🫧
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute top-12 -right-3 w-8 h-8 rounded-full bg-gradient-to-br from-white via-blue-100 to-indigo-200/50 border border-white/80 shadow-sm otter-bubble-aura z-20" style={{ animationDelay: "1.5s" }} />
        <div aria-hidden="true" className="pointer-events-none absolute bottom-12 -left-2 w-6 h-6 rounded-full bg-white/70 border border-sky-200 shadow-sm otter-bubble-aura z-20" style={{ animationDelay: "2.7s" }} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-5 items-center">
          <div className="lg:col-span-6 relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-sky-50 flex items-center justify-center border border-sky-100 shadow-sm">
            <SafeImage
              src={HERO_IMAGE}
              alt="수달 도사 도리와 오행 친구들이 말해요: 궁금행? 궁금하면 500원!!"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              fallback="🦦"
              fallbackClass="text-8xl"
            />
          </div>

          <div className="lg:col-span-6 flex flex-col justify-center bg-sky-50/70 p-4 sm:p-6 rounded-2xl border border-sky-200">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-semibold text-brand-500 flex items-center gap-1">
                <span className="material-symbols-outlined text-base">verified</span> 매일 첫 1회 무료 체험
              </span>
              <span className="text-slate-400" aria-hidden="true">
                •
              </span>
              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <span className="material-symbols-outlined text-base">water_drop</span> 맑고 청명한 운세 풀이
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-2 text-center">
        {/* 소개 카드 바로 아래, 자판기 바로 위: "이제 아래 자판기를 골라보세요" 안내 */}
        <a
          href="#machines"
          data-testid="scroll-cue"
          className="inline-flex flex-col items-center gap-0.5 rounded-2xl px-4 py-1 text-xs sm:text-sm font-bold text-brand-600 hover:text-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
        >
          <span>아래로 스크롤해서 운명의 자판기를 골라보세요</span>
          <span className="material-symbols-outlined text-[28px] leading-none motion-safe:animate-bounce" aria-hidden="true">
            keyboard_double_arrow_down
          </span>
        </a>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ 6대 운명의 자판기 */

export function MachinesSection({ onSpin, spinningKey }: SpinProps) {
  return (
    <section id="machines" className="mb-8 relative z-10 scroll-mt-20">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
        <div className="text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-brand-500 text-xs font-bold mb-1.5">
            <span aria-hidden="true">🌊</span>
            <span>수달 도사의 6대 운명의 자판기</span>
          </div>
          <h3 className="font-serifKr text-2xl sm:text-3xl font-bold text-gray-900">원하는 테마의 레버를 직접 돌려보세요</h3>
        </div>
        <span className="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-sky-50 text-brand-500 border border-sky-200">
          모든 자판기: <strong className="underline font-bold">매일 첫 1회 무료</strong> (이후 500원)
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 max-w-7xl mx-auto items-stretch">
        {MACHINES.map((m) => (
          <div
            key={m.key}
            id={m.key}
            data-testid="machine-card"
            className={`scroll-mt-24 card-water-glow flex flex-col justify-between rounded-3xl p-3 sm:p-6 hover:shadow-xl hover:-translate-y-1.5 transition-all group ${m.card}`}
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
                  alt={`${m.name} 자판기`}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                  fallback={m.emoji}
                />
              </div>

              <h4 className={`font-serifKr font-bold text-sm sm:text-lg text-center mb-1.5 ${m.titleClass}`}>{m.name}</h4>
              <p className="text-[11px] sm:text-xs text-slate-500 text-center leading-relaxed sm:min-h-[36px]">{m.desc}</p>
            </div>

            <div className={`mt-3 sm:mt-4 pt-3 border-t flex flex-col gap-2 sm:gap-2.5 ${m.divider}`}>
              <button
                onClick={() => onSpin(m.key, m.fortune, FREE_PRICE_LABEL)}
                type="button"
                aria-label={`${m.name} 레버 돌리기`}
                className={`w-full py-2 sm:py-2.5 px-2 sm:px-4 rounded-full text-white font-serifKr font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-1 sm:gap-1.5 active:scale-95 ${m.button}`}
              >
                <span className={`material-symbols-outlined text-[18px] ${spinningKey === m.key ? "lever-rotating" : ""}`}>
                  autorenew
                </span>
                <span>{m.leverLabel}</span>
              </button>
              <div className="text-center text-[11px] sm:text-xs text-slate-500">
                매일 첫 1회 무료 <span className="text-[11px] text-slate-400">(이후 500원)</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ 프리미엄 심층 사주서 */

export function PremiumSection({ onSpin, spinningKey }: SpinProps) {
  return (
    <section className="mb-8 relative z-10">
      <div className="card-water-glow rounded-[2.5rem] p-4 sm:p-6 bg-gradient-to-b from-amber-50/90 via-white to-sky-50/40 border-2 border-amber-300 shadow-[0_12px_36px_rgba(204,167,47,0.18)] relative overflow-hidden">
        <div className="pointer-events-none absolute -top-16 -right-16 w-80 h-80 rounded-full bg-amber-200/35 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-purple-100/40 blur-3xl" aria-hidden="true" />

        <div className="text-center max-w-2xl mx-auto mb-5 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold mb-2">
            <span aria-hidden="true">👑</span>
            <span>수달 도사의 심층 리포트</span>
            <span className="bg-brand-500 text-white text-[10px] px-2 py-0.5 rounded-full font-sans">SPECIAL</span>
          </div>
          <h3 className="font-serifKr text-2xl sm:text-3xl font-extrabold text-gray-900 leading-snug">
            2,990원 프리미엄 3대 테마 자판기
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 font-serifKr leading-relaxed">
            캡슐 한 알로는 아쉬운 날을 위한 <strong>10쪽 분량의 심층 리포트</strong>예요. 흐름과 조언을 차분하게 담았어요.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto relative z-10">
          {PREMIUM_CARDS.map((p) => (
            <div
              key={p.key}
              id={p.key}
              data-testid="premium-card"
              className={`scroll-mt-24 card-water-glow flex flex-col justify-between rounded-3xl p-6 bg-white hover:shadow-lg hover:-translate-y-1 transition-all group ${p.card}`}
            >
              {p.ribbon && (
                <div className="absolute -top-0 right-5 px-3 py-0.5 rounded-b-full bg-amber-600 text-white text-[11px] font-bold shadow-sm z-10">
                  {p.ribbon}
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${p.tagClass}`}>{p.tag}</span>
                  <span className="text-xs text-slate-400">10쪽 리포트</span>
                </div>

                <button
                  onClick={() => onSpin(p.key, p.fortune, "2,990원", true)}
                  type="button"
                  aria-label={`${p.title} 레버 돌리기`}
                  className={`w-full py-2.5 px-4 rounded-full text-white font-serifKr font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-1.5 mb-3.5 active:scale-95 ${p.button}`}
                >
                  <span className={`material-symbols-outlined text-[18px] ${spinningKey === p.key ? "lever-rotating" : ""}`}>
                    autorenew
                  </span>
                  <span>{p.leverLabel}</span>
                </button>

                <div className={`w-full h-52 rounded-2xl p-2 flex items-center justify-center overflow-hidden mb-3.5 border ${p.imageBox}`}>
                  <SafeImage
                    src={IMAGES[p.image]}
                    alt={`${p.title} 자판기`}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    fallback={p.emoji}
                  />
                </div>

                <h4 className="font-serifKr font-bold text-base text-gray-900 text-center mb-1">{p.title}</h4>
                <p className="text-xs text-slate-500 text-center leading-relaxed">{p.desc}</p>
              </div>
              <div className={`mt-4 pt-3 border-t flex items-center justify-between ${p.divider}`}>
                <span className="text-xs text-slate-400">1회</span>
                <span className={`text-sm font-extrabold ${p.priceClass}`}>2,990원</span>
              </div>
            </div>
          ))}
        </div>
        <p className="relative z-10 mt-6 text-center text-[11px] text-slate-500">
          * 프리미엄 심층 리포트는 준비 중이에요. 베타 기간에는 결제 없이 체험할 수 있고, 지금 뽑으면 간단 풀이가 나와요.
        </p>
        <div className="relative z-10 mt-3 text-center">
          <Link href="/premium" data-testid="premium-report-link" className="text-sm font-bold text-brand-600 underline underline-offset-4">
            사주 원국 리포트 미리 보기 →
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ 풀이 예시 */

export function SampleSection() {
  return (
    <section className="mb-8 relative z-10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-100 flex items-center justify-center text-brand-500">
            <span className="material-symbols-outlined text-[22px]">bubble_chart</span>
          </div>
          <div>
            <h3 className="font-serifKr text-xl sm:text-2xl font-bold text-gray-900">이런 물빛 운세 캡슐이 나와요</h3>
            <p className="text-xs text-slate-500">수달 도사가 건네는 캡슐 속 한마디, 이런 느낌이에요</p>
          </div>
        </div>
        <span className="hidden sm:inline-flex text-xs font-semibold px-3 py-1.5 rounded-full bg-sky-50 text-brand-500 border border-sky-200">
          예시 문구
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {SAMPLE_CAPSULES.map((s) => (
          <div
            key={s.key}
            className={`card-water-glow rounded-3xl p-6 bg-white border shadow-sm hover:shadow-md transition-all ${s.border}`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${s.tagClass}`}>{s.tag}</span>
              <span className="text-xs text-slate-400">예시</span>
            </div>
            <p className="font-serifKr text-sm text-slate-800 leading-relaxed">
              {s.parts.map((p, i) => (p.strong ? <strong key={i}>{p.text}</strong> : <span key={i}>{p.text}</span>))}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-[11px] text-slate-400">
        * 예시 문구예요. 실제 이용자의 기록이 아니며, 실제 풀이는 입력한 정보에 따라 달라져요.
      </p>
    </section>
  );
}

/* ------------------------------------------------------------------ 소개 (후기 자리) */

const TRUST_POINTS = [
  { title: "500원", desc: "동전 하나면 충분한 1회", titleClass: "text-amber-600", box: "bg-amber-50/40 border-amber-100" },
  { title: "매일 첫 1회 무료", desc: "가벼운 마음으로 오늘의 운 뽑아보기", titleClass: "text-brand-500", box: "bg-sky-50/60 border-sky-100" },
  { title: "결과지 카드", desc: "인스타 스토리용 모바일 결과지", titleClass: "text-indigo-600", box: "bg-indigo-50/40 border-indigo-100" },
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
          <h3 className="font-serifKr text-2xl sm:text-3xl font-extrabold text-gray-900 leading-snug">
            철학관 대신,
            <br />
            <span className="text-brand-500">동전 하나</span>면 충분해요.
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            무거운 분위기도, 예약도 없이 500원 동전 하나로 오늘의 운을 뽑아요. 출퇴근길에 가볍게 뽑아보고,
            마음에 드는 결과는 인스타 스토리에 남겨보세요.
          </p>
        </div>

        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {TRUST_POINTS.map((t) => (
            <div key={t.title} className={`p-4 rounded-2xl border flex flex-col justify-between ${t.box}`}>
              <div className={`font-serifKr text-xl font-bold ${t.titleClass}`}>{t.title}</div>
              <div className="text-xs text-slate-600 mt-2 leading-relaxed">{t.desc}</div>
            </div>
          ))}
        </div>
      </div>
      {/* 실제 이용 후기가 쌓이면 이 자리에 보여주세요. (지어낸 후기나 만족도·적중률 수치는 넣지 않아요) */}
    </section>
  );
}

/* ------------------------------------------------------------------ 푸터 */

export function Footer() {
  return (
    <footer className="relative z-10 bg-white border-t border-brand-100 py-5 text-center text-xs text-gray-500">
      <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-2">
        <div className="flex items-center gap-1.5 text-brand-500 font-serifKr font-bold">
          <span aria-hidden="true">🦦</span> {SERVICE_NAME} <span aria-hidden="true">🫧</span>
        </div>
        <p className="text-gray-400 font-serifKr italic">“궁금하면 500원! 퐁당, 오늘의 운을 뽑아봐.”</p>
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
