"use client";

import { useEffect, useState } from "react";
import { BETA_POPUP_KEY, kstToday, shouldShowBeta } from "@/lib/betaPopup";

/** 처음 접속하면 가장 먼저 뜨는 오픈베타 안내 팝업 */
export default function BetaOpenPopup() {
  const [open, setOpen] = useState(false);
  const [hideToday, setHideToday] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(BETA_POPUP_KEY);
    } catch {
      /* 저장소를 못 읽으면 그냥 보여줘요 */
    }
    if (shouldShowBeta(stored)) setOpen(true);
  }, []);

  if (!open) return null;

  const close = () => {
    if (hideToday) {
      try {
        localStorage.setItem(BETA_POPUP_KEY, kstToday());
      } catch {
        /* 저장 실패는 무시 */
      }
    }
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/55 px-5" role="dialog" aria-modal="true" aria-label="도유사주 오픈베타 안내" data-testid="beta-open-popup" onClick={close}>
      <div className="w-full max-w-[340px] animate-[betaPop_.4s_cubic-bezier(.2,1.3,.4,1)] rounded-[22px] bg-[#fcf6ef] px-4 pb-4 pt-3 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/beta-open.webp"
          alt="달을 안고 축하하는 수달 도리"
          className="mx-auto block w-full"
          style={{ WebkitMaskImage: "radial-gradient(ellipse 72% 72% at 50% 50%, #000 70%, transparent 100%)", maskImage: "radial-gradient(ellipse 72% 72% at 50% 50%, #000 70%, transparent 100%)" }}
        />
        <span className="inline-block rounded-full bg-gradient-to-r from-[#8fb0f6] to-[#c9a7ef] px-3 py-1 text-[11px] font-extrabold text-white">🎉 도유사주 OPEN BETA</span>
        <h4 className="mt-2 text-[19px] font-black leading-snug text-[#1f2a55]">
          2026년 11월 8일,
          <br />
          도유사주 오픈베타 오픈!
        </h4>
        <p className="mt-2 text-[12.5px] leading-relaxed text-[#7a6a4f]">
          당신의 운명을 비추는 작은 달빛 🌙
          <br />
          수달 도사 도리와 함께하는
          <br />
          신묘한 사주풀이가 찾아왔어요!
          <br />
          지금 바로 첫 1회 무료 뽑기를 체험해보세요 ✨
        </p>
        <div className="mt-3.5 flex items-center gap-2">
          <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-[11.5px] font-bold text-gray-500">
            <input type="checkbox" checked={hideToday} onChange={(e) => setHideToday(e.target.checked)} className="h-4 w-4 accent-[#8fb0f6]" data-testid="beta-hide-today" />
            오늘 하루 보지 않기
          </label>
          <button type="button" onClick={close} data-testid="beta-close" className="flex-1 rounded-full bg-gradient-to-r from-[#8fb0f6] to-[#eaa1b8] py-2.5 text-[13.5px] font-black text-white active:scale-[0.98]">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
