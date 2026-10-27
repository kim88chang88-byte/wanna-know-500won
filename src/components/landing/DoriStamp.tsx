import { useId } from "react";

/** 도리 얼굴이 찍힌 빨간 도장. done 이 아니면 흐린 빈 칸이에요. */
export default function DoriStamp({ done, today, tilt = 0, label }: { done: boolean; today?: boolean; tilt?: number; label?: string }) {
  const id = useId().replace(/:/g, "");
  if (!done) {
    return (
      <svg viewBox="0 0 100 100" className="h-8 w-8 shrink-0" aria-hidden="true">
        <circle cx="50" cy="50" r="42" fill="none" stroke="#d9cdf3" strokeWidth="4" strokeDasharray="6 7" strokeLinecap="round" />
        {label && (
          <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fontSize="40" fontWeight="700" fill={today ? "#8057e0" : "#b7a3e8"} style={{ fontFamily: "serif" }}>
            {label}
          </text>
        )}
      </svg>
    );
  }
  const red = "#e8352e";
  return (
    <svg viewBox="0 0 100 100" className="h-8 w-8 shrink-0" style={{ transform: `rotate(${tilt}deg)` }} aria-hidden="true">
      <defs>
        <filter id={`crayon-${id}`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" />
        </filter>
      </defs>
      <g filter={`url(#crayon-${id})`} fill="none" stroke={red} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="50" cy="50" r="45" />
        <path d="M22 80 h56" strokeWidth="3" strokeDasharray="2 6" />
        {/* 귀 */}
        <circle cx="31" cy="39" r="4.5" />
        <circle cx="69" cy="39" r="4.5" />
        {/* 얼굴 */}
        <ellipse cx="50" cy="55" rx="27" ry="20" />
        {/* 머리 위 초승달 */}
        <path d="M46 25 a5 5 0 1 0 8 0 a4 4 0 1 1 -8 0" strokeWidth="3" />
        {/* 웃는 눈 */}
        <path d="M36 52 q4 -6 8 0" />
        <path d="M56 52 q4 -6 8 0" />
        {/* 입 */}
        <path d="M44 63 q6 6 12 0" />
        <path d="M50 59 v3" strokeWidth="3" />
        {/* 반짝임 */}
        <path d="M33 60 l-7 -1 M33 64 l-7 2 M67 60 l7 -1 M67 64 l7 2" strokeWidth="2.5" />
      </g>
      <ellipse cx="50" cy="58" rx="4.2" ry="3" fill={red} filter={`url(#crayon-${id})`} />
    </svg>
  );
}
