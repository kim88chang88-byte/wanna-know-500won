"use client";

import { useEffect, useState } from "react";
import { getBrowserStorage } from "@/lib/drawCounter";

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
  const bar = dark ? "border-[#e6c887]/30 bg-white/[0.06] text-[#f0d9a0]" : "border-brand-100 bg-white text-brand-700";
  return (
    <section data-testid="saju-guide" aria-label="사주 읽는 법" className="mb-4">
      <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className={`flex w-full items-center gap-2 rounded-2xl border p-1.5 pr-3 text-left text-[13px] font-extrabold shadow-sm ${bar}`}>
        <span aria-hidden="true" className="h-9 w-9 shrink-0 rounded-full bg-[#c9b8f0] bg-no-repeat" style={{ backgroundImage: "url(/images/saju-guide.webp)", backgroundSize: "auto 260%", backgroundPosition: "-20px -17px" }} />
        <span className="whitespace-nowrap">도리가 알려 줄게, 사주 이렇게 읽어 봐</span>
        <span aria-hidden="true" className="ml-auto shrink-0 text-[12px] font-bold opacity-60">{open ? "접기 ▲" : "펼치기 ▼"}</span>
      </button>
      {open && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/images/saju-guide.webp" alt={`도리가 알려 줄게, 사주 이렇게 읽어 봐. ${SAJU_GUIDE_LINES.join(" ")}`} width={998} height={546} className={`mt-2 block h-auto w-full rounded-2xl ${dark ? "shadow-[0_0_0_1px_rgba(230,200,135,.35),0_4px_16px_rgba(0,0,0,.4)]" : "shadow-md"}`} />
      )}
    </section>
  );
}
