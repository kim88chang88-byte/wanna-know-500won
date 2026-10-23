"use client";

import { fetchRetry } from "@/lib/fetchRetry";
import { useState } from "react";
import type { MbtiResult } from "@/lib/ai/mbti";
import { MBTI_TYPES } from "@/lib/ai/mbti";
import type { BirthInput } from "@/lib/saju/types";

const ROWS: Array<[keyof MbtiResult, string]> = [
  ["common", "🤝 둘이 같은 말을 해요"],
  ["differ", "🔀 서로 다르게 말해요"],
  ["strength", "✨ 둘 다 가리키는 강점"],
  ["caution", "🫧 둘 다 살짝 알려주는 점"],
  ["tip", "🌱 이 조합 사용법"],
];

/** 사주 × MBTI 교차 카드. 두 체계가 같은 말을 하는 곳이 진짜 내 모습일 가능성이 높아요. */
export function MbtiCard({ input }: { input: BirthInput }) {
  const [open, setOpen] = useState(false);
  const [mbti, setMbti] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [out, setOut] = useState<{ mbti: string; result: MbtiResult } | null>(null);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (loading || !mbti) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetchRetry("/api/mbti", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...input, mbti }) });
      const data = (await res.json().catch(() => null)) as { mbti?: string; result?: MbtiResult; error?: string } | null;
      if (!res.ok || !data?.result) throw new Error(data?.error ?? "도리가 잠깐 물놀이하러 갔어요. 다시 눌러 볼래요?");
      setOut({ mbti: data.mbti ?? mbti, result: data.result });
    } catch (err) {
      setError(err instanceof Error ? err.message : "답을 받지 못했어요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section data-testid="mbti-card" aria-label="사주와 MBTI 교차" className="mt-3">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="w-full text-left px-4 py-3 rounded-2xl bg-white border border-brand-200 hover:bg-brand-50 transition">
        <span className="text-sm font-bold text-gray-900">🧬 사주 × MBTI, 같이 보면?</span>
        <span className="block text-xs text-gray-500 mt-0.5">두 가지가 같은 말을 하는 곳이 진짜 내 모습일지도 몰라요.</span>
      </button>
      {open && (
        <form onSubmit={run} className="mt-2 p-4 rounded-2xl bg-brand-50/50 border border-brand-100 space-y-3">
          <label className="block text-xs font-semibold text-gray-700">
            내 MBTI
            <select value={mbti} onChange={(e) => setMbti(e.target.value)} className="mt-1 w-full rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm font-normal">
              <option value="">골라 주세요</option>
              {MBTI_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <button type="submit" disabled={loading || !mbti} className="w-full py-2.5 rounded-xl bg-brand-500 text-white text-sm font-bold disabled:opacity-50">
            {loading ? "도리가 두 지도를 겹쳐 보는 중이에요 🫧" : "교차해서 보기"}
          </button>
        </form>
      )}
      <div role="status" aria-live="polite">
        {error && <p className="mt-2 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800">{error}</p>}
        {out && (
          <div data-testid="mbti-result" className="mt-3 p-4 rounded-2xl bg-white border border-brand-100 text-sm text-gray-800 leading-relaxed space-y-2.5">
            <p className="font-bold text-gray-900">사주 × {out.mbti}</p>
            {ROWS.map(([k, label]) => (
              <p key={k}><span className="font-semibold">{label}</span><br />{out.result[k]}</p>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
