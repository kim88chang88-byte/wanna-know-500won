"use client";

import { useEffect, useState } from "react";
import { makePieces, type Piece } from "@/components/landing/LoadingScene";

/*
 * 프리미엄 사주서를 만드는 동안 보여주는 "집필 목차" 장면.
 * 1분 안팎 걸려서, 지금 어디까지 썼는지 목차가 한 줄씩 "집필 중 → 완료 ✓"로 바뀌어요.
 * 끝나면 금빛 색종이가 터져요. (밝은 모달 안에서도, 어두운 프리미엄 화면에서도 같은 어두운 카드로 보여요)
 */
export const BOOK_CHAPTERS = ["서문 · 한눈에 보기", "제1장 · 나의 사주팔자", "제2장 · 나는 어떤 사람인가", "제3장 · 십성으로 보는 삶의 방식", "제4~6장 · 운의 흐름·신살·귀인", "제7~10장 · 재물·연애·직업·건강", "부록 · 격국과 용신", "부록 · 대운과 올해·내년"] as const;
const GOLD = ["#f0d9a0", "#e6c887", "#d3ac62", "#fff3c8", "#ffffff", "#a07df0", "#ff95c6"];

/** 진행률 → 지금 쓰는 장 번호(끝났으면 전부 완료) */
export function currentChapter(pct: number, total = BOOK_CHAPTERS.length): number {
  return Math.floor((pct / 100) * total * 1.04);
}

export default function PremiumLoadingScene({ pct, done }: { pct: number; done: boolean }) {
  const [pieces, setPieces] = useState<Piece[]>([]);
  useEffect(() => {
    if (done) setPieces(makePieces(GOLD));
  }, [done]);
  const n = currentChapter(pct);
  return (
    <div
      aria-hidden="true"
      data-testid="premium-loading-scene"
      className={`relative mx-auto w-full max-w-[340px] rounded-2xl overflow-hidden border border-[#e6c887]/30 ${done ? "ls-shake" : ""}`}
      style={{ background: "radial-gradient(circle at 50% 20%,#2a2340,#15121e 75%)", height: 236 }}
    >
      <div className="absolute inset-x-4 top-3.5 bottom-3 grid content-between">
        {BOOK_CHAPTERS.map((c, i) => {
          const ok = done || i < n;
          const cur = !done && i === n;
          return (
            <div key={c} className={`flex items-center gap-2 text-xs transition-colors ${ok ? "text-[#e6c887]" : cur ? "text-[#fbf3de]" : "text-[#b9ad93]"}`}>
              <i
                className={`not-italic flex-none w-[18px] h-[18px] rounded-full grid place-items-center text-[10px] border-[1.5px] ${ok ? "bg-[#e6c887] border-[#e6c887] text-[#1b1824]" : cur ? "border-[#e6c887] ls-ping" : "border-[#e6c887]/30"}`}
              >
                {ok ? "✓" : i + 1}
              </i>
              <span className="truncate">{c}</span>
              <span className="ml-auto flex-none text-[10px] opacity-75">{ok ? "완료" : cur ? "집필 중 ✍️" : ""}</span>
            </div>
          );
        })}
      </div>
      {done && (
        <>
          <span className="ls-flash" style={{ borderColor: "#e6c887" }} />
          {pieces.map((p) => (
            <span key={p.id} className="ls-cf" style={p.style} />
          ))}
          <div className="ls-big" style={{ color: "#fff3c8", textShadow: "0 2px 16px rgba(230,200,135,.9)" }}>
            20쪽 완성! 🎉
          </div>
        </>
      )}
    </div>
  );
}
