"use client";

import { useEffect, useState } from "react";
import { getBrowserStorage } from "@/lib/drawCounter";

export const SAJU_GUIDE_LINES = [
  "사주는 오래오래 쌓인 흐름의 지도야.",
  "도리가 길은 읽어 줄 테니, 너는 \"어, 맞네?\" 하는 대목만 골라 봐.",
  "딱 맞는 곳은 앞으로 더 살펴볼 신호고, 다르게 느껴지는 곳은 \"그럼 내가 이렇게 바꿔 볼래!\" 하고 내 쪽으로 길을 틀어 볼 기회야 🌙",
] as const;

const SEEN_KEY = "doyu_saju_guide_seen";

/** 결과서 맨 앞의 "사주, 이렇게 읽어 봐요" 접이식 안내. 처음 한 번은 펼쳐 보이고, 그다음부터는 접어 둬요. */
export default function SajuGuide({ dark = false }: { dark?: boolean }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try {
      const st = getBrowserStorage();
      if (!st?.getItem(SEEN_KEY)) {
        setOpen(true);
        st?.setItem(SEEN_KEY, "1");
      }
    } catch {
      setOpen(true);
    }
  }, []);
  return (
    <section data-testid="saju-guide" aria-label="사주 읽는 법" className={`mb-4 overflow-hidden rounded-2xl border ${dark ? "border-[#e6c887]/25 bg-white/[0.04] text-[#efe7d3]" : "border-brand-100 bg-white text-gray-800 shadow-sm"}`}>
      <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-2 px-4 py-3 text-left text-[13.5px] font-extrabold">
        <span aria-hidden="true">🗺️</span>
        <span className={dark ? "text-[#f0d9a0]" : "text-brand-700"}>사주, 이렇게 읽어 봐요</span>
        <span aria-hidden="true" className="ml-auto text-[12px] opacity-60">{open ? "접기 ▲" : "펼치기 ▼"}</span>
      </button>
      {open && (
        <div className="space-y-1.5 px-4 pb-4 text-[13px] leading-[1.75]">
          {SAJU_GUIDE_LINES.map((l) => (
            <p key={l}>{l}</p>
          ))}
        </div>
      )}
    </section>
  );
}
