import type { CompatPerson, CompatView, ElementKind } from "@/lib/premium/types";

const BAR: Record<ElementKind, string> = {
  wood: "bg-emerald-400",
  fire: "bg-rose-400",
  earth: "bg-amber-400",
  metal: "bg-slate-400",
  water: "bg-sky-400",
  unknown: "bg-brand-400",
};

function PersonBox({ p }: { p: CompatPerson }) {
  const max = Math.max(1, ...p.elements.map((e) => e.count));
  return (
    <div className="flex-1 min-w-0 rounded-2xl bg-white/85 border border-pink-100 px-3 py-3 text-center">
      <div className="text-[11px] font-bold text-pink-600">{p.label}</div>
      <div className="mt-1 font-cute text-2xl leading-none text-gray-900">{p.dayPillar ?? "?"}</div>
      <div className="text-[11px] text-slate-500 mt-1">{p.dayReading ? `${p.dayReading} 일주` : "일주"}</div>
      <div className="mt-2.5 space-y-1" aria-label={`${p.label}의 오행`}>
        {p.elements.map((e) => (
          <div key={e.name} className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <span className="w-3 shrink-0">{e.name}</span>
            <span className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
              <span className={`block h-full rounded-full ${BAR[e.kind]}`} style={{ width: `${(e.count / max) * 100}%` }} />
            </span>
            <span className="w-3 shrink-0 text-right">{e.count}</span>
          </div>
        ))}
      </div>
      {p.hourUnknown && <div className="mt-2 text-[10px] text-slate-400">태어난 시간을 몰라 시주는 뺐어요</div>}
    </div>
  );
}

/** 두 사람의 궁합 결과. 궁합 리포트에서만 나와요. */
export default function CompatCard({ compat }: { compat: CompatView }) {
  return (
    <section
      aria-labelledby="compat-h"
      data-testid="compat-card"
      className="rounded-3xl bg-gradient-to-br from-pink-50 via-white to-violet-50 border border-pink-100 p-5 sm:p-6 shadow-[0_8px_30px_rgba(236,120,190,0.12)]"
    >
      <h2 id="compat-h" className="font-cute font-normal text-xl text-brand-700">
        <span aria-hidden="true">💞</span> 우리 둘의 궁합
      </h2>

      <div className="mt-3 flex items-stretch gap-2">
        <PersonBox p={compat.me} />
        <div className="flex items-center text-xl text-pink-400" aria-hidden="true">
          ♡
        </div>
        <PersonBox p={compat.partner} />
      </div>

      <div className="mt-4 text-center">
        <div data-testid="compat-score" className="inline-flex items-baseline gap-1 rounded-full bg-white border border-pink-100 px-4 py-1.5">
          <span className="text-[11px] font-bold text-pink-600">도리 궁합 지수</span>
          <span className="font-cute text-2xl text-brand-700">{compat.score}</span>
          <span className="text-[11px] text-slate-400">/ 100</span>
        </div>
        <p data-testid="compat-headline" className="mt-2 font-cute font-normal text-base leading-snug text-slate-800">
          {compat.headline}
        </p>
      </div>

      <ul className="mt-4 space-y-2.5">
        {compat.points.map((pt) => (
          <li
            key={pt.title}
            data-testid="compat-point"
            className={`rounded-2xl px-4 py-3 border ${pt.tone === "good" ? "bg-white/90 border-pink-100" : "bg-violet-50/70 border-violet-100"}`}
          >
            <div className={`text-xs font-bold ${pt.tone === "good" ? "text-pink-600" : "text-violet-600"}`}>
              {pt.tone === "good" ? "💗 잘 맞는 점" : "🌱 맞춰 가면 좋은 점"} · {pt.title}
            </div>
            <p className="mt-1 text-sm leading-relaxed text-slate-700">{pt.body}</p>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-sm leading-relaxed text-slate-700 text-center">{compat.closing}</p>
      <p className="mt-3 text-[11px] text-slate-400 text-center">
        * 궁합 지수는 재미로 보는 참고 점수예요. 두 사람의 관계를 정하지 않아요.
      </p>
    </section>
  );
}
