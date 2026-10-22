"use client";

import { useEffect, useState } from "react";

/** 풀이를 만드는 동안 보여주는 진행 막대. 서버는 진행률을 알려주지 않아서, 시간이 갈수록 천천히 차오르게 보여줘요. (끝나면 화면이 결과로 바뀌어요) */
const STAGES: { at: number; text: string }[] = [
  { at: 0, text: "사주 여덟 글자를 세우고 있어요" },
  { at: 25, text: "오행의 균형을 살펴보고 있어요" },
  { at: 50, text: "올해와 대운의 흐름을 보고 있어요" },
  { at: 75, text: "도리가 풀이를 정리하고 있어요" },
];

/** 경과 시간(초) → 진행률(0~92). 처음엔 빠르게, 뒤로 갈수록 느려져서 끝까지 차 버리지 않아요. */
export function progressAt(sec: number): number {
  return Math.min(92, 92 * (1 - Math.exp(-sec / 12)));
}

export default function LoadingBar() {
  const [pct, setPct] = useState(3);
  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => setPct(Math.max(3, progressAt((Date.now() - start) / 1000))), 250);
    return () => clearInterval(id);
  }, []);
  const stage = [...STAGES].reverse().find((s) => pct >= s.at) ?? STAGES[0];
  return (
    <div className="mt-4">
      <div
        role="progressbar"
        aria-label="풀이 진행"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        className="h-2 rounded-full bg-brand-100 overflow-hidden"
      >
        <div className="h-full rounded-full bg-brand-500 transition-[width] duration-300 ease-out" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-xs text-gray-500">{stage.text}</p>
    </div>
  );
}
