import Link from "next/link";
import type { DrawCounts } from "@/lib/drawCounter";
import type { AuthUser } from "./useAuth";
import {
  FREE_PRICE_LABEL,
  GOLDEN_MACHINE,
  MACHINES,
  PREMIUM_CARDS,
  SAMPLE_CAPSULES,
  SLOTS,
} from "./data";
import MenuButton from "./MenuButton";
import { HOBO_IMAGE, MACHINE_IMAGE, PREMIUM_MACHINE_IMAGE } from "./images";

export type SpinHandler = (key: string, fortune: string, price: string) => void;

interface SpinProps {
  onSpin: SpinHandler;
  spinningKey: string | null;
}

const BETA_NOTICE_TEXT = (
  <>
    * &apos;꽃거지의 신묘한 사주&apos; 서비스는 현재 <strong>Beta 테스트 버전</strong>으로 과금이 발생하지 않습니다.
  </>
);

/* ------------------------------------------------------------------ 헤더 */

/** 닉네임의 첫 글자. 이모지처럼 글자 하나가 두 칸을 차지하는 문자도 깨지지 않게 Array.from 으로 나눠요. */
export function firstGlyph(nickname: string | null | undefined): string {
  return Array.from((nickname ?? "").trim())[0] ?? "🌸";
}

export function Header({ onOpenLogin, user = null }: { onOpenLogin: () => void; user?: AuthUser | null }) {
  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-brand-100 shadow-[0_2px_15px_rgba(244,63,104,0.05)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-3">
          {/* 왼쪽 위: 로고 + 베타 안내 (좁은 화면에서는 아래 띠로 따로 보여줘요) */}
          <div className="flex flex-col items-start gap-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xl floating-anim" aria-hidden="true">
                🌸
              </span>
              <h1 className="font-serifKr font-black text-lg sm:text-2xl tracking-tight bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">
                꽃거지의 신묘한 사주
              </h1>
            </div>
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-brand-700 text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-ping" aria-hidden="true" />
              <span>{BETA_NOTICE_TEXT}</span>
            </div>
          </div>

          {/* 오른쪽 위: 마이페이지 (로그인 모달 열기) + 햄버거 메뉴 */}
          <div className="shrink-0 flex items-center gap-2">
            <button
              onClick={onOpenLogin}
              type="button"
              aria-haspopup="dialog"
              data-testid="mypage-button"
              data-logged-in={user ? "true" : "false"}
              className={`group flex items-center gap-2 p-1.5 pr-3 sm:px-3.5 sm:py-1.5 rounded-full border transition-all text-left shadow-sm ${
                user
                  ? "bg-emerald-50 hover:bg-emerald-100/70 border-emerald-300/70"
                  : "bg-brand-50 hover:bg-brand-100/70 border-brand-200/60"
              }`}
            >
              <div
                className={`relative w-8 h-8 shrink-0 rounded-full bg-white flex items-center justify-center group-hover:scale-105 transition-transform ${
                  user ? "text-emerald-700 font-bold text-sm" : "text-brand-600"
                }`}
              >
                {user ? (
                  <span aria-hidden="true">{firstGlyph(user.nickname)}</span>
                ) : (
                  <span className="material-symbols-outlined text-[20px]">person</span>
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
                  <span data-testid="mypage-name" className="block max-w-[5.5rem] sm:max-w-[9rem] truncate text-xs font-bold text-gray-800">
                    {user ? (user.nickname ? `${user.nickname}님` : "회원님") : "마이페이지"}
                  </span>
                  <span className="block text-[10px] font-medium text-emerald-700">로그인됨</span>
                </div>
              ) : (
                <>
                  <span className="sr-only sm:hidden">마이페이지</span>
                  <div className="hidden sm:block">
                    <span className="block text-xs font-bold text-gray-800 group-hover:text-brand-600 transition-colors">
                      마이페이지
                    </span>
                    <span className="block text-[10px] text-gray-500">로그인 / 회원가입</span>
                  </div>
                </>
              )}
            </button>
            <MenuButton />
          </div>
        </div>
      </header>

      <div className="sm:hidden bg-rose-50 border-b border-rose-200 px-4 py-1.5 text-center text-[11px] font-medium text-brand-700">
        {BETA_NOTICE_TEXT}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ 히어로 */

export function HeroSection({ counts }: { counts: DrawCounts }) {
  return (
    <section className="mb-12">
      {/* 뽑기 횟수 (이 기기에서 센 값) — 화면 맨 오른쪽 */}
      <div className="flex justify-end mb-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-fit p-2 rounded-2xl bg-white/80 backdrop-blur-sm border border-brand-100 shadow-sm">
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-brand-50/80 border border-brand-100 text-left">
          <span className="material-symbols-outlined text-brand-600 text-[22px]">calendar_today</span>
          <div>
            <div className="text-[11px] text-gray-500 font-medium">오늘 뽑기 횟수</div>
            <div className="font-bold text-sm text-brand-700" data-testid="count-today">
              {counts.today}회 참여{" "}
              {counts.today === 0 && <span className="text-xs font-normal text-brand-500">(무료 1회 잔여)</span>}
            </div>
          </div>
        </div>

        <div className="w-px h-8 bg-brand-200 hidden sm:block" />

        <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-amber-50/80 border border-amber-200 text-left">
          <span className="material-symbols-outlined text-amber-600 text-[22px]">auto_awesome</span>
          <div>
            <div className="text-[11px] text-gray-500 font-medium">이번달 누적 뽑기 횟수</div>
            <div className="font-bold text-sm text-amber-800" data-testid="count-month">
              {counts.month}회 참여 ✧
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* 제목: 가운데 정렬 */}
      <div className="text-center max-w-4xl mx-auto">
      <div className="relative inline-block mb-3">
        <h2 className="font-serifKr text-3xl sm:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
          꽃거지의 신묘한 사주
        </h2>
        <span className="absolute -top-3 -right-6 text-2xl select-none floating-anim" aria-hidden="true">
          ✨
        </span>
      </div>

      <p className="font-serifKr text-base sm:text-lg text-gray-600 font-medium leading-relaxed max-w-2xl mx-auto">
        “궁금해요? 궁금하면 500원!!”
        <br className="hidden sm:inline" /> 매일 첫 1회는 무료, 그 다음부터는 500원 짜리 동전 하나면 충분해요.
      </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ 꽃거지 + 자판기 */

export function ShowcaseSection({ onSpin, spinningKey }: SpinProps) {
  return (
    <section className="rounded-[2.5rem] bg-gradient-to-b from-white/90 via-brand-50/30 to-white/90 border border-brand-200/60 p-6 sm:p-10 mb-16 shadow-[0_12px_40px_rgba(244,63,104,0.06)]">
      {/* 윗줄: 꽃거지 + 프리미엄 황금 자판기 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto mb-14">
        <div className="lg:col-span-6 flex flex-col items-center">
          <div className="relative w-full max-w-[370px] rounded-3xl overflow-hidden shadow-[0_12px_32px_rgba(190,18,60,0.14)] bg-white p-2.5 border border-brand-200">
            <div className="relative w-full rounded-2xl overflow-hidden aspect-[3/4.2] bg-brand-50">
              <img
                src={HOBO_IMAGE}
                alt="꽃거지 캐릭터"
                className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

              <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-brand-200">
                <div className="flex items-start gap-2.5">
                  <span className="text-2xl" aria-hidden="true">
                    🌸
                  </span>
                  <div className="flex-1">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-100 text-brand-700">
                      꽃거지의 한마디
                    </span>
                    <h3 className="font-serifKr font-black text-xl text-brand-600 mt-1 leading-snug">
                      “지금 네 고민, 나 알 것 같은데?”
                    </h3>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      꽃거지가 준비한 6대 자판기와 황금 자판기에서 오늘의 운을 직접 뽑아봐요 🌸
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 flex flex-col items-center">
          <div className="relative w-full max-w-[420px] rounded-3xl p-6 bg-gradient-to-b from-amber-50/80 via-white to-amber-50/50 border-2 border-gold-400 shadow-[0_12px_36px_rgba(204,167,47,0.2)] flex flex-col items-center">
            <div className="px-3.5 py-1 rounded-full bg-gradient-to-r from-gold-600 to-amber-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 mb-2">
              <span aria-hidden="true">👑</span>
              <span>프리미엄 황금 자판기</span>
              <span className="bg-black/20 text-[10px] px-1.5 rounded-full">2,990원</span>
            </div>

            <div className="w-full text-center mb-3">
              <h4 className="font-serifKr font-bold text-lg text-amber-900">10쪽 심층 리포트 &amp; 행운 키워드 카드</h4>
              <p className="text-xs text-gray-500">올해의 흐름 · 이달의 조언 · 행운 키워드까지</p>
            </div>

            <div className="relative w-full aspect-square max-h-[290px] rounded-2xl overflow-hidden bg-white/70 p-2 border border-gold-200 flex items-center justify-center">
              <img
                src={PREMIUM_MACHINE_IMAGE}
                alt="프리미엄 황금 자판기"
                className="w-full h-full object-contain hover:scale-105 transition-transform duration-500"
              />
            </div>

            <div className="w-full mt-4">
              <button
                onClick={() => onSpin(GOLDEN_MACHINE.key, GOLDEN_MACHINE.fortune, GOLDEN_MACHINE.price)}
                type="button"
                className="w-full py-3 px-5 rounded-full bg-gradient-to-r from-gold-600 via-amber-500 to-yellow-600 text-white font-serifKr font-bold text-sm shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span
                  className={`material-symbols-outlined text-[20px] ${spinningKey === GOLDEN_MACHINE.key ? "lever-rotating" : ""}`}
                >
                  autorenew
                </span>
                <span>황금 레버 돌리기 ✧ (2,990원)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 6대 자판기 */}
      <div className="pt-8 border-t border-brand-200/60">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
          <div>
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-bold mb-1">
              <span aria-hidden="true">🌸</span>
              <span>두근두근 6대 자판기</span>
            </div>
            <h3 className="font-serifKr text-2xl font-bold text-gray-900">원하는 테마의 레버를 직접 돌려보세요</h3>
          </div>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-rose-50 text-brand-600 border border-brand-200">
            모든 자판기: <strong className="underline font-bold">매일 첫 1회 무료</strong> (이후 500원)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {MACHINES.map((m) => (
            <div
              key={m.key}
              className={`flex flex-col justify-between rounded-3xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all group ${m.card}`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${m.badgeClass}`}>{m.badge}</span>
                  <span className="text-xs font-bold text-brand-600">{m.best ? "BEST" : "매일 첫 1회 무료"}</span>
                </div>

                <button
                  onClick={() => onSpin(m.key, m.fortune, FREE_PRICE_LABEL)}
                  type="button"
                  aria-label={`${m.name} 레버 돌리기`}
                  className={`w-full py-2.5 px-4 rounded-full text-white font-serifKr font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-1.5 mb-3.5 active:scale-95 ${m.button}`}
                >
                  <span
                    className={`material-symbols-outlined text-[18px] ${spinningKey === m.key ? "lever-rotating" : ""}`}
                  >
                    autorenew
                  </span>
                  <span>레버 돌리기</span>
                </button>

                <div
                  className={`w-full aspect-[4/3] rounded-2xl p-2 flex items-center justify-center overflow-hidden mb-3.5 border ${m.imageBox}`}
                >
                  <img
                    src={MACHINE_IMAGE}
                    alt={m.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <h4 className={`font-serifKr font-bold text-base text-center ${m.titleClass}`}>{m.name}</h4>
                <p className={`text-xs text-center mt-1 leading-snug ${m.descClass}`}>{m.desc}</p>
              </div>
              <div className={`mt-4 pt-2.5 border-t text-center text-xs ${m.footerClass}`}>매일 첫 1회 0원 (이후 500원)</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ 풀이 예시 */

export function SampleSection() {
  return (
    <section className="mb-16">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-700">
            <span className="material-symbols-outlined text-[22px]">bubble_chart</span>
          </div>
          <div>
            <h3 className="font-serifKr text-xl sm:text-2xl font-bold text-gray-900">이런 운세 캡슐이 나와요</h3>
            <p className="text-xs text-gray-500">꽃거지가 건네는 캡슐 속 한마디, 이런 느낌이에요</p>
          </div>
        </div>
        <span className="hidden sm:inline-flex text-xs font-semibold px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
          예시 문구
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {SAMPLE_CAPSULES.map((s) => (
          <div
            key={s.key}
            className={`rounded-3xl p-6 bg-white border shadow-sm hover:shadow-md transition-all ${s.border}`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${s.tagClass}`}>{s.tag}</span>
              <span className="text-xs text-gray-400">예시</span>
            </div>
            <p className="font-serifKr text-sm text-gray-800 leading-relaxed">
              {s.parts.map((p, i) => (p.strong ? <strong key={i}>{p.text}</strong> : <span key={i}>{p.text}</span>))}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-[11px] text-gray-400">
        * 예시 문구예요. 실제 풀이는 입력한 정보에 따라 달라져요.
      </p>
    </section>
  );
}

/* ------------------------------------------------------------------ 6대 운세 슬롯 */

export function SlotsSection({ onSpin, spinningKey }: SpinProps) {
  return (
    <section className="mb-16">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-bold mb-2">
          <span aria-hidden="true">✧</span>
          <span>6 LUCKY SLOTS</span>
          <span aria-hidden="true">✧</span>
        </div>
        <h3 className="font-serifKr text-2xl sm:text-3xl font-extrabold text-gray-900">꽃거지의 6대 운세 슬롯</h3>
        <p className="text-sm text-gray-600 mt-2 font-serifKr">
          마음 가는 슬롯을 골라보세요. 오늘 기분이 한결 나아지는 한마디가 들어 있어요.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {SLOTS.map((s) => (
          <div
            key={s.key}
            className={`rounded-3xl p-6 hover:-translate-y-1 transition-all flex flex-col justify-between ${s.card}`}
          >
            <div>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-3 ${s.iconBox}`}>
                <span className="material-symbols-outlined text-[22px]">{s.icon}</span>
              </div>
              <span className={`text-xs font-bold ${s.labelClass}`}>{s.no}</span>
              <h4 className={`font-serifKr font-bold text-lg mt-1 mb-1.5 ${s.titleClass}`}>{s.name}</h4>
              <p className={`text-xs leading-relaxed ${s.descClass}`}>{s.desc}</p>
            </div>
            <div className={`mt-5 pt-3 border-t flex items-center justify-between ${s.footerBorder}`}>
              <div>
                <span className="text-[10px] text-gray-400 line-through">1,500원</span>
                <span className={`block text-sm font-bold ${s.priceClass}`}>
                  0원 <span className="text-[10px] font-normal text-gray-400">(매일 첫 1회 무료)</span>
                </span>
              </div>
              <button
                onClick={() => onSpin(s.key, s.fortune, "0원")}
                type="button"
                aria-label={`${s.name} 뽑기 선택`}
                className={`px-3.5 py-1.5 rounded-full text-white font-serifKr text-xs font-bold transition-colors ${s.button}`}
              >
                뽑기 선택
              </button>
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
    <section className="mb-16">
      <div className="p-6 sm:p-10 rounded-[2.5rem] bg-gradient-to-b from-amber-50/70 via-white to-amber-50/40 border-2 border-gold-300 shadow-md">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gold-100 text-amber-900 text-xs font-bold mb-2">
            <span aria-hidden="true">👑</span>
            <span>꽃거지의 심층 사주 OPEN</span>
            <span className="bg-brand-600 text-white text-[10px] px-2 rounded-full">70% OFF</span>
          </div>
          <h3 className="font-serifKr text-2xl sm:text-3xl font-extrabold text-gray-900">2,990원 프리미엄 심층 사주서</h3>
          <p className="text-xs sm:text-sm text-gray-600 mt-2 font-serifKr">
            캡슐 한 알로는 아쉬운 날을 위한{" "}
            <strong>10쪽 분량의 심층 리포트</strong>예요. 올해의 흐름과 이달의 조언, <strong>행운 키워드 카드</strong>까지
            차분하게 담았어요.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PREMIUM_CARDS.map((p) => (
            <div
              key={p.key}
              className={`rounded-3xl p-6 bg-white hover:-translate-y-1 transition-all flex flex-col justify-between ${p.card}`}
            >
              {p.ribbon && (
                <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-amber-600 text-white text-[11px] font-bold">
                  {p.ribbon}
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${p.tagClass}`}>{p.tag}</span>
                  <span className="text-xs text-gray-400">10쪽 리포트</span>
                </div>
                <h4 className="font-serifKr font-bold text-base text-gray-900 mb-2">{p.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{p.desc}</p>
                <div className={`mt-3 p-2.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 ${p.perkClass}`}>
                  {p.perk}
                </div>
              </div>
              <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-400 line-through">9,900원</span>
                  <span className={`block text-base font-bold ${p.priceClass}`}>2,990원</span>
                </div>
                <button
                  onClick={() => onSpin(p.key, p.fortune, "2,990원")}
                  type="button"
                  aria-label={`${p.title} 황금 캡슐 뽑기`}
                  className={`px-3.5 py-1.5 rounded-full text-white font-serifKr text-xs font-bold transition-colors ${p.button}`}
                >
                  황금 캡슐 뽑기
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ 소개 (후기 자리) */

const TRUST_POINTS = [
  { title: "500원", desc: "동전 하나면 충분한 1회", titleClass: "text-amber-600", box: "bg-amber-50/40 border-amber-100" },
  { title: "매일 첫 1회 무료", desc: "가벼운 마음으로 오늘의 운 뽑아보기", titleClass: "text-brand-600", box: "bg-brand-50/40 border-brand-100" },
  { title: "결과지 카드", desc: "인스타 스토리용 모바일 결과지", titleClass: "text-purple-600", box: "bg-purple-50/40 border-purple-100" },
] as const;

export function TrustSection() {
  return (
    <section className="rounded-[2.5rem] bg-white border border-brand-100 p-6 sm:p-10 mb-8 shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="inline-flex items-center gap-1.5 text-brand-600 font-bold text-xs">
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span>500원짜리 동전 하나의 설렘</span>
          </div>
          <h3 className="font-serifKr text-2xl sm:text-3xl font-extrabold text-gray-900 leading-snug">
            철학관 대신,
            <br />
            <span className="text-brand-600">동전 하나</span>면 충분해요.
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            무거운 분위기도, 예약도 없이 500원 동전 하나로 오늘의 운을 뽑아요. 출퇴근길에 가볍게 뽑아보고,
            마음에 드는 결과는 인스타 스토리에 남겨보세요.
          </p>
        </div>

        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {TRUST_POINTS.map((t) => (
            <div key={t.title} className={`p-4 rounded-2xl border flex flex-col justify-between ${t.box}`}>
              <div className={`font-serifKr text-xl font-bold ${t.titleClass}`}>{t.title}</div>
              <div className="text-xs text-gray-600 mt-2 leading-relaxed">{t.desc}</div>
            </div>
          ))}
        </div>
      </div>
      {/* 실제 이용 후기가 쌓이면 이 자리에 보여주세요. (지어낸 후기나 만족도 수치는 넣지 않아요) */}
    </section>
  );
}

/* ------------------------------------------------------------------ 푸터 */

export function Footer() {
  return (
    <footer className="bg-white border-t border-brand-100 py-10 text-center text-xs text-gray-500">
      <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-2">
        <div className="flex items-center gap-1.5 text-brand-600 font-serifKr font-bold">
          <span aria-hidden="true">🌸</span> 꽃거지의 신묘한 사주 <span aria-hidden="true">🌸</span>
        </div>
        <p className="text-gray-400 font-serifKr italic">
          “오늘 이 마음, 맞지? 동전 하나로 뽑아봐.”
        </p>
        <div className="flex items-center gap-3 text-gray-400 mt-2">
                    <Link href="/terms" className="hover:text-brand-600">
            이용약관
          </Link>
          <span aria-hidden="true">•</span>
          <Link href="/privacy" className="hover:text-brand-600">
            개인정보처리방침
          </Link>
          <span aria-hidden="true">•</span>
          <Link href="/refund" className="hover:text-brand-600">
            환불 안내
          </Link>
        </div>
        <div className="text-[11px] text-gray-400 mt-1">
          © <span suppressHydrationWarning>{new Date().getFullYear()}</span> 꽃거지의 신묘한 사주. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
