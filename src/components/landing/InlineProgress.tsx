"use client";

import { useEffect, useState } from "react";

/** 경과 시간(초) → 진행률(1~95). 서버가 진행률을 알려 주지 않아서, 처음엔 빠르게 차오르고 뒤로 갈수록 느려져요. */
export function inlinePct(sec: number): number {
  return Math.max(1, Math.min(95, Math.round(95 * (1 - Math.exp(-sec / 5)))));
}

/** 작은 답변용 진행 표시: "도리가 물결을 읽는 중이에요 37%" + 막대. done 이 되면 100% 로 채워요. */
export default function InlineProgress({ label = "도리가 물결을 읽는 중이에요", done = false, luxe = false }: { label?: string; done?: boolean; luxe?: boolean }) {
  const [pct, setPct] = useState(1);
  useEffect(() => {
    if (done) return;
    const start = Date.now();
    const id = setInterval(() => setPct(inlinePct((Date.now() - start) / 1000)), 100);
    return () => clearInterval(id);
  }, [done]);
  const shown = done ? 100 : pct;
  return (
    <div
      data-testid="ask-loading"
      className={`p-4 rounded-2xl border ${luxe ? "bg-white/[0.04] border-[#e6c887]/25 text-[#e8dfca]/80" : "bg-brand-50/60 border-brand-100 text-gray-600"}`}
    >
      <p className="flex items-center justify-between gap-3 text-sm">
        <span>{label} 🫧</span>
        <span data-testid="ask-loading-pct" className={`tabular-nums font-bold ${luxe ? "text-[#e6c887]" : "text-brand-600"}`}>{shown}%</span>
      </p>
      <div
        role="progressbar"
        aria-label="답변 진행"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={shown}
        className={`mt-2.5 h-2 overflow-hidden rounded-full ${luxe ? "bg-white/10" : "bg-brand-100"}`}
      >
        <div className={`h-full rounded-full transition-[width] ease-out ${done ? "duration-300" : "duration-150"} ${luxe ? "bg-gradient-to-r from-[#f0d9a0] to-[#d3ac62]" : "bg-brand-500"}`} style={{ width: `${shown}%` }} />
      </div>
    </div>
  );
}
