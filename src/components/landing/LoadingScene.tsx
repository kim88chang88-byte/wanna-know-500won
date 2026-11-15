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
const PTS: Array<[number, number]> = [[40, 126], [78, 80], [120, 113], [160, 59], [200, 97], [238, 52], [262, 100], [215, 144]];
const BG_STARS = Array.from({ length: 34 }, (_, k) => ({ x: (k * 53 + 23) % 300, y: (k * 37 + 69) % 220, r: 0.6 + (k % 3) * 0.4, d: (k % 7) * 0.3 }));
const COLORS = ["#ff95c6", "#ffd98a", "#9ff3e1", "#a07df0", "#ffffff", "#34c38f", "#4c8df5", "#f0607c"];

interface Piece {
  id: number;
  style: React.CSSProperties;
}

function makePieces(): Piece[] {
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
        background: COLORS[i % COLORS.length],
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
        background: COLORS[i % COLORS.length],
        borderRadius: 2,
        width: 9,
        height: 14,
        animationDelay: "0.7s",
      },
    });
  }
  return out;
}

export default function LoadingScene({ pct, done, animal }: { pct: number; done: boolean; animal: string }) {
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

  return (
    <div aria-hidden="true" className={`ls-sky relative mx-auto w-full max-w-[320px] h-56 rounded-2xl overflow-hidden ${done ? "ls-shake" : ""}`} style={{ background: "linear-gradient(170deg,#0f1b3d,#1f2f66)" }}>
      <svg viewBox="0 0 300 220" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
        {BG_STARS.map((s, i) => (
          <circle key={i} className="ls-tw" cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity=".7" style={{ animationDelay: `${s.d}s` }} />
        ))}
        <g style={{ filter: "blur(14px)" }}>
          <ellipse className="ls-au" cx="90" cy="60" rx="110" ry="24" fill="#34e0b5" opacity=".45" />
          <ellipse className="ls-au" cx="210" cy="85" rx="100" ry="22" fill="#a07df0" opacity=".5" style={{ animationDelay: "-3s" }} />
          <ellipse className="ls-au" cx="150" cy="40" rx="90" ry="16" fill="#ff95c6" opacity=".35" style={{ animationDelay: "-5s" }} />
        </g>
        {PTS.slice(0, -1).map((a, i) => (
          <line
            key={i}
            x1={a[0]}
            y1={a[1]}
            x2={PTS[i + 1][0]}
            y2={PTS[i + 1][1]}
            stroke="#bfeee4"
            strokeWidth="1.6"
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
            <g key={i} opacity={i <= lit ? 1 : 0.25} style={{ transition: "opacity .4s" }}>
              <circle cx={p[0]} cy={p[1]} r="10" fill={c} opacity=".22" />
              <circle cx={p[0]} cy={p[1]} r="4" fill={c} />
              <text x={p[0]} y={p[1] - 13} textAnchor="middle" fontSize="11" fill="#fff" fontWeight="700" opacity=".9">
                {EIGHT[i]}
              </text>
            </g>
          );
        })}
        {!done && (
          <g style={{ transform: `translate(${cx}px,${cy}px)`, transition: "transform .3s linear" }}>
            <circle r="9" fill="#9ff3e1" opacity=".3" />
            <circle r="3.5" fill="#fff" />
          </g>
        )}
      </svg>

      <div className="absolute right-3 top-2 w-14 h-14 ls-bob">
        <SafeImage src={animal} alt="" className="w-full h-full object-contain drop-shadow-md" fallback="🦦" fallbackClass="text-4xl" />
      </div>
      <span className="absolute left-3 top-2.5 text-[13px] font-extrabold text-amber-200 bg-black/25 px-2.5 py-0.5 rounded-full">{Math.round(pct)}%</span>

      <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
        {CHIPS.map(([ch, color], i) => {
          const on = done || (pct / 100) * 5 * 1.05 > i;
          return (
            <span
              key={ch}
              className="w-[26px] h-[26px] rounded-[9px] grid place-items-center font-extrabold text-xs text-white transition-all duration-500"
              style={{ background: color, opacity: on ? 1 : 0.25, transform: on ? "translateY(-3px) scale(1.08)" : "none" }}
            >
              {ch}
            </span>
          );
        })}
      </div>

      {done && (
        <>
          <span className="ls-flash" />
          {pieces.map((p) => (
            <span key={p.id} className="ls-cf" style={p.style} />
          ))}
          <span className="ls-pop2 left-2.5">🎉</span>
          <span className="ls-pop2 right-2.5" style={{ animationDelay: ".12s" }}>
            🎊
          </span>
          <div className="ls-big">다 됐어! 🎉</div>
        </>
      )}
    </div>
  );
}
