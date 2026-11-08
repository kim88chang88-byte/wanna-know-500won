"use client";

import DoriIcon from "./DoriIcon";
import DoriScene from "./DoriScene";
import FitText from "./FitText";
import { ganzhiMeaning } from "@/lib/ganzhiMeaning";
import { useEffect, useState } from "react";
import { ChatEntry } from "@/components/chat/ChatEntry";
import { dayKey, getBrowserStorage } from "@/lib/drawCounter";
import type { BirthInput } from "@/lib/saju/types";

interface Daily {
  day: string;
  line: string;
  tip: string;
  ganzhi: string;
  /** 오늘의 행운 지수와 응원 (예전에 저장된 값에는 없을 수 있어요) */
  luck?: number;
  grade?: string;
  cheer?: string;
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

/** 도리 조약돌이 빙글 돌며 떠올랐다가 내려앉으면 뒷면에 오늘의 행운 지수가 보이고, 옆에 응원 한 줄이 나와요. */
function LuckCoin({ luck, grade, cheer }: { luck: number; grade: string; cheer: string }) {
  const high = luck >= 90;
  return (
    <div data-testid="daily-luck" className="mt-2.5 flex items-center gap-3 rounded-2xl bg-[#fff8e6] px-3 py-2.5">
      <div className="relative h-[84px] w-[84px] shrink-0 [perspective:500px]" aria-hidden="true">
        <div className="coin-flip relative h-full w-full [transform-style:preserve-3d]">
          <div className="absolute inset-0 [backface-visibility:hidden]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/coin-500.webp" alt="" className={`h-full w-full drop-shadow-[0_6px_6px_rgba(0,0,0,0.25)] ${high ? "coin-glow" : ""}`} />
          </div>
          <div className="absolute inset-0 grid place-content-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#fff3b8,#f1b933_55%,#c88a10)] text-center text-[#6b4300] shadow-[0_5px_0_#a8730a,0_9px_12px_rgba(0,0,0,0.25)] [backface-visibility:hidden] [transform:rotateY(180deg)] after:absolute after:inset-[5px] after:rounded-full after:border-2 after:border-dashed after:border-white/60 after:content-['']">
            <small className="text-[8.5px] font-extrabold tracking-[0.08em]">LUCKY</small>
            <b className="text-[30px] font-black leading-none tabular-nums">{luck}</b>
            <small className="text-[8.5px] font-extrabold">오늘의 행운</small>
          </div>
        </div>
      </div>
      <p className="min-w-0 flex-1 text-[13px] font-semibold leading-relaxed text-slate-800">
        <span className="block font-hand text-[17px] font-bold text-[#d4558a]">도리의 응원</span>
        {cheer}
        <em className="mt-1 inline-block rounded-full bg-[#fff0c2] px-2.5 py-0.5 text-[11.5px] font-extrabold not-italic text-[#a8730a]">오늘의 행운 {luck}점 · {grade}</em>
      </p>
    </div>
  );
}

/**
 * 오늘의 도리 한마디. 저장된 생년월일시가 있는 회원에게만 보여요.
 * 한 번 누르면 열리고(AI 비용 없음), 열어 본 날은 방문으로 세어 물길이 이어져요.
 */
export function DailyLineCard({ onOpened, birth }: { onOpened?: () => void; /** 저장된 내 생년월일시: 상담실 첫 화면에서 사주 기둥을 보여 주는 데만 써요 */ birth?: BirthInput | null }) {
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
    <section id="daily-today" data-testid="daily-line" aria-label="오늘의 도리 한마디" className="mb-4 rounded-2xl border border-brand-200 bg-white/90 px-4 py-3.5 shadow-sm">
      {daily ? (
        <div role="status">
          <p className="text-xs font-bold text-brand-600"><DoriIcon />오늘의 도리 한마디</p>
          <div className="mt-2">
            <DoriScene line={daily.line} tip={daily.tip} action={<ChatEntry inScene ctx={{ kind: "daily", ...(birth ? { birth } : {}), summary: `오늘의 한마디: ${daily.line}\n오늘의 팁: ${daily.tip}\n오늘 일진: ${daily.ganzhi}${daily.luck ? `\n오늘의 행운 지수: ${daily.luck}점(${daily.grade})` : ""}` }} />} />
          </div>
          {typeof daily.luck === "number" && daily.cheer && <LuckCoin luck={daily.luck} grade={daily.grade ?? ""} cheer={daily.cheer} />}
          <div data-testid="daily-ganzhi" className="mt-2 flex items-center gap-1.5">
            <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-600">오늘 일진</span>
            <FitText maxPx={11} minPx={8} className="min-w-0 flex-1 text-gray-500">
              <span className="font-semibold">{ganzhiParts(daily.ganzhi).hangul || daily.ganzhi}</span>
              {ganzhiParts(daily.ganzhi).hangul && <span className="ml-0.5 text-gray-400">({ganzhiParts(daily.ganzhi).hanja})</span>}
              {ganzhiMeaning(daily.ganzhi, true) && <span> · {ganzhiMeaning(daily.ganzhi, true)}</span>}
            </FitText>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-bold text-gray-900"><DoriIcon />오늘의 도리 한마디가 도착했어요</p>
          <button
            type="button"
            data-testid="daily-line-open"
            onClick={() => void open()}
            disabled={state === "loading"}
            className="shrink-0 rounded-full bg-brand-500 px-4 py-1.5 text-center text-xs font-bold leading-tight text-white disabled:opacity-60"
          >
            {state === "loading" ? "여는 중…" : <>지금 바로<br />열어보기</>}
          </button>
        </div>
      )}
      {state === "error" && <p role="alert" className="mt-2 text-xs text-amber-800">지금은 열지 못했어요. 잠시 뒤에 다시 눌러 주세요.</p>}
    </section>
  );
}
