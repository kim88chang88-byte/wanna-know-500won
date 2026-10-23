"use client";

import { useState } from "react";
import type { RealityCheck } from "@/lib/premium/types";

/** 사주가 보여 준 흐름과 지금 내 현실을 견줘 보는 세 갈래 (밝은 화면용). 어느 쪽을 골라도 응원으로 마무리해요. */
export function RealityLight({ rc }: { rc: RealityCheck }) {
  const [pick, setPick] = useState<number | null>(null);
  return (
    <div data-testid="topic-reality" className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/60 px-4 py-3.5">
      <p className="text-xs font-bold text-amber-800">🔎 지금 내 현실과 견줘 보기</p>
      <p className="mt-1 text-[13px] leading-relaxed text-slate-700">{rc.question}</p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {rc.options.map((o, i) => (
          <button
            key={o.label}
            type="button"
            aria-pressed={pick === i}
            onClick={() => setPick(i)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors ${
              pick === i ? "border-amber-500 bg-amber-500 text-white" : "border-amber-300 bg-white text-amber-800 hover:border-amber-500"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <p role="status" data-testid="topic-reality-result" className="min-h-[1.25rem] pt-2.5 text-[13px] leading-relaxed text-slate-800">
        {pick !== null ? rc.options[pick].message : ""}
      </p>
    </div>
  );
}
