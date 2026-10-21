"use client";

import { useState } from "react";
import type { HourResult } from "@/lib/ai/hourRange";
import type { BirthInput } from "@/lib/saju/types";

const HOURS = Array.from({ length: 25 }, (_, i) => i);
const label = (h: number) => (h === 24 ? "밤 12시(24시)" : h === 0 ? "밤 12시(0시)" : h < 12 ? `오전 ${h}시` : h === 12 ? "낮 12시" : `오후 ${h - 12}시`);

/** 태어난 시간이 애매할 때, 범위 안에서 사주가 어떻게 달라지는지 후보를 나란히 보여줘요. */
export function HoursCard({ input }: { input: BirthInput }) {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(7);
  const [end, setEnd] = useState(9);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<HourResult | null>(null);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/hours", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...input, start, end }) });
      const data = (await res.json().catch(() => null)) as { result?: HourResult; error?: string } | null;
      if (!res.ok || !data?.result) throw new Error(data?.error ?? "도리가 잠깐 물놀이하러 갔어요. 다시 눌러 볼래요?");
      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "답을 받지 못했어요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section data-testid="hours-card" aria-label="태어난 시간이 애매할 때" className="mt-3">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="w-full text-left px-4 py-3 rounded-2xl bg-white border border-brand-200 hover:bg-brand-50 transition">
        <span className="text-sm font-bold text-gray-900">🕰 태어난 시간이 애매하다면?</span>
        <span className="block text-xs text-gray-500 mt-0.5">&ldquo;아침쯤&rdquo;처럼 대략만 알아도, 시간대별로 사주가 어떻게 달라지는지 비교해 줘요.</span>
      </button>
      {open && (
        <form onSubmit={run} className="mt-2 p-4 rounded-2xl bg-brand-50/50 border border-brand-100 space-y-3">
          <div className="flex items-end gap-2">
            <label className="flex-1 text-xs font-semibold text-gray-700">
              시작
              <select value={start} onChange={(e) => setStart(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm font-normal">
                {HOURS.slice(0, 24).map((h) => <option key={h} value={h}>{label(h)}</option>)}
              </select>
            </label>
            <span className="pb-2 text-gray-500">~</span>
            <label className="flex-1 text-xs font-semibold text-gray-700">
              끝
              <select value={end} onChange={(e) => setEnd(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm font-normal">
                {HOURS.slice(1).map((h) => <option key={h} value={h}>{label(h)}</option>)}
              </select>
            </label>
          </div>
          <p className="text-[11px] text-gray-500">4시간 이내로 골라 주세요. 자정을 넘는 범위는 나눠서 따로 봐 주세요.</p>
          <button type="submit" disabled={loading} className="w-full py-2.5 rounded-xl bg-brand-500 text-white text-sm font-bold disabled:opacity-50">
            {loading ? "도리가 시간대를 비교하는 중이에요 🫧" : "시간대별로 비교하기"}
          </button>
        </form>
      )}
      <div role="status" aria-live="polite">
        {error && <p className="mt-2 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800">{error}</p>}
        {result && (
          <div data-testid="hours-result" className="mt-3 p-4 rounded-2xl bg-white border border-brand-100 text-sm text-gray-800 leading-relaxed space-y-3">
            <div className="grid gap-2">
              {result.candidates.map((c, i) => (
                <div key={i} className="p-3 rounded-xl bg-brand-50/60">
                  <p className="text-xs font-bold text-brand-700">{c.window} · {c.pillars.join(" ")}</p>
                  <p className="mt-1">{c.feel}</p>
                </div>
              ))}
            </div>
            <p><span className="font-semibold">🔒 변하지 않는 핵심</span><br />{result.common}</p>
            <p><span className="font-semibold">🔀 달라지는 부분</span><br />{result.differ}</p>
            <p><span className="font-semibold">🔎 정확히 확인하려면</span><br />{result.howToCheck}</p>
            <p className="text-[11px] text-gray-500">참고용 재미 풀이예요. 정확한 시간을 알게 되면 처음부터 다시 뽑아 보세요.</p>
          </div>
        )}
      </div>
    </section>
  );
}
