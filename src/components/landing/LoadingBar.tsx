"use client";

import { useEffect, useRef, useState } from "react";
import LoadingScene from "./LoadingScene";
import PremiumLoadingScene from "@/components/premium/PremiumLoadingScene";

/** 풀이를 만드는 동안 보여주는 진행 막대. 서버는 진행률을 알려주지 않아서, 시간이 갈수록 천천히 차오르게 보여줘요. (끝나면 화면이 결과로 바뀌어요) */
const STAGES: { at: number; text: string }[] = [
  { at: 0, text: "사주 여덟 글자를 세우고 있어" },
  { at: 25, text: "오행의 균형을 살펴보고 있어" },
  { at: 50, text: "올해와 대운의 흐름을 보고 있어" },
  { at: 75, text: "도리가 풀이를 정리하고 있어" },
];

/** 경과 시간(초) → 진행률(0~92). 처음부터 꾸준히 차오르다(5초≈43%, 10초≈66%) 뒤로 갈수록 느려져서 끝까지 차 버리지 않아요. */
export function progressAt(sec: number): number {
  return Math.min(92, 92 * (1 - Math.exp(-sec / 8)));
}

const PREMIUM_STAGES: { at: number; text: string }[] = [
  { at: 0, text: "사주 여덟 글자를 세우고 있어" },
  { at: 20, text: "오행의 균형을 살펴보고 있어" },
  { at: 40, text: "신강·신약과 용신을 가늠하고 있어" },
  { at: 60, text: "올해와 대운의 흐름을 보고 있어" },
  { at: 80, text: "도리가 20쪽 풀이를 정리하고 있어" },
];

/** 프리미엄은 1분 안팎 걸려서 더 천천히 차올라요. (최대 94%) */
export function premiumProgressAt(sec: number): number {
  return Math.min(94, 94 * (1 - Math.exp(-sec / 35)));
}

/** 응답이 일찍 와도 막대가 순식간에 100% 로 뛰지 않게, 지금 값에서 100 까지 이 시간(ms) 동안 부드럽게 채워요. */
export const FINISH_MS = 900;
/** 끝나는 순간 값(from)에서 100 으로 가는 진행률. k 는 0~1 경과 비율(천천히 시작해 빠르게 끝나지 않고, 끝에서 부드럽게 멈춰요). */
export function finishPct(from: number, k: number): number {
  const e = 1 - Math.pow(1 - Math.max(0, Math.min(1, k)), 3);
  return from + (100 - from) * e;
}

export default function LoadingBar({ done = false, animal = "/images/animal-otter.webp", premium = false }: { done?: boolean; animal?: string; premium?: boolean }) {
  const [pct, setPct] = useState(3);
  const [celebrate, setCelebrate] = useState(false);
  const pctRef = useRef(3);
  pctRef.current = pct;
  useEffect(() => {
    if (done) return;
    setCelebrate(false);
    const start = Date.now();
    const id = setInterval(() => setPct(Math.max(3, (premium ? premiumProgressAt : progressAt)((Date.now() - start) / 1000))), 250);
    return () => clearInterval(id);
  }, [done, premium]);
  useEffect(() => {
    // 끝났으면 지금 값에서 100% 까지 부드럽게 채운 뒤 축하 장면을 보여요.
    if (!done) return;
    const from = pctRef.current;
    const t0 = Date.now();
    let raf = 0;
    const step = () => {
      const k = (Date.now() - t0) / FINISH_MS;
      setPct(finishPct(from, k));
      if (k < 1) raf = requestAnimationFrame(step);
      else setCelebrate(true);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [done]);
  const shown = pct;
  const stages = premium ? PREMIUM_STAGES : STAGES;
  const stage = celebrate ? { at: 100, text: "다 됐어! 🎉" } : ([...stages].reverse().find((s) => pct >= s.at) ?? stages[0]);
  return (
    <div>
      {premium ? <PremiumLoadingScene pct={shown} done={celebrate} /> : <LoadingScene pct={shown} done={celebrate} animal={animal} />}
      <p className="mt-3 font-bold text-gray-900 text-center">{premium ? "프리미엄 사주서를 만들고 있어" : "풀이를 만들고 있어"}</p>
      <div className="mt-4">
      <div
        role="progressbar"
        aria-label="풀이 진행"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(shown)}
        className="h-2 rounded-full bg-brand-100 overflow-hidden"
      >
        <div className={`h-full rounded-full bg-brand-500 ease-out ${done ? "" : "duration-300 transition-[width]"}`} style={{ width: `${shown}%` }} />
      </div>
      <p className="mt-2 text-xs text-gray-500 text-center">{stage.text}{premium && !celebrate ? ` · ${Math.round(shown)}%` : ""}</p>
      </div>
    </div>
  );
}
