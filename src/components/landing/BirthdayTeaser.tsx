"use client";

import { useState } from "react";
import { formatDateInput } from "@/lib/intake";
import DoriScene from "./DoriScene";
import DoriIcon from "./DoriIcon";
import FitText from "./FitText";
import { ganzhiSentenceParts } from "@/lib/ganzhiMeaning";

interface Teaser {
  line: string;
  tip: string;
  ganzhi: string;
}

/** 가입 없이 생년월일만 넣으면 바로 보이는 '오늘의 도리 한마디'. 입력값은 저장하지 않아요. */
export default function BirthdayTeaser() {
  const [value, setValue] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<Teaser | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!m) {
      setState("error");
      setError("생년월일을 입력해 주세요. (예: 2000-01-01)");
      return;
    }
    setState("loading");
    try {
      const res = await fetch("/api/daily/try", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) }),
      });
      const data = (await res.json().catch(() => null)) as (Teaser & { error?: string }) | null;
      if (!res.ok || !data?.line) throw new Error(data?.error ?? "");
      setResult(data);
      setState("idle");
    } catch (err) {
      setState("error");
      setError(err instanceof Error && err.message ? err.message : "지금은 열 수 없어요. 잠시 뒤에 다시 시도해 주세요.");
    }
  }

  return (
    <section id="daily-try" data-testid="birthday-teaser" className="mb-6 rounded-3xl border border-brand-200/70 bg-white/85 p-4 sm:p-5 shadow-sm">
      {result ? (
        <div className="text-center">
          <p className="text-left text-xs font-bold text-brand-500">오늘의 도리 한마디</p>
          {ganzhiSentenceParts(result.ganzhi) && (
            <FitText maxPx={13} minPx={9} className="mt-1.5 text-left font-semibold text-slate-600">
              {ganzhiSentenceParts(result.ganzhi)!.map((p, i) =>
                p.hl ? (
                  <mark key={i} className="rounded-sm bg-transparent px-0.5 font-bold text-slate-900" style={{ backgroundImage: "linear-gradient(transparent 50%, #fde047 50%)" }}>
                    {p.text}
                  </mark>
                ) : (
                  <span key={i}>{p.text}</span>
                ),
              )}
            </FitText>
          )}
          <div className="mt-3">
            <DoriScene line={result.line} tip={result.tip} />
          </div>
          <button type="button" onClick={() => setResult(null)} className="mt-3 block mx-auto text-[11px] text-gray-400 underline">
            다른 생일로 보기
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col items-center gap-2">
          <p className="text-sm font-bold text-slate-700">생일만 알려주면 오늘의 도리 한마디를 바로 보여줄게요 <DoriIcon className="!mr-0 ml-1" /></p>
          <div className="flex w-full max-w-sm gap-2">
            <div className="relative min-w-0 flex-1">
              <span aria-hidden="true" className="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-brand-500">
                calendar_today
              </span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                aria-label="생년월일 (양력)"
                placeholder="예: 2000-01-01"
                maxLength={10}
                value={value}
                onChange={(e) => setValue(formatDateInput(e.target.value))}
                className="h-[52px] w-full rounded-2xl border-2 border-transparent bg-gray-100 pl-11 pr-3 text-[15px] text-gray-900 placeholder:text-gray-400 transition-colors focus:border-brand-300 focus:bg-white focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={state === "loading"}
              className="h-[52px] shrink-0 rounded-2xl bg-brand-500 px-5 text-[15px] font-bold text-white shadow-md transition active:scale-95 disabled:opacity-60"
            >
              {state === "loading" ? "여는 중…" : "보기"}
            </button>
          </div>
          {state === "error" && <p role="alert" className="text-xs text-rose-600">{error}</p>}
          <p className="flex items-center justify-center gap-1 text-center text-[11px] leading-relaxed text-gray-400"><span aria-hidden="true" className="material-symbols-outlined text-[14px]">lock</span>생년월일은 사주풀이 계산에만 쓰고 저장하지 않아요!</p>
        </form>
      )}
    </section>
  );
}
