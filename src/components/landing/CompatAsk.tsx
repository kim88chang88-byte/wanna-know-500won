"use client";

import { useState } from "react";
import type { CompatView } from "@/lib/premium/types";

/*
 * 궁합용 "도리에게 더 물어보기". 이미 계산해 둔 결과(팁·흐름·성향)를 질문별로 꺼내 보여줘요.
 * 새로 AI 를 부르지 않아서 바로 답이 나오고 비용이 들지 않아요.
 */

interface Q {
  id: string;
  label: string;
  answer: string | null;
}

export function compatQuestions(c: CompatView): Q[] {
  const best = c.scores && c.scores.length ? [...c.scores].sort((a, b) => b.score - a.score)[0] : null;
  const marriage = [
    "사주만으로 결혼 여부를 정할 수는 없어요. 다만 두 사람의 흐름을 보면",
    best ? `‘${best.label}’ 쪽이 가장 든든한 강점이에요.` : "서로 맞는 구석이 분명히 있어요.",
    c.closing,
    "결혼처럼 큰 결정은 가치관, 돈, 생활 습관을 편안할 때 미리 이야기해 보는 게 가장 중요해요.",
  ].join(" ");
  return [
    { id: "marriage", label: "이 사람과 결혼해도 될까?", answer: marriage },
    { id: "fight", label: "싸운 뒤에 어떻게 풀까?", answer: c.tips?.[0]?.body ?? null },
    { id: "talk", label: "어떤 말투가 잘 통할까?", answer: c.tips?.[1]?.body ?? null },
    { id: "date", label: "함께하면 좋은 데이트는?", answer: c.tips?.[2]?.body ?? null },
    { id: "year", label: "올해 둘의 흐름은?", answer: c.timing?.[0]?.body ?? null },
    { id: "who", label: "상대는 어떤 사람이야?", answer: c.partnerTrait?.body ?? null },
  ].filter((q) => q.answer);
}

export default function CompatAsk({ compat }: { compat: CompatView }) {
  const qs = compatQuestions(compat);
  const [active, setActive] = useState<string | null>(null);
  const cur = qs.find((q) => q.id === active);
  if (qs.length === 0) return null;
  return (
    <section data-testid="compat-ask" aria-label="도리에게 더 물어보기" className="mt-3">
      <div className="flex flex-wrap gap-2">
        {qs.map((q) => (
          <button
            key={q.id}
            type="button"
            onClick={() => setActive(q.id === active ? null : q.id)}
            aria-pressed={q.id === active}
            className={`rounded-full border px-3 py-1.5 text-[12.5px] font-bold transition-colors ${q.id === active ? "border-brand-500 bg-brand-500 text-white" : "border-amber-200 bg-white text-gray-800 hover:bg-amber-50"}`}
          >
            {q.label}
          </button>
        ))}
      </div>
      {cur && (
        <p data-testid="compat-ask-answer" role="status" className="mt-3 rounded-xl bg-white px-3.5 py-3 text-[14px] leading-relaxed text-gray-800 break-keep">
          {cur.answer}
        </p>
      )}
    </section>
  );
}
