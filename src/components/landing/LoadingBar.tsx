"use client";

import { useEffect, useState } from "react";
import LoadingScene from "./LoadingScene";

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

export default function LoadingBar({ done = false, animal = "/images/animal-otter.webp" }: { done?: boolean; animal?: string }) {
  const [pct, setPct] = useState(3);
  useEffect(() => {
    if (done) return; // 끝났으면 시간 진행을 멈추고 100% 로 채워요
    const start = Date.now();
    const id = setInterval(() => setPct(Math.max(3, progressAt((Date.now() - start) / 1000))), 250);
    return () => clearInterval(id);
  }, [done]);
  const shown = done ? 100 : pct;
  const stage = done ? { at: 100, text: "다 됐어요! 🎉" } : ([...STAGES].reverse().find((s) => pct >= s.at) ?? STAGES[0]);
  const stageIndex = done ? 4 : STAGES.indexOf(stage);
  return (
    <div>
      <LoadingScene stage={stageIndex} animal={animal} year={new Date().getFullYear()} />
      <p className="mt-3 font-bold text-gray-900 text-center">풀이를 만들고 있어요</p>
      <div className="mt-4">
      <div
        role="progressbar"
        aria-label="풀이 진행"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(shown)}
        className="h-2 rounded-full bg-brand-100 overflow-hidden"
      >
        <div className={`h-full rounded-full bg-brand-500 ease-out ${done ? "duration-500" : "duration-300"} transition-[width]`} style={{ width: `${shown}%` }} />
      </div>
      <p className="mt-2 text-xs text-gray-500 text-center">{stage.text}</p>
      </div>
    </div>
  );
}
