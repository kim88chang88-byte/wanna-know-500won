"use client";

import { useRef, useState } from "react";
import { ASK_QUESTIONS } from "@/lib/ai/askQuestions";
import type { BirthInput } from "@/lib/saju/types";

/** 결과 아래 "도리에게 더 물어보기" 칩. 눌러 보면 그 사람 사주 근거로 짧게 답해요. */
export function AskChips({ input }: { input: BirthInput }) {
  const [active, setActive] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inflight = useRef(false);

  async function ask(id: string) {
    setError(null);
    setActive(id);
    if (answers[id] || inflight.current) return;
    inflight.current = true;
    setLoading(id);
    try {
      const res = await fetch("/api/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...input, q: id }) });
      const data = (await res.json().catch(() => null)) as { answer?: string; error?: string } | null;
      if (!res.ok || !data?.answer) throw new Error(data?.error ?? "도리가 잠깐 물놀이하러 갔어요. 다시 눌러 볼래요?");
      const answer = data.answer;
      setAnswers((a) => ({ ...a, [id]: answer }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "답을 받지 못했어요.");
    } finally {
      inflight.current = false;
      setLoading(null);
    }
  }

  const current = active ? answers[active] : null;
  return (
    <section data-testid="ask-chips" aria-label="도리에게 더 물어보기" className="mt-6">
      <p className="text-sm font-bold text-gray-900">🦦 도리에게 더 물어보기</p>
      <p className="mt-0.5 text-xs text-gray-500">궁금한 걸 눌러 보세요. 내 사주 근거로 짧게 답해줄게요.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {ASK_QUESTIONS.map((q) => (
          <button
            key={q.id}
            type="button"
            onClick={() => void ask(q.id)}
            disabled={loading !== null}
            aria-pressed={active === q.id}
            className={`px-3 py-1.5 rounded-full text-xs border transition ${
              active === q.id ? "bg-brand-500 border-brand-500 text-white" : "bg-white border-brand-200 text-gray-800 hover:bg-brand-50"
            } disabled:opacity-60`}
          >
            {q.label}
          </button>
        ))}
      </div>
      <div role="status" aria-live="polite" className="mt-3">
        {loading && <p className="p-4 rounded-2xl bg-brand-50/60 border border-brand-100 text-sm text-gray-600">도리가 물결을 읽는 중이에요 🫧</p>}
        {!loading && current && <p data-testid="ask-answer" className="p-4 rounded-2xl bg-brand-50/60 border border-brand-100 text-sm text-gray-800 leading-relaxed whitespace-pre-line">{current}</p>}
        {!loading && error && <p className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800">{error}</p>}
      </div>
    </section>
  );
}
