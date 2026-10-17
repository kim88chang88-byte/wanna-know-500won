import type { ElementKind, PremiumReportView } from "@/lib/premium/types";

const ELEMENT_STYLE: Record<ElementKind, { bar: string; chip: string }> = {
  wood: { bar: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700" },
  fire: { bar: "bg-rose-500", chip: "bg-rose-50 text-rose-700" },
  earth: { bar: "bg-amber-500", chip: "bg-amber-50 text-amber-700" },
  metal: { bar: "bg-slate-400", chip: "bg-slate-100 text-slate-700" },
  water: { bar: "bg-sky-500", chip: "bg-sky-50 text-sky-700" },
  unknown: { bar: "bg-brand-500", chip: "bg-brand-50 text-brand-700" },
};

const CARD = "rounded-3xl bg-white border border-brand-100 p-5 sm:p-6 shadow-[0_8px_30px_rgba(34,94,170,0.08)]";
const H2 = "font-serifKr font-bold text-lg text-brand-700 mb-4";

export default function ManseReport({ report }: { report: PremiumReportView }) {
  const max = Math.max(1, ...report.elements.map((e) => e.count));

  return (
    <div data-testid="manse-report" className="space-y-6">
      <section aria-labelledby="pillars-h" className={CARD}>
        <h2 id="pillars-h" className={H2}>
          사주 원국
        </h2>
        <div className="grid grid-cols-4 gap-2 sm:gap-4">
          {report.pillars.map((p) => {
            const [stem, branch] = p.full ? Array.from(p.full) : [null, null];
            return (
              <div key={p.key} data-testid="pillar-card" className="rounded-2xl border border-brand-100 bg-brand-50/60 py-3 text-center">
                <div className="text-[11px] sm:text-xs font-bold text-brand-500">{p.label}</div>
                {p.full ? (
                  <>
                    <div className="font-serifKr font-black text-2xl sm:text-4xl text-brand-700 leading-tight mt-1" aria-label={`${p.label} ${p.full}`}>
                      <div>{stem}</div>
                      <div>{branch}</div>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">{p.reading}</div>
                    <div className="mt-1.5 text-[10px] sm:text-[11px] text-slate-500 leading-tight">
                      <div>{p.tenGodStem}</div>
                      <div>{p.tenGodBranch}</div>
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-slate-400 mt-3 mb-2">시간 미상</div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="elements-h" className={CARD}>
        <h2 id="elements-h" className={H2}>
          오행 분포
        </h2>
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
      </section>

      <section aria-labelledby="strength-h" className="rounded-3xl bg-gradient-to-br from-brand-50 to-white border border-brand-100 p-5 sm:p-6">
        <h2 id="strength-h" className={H2}>
          신강 · 신약
        </h2>
        <div data-testid="strength-box">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-brand-500 text-white font-bold text-sm px-4 py-1.5">{report.strength.grade}</span>
            <span className="text-xs text-slate-500">강도 점수 {report.strength.score}</span>
          </div>
          <dl className="mt-4 grid grid-cols-[4.5rem_1fr] gap-y-2 text-sm">
            <dt className="font-bold text-brand-600">격국</dt>
            <dd data-testid="geukguk" className="text-slate-700">
              {report.geukguk}
            </dd>
            <dt className="font-bold text-brand-600">용신</dt>
            <dd data-testid="yongsin" className="text-slate-700">
              {report.yongsin.length ? report.yongsin.join(" · ") : "-"}
            </dd>
            {report.gilsin.length > 0 && (
              <>
                <dt className="font-bold text-brand-600">길신</dt>
                <dd className="text-slate-700">{report.gilsin.join(", ")}</dd>
              </>
            )}
            {report.hyungsin.length > 0 && (
              <>
                <dt className="font-bold text-brand-600">흉신</dt>
                <dd className="text-slate-700">{report.hyungsin.join(", ")}</dd>
              </>
            )}
          </dl>
          {report.summary && <p className="mt-4 text-sm leading-relaxed text-slate-700 whitespace-pre-line">{report.summary}</p>}
          {report.hourUnknown && (
            <p data-testid="hour-unknown-note" className="mt-3 text-[11px] leading-relaxed text-amber-700">
              태어난 시간을 몰라 정오(12시)를 기준으로 계산했어요. 신강·신약, 격국, 용신은 태어난 시간에 따라 달라질 수 있어요.
            </p>
          )}
        </div>
      </section>

      {(report.daeun || report.seyun) && (
        <section aria-labelledby="flow-h" className={CARD}>
          <h2 id="flow-h" className={H2}>
            운의 흐름
          </h2>
          {report.seyun && (
            <p data-testid="seyun" className="mb-4 rounded-2xl bg-brand-50 border border-brand-100 px-4 py-3 text-sm text-slate-700">
              <span className="font-bold text-brand-700">{report.seyun.year}년</span> 세운 {report.seyun.ganzhi}
              <span className="text-slate-500"> ({report.seyun.tenGodStem} · {report.seyun.tenGodBranch})</span>
            </p>
          )}
          {report.daeun && (
            <>
              <p className="mb-2 text-xs text-slate-500">
                대운 {report.daeun.direction} · {report.daeun.startAge}세 시작
              </p>
              <ol className="grid grid-cols-5 gap-2">
                {report.daeun.list.map((d) => (
                  <li
                    key={d.age}
                    data-testid="daeun-item"
                    aria-current={d.current ? "true" : undefined}
                    className={`rounded-xl border py-2 text-center ${d.current ? "bg-brand-500 border-brand-500 text-white" : "bg-white border-brand-100 text-slate-700"}`}
                  >
                    <div className="font-serifKr font-bold text-base">{d.ganzhi}</div>
                    <div className={`text-[11px] ${d.current ? "text-white/80" : "text-slate-400"}`}>{d.age}세~</div>
                  </li>
                ))}
              </ol>
            </>
          )}
        </section>
      )}
    </div>
  );
}
