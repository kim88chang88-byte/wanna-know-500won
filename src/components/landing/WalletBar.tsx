import type { ReactNode } from "react";
export { splitPearls } from "@/lib/currency";
/*
 * 로그인한 회원에게만 보이는 "내 주머니": 진주(3,000원) · 조약돌(500원) · 오늘 남은 무료 뽑기.
 * 글자 없이 그림과 숫자로만 보여주고, 읽어 주는 설명은 aria-label/title 에 둬요.
 */

export interface WalletValues {
  /** 진주(3,000원) 개수: 조약돌 6개마다 1개 */
  pearls: number;
  /** 남는 조약돌(500원) 개수 */
  pebbles: number;
  /** 무료로 뽑을 수 있는 횟수: 오늘 남은 무료 + 선물·도장으로 받은 뽑기권 */
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
      className={`inline-flex h-6 shrink-0 items-center gap-0.5 rounded-full border bg-white/95 pl-0.5 pr-1.5 shadow-sm sm:h-7 sm:gap-1 sm:pl-1 sm:pr-2 ${tone} ${count > 0 ? "" : "opacity-60 grayscale-[35%]"}`}
    >
      {children}
      {/* 숫자가 바뀔 때 톡 튀어 오르도록 key 에 숫자를 넣어요 */}
      <span key={text} aria-hidden="true" className="wallet-pop min-w-[0.65rem] text-center text-[12px] sm:min-w-[0.75rem] sm:text-[13px] font-extrabold leading-none text-gray-800">
        {text}
      </span>
    </span>
  );
}

export default function WalletBar({ pearls, pebbles, free, onBuy }: WalletValues & { onBuy?: () => void }) {
  const money = (
    <>
      <span data-testid="wallet-pearls" className="contents">
        <Chip label="진주" count={pearls} tone="border-violet-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/pearl-3000.webp" alt="" width={22} height={22} className="h-[18px] w-[18px] object-contain sm:h-[22px] sm:w-[22px] drop-shadow-sm" />
        </Chip>
      </span>
      <span data-testid="wallet-pebbles" className="contents">
        <Chip label="조약돌" count={pebbles} tone="border-sky-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/coin-500.webp" alt="" width={22} height={22} className="h-[18px] w-[18px] object-contain sm:h-[22px] sm:w-[22px] drop-shadow-sm" />
        </Chip>
      </span>
    </>
  );
  return (
    <div data-testid="wallet-bar" className="flex flex-nowrap items-center justify-end gap-1 sm:gap-1.5">
      {onBuy ? (
        <button type="button" onClick={onBuy} aria-label="조약돌 충전하기 (결제 메뉴판 열기)" className="flex flex-nowrap items-center justify-end gap-1 rounded-full active:scale-95 sm:gap-1.5">
          {money}
        </button>
      ) : (
        money
      )}
      <span data-testid="wallet-free" className="contents">
        <Chip label="무료 뽑기" count={free} tone="border-pink-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/free-tag.webp" alt="" width={40} height={20} className="h-[14px] w-auto object-contain drop-shadow-sm sm:h-[18px]" />
        </Chip>
      </span>
    </div>
  );
}
