"use client";

import { useEffect, useMemo, useRef } from "react";
import type { PremiumReportView } from "@/lib/premium/types";
import { buildPhotoCardData } from "@/lib/card/photoData";

interface Props {
  /** 프리미엄 결과 화면용 미드나잇+골드 톤 */
  luxe?: boolean;
  report: PremiumReportView;
  /** AI 풀이가 있으면 도리의 한마디를 카드에 넣어요 */
  aiQuote?: string | null;
  /** 행운 컬러·방향 알약을 숨겨요 (같은 내용이 행운 처방에 따로 있을 때) */
  hideLucky?: boolean;
}

/** 풀이 맨 위에 보이는 한 줄 결론. 카드 틀 없이 글자 그대로 크게 보여줘요. (예전 포토카드에 들어가던 글을 그대로 살렸어요) */
export function ResultHero({ report, aiQuote, luxe = false, hideLucky = false }: Props) {
  const data = useMemo(() => buildPhotoCardData(report, { date: new Date(), siteLabel: "", aiQuote }), [report, aiQuote]);
  // 한 줄 결론은 화면에 들어올 때 부드럽게 떠오르며 나타나요. (움직임 줄이기 설정이면 처음부터 보여요)
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.classList.add("reveal-shown");
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  if (luxe) {
    return (
      <div ref={rootRef} data-testid="result-hero" className="reveal-hidden px-1 pt-2 pb-3 text-center">
        <p className="text-[10px] font-bold tracking-[0.32em] text-[#e6c887]">DORI PREMIUM · {data.topicLabel}</p>
        <div aria-hidden="true" className="mx-auto mt-3 flex items-center justify-center gap-2 text-[#e6c887]">
          <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#e6c887]/70" />
          <span className="text-[10px]">◆</span>
          <span className="h-px w-12 bg-gradient-to-l from-transparent to-[#e6c887]/70" />
        </div>
        <h4 data-testid="result-hero-headline" className="mt-4 font-serifKr text-[22px] sm:text-[25px] font-bold leading-snug text-[#fbf3de] break-keep">
          {data.headline}
        </h4>
        <p data-testid="result-hero-quote" className="mt-3 font-serifKr italic text-[14.5px] leading-relaxed text-[#f3e7c9] break-keep">
          &ldquo;{data.quote}&rdquo;
        </p>
        {data.tags.length > 0 && (
          <p className="mt-4 flex flex-wrap justify-center gap-1.5">
            {data.tags.map((t) => (
              <span key={t} className="rounded-full border border-[#e6c887]/40 px-2.5 py-0.5 text-[11px] font-bold text-[#e6c887]">
                {t}
              </span>
            ))}
          </p>
        )}
        <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#e6c887]/25 bg-white/[0.04] px-3.5 py-1.5 text-xs text-[#e8dfca]/80">
          <span aria-hidden="true" className="h-3 w-3 rounded-full border border-white/30" style={{ backgroundColor: data.lucky.hex }} />
          행운 컬러 <b className="font-bold text-[#fbf3de]">{data.lucky.color}</b>
          <span aria-hidden="true" className="text-[#e6c887]/40">|</span>
          행운 방향 <b className="font-bold text-[#fbf3de]">{data.lucky.direction}</b>
        </p>
      </div>
    );
  }
  return (
    <div ref={rootRef} data-testid="result-hero" className="reveal-hidden px-1 pt-1 pb-2 text-center">
      <p className="text-xs font-bold tracking-wide text-brand-500">{data.tier === "premium" ? "✨ 프리미엄 · " : ""}{data.topicLabel}</p>
      <h4 data-testid="result-hero-headline" className="mt-2 font-cute text-[23px] sm:text-[26px] font-normal leading-snug text-brand-700 break-keep">
        {data.headline}
      </h4>
      <p data-testid="result-hero-quote" className="mt-3 text-[15px] leading-relaxed text-gray-700 break-keep">
        &ldquo;{data.quote}&rdquo;
      </p>
      {data.tags.length > 0 && (
        <p className="mt-3 flex flex-wrap justify-center gap-1.5">
          {data.tags.map((t) => (
            <span key={t} className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-bold text-brand-600">
              {t}
            </span>
          ))}
        </p>
      )}
      {!hideLucky && <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-gray-50 px-3.5 py-1.5 text-xs text-gray-600">
        <span aria-hidden="true" className="h-3 w-3 rounded-full border border-black/10" style={{ backgroundColor: data.lucky.hex }} />
        행운 컬러 <b className="font-bold text-gray-800">{data.lucky.color}</b>
        <span aria-hidden="true" className="text-gray-300">|</span>
        행운 방향 <b className="font-bold text-gray-800">{data.lucky.direction}</b>
      </p>}
    </div>
  );
}
