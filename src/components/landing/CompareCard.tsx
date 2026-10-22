"use client";

import { useState } from "react";
import type { CompareResult } from "@/lib/ai/compare";
import type { BirthInput } from "@/lib/saju/types";

const LEAN_TEXT: Record<CompareResult["lean"], string> = { A: "A 쪽이 조금 더 결이 맞아요", B: "B 쪽이 조금 더 결이 맞아요", 비슷해요: "두 쪽이 비슷하게 팽팽해요" };

/** "A냐 B냐" 비교 카드. 결정은 내가 하고, 도리는 판단 재료만 정리해 줘요. */
export function CompareCard({ input }: { input: BirthInput }) {
  const [open, setOpen] = useState(false);
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompareResult | null>(null);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/compare", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...input, a, b }) });
      const data = (await res.json().catch(() => null)) as { result?: CompareResult; error?: string } | null;
      if (!res.ok || !data?.result) throw new Error(data?.error ?? "도리가 잠깐 물놀이하러 갔어요. 다시 눌러 볼래요?");
      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "답을 받지 못했어요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section data-testid="compare-card" aria-label="두 선택지 비교" className="mt-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full text-left px-4 py-3 rounded-2xl bg-white border border-brand-200 hover:bg-brand-50 transition"
      >
        <span className="text-sm font-bold text-gray-900">⚖️ A냐 B냐, 고민될 땐?</span>
        <span className="block text-xs text-gray-500 mt-0.5">두 선택지를 적으면 내 사주 결에 맞춰 판단 재료를 정리해 줘요. 결정은 내가 해요.</span>
      </button>
      {open && (
        <form onSubmit={run} className="mt-2 p-4 rounded-2xl bg-brand-50/50 border border-brand-100 space-y-3">
          <label className="block text-xs font-semibold text-gray-700">
            선택지 A
            <input value={a} onChange={(e) => setA(e.target.value)} maxLength={40} placeholder="예: 지금 회사에 남아 승진을 노린다" className="mt-1 w-full rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm font-normal" />
          </label>
          <label className="block text-xs font-semibold text-gray-700">
            선택지 B
            <input value={b} onChange={(e) => setB(e.target.value)} maxLength={40} placeholder="예: 다른 업계 회사로 옮긴다" className="mt-1 w-full rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm font-normal" />
          </label>
          <p className="text-[11px] text-gray-500">이름·회사명 같은 개인 정보는 적지 않아도 돼요. 건강·법률·투자 판단은 도리가 도와줄 수 없어요.</p>
          <button type="submit" disabled={loading || a.trim().length < 2 || b.trim().length < 2} className="w-full py-2.5 rounded-xl bg-brand-500 text-white text-sm font-bold disabled:opacity-50">
            {loading ? "도리가 저울에 올려보는 중이에요 🫧" : "비교해 보기"}
          </button>
        </form>
      )}
      <div role="status" aria-live="polite">
        {error && <p className="mt-2 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800">{error}</p>}
        {result && (
          <div data-testid="compare-result" className="mt-3 p-4 rounded-2xl bg-white border border-brand-100 text-sm text-gray-800 leading-relaxed space-y-3">
            <p className="font-bold text-gray-900">{LEAN_TEXT[result.lean]}</p>
            <p>{result.summary}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="p-3 rounded-xl bg-brand-50/60"><p className="text-xs font-bold text-brand-700">A · {a}</p><p className="mt-1">👍 {result.whyA}</p><p className="mt-1 text-gray-600">⚠️ {result.hardA}</p></div>
              <div className="p-3 rounded-xl bg-brand-50/60"><p className="text-xs font-bold text-brand-700">B · {b}</p><p className="mt-1">👍 {result.whyB}</p><p className="mt-1 text-gray-600">⚠️ {result.hardB}</p></div>
            </div>
            <p><span className="font-semibold">🗓 시기</span> {result.timing}</p>
            <div>
              <p className="font-semibold">결정 전에 스스로 물어볼 3가지</p>
              <ol className="mt-1 list-decimal pl-5 space-y-0.5">{result.questions.map((q, i) => <li key={i}>{q}</li>)}</ol>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
