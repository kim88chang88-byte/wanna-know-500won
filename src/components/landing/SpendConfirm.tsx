"use client";

import { splitWallet } from "./WalletBar";
import type { SpendPlan } from "@/lib/spendPlan";

/* 풀이 보기 직전 확인창: 무엇이 얼마나 쓰이는지 보여주고 계속할지 물어요. */

function Img({ src, h }: { src: string; h: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" style={{ height: h }} className="w-auto drop-shadow" />;
}

function Bal({ coins }: { coins: number }) {
  const { bills, coins: c } = splitWallet(coins);
  return (
    <span className="inline-flex items-center gap-1">
      {bills > 0 && (
        <>
          <Img src="/images/bill-1000.webp" h={20} />×{bills}
        </>
      )}
      {c > 0 && (
        <>
          <Img src="/images/coin-500.webp" h={20} />×{c}
        </>
      )}
      {bills === 0 && c === 0 && <span>0</span>}
    </span>
  );
}

export default function SpendConfirm({ plan, onCancel, onConfirm, onCharge }: { plan: SpendPlan; onCancel: () => void; onConfirm: () => void; onCharge: () => void }) {
  const short = plan.kind === "short";
  const title =
    plan.kind === "free" ? "오늘의 무료 뽑기 1회를 써서\n풀이를 볼까요?"
    : plan.kind === "ticket" ? "보너스 뽑기권 1장을 써서\n풀이를 볼까요?"
    : plan.kind === "coin" ? `동전 ${plan.cost}개(${(plan.cost * 500).toLocaleString("ko-KR")}원)를 써서\n풀이를 볼까요?`
    : "동전이 모자라요";
  const sub =
    plan.kind === "free" ? "한 번 보면 무료 횟수가 하나 줄어요."
    : plan.kind === "ticket" ? "오늘 무료는 이미 사용했어요."
    : plan.kind === "coin" ? "오늘 무료는 이미 사용했어요."
    : `이 풀이는 동전 ${plan.cost}개가 필요한데\n지금은 ${plan.have}개가 있어요.`;
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
        {plan.kind === "coin" && (
          <div className="mt-2.5 flex items-center justify-center gap-1.5 rounded-xl bg-brand-50 py-2 text-[12.5px] font-bold text-brand-600">
            <Bal coins={plan.before} /> → <Bal coins={plan.after} />
          </div>
        )}
        <div className="mt-3.5 flex gap-2">
          <button type="button" onClick={onCancel} className="flex-1 rounded-full bg-brand-50 py-2.5 text-sm font-extrabold text-brand-600 active:scale-[0.98]">
            {short ? "닫기" : "취소"}
          </button>
          <button type="button" onClick={short ? onCharge : onConfirm} className="flex-1 rounded-full bg-brand-600 py-2.5 text-sm font-extrabold text-white active:scale-[0.98]">
            {short ? "동전 충전하기" : plan.kind === "coin" ? "동전 쓰고 보기" : "계속하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
