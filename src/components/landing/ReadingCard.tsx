import type { PublicReading } from "@/lib/ai/reading";

/** 점수(1~5)를 별 모양으로. 색에만 기대지 않게 숫자도 같이 적어요. */
function Stars({ score, luxe = false }: { score: number; luxe?: boolean }) {
  return (
    <span className={`whitespace-nowrap ${luxe ? "text-[#e6c887]" : "text-amber-400"}`} aria-label={`5점 만점에 ${score}점`}>
      {"★".repeat(score)}
      <span className={luxe ? "text-white/15" : "text-gray-200"}>{"★".repeat(5 - score)}</span>
    </span>
  );
}

/** 오늘 도리의 풀이: 키워드·총운·세 지표(연애/금전/마음)·도리가 본 이유를 한 카드에 모아 보여줘요. */
export function ReadingCard({ reading, luxe = false }: { reading: Pick<PublicReading, "keyword" | "total" | "indicators" | "reason">; luxe?: boolean }) {
  const shown = reading.indicators.filter((i) => i.comment);
  return (
    <section data-testid="reading-card" className={`mt-4 rounded-2xl border p-4 ${luxe ? "border-[#e6c887]/25 bg-white/[0.03] text-[#efe7d3]" : "border-brand-100 bg-white text-gray-800"}`}>
      <div className="flex items-center justify-between gap-2">
        <p className={`text-xs font-semibold ${luxe ? "text-[#e6c887]" : "text-brand-700"}`}>{luxe ? "◆ 오늘 도리의 풀이" : "🫧 오늘 도리의 풀이"}</p>
        <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${luxe ? "border-[#e6c887]/40 text-[#e6c887]" : "bg-brand-50 border-brand-100 text-brand-700"}`}>#{reading.keyword}</span>
      </div>
      <p className="mt-2 flex items-start gap-2 text-sm leading-relaxed">
        <span className="shrink-0 text-xs pt-0.5">
          <Stars score={reading.total.score} luxe={luxe} />
        </span>
        <span data-testid="reading-total">{reading.total.summary}</span>
      </p>
      {shown.length > 0 && (
        <ul data-testid="reading-indicators" className="mt-3 space-y-2">
          {shown.map((i) => (
            <li key={i.key} className={`rounded-xl border px-3 py-2 ${luxe ? "bg-white/[0.04] border-[#e6c887]/20" : "bg-brand-50/50 border-brand-100"}`}>
              <p className={`flex items-center justify-between text-xs font-bold ${luxe ? "text-[#e6c887]" : "text-gray-700"}`}>
                <span>{i.label}</span>
                <Stars score={i.score} luxe={luxe} />
              </p>
              <p className={`mt-1 text-[13px] leading-relaxed ${luxe ? "text-[#efe7d3]" : "text-gray-700"}`}>{i.comment}</p>
            </li>
          ))}
        </ul>
      )}
      {reading.reason && (
        <div data-testid="reading-reason" className={`mt-3 border-t pt-3 text-sm leading-relaxed ${luxe ? "border-[#e6c887]/20" : "border-brand-100"}`}>
          <p className={`text-xs font-semibold mb-1 ${luxe ? "text-[#e6c887]" : "text-brand-700"}`}>🔎 도리가 본 이유</p>
          {reading.reason}
        </div>
      )}
    </section>
  );
}
