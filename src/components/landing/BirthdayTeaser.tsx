"use client";

import { track } from "@/lib/track";
import { useState } from "react";
import { formatDateInput, formatTimeInput } from "@/lib/intake";
import DoriScene from "./DoriScene";
import DoriIcon from "./DoriIcon";
import FitText from "./FitText";
import { ganzhiSentenceParts } from "@/lib/ganzhiMeaning";
import type { ChatCtx } from "@/lib/chatContext";

interface Teaser {
  line: string;
  tip: string;
  ganzhi: string;
}

/** 가입 없이 생년월일만 넣으면 바로 보이는 '오늘의 도리 한마디'. 입력값은 저장하지 않아요. */
export default function BirthdayTeaser({ onOpenLogin }: { /** 로그인하면 이 한마디를 들고 곧바로 상담실로 가 */ onOpenLogin?: (chat: ChatCtx) => void } = {}) {
  const [value, setValue] = useState("");
  const [time, setTime] = useState("");
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<Teaser | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!m) {
      setState("error");
      setError("생년월일을 입력해 줘. (예: 2000-01-01)");
      return;
    }
    let hour: number | undefined;
    let minute: number | undefined;
    if (!timeUnknown) {
      const t = /^(\d{2}):(\d{2})$/.exec(time);
      if (!t || Number(t[1]) > 23 || Number(t[2]) > 59) {
        setState("error");
        setError("태어난 시간을 입력하거나 '모름'을 눌러 줘. (예: 14:30)");
        return;
      }
      hour = Number(t[1]);
      minute = Number(t[2]);
    }
    setState("loading");
    try {
      const res = await fetch("/api/daily/try", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: Number(m[1]), month: Number(m[2]), day: Number(m[3]), hour, minute }),
      });
      const data = (await res.json().catch(() => null)) as (Teaser & { error?: string }) | null;
      if (!res.ok || !data?.line) throw new Error(data?.error ?? "");
      setResult(data);
      setState("idle");
      track("bday_read");
    } catch (err) {
      setState("error");
      setError(err instanceof Error && err.message ? err.message : "지금은 열 수 없어. 잠시 뒤에 다시 시도해 줘.");
    }
  }

  return (
    <section id="daily-try" data-testid="birthday-teaser" className={`mb-6 -mx-2.5 rounded-3xl border border-brand-200/70 bg-white/85 px-2.5 py-3 shadow-sm ${result ? "sm:mx-0 sm:p-5" : "min-[480px]:mx-auto min-[480px]:max-w-[21.25rem]"}`}>
      {result ? (
        <div className="text-center">
          <p className="text-left text-xs font-bold text-brand-500">오늘의 도리 한마디</p>
          {ganzhiSentenceParts(result.ganzhi) && (
            <FitText maxPx={13} minPx={9} className="mt-1.5 text-left font-semibold text-slate-600">
              {ganzhiSentenceParts(result.ganzhi)!.map((p, i) =>
                p.hl ? (
                  <mark key={i} className="rounded-sm bg-transparent px-0.5 font-bold text-slate-900" style={{ backgroundImage: "linear-gradient(transparent 50%, #f3dcff 50%)" }}>
                    {p.text}
                  </mark>
                ) : (
                  <span key={i}>{p.text}</span>
                ),
              )}
            </FitText>
          )}
          <div className="mt-3">
            <DoriScene
              line={result.line}
              tip={result.tip}
              action={
                onOpenLogin ? (
                  <button
                    type="button"
                    data-testid="teaser-chat-login"
                    onClick={() => onOpenLogin({ kind: "daily", summary: `오늘의 한마디: ${result.line}\n오늘의 팁: ${result.tip}\n오늘 일진: ${result.ganzhi}` })}
                    className="w-full rounded-full bg-brand-500 font-bold text-white shadow-sm active:scale-95"
                    style={{ fontSize: "3cqw", lineHeight: 1.25, padding: "2cqw 1.5cqw" }}
                  >
                    💬 로그인하고 도리에게 더 물어보기
                  </button>
                ) : undefined
              }
            />
          </div>
          <button type="button" onClick={() => setResult(null)} className="mt-3 block mx-auto text-[11px] text-gray-400 underline">
            다른 생일로 보기
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col items-center gap-2">
          <p className="text-balance text-center text-[13.5px] font-bold text-slate-700">생일과 태어난 시간을 알려주면 오늘의 도리 한마디를 보여줄게 <DoriIcon className="!mr-0 ml-1" /></p>
          <div className="flex w-full max-w-sm flex-col gap-2">
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                aria-label="생년월일 (양력)"
                placeholder="생년월일 2000-01-01"
                maxLength={10}
                value={value}
                onChange={(e) => setValue(formatDateInput(e.target.value))}
                className="h-11 w-full min-w-0 rounded-[14px] border-2 border-transparent bg-gray-100 px-3 text-[14px] text-gray-900 placeholder:text-gray-400 transition-colors focus:border-brand-300 focus:bg-white focus:outline-none flex-[1.2]"
              />
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                aria-label="태어난 시간"
                data-testid="teaser-time"
                placeholder="시간 14:30"
                maxLength={5}
                disabled={timeUnknown}
                value={time}
                onChange={(e) => setTime(formatTimeInput(e.target.value))}
                className="h-11 w-full min-w-0 flex-1 rounded-[14px] border-2 border-transparent bg-gray-100 px-3 text-[14px] text-gray-900 placeholder:text-gray-400 transition-colors focus:border-brand-300 focus:bg-white focus:outline-none disabled:opacity-45"
              />
            </div>
            <label className="flex items-center gap-1.5 self-end text-[12px] text-gray-500">
              <input
                type="checkbox"
                data-testid="teaser-time-unknown"
                checked={timeUnknown}
                onChange={(e) => {
                  setTimeUnknown(e.target.checked);
                  if (e.target.checked) setTime("");
                }}
                className="h-4 w-4 accent-brand-500"
              />
              태어난 시간을 몰라요
            </label>
            <button
              type="submit"
              disabled={state === "loading"}
              className="h-11 w-full rounded-[14px] bg-brand-500 px-5 text-[14px] font-bold text-white shadow-md transition active:scale-95 disabled:opacity-60"
            >
              {state === "loading" ? "여는 중…" : "보기"}
            </button>
          </div>
          {state === "error" && <p role="alert" className="text-xs text-rose-600">{error}</p>}
          <p className="flex items-center justify-center gap-1 text-center text-[10.5px] leading-relaxed text-gray-400"><span aria-hidden="true" className="material-symbols-outlined text-[14px]">lock</span>입력값은 사주풀이 계산에만 쓰고 저장하지 않아!</p>
        </form>
      )}
    </section>
  );
}
