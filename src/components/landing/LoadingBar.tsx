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

/** 일반 풀이는 응답이 빨리 와도 막대가 이 시간(ms)까지는 꾸준히 차오르게 보여줘요. (끝나면 0.9초 동안 100% 로 채워서 총 8초쯤) */
export const GENERAL_MIN_MS = 7_100;

/**
 * 경과 시간(초) → 진행률. 처음 7.1초 동안 3%→88% 로 처음부터 끝까지 꾸준히 차오르고(조금씩 느려져요),
 * 응답이 더 늦으면 92% 까지 아주 천천히 더 가요. (응답이 와야 100% 로 채워요)
 */
export function progressAt(sec: number): number {
  const edge = GENERAL_MIN_MS / 1000;
  if (sec <= edge) return 3 + 85 * (1 - Math.pow(1 - sec / edge, 1.5));
  return Math.min(92, 88 + 4 * (1 - Math.exp(-(sec - edge) / 8)));
}

const PREMIUM_STAGES: { at: number; text: string }[] = [
  { at: 0, text: "사주 여덟 글자를 세우고 있어" },
  { at: 20, text: "오행의 균형을 살펴보고 있어" },
  { at: 40, text: "신강·신약과 용신을 가늠하고 있어" },
  { at: 60, text: "올해와 대운의 흐름을 보고 있어" },
  { at: 80, text: "도리가 20쪽 풀이를 정리하고 있어" },
];

/** 프리미엄은 1분 안팎 걸려서 더 천천히 차올라요. (최대 94%, 30초쯤에 80% 언저리) */
export const PREMIUM_MIN_MS = 30_000;
export function premiumProgressAt(sec: number): number {
  return Math.min(94, 94 * (1 - Math.exp(-sec / 18)));
}

/** 응답이 일찍 와도 막대가 순식간에 100% 로 뛰지 않게, 지금 값에서 100 까지 이 시간(ms) 동안 부드럽게 채워요. */
export const FINISH_MS = 900;
/** 끝나는 순간 값(from)에서 100 으로 가는 진행률. k 는 0~1 경과 비율(천천히 시작해 빠르게 끝나지 않고, 끝에서 부드럽게 멈춰요). */
export function finishPct(from: number, k: number): number {
  const e = 1 - Math.pow(1 - Math.max(0, Math.min(1, k)), 3);
  return from + (100 - from) * e;
}

export default function LoadingBar({ done: doneProp = false, animal = "/images/animal-otter.webp", premium = false, newYear = false, label, onClose }: { done?: boolean; animal?: string; premium?: boolean; newYear?: boolean; label?: string; onClose?: () => void }) {
  // 프리미엄은 응답이 일찍 와도 최소 30초는 "집필 중" 장면을 보여줘요.
  const [minPassed, setMinPassed] = useState(!premium);
  useEffect(() => {
    if (!premium) return;
    const id = setTimeout(() => setMinPassed(true), PREMIUM_MIN_MS);
    return () => clearTimeout(id);
  }, [premium]);
  const done = doneProp && minPassed;
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
  if (!premium) {
    // 팝업 전체를 채우는 밤하늘 로딩 (퍼센트는 게이지에 붙어 따라가요)
    return <LoadingScene pct={shown} done={celebrate} animal={animal} newYear={newYear} label={label} onClose={onClose} stageText={stage.text} />;
  }
  // 프리미엄도 팝업 전체를 채우는 보랏빛 밤 + 금박 장면 (큰 숫자 + 단계 문구 + 게이지)
  return <PremiumLoadingScene full pct={shown} done={celebrate} label={label} onClose={onClose} stageText={stage.text} />;
}
