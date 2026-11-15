"use client";

import { useEffect, useState } from "react";
import SafeImage from "./SafeImage";

/*
 * 풀이를 만드는 동안 보여주는 밤하늘 장면(오로라 + 별자리 + 오행 칩).
 * 사주 여덟 글자가 별로 떠서 혜성이 선을 그리며 이어 가고, 진행률에 맞춰 아래 오행 칩 다섯이 하나씩 켜져요.
 * 끝나면(done) 색종이와 폭죽이 터져요.
 */
const EIGHT = ["甲", "子", "乙", "丑", "丙", "寅", "丁", "卯"] as const;
const STAR_COLOR: Record<string, string> = { 甲: "#34c38f", 乙: "#34c38f", 寅: "#34c38f", 卯: "#34c38f", 丙: "#f0607c", 丁: "#f0607c", 子: "#4c8df5", 丑: "#e0a63a" };
const CHIPS: Array<[string, string]> = [["木", "#34c38f"], ["火", "#f0607c"], ["土", "#e0a63a"], ["金", "#aab4c3"], ["水", "#4c8df5"]];
const BASE: Array<[number, number]> = [[40, 126], [78, 80], [120, 113], [160, 59], [200, 97], [238, 52], [262, 100], [215, 144]];
/** 팝업 전체(360×500 기준)에 펼친 별 위치 */
const PTS: Array<[number, number]> = BASE.map(([x, y]) => [24 + x * 1.05, 100 + y * 1.3]);
const BG_STARS = Array.from({ length: 46 }, (_, k) => ({ x: (k * 53 + 23) % 360, y: (k * 37 + 69) % 500, r: 0.6 + (k % 3) * 0.4, d: (k % 7) * 0.3 }));
const COLORS = ["#ff95c6", "#ffd98a", "#9ff3e1", "#a07df0", "#ffffff", "#34c38f", "#4c8df5", "#f0607c"];

export interface Piece {
  id: number;
  style: React.CSSProperties;
}

export function makePieces(colors: string[] = COLORS): Piece[] {
  const out: Piece[] = [];
  for (let i = 0; i < 56; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 60 + Math.random() * 120;
    out.push({
      id: i,
      style: {
        ["--x" as string]: `${Math.cos(a) * r}px`,
        ["--y" as string]: `${Math.sin(a) * r * 0.8 - 40 + Math.random() * 80}px`,
        ["--r" as string]: `${Math.random() * 900 - 450}deg`,
        ["--d" as string]: `${1.1 + Math.random()}s`,
        background: colors[i % colors.length],
        borderRadius: i % 3 === 0 ? "50%" : 2,
        width: i % 3 === 0 ? 8 : 9,
        height: i % 3 === 0 ? 8 : 14,
        animationDelay: `${Math.random() * 0.15}s`,
      },
    });
  }
  // 조금 뒤에 위에서 한 번 더 쏟아지는 색종이
  for (let i = 0; i < 24; i++) {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
    const r = 90 + Math.random() * 110;
    out.push({
      id: 100 + i,
      style: {
        ["--x" as string]: `${Math.cos(a) * r}px`,
        ["--y" as string]: `${Math.sin(a) * r + 120}px`,
        ["--r" as string]: `${Math.random() * 720 - 360}deg`,
        ["--d" as string]: "1.8s",
        top: "0%",
        left: `${10 + Math.random() * 80}%`,
        background: colors[i % colors.length],
        borderRadius: 2,
        width: 9,
        height: 14,
        animationDelay: "0.7s",
      },
    });
  }
  return out;
}

export default function LoadingScene({
  pct,
  done,
  animal,
  label,
  onClose,
  stageText,
}: {
  pct: number;
  done: boolean;
  animal: string;
  /** 위쪽 알약 글자(예: "2027 신년운 · 무료") */
  label?: string;
  onClose?: () => void;
  stageText: string;
}) {
  const [pieces, setPieces] = useState<Piece[]>([]);
  useEffect(() => {
    // 색종이 모양은 끝나는 순간에만 무작위로 정해요. (서버 렌더와 어긋나지 않게)
    if (done) setPieces(makePieces());
  }, [done]);

  const E = PTS.length - 1;
  const f = (pct / 100) * E * 1.02;
  const lit = Math.floor((pct / 100) * PTS.length * 1.04);
  const seg = Math.min(E - 1, Math.floor(f));
  const fr = Math.max(0, Math.min(1, f - seg));
  const cx = PTS[seg][0] + (PTS[seg + 1][0] - PTS[seg][0]) * fr;
  const cy = PTS[seg][1] + (PTS[seg + 1][1] - PTS[seg][1]) * fr;
  const shown = Math.round(pct);

  return (
    <div className={`ls-full relative w-full h-[min(540px,78vh)] min-h-[440px] overflow-hidden ${done ? "ls-shake" : ""}`} style={{ background: "linear-gradient(180deg,#a99af0 0%,#7d5cdd 52%,#4f33a8 100%)" }}>
      <svg aria-hidden="true" viewBox="0 0 360 500" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
        {BG_STARS.map((s, i) => (
          <circle key={i} className="ls-tw" cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity=".7" style={{ animationDelay: `${s.d}s` }} />
        ))}
        <g style={{ filter: "blur(18px)" }}>
          <ellipse className="ls-au" cx="100" cy="150" rx="140" ry="30" fill="#ffd1ea" opacity=".45" />
          <ellipse className="ls-au" cx="250" cy="230" rx="130" ry="28" fill="#ffb9d9" opacity=".5" style={{ animationDelay: "-3s" }} />
          <ellipse className="ls-au" cx="180" cy="110" rx="120" ry="20" fill="#fff3c8" opacity=".4" style={{ animationDelay: "-5s" }} />
        </g>
        {PTS.slice(0, -1).map((a, i) => (
          <line
            key={i}
            x1={a[0]}
            y1={a[1]}
            x2={PTS[i + 1][0]}
            y2={PTS[i + 1][1]}
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray="1"
            strokeDashoffset={1 - Math.max(0, Math.min(1, f - i))}
            style={{ transition: "stroke-dashoffset .5s" }}
          />
        ))}
        {PTS.map((p, i) => {
          const c = STAR_COLOR[EIGHT[i]];
          return (
            <g key={i} opacity={i <= lit ? 1 : 0.3} style={{ transition: "opacity .4s" }}>
              <circle cx={p[0]} cy={p[1]} r="12" fill={c} opacity=".25" />
              <circle cx={p[0]} cy={p[1]} r="5" fill={c} />
              <text x={p[0]} y={p[1] - 15} textAnchor="middle" fontSize="13" fill="#fff" fontWeight="700">
                {EIGHT[i]}
              </text>
            </g>
          );
        })}
        {!done && (
          <g style={{ transform: `translate(${cx}px,${cy}px)`, transition: "transform .3s linear" }}>
            <circle r="11" fill="#fff" opacity=".3" />
            <circle r="4" fill="#fff" />
          </g>
        )}
      </svg>

      {label && <span className="absolute top-4 left-1/2 -translate-x-1/2 max-w-[78%] truncate rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-brand-700">{label}</span>}
      {onClose && (
        <button type="button" onClick={onClose} aria-label="닫기" className="absolute top-3 right-3 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-white/25 text-white hover:bg-white/40">
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      )}
      <div aria-hidden="true" className="absolute right-4 top-14 w-16 h-16 ls-bob">
        <SafeImage src={animal} alt="" className="w-full h-full object-contain drop-shadow-md" fallback="🦦" fallbackClass="text-5xl" />
      </div>

      <div aria-hidden="true" className="absolute inset-x-0 bottom-[150px] flex justify-center gap-2">
        {CHIPS.map(([ch, color], i) => {
          const on = done || (pct / 100) * 5 * 1.05 > i;
          return (
            <span
              key={ch}
              className="w-[30px] h-[30px] rounded-[10px] grid place-items-center font-extrabold text-[13px] text-white transition-all duration-500"
              style={{ background: color, opacity: on ? 1 : 0.3, transform: on ? "translateY(-3px) scale(1.08)" : "none" }}
            >
              {ch}
            </span>
          );
        })}
      </div>

      <div className="absolute inset-x-[22px] bottom-[22px] text-center text-white">
        <p className="mb-2.5 text-base font-extrabold" style={{ textShadow: "0 1px 8px rgba(40,20,100,.4)" }}>
          풀이를 만들고 있어
        </p>
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <span className="text-[34px] font-black leading-none" style={{ textShadow: "0 2px 10px rgba(40,20,100,.4)" }}>
            {shown}
            <small className="text-base">%</small>
          </span>
          <span className="min-w-0 truncate text-xs opacity-90">{stageText}</span>
        </div>
        <div role="progressbar" aria-label="풀이 진행" aria-valuemin={0} aria-valuemax={100} aria-valuenow={shown} className="h-2.5 rounded-full bg-white/30 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#fff,#ffd1ea)" }} />
        </div>
      </div>

      {done && (
        <>
          <span className="ls-flash" />
          {pieces.map((p) => (
            <span key={p.id} className="ls-cf" style={p.style} />
          ))}
          <span className="ls-pop2 left-3">🎉</span>
          <span className="ls-pop2 right-3" style={{ animationDelay: ".12s" }}>
            🎊
          </span>
          <div className="ls-big">다 됐어! 🎉</div>
        </>
      )}
    </div>
  );
}
