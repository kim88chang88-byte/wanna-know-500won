"use client";

import { useEffect, useState } from "react";
import { getBrowserStorage } from "@/lib/drawCounter";
import SafeImage from "./SafeImage";

export const SAJU_GUIDE_LINES = [
  "사주는 오래오래 쌓인 흐름의 지도야.",
  "도리가 그 흐름의 길을 읽어 줄 테니, 너는 \"어, 맞네?\" 싶은 대목에서는 고개를 끄덕여 줘.",
  "조금 다르게 느껴지는 곳은 참고만 하고, 너만의 선택으로 길을 만들어 가면 돼 🌙",
] as const;

const SEEN_KEY = "doyu_saju_guide_seen";

/** 결과서 맨 앞의 도리 말풍선으로 보여 주는 "사주, 이렇게 읽어 봐" 접이식 안내. 처음 한 번은 펼쳐 보이고, 그다음부터는 접어 둬요. */
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
  const bubble = dark ? "border-[#e6c887]/30 bg-white/[0.06] text-[#efe7d3]" : "border-brand-100 bg-white text-gray-800";
  return (
    <section data-testid="saju-guide" aria-label="사주 읽는 법" className="mb-4">
      <div className="flex items-start gap-2">
        <SafeImage src="/images/animal-otter.webp" alt="" className={`h-10 w-10 shrink-0 rounded-full object-contain ${dark ? "bg-white/10" : "bg-brand-50"}`} fallback="🦦" fallbackClass="text-2xl" />
        <div className="min-w-0 flex-1">
          <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className={`relative flex w-full items-center gap-2 rounded-2xl rounded-tl-md border px-3.5 py-2.5 text-left text-[13.5px] font-extrabold shadow-sm ${bubble}`}>
            <span className={dark ? "text-[#f0d9a0]" : "text-brand-700"}>도리가 알려 줄게, 사주 이렇게 읽어 봐 ✨</span>
            <span aria-hidden="true" className="ml-auto shrink-0 text-[12px] font-bold opacity-60">{open ? "접기 ▲" : "펼치기 ▼"}</span>
          </button>
          {open && (
            <div className="mt-1.5 space-y-1.5 text-[13px] leading-[1.75]">
              {SAJU_GUIDE_LINES.map((l) => (
                <p key={l} className={`w-fit max-w-full rounded-2xl rounded-tl-md border px-3.5 py-2 shadow-sm ${bubble}`}>{l}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
