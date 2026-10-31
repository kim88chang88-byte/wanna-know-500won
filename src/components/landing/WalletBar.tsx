import type { ReactNode } from "react";
/*
 * 로그인한 회원에게만 보이는 "내 주머니": 1,000원 지폐 · 500원 동전 · 오늘 남은 무료 뽑기.
 * 글자 없이 그림과 숫자로만 보여주고, 읽어 주는 설명은 aria-label/title 에 둬요.
 */

export interface WalletValues {
  /** 1,000원 지폐 장수 (결제 기능이 열리면 채워져요) */
  bills: number;
  /** 500원 뽑기 동전 개수 (로그인·초대·후기 선물 등) */
  coins: number;
  /** 오늘 남은 무료 뽑기 횟수 */
  free: number;
}

/** 칩 안에 들어갈 숫자: 음수·소수는 0으로, 너무 크면 99+ */
export function capCount(n: number): string {
  const v = Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  return v > 99 ? "99+" : String(v);
}

function Chip({ label, count, tone, children }: { label: string; count: number; tone: string; children: ReactNode }) {
  const text = capCount(count);
  return (
    <span
      role="img"
      aria-label={`${label} ${text}`}
      title={`${label} ${text}`}
      className={`inline-flex h-7 items-center gap-1 rounded-full border bg-white/95 pl-1 pr-2 shadow-sm ${tone} ${count > 0 ? "" : "opacity-60 grayscale-[35%]"}`}
    >
      {children}
      {/* 숫자가 바뀔 때 톡 튀어 오르도록 key 에 숫자를 넣어요 */}
      <span key={text} aria-hidden="true" className="wallet-pop min-w-[0.75rem] text-center text-[13px] font-extrabold leading-none text-gray-800">
        {text}
      </span>
    </span>
  );
}

export default function WalletBar({ bills, coins, free }: WalletValues) {
  return (
    <div data-testid="wallet-bar" className="flex items-center justify-end gap-1.5">
      <span data-testid="wallet-bills" className="contents">
        <Chip label="1,000원 지폐" count={bills} tone="border-sky-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/bill-1000.webp" alt="" width={44} height={25} className="h-[18px] w-auto rounded-[3px] shadow-[0_1px_2px_rgba(0,0,0,0.2)]" />
        </Chip>
      </span>
      <span data-testid="wallet-coins" className="contents">
        <Chip label="500원 동전" count={coins} tone="border-amber-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/coin-500.webp" alt="" width={22} height={22} className="h-[22px] w-[22px] object-contain drop-shadow-sm" />
        </Chip>
      </span>
      <span data-testid="wallet-free" className="contents">
        <Chip label="오늘 남은 무료 뽑기" count={free} tone="border-pink-200">
          <span className="relative inline-flex h-[22px] w-[22px] items-center justify-center rounded-full bg-gradient-to-b from-pink-100 to-brand-100 ring-1 ring-pink-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/dori-icon.webp" alt="" width={18} height={18} className="h-[18px] w-[18px] rounded-full object-cover" />
            <span aria-hidden="true" className="absolute -right-1 -top-1.5 text-[10px] leading-none">✨</span>
          </span>
        </Chip>
      </span>
    </div>
  );
}
