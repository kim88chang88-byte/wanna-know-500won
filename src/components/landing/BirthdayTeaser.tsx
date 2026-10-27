"use client";

import { useState } from "react";
import { readingFirst } from "@/lib/hanjaReading";

interface Teaser {
  line: string;
  tip: string;
  ganzhi: string;
}

/** 가입 없이 생년월일만 넣으면 바로 보이는 '오늘의 도리 한마디'. 입력값은 저장하지 않아요. */
export default function BirthdayTeaser({ onPick }: { onPick?: () => void }) {
  const [value, setValue] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<Teaser | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!m) {
      setState("error");
      setError("생년월일을 골라 주세요.");
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
    <section data-testid="birthday-teaser" className="mb-6 rounded-3xl border border-brand-200/70 bg-white/85 p-4 sm:p-5 shadow-sm">
      {result ? (
        <div className="text-center">
          <p className="text-xs font-bold text-brand-500">오늘의 도리 한마디 · {readingFirst(result.ganzhi)}</p>
          <p className="mt-2 text-sm sm:text-base text-slate-700 leading-relaxed">{result.line}</p>
          <p className="mt-2 text-xs text-sky-700 font-medium">🫧 {result.tip}</p>
          <button
            type="button"
            onClick={onPick}
            className="mt-3 inline-flex items-center rounded-full bg-gradient-to-r from-brand-500 to-fuchsia-500 px-5 py-2 text-sm font-bold text-white shadow active:scale-95"
          >
            더 자세한 운세 뽑으러 가기
          </button>
          <button type="button" onClick={() => setResult(null)} className="mt-2 block mx-auto text-[11px] text-gray-400 underline">
            다른 생일로 보기
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col items-center gap-2">
          <p className="text-sm font-bold text-slate-700">생일만 알려주면 오늘의 도리 한마디를 바로 보여줄게요 🦦</p>
          <div className="flex w-full max-w-sm gap-2">
            <input
              type="date"
              aria-label="생년월일 (양력)"
              value={value}
              min="1900-01-01"
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setValue(e.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={state === "loading"}
              className="shrink-0 rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-60 active:scale-95"
            >
              {state === "loading" ? "여는 중…" : "보기"}
            </button>
          </div>
          {state === "error" && <p role="alert" className="text-xs text-rose-600">{error}</p>}
          <p className="text-[11px] text-gray-400">가입 없이 볼 수 있어요 · 양력 기준 · 생년월일은 계산에만 쓰고 저장하지 않아요</p>
        </form>
      )}
    </section>
  );
}
