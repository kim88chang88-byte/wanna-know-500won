"use client";

import { useEffect, useState } from "react";
import { kstToday } from "@/lib/betaPopup";
import { EXAM_WELCOME_KEY, shouldShowExamWelcome } from "@/lib/examWelcome";

/** 수능이 끝난 수험생을 반기는 첫 화면 팝업. 그림 아래쪽 버튼 자리를 누르면 운세 뽑기 칸으로 가요. */
export default function ExamWelcomePopup() {
  const [open, setOpen] = useState(false);
  const [hideToday, setHideToday] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(EXAM_WELCOME_KEY);
    } catch {
      /* 저장소를 못 읽으면 그냥 보여줘요 */
    }
    if (shouldShowExamWelcome(stored, kstToday())) setOpen(true);
  }, []);

  if (!open) return null;

  const close = () => {
    if (hideToday) {
      try {
        localStorage.setItem(EXAM_WELCOME_KEY, kstToday());
      } catch {
        /* 저장 실패는 무시 */
      }
    }
    setOpen(false);
  };
  const go = () => {
    close();
    window.setTimeout(() => document.getElementById("machines")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/55 px-5" role="dialog" aria-modal="true" aria-label="2027 수험생 환영 안내" data-testid="exam-welcome-popup" onClick={close}>
      <div className="relative w-full max-w-[360px] animate-[betaPop_.4s_cubic-bezier(.2,1.3,.4,1)] overflow-hidden rounded-[22px] bg-[#f6efe6] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/exam-welcome.webp" alt="2027 수험생 여러분 환영해요! 정말 고생 많았어, 이제 매일 무료로 행운을 열어봐. 매일 첫 1회 무료 운세 선물" width={770} height={618} className="block h-auto w-full" draggable={false} />
          {/* 그림 속 "오늘 무료 1회 행운 열기" 버튼 자리 위에 올린 투명 버튼 */}
          <button type="button" onClick={go} data-testid="exam-welcome-go" aria-label="오늘 무료 1회 행운 열기" className="absolute bottom-[3%] left-[28%] h-[11%] w-[44%] rounded-full" />
          <button type="button" onClick={close} aria-label="닫기" className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/85 text-[15px] text-[#4a3a6a] active:scale-95">
            ✕
          </button>
        </div>
        <div className="flex items-center justify-between gap-2 px-4 py-2.5">
          <label className="flex cursor-pointer items-center gap-1.5 text-[11.5px] font-bold text-gray-500">
            <input type="checkbox" checked={hideToday} onChange={(e) => setHideToday(e.target.checked)} className="h-4 w-4 accent-[#8fb0f6]" data-testid="exam-hide-today" />
            오늘 하루 보지 않기
          </label>
          <button type="button" onClick={close} data-testid="exam-welcome-close" className="rounded-full px-3 py-1.5 text-[12.5px] font-bold text-gray-600 active:scale-95">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
