import type { ElementKind, ManseReportView } from "@/lib/sazu/types";

const ELEMENT_STYLE: Record<ElementKind, { bar: string; chip: string }> = {
  wood: { bar: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700" },
  fire: { bar: "bg-rose-500", chip: "bg-rose-50 text-rose-700" },
  earth: { bar: "bg-amber-500", chip: "bg-amber-50 text-amber-700" },
  metal: { bar: "bg-slate-400", chip: "bg-slate-100 text-slate-700" },
  water: { bar: "bg-sky-500", chip: "bg-sky-50 text-sky-700" },
  unknown: { bar: "bg-brand-500", chip: "bg-brand-50 text-brand-700" },
};

export default function ManseReport({ report }: { report: ManseReportView }) {
  const max = Math.max(1, ...report.elements.map((e) => e.count));

  return (
    <div data-testid="manse-report" className="space-y-6">
      <section aria-labelledby="pillars-h" className="rounded-3xl bg-white border border-brand-100 p-5 sm:p-6 shadow-[0_8px_30px_rgba(34,94,170,0.08)]">
        <h2 id="pillars-h" className="font-serifKr font-bold text-lg text-brand-700 mb-4">
          사주 원국
        </h2>
        <div className="grid grid-cols-4 gap-2 sm:gap-4">
          {report.pillars.map((p) => {
            const [stem, branch] = p.full ? Array.from(p.full) : [null, null];
            return (
              <div key={p.key} data-testid="pillar-card" className="rounded-2xl border border-brand-100 bg-brand-50/60 py-3 text-center">
                <div className="text-[11px] sm:text-xs font-bold text-brand-500">{p.label}</div>
                {p.full ? (
                  <div className="font-serifKr font-black text-2xl sm:text-4xl text-brand-700 leading-tight mt-1" aria-label={`${p.label} ${p.full}`}>
                    <div>{stem}</div>
                    <div>{branch}</div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 mt-3 mb-2">시간 미상</div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="elements-h" className="rounded-3xl bg-white border border-brand-100 p-5 sm:p-6 shadow-[0_8px_30px_rgba(34,94,170,0.08)]">
        <h2 id="elements-h" className="font-serifKr font-bold text-lg text-brand-700 mb-4">
          오행 분포
        </h2>
        {report.elements.length === 0 ? (
          <p className="text-sm text-slate-500">오행 정보를 불러오지 못했어요.</p>
        ) : (
          <ul className="space-y-3">
            {report.elements.map((e) => (
              <li key={e.name} data-testid="element-row" className="flex items-center gap-3">
                <span className={`w-12 shrink-0 text-center text-xs font-bold rounded-full py-1 ${ELEMENT_STYLE[e.kind].chip}`}>{e.name}</span>
                <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden" role="img" aria-label={`${e.name} ${e.count}`}>
                  <div className={`h-full rounded-full ${ELEMENT_STYLE[e.kind].bar}`} style={{ width: `${(e.count / max) * 100}%` }} />
                </div>
                <span className="w-8 text-right text-sm font-bold text-slate-700 tabular-nums">{e.count}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="strength-h" className="rounded-3xl bg-gradient-to-br from-brand-50 to-white border border-brand-100 p-5 sm:p-6">
        <h2 id="strength-h" className="font-serifKr font-bold text-lg text-brand-700 mb-3">
          신강 · 신약
        </h2>
        {report.strength ? (
          <div data-testid="strength-box">
            <div className="inline-block rounded-full bg-brand-500 text-white font-bold text-sm px-4 py-1.5">{report.strength.grade}</div>
            {report.strength.analysis && <p className="mt-3 text-sm leading-relaxed text-slate-700 whitespace-pre-line">{report.strength.analysis}</p>}
          </div>
        ) : (
          <p className="text-sm text-slate-500">신강·신약 정보를 불러오지 못했어요.</p>
        )}
      </section>
    </div>
  );
}
