"use client";

import { useEffect, useState } from "react";
import { pebbleText, splitPearls } from "@/lib/currency";
import type { SpendPlan } from "@/lib/spendPlan";

/* 풀이 보기 직전 확인창: 무엇이 얼마나 쓰이는지 보여주고 계속할지 물어요. */

function Img({ src, h }: { src: string; h: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" style={{ height: h }} className="w-auto drop-shadow" />;
}

function Bal({ coins }: { coins: number }) {
  const { pearls, pebbles } = splitPearls(coins);
  return (
    <span className="inline-flex items-center gap-1">
      {pearls > 0 && (
        <>
          <Img src="/images/pearl-3000.webp" h={22} />×{pearls}
        </>
      )}
      {pebbles > 0 && (
        <>
          <Img src="/images/coin-500.webp" h={22} />×{pebbles}
        </>
      )}
      {pearls === 0 && pebbles === 0 && <span>0</span>}
    </span>
  );
}

/* 쓰는 돈이 위로 떠올라 날아가고, 남은 돈 숫자가 줄어드는 장면 */
function SpendStage({ before, after }: { before: number; after: number }) {
  const cost = Math.max(0, before - after);
  const [won, setWon] = useState(before * 500);
  useEffect(() => {
    const from = before * 500;
    const to = after * 500;
    if (typeof window === "undefined" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setWon(to);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const delay = 900;
    const dur = 700;
    const tick = (now: number) => {
      const k = Math.min(1, Math.max(0, (now - t0 - delay) / dur));
      setWon(Math.round((from + (to - from) * k) / 100) * 100);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [before, after]);
  // 날아가는 돈: 쓰는 만큼의 조약돌 (최대 3개)
  const flyCount = Math.max(1, Math.min(3, cost));
  return (
    <div className="mt-2.5 rounded-xl bg-brand-50 px-3 py-2.5" data-testid="spend-stage">
      <style>{`
        @keyframes spFly{0%{transform:translate(0,0) rotate(0);opacity:1}25%{transform:translate(2px,-14px) rotate(-5deg);opacity:1}100%{transform:translate(44px,-54px) rotate(22deg) scale(.55);opacity:0}}
        @keyframes spMinus{0%{opacity:0;transform:translateY(8px) scale(.7)}35%{opacity:1;transform:translateY(0) scale(1.1)}100%{opacity:0;transform:translateY(-14px)}}
        .sp-fly{animation:spFly 1.3s cubic-bezier(.5,0,.3,1) both}
        .sp-minus{animation:spMinus 1.3s ease .5s both}
        @media (prefers-reduced-motion:reduce){.sp-fly,.sp-minus{animation:none;opacity:0}}
      `}</style>
      <div className="flex items-end justify-between gap-2">
        <div className="relative min-w-0 text-left">
          <div className="text-[11px] font-bold text-slate-500">내 지갑</div>
          <div className="mt-1 text-[12.5px] font-bold text-brand-600"><Bal coins={after} /></div>
          <div className="pointer-events-none absolute left-0 top-3 flex gap-1">
            {Array.from({ length: flyCount }).map((_, i) => (
              <span key={i} className="sp-fly inline-block" style={{ animationDelay: `${0.35 + i * 0.18}s` }}>
                <Img src="/images/coin-500.webp" h={22} />
              </span>
            ))}
          </div>
        </div>
        <div className="relative text-right">
          <span className="sp-minus pointer-events-none absolute -top-3 right-0 text-[12px] font-black text-red-500">−{(cost * 500).toLocaleString("ko-KR")}원</span>
          <div className="text-[11px] font-bold text-slate-500">남은 돈</div>
          <div className="text-[26px] font-black leading-none tabular-nums text-brand-600" aria-label={`쓰고 나면 ${(after * 500).toLocaleString("ko-KR")}원`}>
            {won.toLocaleString("ko-KR")}
            <span className="ml-0.5 text-[13px] font-extrabold">원</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SpendConfirm({ plan, onCancel, onConfirm, onCharge }: { plan: SpendPlan; onCancel: () => void; onConfirm: () => void; onCharge: () => void }) {
  const short = plan.kind === "short";
  const title =
    plan.kind === "free" ? "오늘의 무료 뽑기 1회를 써서\n풀이를 볼까?"
    : plan.kind === "ticket" ? "보너스 뽑기권 1장을 써서\n풀이를 볼까?"
    : plan.kind === "coin" ? `${pebbleText(plan.cost)}(${(plan.cost * 500).toLocaleString("ko-KR")}원)를 써서\n풀이를 볼까?`
    : "조약돌이 모자라";
  const sub =
    plan.kind === "free" ? "한 번 보면 무료 횟수가 하나 줄어."
    : plan.kind === "ticket" ? "오늘 무료는 이미 사용했어."
    : plan.kind === "coin" ? "오늘 무료는 이미 사용했어."
    : `이 풀이는 ${pebbleText(plan.cost)}가 필요한데\n지금은 ${pebbleText(plan.have)}가 있어.`;
  const icon = plan.kind === "coin" || short ? "/images/coin-500.webp" : "/images/free-tag.webp";
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 px-6" role="alertdialog" aria-modal="true" aria-label="사용 확인" onClick={onCancel}>
      <div className="w-full max-w-[300px] rounded-[22px] bg-white p-5 pb-4 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex h-[46px] items-center justify-center">
          <Img src={icon} h={46} />
        </div>
        <h4 className="mt-1.5 whitespace-pre-line text-[16.5px] font-extrabold leading-snug text-gray-900">{title}</h4>
        <p className="mt-1 whitespace-pre-line text-[12.5px] leading-relaxed text-slate-500">{sub}</p>
        {(plan.kind === "free" || plan.kind === "ticket") && (
          <div className="mt-2.5 rounded-xl bg-brand-50 py-2 text-[12.5px] font-bold text-brand-600">
            {plan.kind === "free" ? "남은 무료" : "보너스 뽑기"} {plan.before}{plan.kind === "free" ? "회" : "장"} → {plan.after}{plan.kind === "free" ? "회" : "장"}
          </div>
        )}
        {plan.kind === "coin" && <SpendStage before={plan.before} after={plan.after} />}
        <div className="mt-3.5 flex gap-2">
          <button type="button" onClick={onCancel} className="flex-1 rounded-full bg-brand-50 py-2.5 text-sm font-extrabold text-brand-600 active:scale-[0.98]">
            {short ? "닫기" : "취소"}
          </button>
          <button type="button" onClick={short ? onCharge : onConfirm} className="flex-1 rounded-full bg-brand-600 py-2.5 text-sm font-extrabold text-white active:scale-[0.98]">
            {short ? "충전하기" : plan.kind === "coin" ? "쓰고 보기" : "계속하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
