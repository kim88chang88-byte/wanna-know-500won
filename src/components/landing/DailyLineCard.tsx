"use client";

import { useEffect, useState } from "react";
import { dayKey, getBrowserStorage } from "@/lib/drawCounter";

interface Daily {
  day: string;
  line: string;
  tip: string;
  ganzhi: string;
}

const KEY = "wanna500:daily:v1";

/** "庚午(경오)" → 한자 "庚午", 한글 "경오" (모양이 다르면 통째로 한자 칸에 보여 줘요) */
function ganzhiParts(g: string): { hanja: string; hangul: string } {
  const m = /^(.+?)\((.+)\)$/.exec(g);
  return m ? { hanja: m[1], hangul: m[2] } : { hanja: g, hangul: "" };
}

function readOpened(day: string): Daily | null {
  try {
    const v = JSON.parse(getBrowserStorage()?.getItem(KEY) ?? "null") as Partial<Daily> | null;
    if (v && v.day === day && typeof v.line === "string" && typeof v.tip === "string" && typeof v.ganzhi === "string") return v as Daily;
  } catch {
    /* 깨진 값은 없는 것으로 */
  }
  return null;
}

/**
 * 오늘의 도리 한마디. 저장된 생년월일시가 있는 회원에게만 보여요.
 * 한 번 누르면 열리고(AI 비용 없음), 열어 본 날은 방문으로 세어 물길이 이어져요.
 */
export function DailyLineCard({ onOpened }: { onOpened?: () => void }) {
  const [daily, setDaily] = useState<Daily | null>(null);
  const [state, setState] = useState<"closed" | "loading" | "error">("closed");

  useEffect(() => {
    const cached = readOpened(dayKey(new Date()));
    if (cached) setDaily(cached);
  }, []);

  async function open() {
    setState("loading");
    try {
      const res = await fetch("/api/daily", { cache: "no-store" });
      const data = (await res.json().catch(() => null)) as Daily | null;
      if (!res.ok || !data?.line) throw new Error();
      try {
        getBrowserStorage()?.setItem(KEY, JSON.stringify({ ...data, day: dayKey(new Date()) }));
      } catch {
        /* 저장 실패는 무시 */
      }
      setDaily({ ...data, day: dayKey(new Date()) });
      setState("closed");
      onOpened?.();
    } catch {
      setState("error");
    }
  }

  return (
    <section data-testid="daily-line" aria-label="오늘의 도리 한마디" className="mb-4 rounded-2xl border border-brand-200 bg-white/90 px-4 py-3.5 shadow-sm">
      {daily ? (
        <div role="status">
          <p className="text-xs font-bold text-brand-600">🦦 오늘의 도리 한마디</p>
          <div data-testid="daily-ganzhi" className="mt-2 flex items-center gap-3 rounded-2xl border border-brand-200 bg-gradient-to-r from-brand-50 via-white to-amber-50 px-4 py-2.5">
            <span className="shrink-0 rounded-full bg-brand-500 px-2.5 py-1 text-[11px] font-black tracking-wide text-white">오늘 일진</span>
            <span className="font-serifKr text-3xl font-black leading-none text-brand-700 sm:text-4xl">{ganzhiParts(daily.ganzhi).hanja}</span>
            <span className="font-serifKr text-lg font-extrabold text-amber-600">{ganzhiParts(daily.ganzhi).hangul}</span>
          </div>
          <p data-testid="daily-line-text" className="mt-3 text-[15px] font-semibold leading-relaxed text-gray-900">{daily.line}</p>
          <p className="mt-2 text-xs font-semibold text-sky-700">{daily.tip}</p>
          <a href="#machines" className="mt-2.5 inline-block rounded-full bg-brand-500 px-3.5 py-1.5 text-xs font-bold text-white">더 궁금하면 쪽지 뽑으러 가기</a>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-bold text-gray-900">🦦 오늘의 도리 한마디가 도착했어요</p>
          <button
            type="button"
            data-testid="daily-line-open"
            onClick={() => void open()}
            disabled={state === "loading"}
            className="shrink-0 rounded-full bg-brand-500 px-3.5 py-1.5 text-xs font-bold text-white disabled:opacity-60"
          >
            {state === "loading" ? "여는 중…" : "열어 보기"}
          </button>
        </div>
      )}
      {state === "error" && <p role="alert" className="mt-2 text-xs text-amber-800">지금은 열지 못했어요. 잠시 뒤에 다시 눌러 줘요.</p>}
    </section>
  );
}
