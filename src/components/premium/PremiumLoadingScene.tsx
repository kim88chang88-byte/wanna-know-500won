"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { makePieces, type Piece } from "@/components/landing/LoadingScene";

/*
 * 프리미엄 사주서를 만드는 동안 보여주는 "집필 목차" 장면.
 * 1분 안팎 걸려서, 지금 어디까지 썼는지 목차가 한 줄씩 "집필 중 → 완료 ✓"로 바뀌어요.
 * 끝나면 금빛 색종이가 터져요. (밝은 모달 안에서도, 어두운 프리미엄 화면에서도 같은 어두운 카드로 보여요)
 */
export const BOOK_CHAPTERS = ["서문 · 한눈에 보기", "제1장 · 나의 사주팔자", "제2장 · 나는 어떤 사람인가", "제3장 · 십성으로 보는 삶의 방식", "제4~6장 · 운의 흐름·신살·귀인", "제7~10장 · 재물·연애·직업·건강", "부록 · 격국과 용신", "부록 · 대운과 올해·내년"] as const;
/** 완성 장면의 금가루 한 알(끝나는 순간에만 무작위로 정해요) */
interface Dust {
  id: number;
  style: Record<string, string>;
  big: boolean;
}
function makeDust(n: number): Dust[] {
  return Array.from({ length: n }, (_, i) => {
    const big = i % 7 === 0;
    const sz = 1.5 + Math.random() * (big ? 5 : 3);
    return {
      id: i,
      big,
      style: {
        left: `${Math.random() * 100}%`,
        width: `${sz}px`,
        height: `${sz}px`,
        "--d": `${2.4 + Math.random() * 2.2}s`,
        "--x": `${Math.random() * 60 - 30}px`,
        "--h": `${-(280 + Math.random() * 260)}px`,
        animationDelay: `${Math.random() * 4.4}s`,
      },
    };
  });
}
const GOLD = ["#f0d9a0", "#e6c887", "#d3ac62", "#fff3c8", "#ffffff", "#a07df0", "#ff95c6"];

/** 진행률 → 지금 쓰는 장 번호(끝났으면 전부 완료) */
export function currentChapter(pct: number, total = BOOK_CHAPTERS.length): number {
  return Math.floor((pct / 100) * total * 1.04);
}

/** 프리미엄 팝업을 가득 채우는 "보랏빛 밤 + 금박" 배경 별가루 (고정 좌표라 서버 렌더와 같아요) */
const FULL_STARS = Array.from({ length: 36 }, (_, k) => ({ x: (k * 53 + 19) % 360, y: (k * 37 + 57) % 500, r: 0.5 + (k % 3) * 0.4, d: (k % 7) * 0.3 }));

export default function PremiumLoadingScene({
  pct,
  done,
  full,
  label,
  onClose,
  stageText,
}: {
  pct: number;
  done: boolean;
  /** true면 팝업 전체를 채우는 보랏빛 밤 + 금박 장면(큰 숫자 + 단계 문구 + 게이지 포함) */
  full?: boolean;
  label?: string;
  onClose?: () => void;
  stageText?: string;
}) {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [dust, setDust] = useState<Dust[]>([]);
  useEffect(() => {
    if (!done) return;
    if (full) setDust(makeDust(600));
    else setPieces(makePieces(GOLD));
  }, [done, full]);
  const n = currentChapter(pct);
  if (full) {
    return (
      <div
        data-testid="premium-loading-scene"
        className={`relative w-full h-[min(540px,78vh)] min-h-[440px] overflow-hidden ${done ? "pf-done" : ""}`}
        style={{ background: "linear-gradient(180deg,#4a3a8a 0%,#2a2058 40%,#15121e 100%)" }}
      >
        <svg aria-hidden="true" viewBox="0 0 360 500" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
          {FULL_STARS.map((q, i) => (
            <circle key={i} className="ls-tw" cx={q.x} cy={q.y} r={q.r} fill="#fff3c8" opacity=".6" style={{ animationDelay: `${q.d}s` }} />
          ))}
          <g style={{ filter: "blur(18px)" }}>
            <ellipse className="ls-au" cx="120" cy="80" rx="150" ry="30" fill="#a07df0" opacity=".35" />
            <ellipse className="ls-au" cx="260" cy="130" rx="120" ry="24" fill="#e6c887" opacity=".18" style={{ animationDelay: "-3s" }} />
          </g>
        </svg>
        {label && <span className="absolute top-4 left-1/2 -translate-x-1/2 max-w-[78%] truncate rounded-full border border-[#e6c887]/55 bg-[#12101a]/60 px-3 py-1 text-xs font-bold text-[#f6dfa8]">{label}</span>}
        {onClose && (
          <button type="button" onClick={onClose} aria-label="닫기" className="absolute top-3 right-3 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[#e6c887] hover:bg-white/20">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        )}
        <div aria-hidden="true" className="pf-rows absolute left-7 right-7 top-[66px] grid gap-[11px]">
          {BOOK_CHAPTERS.map((c, i) => {
            const ok = done || i < n;
            const cur = !done && i === n;
            return (
              <div key={c} className={`flex items-center gap-2.5 text-[13px] text-left transition-colors ${ok ? "text-[#e6c887]" : cur ? "text-[#fbf3de]" : "text-[#b9ad93]"}`}>
                <i className={`not-italic flex-none w-5 h-5 rounded-full grid place-items-center text-[11px] border-[1.5px] ${ok ? "bg-[#e6c887] border-[#e6c887] text-[#1b1824]" : cur ? "border-[#e6c887] ls-ping" : "border-[#e6c887]/30"}`}>{ok ? "✓" : i + 1}</i>
                <span className="truncate">{c}</span>
                <span className="ml-auto flex-none text-[11px] opacity-75">{ok ? "완료" : cur ? "집필 중 ✍️" : ""}</span>
              </div>
            );
          })}
        </div>
        <div className="pf-foot absolute inset-x-6 bottom-6 text-[#fbf3de]">
          <p className="mb-2.5 text-center text-base font-extrabold">프리미엄 사주서를 만들고 있어</p>
          <div className="mb-2 flex items-baseline justify-between gap-2.5">
            <span className="text-[34px] font-black leading-none text-[#f6dfa8]" style={{ textShadow: "0 2px 12px rgba(230,200,135,.35)" }}>
              {Math.round(pct)}
              <small className="text-base">%</small>
            </span>
            <span className="text-right text-xs text-[#e8dfca]/90">{stageText}</span>
          </div>
          <div role="progressbar" aria-label="풀이 진행" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} className="h-2.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#f0d9a0,#d3ac62)", boxShadow: "0 0 10px rgba(230,200,135,.5)" }} />
          </div>
        </div>
        {done && (
          <div aria-hidden="true" className="pf-fx">
            <div className="pf-sweep" />
            {dust.map((d) => (
              <i key={d.id} className={`pf-dust${d.big ? " pf-big" : ""}`} style={d.style as CSSProperties} />
            ))}
            <div className="pf-cover">
              <div>
                <small>THE PREMIUM EDITION</small>
                <b>
                  나만을 위한
                  <br />
                  한 권의 사주서
                </b>
              </div>
            </div>
            <p className="pf-cap">당신의 사주서가 완성되었습니다</p>
          </div>
        )}
      </div>
    );
  }
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
