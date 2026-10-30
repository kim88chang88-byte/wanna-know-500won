"use client";

import { PREVIEW_OPEN_PAGES } from "@/lib/premium/config";
import ConcernCard from "./ConcernCard";
import { josa } from "@/lib/premium/josa";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { checkMessage } from "@/lib/premium/book/resonance";
import type { BookChart, BookPage, BookRow, BookTable, ElementKind, PremiumReportView, RealityCheck } from "@/lib/premium/types";
import { ELEMENT_BOX, EL_LABEL, elementOfChar, elName } from "@/lib/elementColor";
import { formatWon } from "@/lib/premium/book/charts";

/*
 * 프리미엄 20페이지 리포트 리더. 한 번에 한 페이지씩 넘겨 보는 고급스러운 책 형태예요.
 * 색: 미드나잇 + 샴페인 골드. 글씨는 항상 충분히 밝은 대비를 유지해요.
 */

const BAR: Record<ElementKind, string> = {
  wood: "bg-emerald-400",
  fire: "bg-rose-400",
  earth: "bg-amber-400",
  metal: "bg-slate-300",
  water: "bg-sky-400",
  unknown: "bg-amber-300",
};

const GOLD = "text-[#e6c887]";
const HAIR = "border-[#e6c887]/25";

/** "나와 비슷해요"를 눌러 확인해 보는 목록. 누른 개수에 따라 한마디가 나와요. (저장하지 않고 화면에서만 써요) */
/** AI 가 쓴 장은 문단(빈 줄)과 "- " 목록, **굵은 핵심**이 들어 있어요. 일반 문장은 그대로 한 문단이에요. */
function bold(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((t, i) =>
    t.startsWith("**") && t.endsWith("**") && t.length > 4 ? (
      <strong key={i} className="font-bold text-[#1d1a30] bg-[linear-gradient(transparent_62%,#f1d98e_62%)]">{t.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{t}</span>
    ),
  );
}

function RichBody({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="mt-1.5 space-y-3 text-[15px] leading-[1.85] text-[#322f47] [word-break:keep-all]">
      {blocks.map((b, i) => {
        const lines = b.split("\n").map((l) => l.trim()).filter(Boolean);
        if (lines.length > 0 && lines.every((l) => l.startsWith("- "))) {
          return (
            <ul key={i} className="list-disc space-y-1.5 pl-5">
              {lines.map((l, j) => (
                <li key={j}>{bold(l.slice(2))}</li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{bold(lines.join(" "))}</p>;
      })}
    </div>
  );
}

function CheckList({ items }: { items: string[] }) {
  const [on, setOn] = useState<boolean[]>(() => items.map(() => false));
  const hit = on.filter(Boolean).length;
  const touched = hit > 0;
  return (
    <div data-testid="book-checks" className="mt-2.5 space-y-2">
      {items.map((t, i) => (
        <button
          key={i}
          type="button"
          aria-pressed={on[i]}
          onClick={() => setOn((p) => p.map((v, j) => (j === i ? !v : v)))}
          className={`flex w-full items-start gap-2.5 rounded-xl border px-3.5 py-3 text-left text-[13.5px] leading-relaxed transition-colors ${
            on[i] ? "border-[#b98a2f] bg-[#f1d98e]/50 text-[#1d1a30]" : "border-[#9a93b0]/50 bg-white/60 text-[#322f47] hover:border-[#b98a2f]"
          }`}
        >
          <span
            aria-hidden="true"
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-black ${on[i] ? "border-[#b98a2f] bg-[#b98a2f] text-white" : "border-[#9a93b0] text-transparent"}`}
          >
            ✓
          </span>
          <span>{t}</span>
        </button>
      ))}
      <p role="status" data-testid="book-checks-result" className="min-h-[1.25rem] pt-0.5 text-[12.5px] font-bold text-[#8a5f12]">
        {touched ? `${items.length}개 중 ${hit}개가 나와 비슷해요. ${checkMessage(hit, items.length)}` : ""}
      </p>
    </div>
  );
}

/** 사주가 보여 준 흐름과 지금 내 현실을 견줘 보는 세 갈래. 어느 쪽이든 응원으로 마무리해요. */
function RealityPick({ rc }: { rc: RealityCheck }) {
  const [pick, setPick] = useState<number | null>(null);
  return (
    <div data-testid="book-reality" className="mt-4 rounded-xl border border-[#9a93b0]/50 bg-white/60 px-4 py-3.5">
      <p className="text-[13px] font-bold text-[#8a5f12]">🔎 지금 내 현실과 견줘 보기</p>
      <p className="mt-1 text-[13px] leading-relaxed text-[#322f47]">{rc.question}</p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {rc.options.map((o, i) => (
          <button
            key={o.label}
            type="button"
            aria-pressed={pick === i}
            onClick={() => setPick(i)}
            className={`rounded-full border px-3.5 py-1.5 text-[12.5px] font-bold transition-colors ${
              pick === i ? "border-[#b98a2f] bg-[#b98a2f] text-white" : "border-[#9a93b0] text-[#322f47] hover:border-[#b98a2f]"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <p role="status" data-testid="book-reality-result" className="min-h-[1.25rem] pt-2.5 text-[13.5px] leading-relaxed text-[#1d1a30]">
        {pick !== null ? rc.options[pick].message : ""}
      </p>
    </div>
  );
}

/** 이 풀이를 어떤 계산에서 가져왔는지 접어서 보여줘요. */
function Evidence({ rows }: { rows: BookRow[] }) {
  return (
    <details data-testid="book-evidence" className="mt-6 rounded-xl border border-[#e6c887]/25 bg-white/[0.03] px-4 py-3 text-[13px] text-[#efe7d3]">
      <summary className="cursor-pointer select-none font-bold text-[#e6c887]">이 풀이의 근거 보기</summary>
      <ul className="mt-2.5 space-y-1.5">
        {rows.map((r, i) => (
          <li key={`${r.label}-${i}`} className="flex gap-3 leading-snug">
            <span className="w-24 shrink-0 text-[#e8dfca]/70">{r.label}</span>
            <span>{r.value}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2.5 text-[11.5px] leading-relaxed text-[#e8dfca]/60">입력하신 생년월일시로 계산한 값이에요. 풀이는 재미와 참고용이에요.</p>
    </details>
  );
}

function Table({ t }: { t: BookTable }) {
  return (
    <div className="mt-6">
      <h4 className={`text-[11px] font-bold tracking-[0.18em] ${GOLD} mb-2`}>{t.title}</h4>
      <ul className={`divide-y divide-[#e6c887]/15 rounded-2xl border ${HAIR} bg-white/[0.03]`}>
        {t.rows.map((row, i) => (
          <li key={`${row.label}-${i}`} data-testid="book-row" className={`flex gap-3 px-4 py-2.5 text-[13px] leading-snug ${row.highlight ? "bg-[#e6c887]/10" : ""}`}>
            <span className={`w-[5.2rem] shrink-0 font-bold ${row.highlight ? "text-[#f6dfa8]" : "text-[#e8dfca]/70"}`}>{row.label}</span>
            <span className="flex-1 text-[#f5efe0]">
              {row.locked ? (
                <span data-testid="locked-row" className="select-none blur-[5px]" aria-hidden="true">
                  {row.value}
                </span>
              ) : (
                row.value
              )}
              {row.locked && <span className="sr-only">잠긴 칸이에요</span>}
              {row.note && (
                <span className={`ml-2 text-[11px] text-[#e6c887] ${row.locked ? "select-none blur-[4px]" : ""}`} aria-hidden={row.locked ? "true" : undefined}>
                  {row.note}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 나이(대운)별 기운 흐름 그래프. 점이 높을수록 그 시기에 그 기운이 힘을 받아요. (상대 지수) */
function LifeChart({ chart }: { chart: BookChart }) {
  const W = 320;
  const H = 176;
  const padX = 14;
  const top = 26;
  const bottom = 34;
  const n = chart.points.length;
  const x = (i: number) => padX + (i * (W - padX * 2)) / Math.max(1, n - 1);
  const asset = chart.mode === "asset";
  const val = (p: BookChart["points"][number]) => (asset ? (p.amount ?? 0) : p.value);
  const maxV = asset ? Math.max(1, ...chart.points.map((p) => p.amount ?? 0)) : 100;
  const y = (v: number) => top + (1 - v / maxV) * (H - top - bottom);
  const open = chart.points.map((p, i) => ({ p, i })).filter((q) => !q.p.locked);
  const lastOpen = open.length ? open[open.length - 1].i : -1;
  const line = open.map((q, k) => `${k === 0 ? "M" : "L"}${x(q.i).toFixed(1)} ${y(val(q.p)).toFixed(1)}`).join(" ");
  const last = open[open.length - 1];
  const area = open.length > 1 ? `${line} L${x(last.i).toFixed(1)} ${(H - bottom).toFixed(1)} L${x(open[0].i).toFixed(1)} ${(H - bottom).toFixed(1)} Z` : "";
  return (
    <div data-testid="life-chart">
      <p className={`text-[12px] font-bold tracking-[0.12em] ${GOLD}`}>{chart.title}</p>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={chart.title} className="mt-2 w-full">
        <defs>
          <linearGradient id="lifeArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e6c887" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#e6c887" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[25, 50, 75].map((g) => (
          <line key={g} x1={padX} x2={W - padX} y1={y((g / 100) * maxV)} y2={y((g / 100) * maxV)} stroke="#ffffff" strokeOpacity="0.1" strokeDasharray="3 4" />
        ))}
        {area && <path d={area} fill="url(#lifeArea)" />}
        {line && <path d={line} fill="none" stroke="#e6c887" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}
        {chart.points.map((p, i) => (
          <g key={i}>
            {p.locked ? (
              <>
                <circle cx={x(i)} cy={y(40)} r="4" fill="none" stroke="#ffffff" strokeOpacity="0.35" strokeDasharray="2 2" />
                <text x={x(i)} y={y(40) - 8} textAnchor="middle" fontSize="9" fill="#ffffff" fillOpacity="0.5">🔒</text>
              </>
            ) : (
              <>
                <circle cx={x(i)} cy={y(val(p))} r={p.current ? 5.5 : p.peak ? 5 : 3.2} fill={p.peak === 1 ? "#f6dfa8" : p.current ? "#ffffff" : "#e6c887"} stroke={p.current ? "#e6c887" : "none"} strokeWidth="2" />
                {p.current && (
                  <text x={x(i)} y={y(val(p)) - 10} textAnchor="middle" fontSize="10" fontWeight="700" fill="#ffffff">지금</text>
                )}
                {p.peak && !p.current && (
                  <text x={x(i)} y={y(val(p)) - 9} textAnchor="middle" fontSize="10" fontWeight="700" fill="#f6dfa8">{p.peak === 1 ? "★" : "☆"}</text>
                )}
                {asset && (p.current || p.peak === 1 || i === lastOpen) && (
                  <text x={Math.min(Math.max(x(i), 26), W - 26)} y={y(val(p)) + (p.current || p.peak ? 17 : -9)} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#f3e7c9">{formatWon(p.amount ?? 0)}</text>
                )}
              </>
            )}
            <text x={x(i)} y={H - 16} textAnchor="middle" fontSize="9.5" fill="#e8dfca" fillOpacity="0.85">{p.age}</text>
          </g>
        ))}
        <text x={W - padX} y={H - 3} textAnchor="end" fontSize="9" fill="#e8dfca" fillOpacity="0.6">{asset ? "나이(세, 대운 시작 기준) · 세로: 가상 누적 자산" : "나이(세, 대운 시작 기준)"}</text>
      </svg>
      <ul className="mt-2 space-y-1">
        {chart.callouts.map((c) => (
          <li key={c.label} className="text-[12.5px] leading-relaxed text-[#f5efe0]">
            <span className={`font-bold ${GOLD}`}>{c.label}</span> · {c.text}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] leading-relaxed text-[#e8dfca]/60">{chart.caption}</p>
    </div>
  );
}

function Visual({ page, report }: { page: BookPage; report: PremiumReportView }) {
  if (page.chart) return <LifeChart chart={page.chart} />;
  const max = Math.max(1, ...report.elements.map((e) => e.count));
  switch (page.key) {
    case "pillars":
      return (
        <div className="mb-6">
          <div className="grid grid-cols-4 gap-2">
            {report.pillars.map((p) => {
              const [stem, branch] = p.full ? Array.from(p.full) : [null, null];
              return (
                <div key={p.key} data-testid="pillar-card" className={`rounded-2xl border ${HAIR} bg-white/[0.04] py-3 text-center`}>
                  <div className={`text-[11px] font-bold ${GOLD}`}>{p.label}</div>
                  {p.full ? (
                    <>
                      <div className="mt-1.5 space-y-1 px-1.5 font-serifKr font-black text-3xl leading-tight" aria-label={`${p.label} ${p.full}`}>
                        {[
                          { ch: stem, el: elementOfChar(stem, false) },
                          { ch: branch, el: elementOfChar(branch, true) },
                        ].map((c, n) => (
                          <div key={n} className={`relative rounded-xl pb-1 pt-4 ${ELEMENT_BOX[c.el ?? "earth"]}`}>
                            {c.el && (
                              <span data-testid="element-chip" className="absolute right-1 top-1 whitespace-nowrap rounded-full bg-black/15 px-1.5 py-px font-sans text-[9px] font-bold leading-tight">
                                {EL_LABEL[c.el].icon} {EL_LABEL[c.el].name}
                              </span>
                            )}
                            {c.ch}
                          </div>
                        ))}
                      </div>
                      <div className="mt-1 text-[11px] text-[#e8dfca]/70">{p.reading}</div>
                      <div className="mt-1.5 text-[10px] text-[#e8dfca]/60 leading-tight">
                        <div>{p.tenGodStem}</div>
                        <div>{p.tenGodBranch}</div>
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-[#e8dfca]/50 mt-3 mb-2">시간 미상</div>
                  )}
                </div>
              );
            })}
          </div>
          {report.hourUnknown && (
            <p data-testid="hour-unknown-note" className="mt-3 text-[11px] leading-relaxed text-[#e6c887]">
              태어난 시간을 몰라 정오(12시)를 기준으로 계산했어요. 신강·신약, 격국, 용신은 태어난 시간에 따라 달라질 수 있어요.
            </p>
          )}
        </div>
      );
    case "c-overview":
      return report.compat ? (
        <div data-testid="compat-pair" className="mb-6">
          <div className="flex items-center gap-2">
            {[report.compat.me, report.compat.partner].flatMap((p, k) => [
              k === 1 ? (
                <div key="heart" aria-hidden="true" className="text-2xl text-[#e6c887]">
                  ♡
                </div>
              ) : null,
              <div key={p.label} className={`flex-1 rounded-2xl border ${HAIR} bg-white/[0.04] py-4 text-center`}>
                <div className={`text-[11px] font-bold ${GOLD}`}>{p.label}</div>
                <div className="mt-1 font-serifKr font-black text-3xl leading-tight text-[#fbf3de]" aria-label={`${p.label}의 일주 ${p.dayPillar ?? ""}`}>
                  {p.dayPillar ? Array.from(p.dayPillar).map((ch, n) => <div key={n}>{ch}</div>) : "?"}
                </div>
                <div className="mt-1 text-[11px] text-[#e8dfca]/70">{p.dayReading ? `${p.dayReading} 일주` : ""}</div>
              </div>,
            ])}
          </div>
          <div data-testid="compat-score" className="mt-4 text-center">
            <span className={`text-[11px] font-bold tracking-[0.2em] ${GOLD}`}>도리 궁합 지수</span>
            <div className="mt-1 font-serifKr font-black text-5xl text-[#fbf3de] tabular-nums">
              {report.compat.score}
              <span className="text-base font-bold text-[#e8dfca]/60"> / 100</span>
            </div>
            <div className="mx-auto mt-3 h-2 max-w-[16rem] rounded-full bg-white/10 overflow-hidden" role="img" aria-label={`궁합 지수 ${report.compat.score}점`}>
              <div className="h-full rounded-full bg-gradient-to-r from-[#f0d9a0] to-[#d3ac62]" style={{ width: `${report.compat.score}%` }} />
            </div>
            <p className="mt-3 text-[12px] text-[#e8dfca]/60">재미로 보는 참고 점수예요</p>
          </div>
        </div>
      ) : null;
    case "c-elements":
      return report.compat ? (
        <div data-testid="compat-elements" className="mb-6">
          <div className="mb-2 flex justify-end gap-3 text-[11px] text-[#e8dfca]/70">
            <span>
              <span aria-hidden="true" className="mr-1 inline-block h-2 w-2 rounded-full bg-[#e6c887]" />나
            </span>
            <span>
              <span aria-hidden="true" className="mr-1 inline-block h-2 w-2 rounded-full bg-pink-300" />상대
            </span>
          </div>
          <ul className="space-y-3">
            {report.compat.me.elements.map((e) => {
              const o = report.compat?.partner.elements.find((x) => x.name === e.name)?.count ?? 0;
              const top = Math.max(1, ...report.compat!.me.elements.map((x) => x.count), ...report.compat!.partner.elements.map((x) => x.count));
              return (
                <li key={e.name} data-testid="compat-element-row" className="flex items-center gap-3">
                  <span className={`w-10 shrink-0 text-center text-xs font-bold rounded-full py-1 border ${HAIR} ${GOLD}`}>{elName(e.name)}</span>
                  <div className="flex-1 space-y-1" role="img" aria-label={`${elName(e.name)} 나 ${e.count} 상대 ${o}`}>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full bg-[#e6c887]" style={{ width: `${(e.count / top) * 100}%` }} />
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full bg-pink-300" style={{ width: `${(o / top) * 100}%` }} />
                    </div>
                  </div>
                  <span className="w-12 text-right text-xs font-bold text-[#f5efe0] tabular-nums">
                    {e.count} · {o}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null;
    case "nature":
      return (
        <div data-testid="strength-box" className="mb-6 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#e6c887] text-[#1b1824] font-bold text-sm px-4 py-1.5">{report.strength.grade}</span>
          <span className="text-xs text-[#e8dfca]/70">강도 점수 {report.strength.score}</span>
        </div>
      );
    case "elements":
      return (
        <ul className="mb-6 space-y-3">
          {report.elements.map((e) => (
            <li key={e.name} data-testid="element-row" className="flex items-center gap-3">
              <span className={`w-10 shrink-0 text-center text-xs font-bold rounded-full py-1 border ${HAIR} ${GOLD}`}>{elName(e.name)}</span>
              <div className="flex-1 h-2.5 rounded-full bg-white/10 overflow-hidden" role="img" aria-label={`${elName(e.name)} ${e.count}`}>
                <div className={`h-full rounded-full ${BAR[e.kind]}`} style={{ width: `${(e.count / max) * 100}%` }} />
              </div>
              <span className="w-6 text-right text-sm font-bold text-[#f5efe0] tabular-nums">{e.count}</span>
            </li>
          ))}
        </ul>
      );
    case "geukguk":
      return (
        <dl className="mb-6 grid grid-cols-[4rem_1fr] gap-y-2 text-sm">
          <dt className={`font-bold ${GOLD}`}>격국</dt>
          <dd data-testid="geukguk" className="text-[#f5efe0]">
            {report.geukguk}
          </dd>
          <dt className={`font-bold ${GOLD}`}>용신</dt>
          <dd data-testid="yongsin" className="text-[#f5efe0]">
            {report.locked ? (
              <>
                <span className="select-none blur-[5px]" aria-hidden="true">
                  丙(병) · 癸(계)
                </span>
                <span className="sr-only">잠긴 칸이에요</span>
              </>
            ) : report.yongsin.length ? (
              report.yongsin.join(" · ")
            ) : (
              "-"
            )}
          </dd>
        </dl>
      );
    case "daeun":
      return report.daeun ? (
        <div className="mb-6">
          <p className="mb-2 text-xs text-[#e8dfca]/70">
            대운 {report.daeun.direction} · {report.daeun.startAge}세 시작
          </p>
          <ol className="grid grid-cols-5 gap-2">
            {report.daeun.list.map((d) => (
              <li key={d.age} data-testid="daeun-item" aria-current={d.current ? "true" : undefined} className={`rounded-xl border py-2 text-center ${d.current ? "bg-[#e6c887] border-[#e6c887] text-[#1b1824]" : `${HAIR} bg-white/[0.04] text-[#f5efe0]`}`}>
                <div className="font-serifKr font-bold text-base">{d.ganzhi}</div>
                <div className={`text-[11px] ${d.current ? "text-[#1b1824]/70" : "text-[#e8dfca]/60"}`}>{d.age}세~</div>
              </li>
            ))}
          </ol>
        </div>
      ) : null;
    case "years":
      return report.seyun ? (
        <p data-testid="seyun" className={`mb-6 rounded-2xl border ${HAIR} bg-white/[0.04] px-4 py-3 text-sm text-[#f5efe0]`}>
          <span className={`font-bold ${GOLD}`}>{report.seyun.year}년</span> 세운 {report.seyun.ganzhi}
          <span className="text-[#e8dfca]/60"> ({report.seyun.tenGodStem} · {report.seyun.tenGodBranch})</span>
        </p>
      ) : null;
    default:
      return null;
  }
}

/** 리포트마다 한 동물만 나와요: 성공 재물 = 용, 연애 결혼 = 토끼, 그 밖(궁합 등) = 수달 */
type Mascot = "dragon" | "rabbit" | "otter";
function mascotOf(report: PremiumReportView): Mascot {
  if (report.compat) return "otter";
  const k = report.topic.key;
  if (k === "money" || k === "success") return "dragon";
  if (k === "love" || k === "marriage") return "rabbit";
  return "otter";
}
const MASCOT_EMOJI: Record<Mascot, string> = { dragon: "🐉", rabbit: "🐰", otter: "🦦" };
const avatarOf = (m: Mascot) => `/images/animal-${m}.webp`;
const sceneOf = (m: Mascot) => `/images/premium-scene-${m}.webp`;

/** "제7장 · 재물운" → 작은 글씨 "제 7 장", 큰 제목 "재물운", 부제 */
function titleParts(title: string): { small: string; main: string; sub: string } {
  if (!title.includes(" · ")) return { small: "", main: title, sub: "" };
  const [pre, rest = ""] = title.split(" · ");
  const small = pre.replace(/제(\d+)장/, "제 $1 장").replace("서문", "서 문").replace("부록", "부 록");
  const [a, b] = rest.split(" - ");
  return b ? { small, main: b, sub: a } : { small, main: a, sub: "" };
}

/** 맨 앞 "먼저 결론부터" 쪽의 도리 말풍선(고정 문구) */
export const openingBubble = (name?: string | null) => `안녕하세요, ${name ? `${name}님, ` : ""}너무 반가워요! ${OPENING_BODY}`;
const OPENING_BODY = "도리사주는 다른 사주 서비스와는 다르게 빙빙 돌려 말하지 않고 핵심 결론부터 먼저 말씀드리는 차별점이 있어요. 자, 그럼 지금부터 당신의 고민을 어떻게 해결하면 좋을지 그 해답을 알아볼까요?";

const BUBBLE =
  "relative max-w-[78%] rounded-[22px] border-2 border-[#20203a] bg-[#fffdf7] px-4 py-3.5 text-[15px] font-medium leading-[1.55] text-[#26233a] after:absolute after:bottom-3.5 after:h-3.5 after:w-3.5 after:bg-[#fffdf7] after:content-['']";

/** 도리와 친구의 말풍선 한 줄. right 면 오른쪽에 그림이 와요. */
function BubbleRow({ text, img, right = false }: { text: string; img: string; right?: boolean }) {
  return (
    <div className={`flex items-end gap-2.5 ${right ? "flex-row-reverse" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img} alt="" width={84} height={84} className="h-[84px] w-[84px] shrink-0 object-contain" />
      <p
        className={`${BUBBLE} ${
          right
            ? "after:-right-[9px] after:rotate-[-135deg] after:border-b-2 after:border-l-2 after:border-[#20203a]"
            : "after:-left-[9px] after:rotate-45 after:border-b-2 after:border-l-2 after:border-[#20203a]"
        }`}
      >
        {text}
      </p>
    </div>
  );
}

/** 장 표지: 큰 장면 위에 장 제목, 아래에 도리의 한마디 */
function ChapterCover({ page, mascot }: { page: BookPage; mascot: Mascot }) {
  const t = titleParts(page.title);
  return (
    <section data-testid="chapter-cover" aria-label={`${page.title} 표지`} className="relative flex aspect-[3/4] flex-col justify-start overflow-hidden rounded-[14px] bg-gradient-to-b from-[#0b0e22] to-[#1d2350] px-5 pt-7">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={sceneOf(mascot)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b0e22]/80 via-transparent to-[#0b0e22]/55" />
      <div className="relative z-[1] text-center">
        <small className="block text-[13px] tracking-[0.3em] text-[#e6c887]">{t.small}</small>
        <b className="mt-2 block font-serifKr text-[30px] leading-tight text-[#fbf3de]">{t.main}</b>
        {t.sub && <span className="mt-1.5 block text-[13px] text-[#e8dfca]">{t.sub}</span>}
        <i className="mx-auto mt-2.5 block h-px w-24 bg-[#e6c887]/70" />
      </div>
    </section>
  );
}

const NEXT_PRODUCTS = [
  { t: "올해 월별 운세 한눈에", d: "달마다 조심할 일과 기회를 짚어드려요", h: "/" },
  { t: "궁합이 궁금하다면", d: "둘의 사주를 겹쳐 보는 500원 풀이", h: "/" },
  { t: "요즘 고민, 한 가지만 콕", d: "500원으로 고민에 맞춘 한 줄 답을 받아요", h: "/" },
];

/** 장 끝: 다음 장 예고(말풍선 박스). 다음 상품 배너는 결과 맨 끝(별점 후기 위)에 한 번만 보여요. */
function ChapterEnd({ cur, next }: { cur: BookPage; next?: BookPage }) {
  if (!next) return null;
  const here = titleParts(cur.title).main;
  const there = titleParts(next.title).main;
  return (
    <div className="mt-9 flex flex-col items-center gap-4">
      <div data-testid="next-teaser" className="border-2 border-[#20203a] bg-[#fffdf7] px-[18px] py-3 text-center text-[15px] font-bold leading-[1.5] text-[#26233a] shadow-[4px_4px_0_#b98a2f]">
        지금까지 ‘{here}’{josa(here, "을/를").slice(here.length)} 살펴봤어요.
        <br />
        다음 장에서는 ‘{there}’{josa(there, "을/를").slice(there.length)} 함께 볼게요!
      </div>
    </div>
  );
}

/** 프리미엄 결과 맨 끝, 별점 후기 바로 위에 한 번 나오는 다음 상품 배너. 궁합 리포트에서는 궁합 대신 다른 상품을 보여요. */
export function NextProductBanner({ report }: { report: PremiumReportView }) {
  const prod = report.compat ? NEXT_PRODUCTS[0] : NEXT_PRODUCTS[1];
  const mascot = mascotOf(report);
  return (
    <a
      href={prod.h}
      data-testid="next-product-banner"
      className="mt-6 flex w-full items-center gap-3 rounded-2xl bg-gradient-to-r from-[#f0d9a0] to-[#d3ac62] px-4 py-3.5 text-[#1b1824] transition-transform active:scale-[0.99]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={avatarOf(mascot)} alt="" width={44} height={44} className="h-11 w-11 shrink-0 object-contain" />
      <span className="flex-1">
        <span className="block text-[10px] font-bold tracking-widest opacity-70">다음 상품</span>
        <span className="block text-[14px] font-bold leading-tight">{prod.t}</span>
        <span className="block text-[12px] opacity-80">{prod.d}</span>
      </span>
      <span aria-hidden="true" className="text-lg font-bold">›</span>
    </a>
  );
}

/** flush: 이미 미드나잇 톤의 틀 안에 들어갈 때 바깥 테두리·배경을 빼고 내용만 보여요. */
export default function PremiumBook({ report, flush = false, finale, previewBlur = false }: { report: PremiumReportView; flush?: boolean; /** 프리미엄 "미리 보기" 화면에서만 true: 5쪽부터 핵심 풀이를 흐리게 가려요 */ previewBlur?: boolean; /** 마지막 쪽 끝에 붙는 마무리(한 줄 결론 등) */ finale?: ReactNode }) {
  const pages = report.book;
  const [i, setI] = useState(0);
  const [unlockMsg, setUnlockMsg] = useState(false);
  const top = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    top.current?.scrollIntoView?.({ block: "start", behavior: "smooth" });
  }, [i]);

  const page = pages[i];
  if (!page) return null;
  // 미리 보기: 5쪽부터(서버도 같은 쪽부터 비워서 보내요) 본문·표·조언·근거를 흐리게. (제목과 도리의 말풍선은 그대로 둬서 궁금증을 남겨요)
  const blurred = previewBlur && page.no >= PREVIEW_OPEN_PAGES;
  const BLUR = "pointer-events-none select-none blur-[6px]";
  const go = (n: number) => setI(Math.min(pages.length - 1, Math.max(0, n)));
  const num = (n: number) => String(n).padStart(2, "0");
  const lockedTotal = pages.reduce((a, p) => a + p.sections.filter((x) => x.locked).length, 0);
  const lockedHere = page.sections.filter((x) => x.locked).length;
  const unlock = (
    <button
      type="button"
      data-testid="unlock-button"
      onClick={() => setUnlockMsg(true)}
      className="mt-3 w-full rounded-full bg-gradient-to-r from-[#f0d9a0] to-[#d3ac62] py-2.5 text-[13px] font-bold text-[#1b1824] active:scale-95 transition-transform"
    >
      {previewBlur ? "전체 사주서 열기 (정식 오픈 후 9,900원)" : "9,900원으로 전체 열기"}
    </button>
  );

  // 풀이는 종이 카드(2~3개 소제목)로 나누고, 카드 사이에 도리의 말풍선을 넣어요.
  const perCard = page.sections.length > 6 ? 3 : 2;
  const groups: BookPage["sections"][] = [];
  for (let k = 0; k < page.sections.length; k += perCard) groups.push(page.sections.slice(k, k + perCard));
  const tp = titleParts(page.title);
  const mascot = mascotOf(report);
  const pic = avatarOf(mascot);

  return (
    <div
      ref={top}
      data-testid="premium-book"
      tabIndex={-1}
      onKeyDown={(e: { key: string }) => {
        if (e.key === "ArrowRight") go(i + 1);
        if (e.key === "ArrowLeft") go(i - 1);
      }}
      className={`mx-auto max-w-[440px] text-[#efe7d3] scroll-mt-4 ${flush ? "pt-2" : "rounded-[1.75rem] bg-[#10142b] p-5 sm:p-6 shadow-[0_20px_60px_rgba(20,16,34,0.45)] border border-[#e6c887]/30"}`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-[11px] font-bold tracking-[0.18em] ${GOLD}`}>DORI 20쪽 사주서</span>
        <span data-testid="book-counter" className="text-xs tabular-nums text-[#e8dfca]/70">
          {num(page.no)} / {num(pages.length)}
        </span>
      </div>

      <nav aria-label="리포트 페이지" className="mt-1 flex gap-[3px]">
        {pages.map((p, k) => (
          <button
            key={p.key}
            type="button"
            data-testid={`book-tab-${p.no}`}
            aria-label={`${p.no}쪽 ${p.title}`}
            aria-current={k === i ? "page" : undefined}
            onClick={() => go(k)}
            className="group flex-1 py-3"
          >
            <span className={`block h-1.5 rounded-full transition-colors ${k === i ? "bg-[#e6c887]" : k < i ? "bg-[#e6c887]/50" : "bg-white/15"}`} />
          </button>
        ))}
      </nav>

      {lockedTotal > 0 && (
        <div data-testid="unlock-bar" className={`mt-3 rounded-2xl border ${HAIR} bg-[#e6c887]/[0.07] px-4 py-3`}>
          <p className="text-[12.5px] leading-relaxed text-[#f3e7c9]">
            <span aria-hidden="true">🔒 </span>
            {previewBlur ? (
              <>
                미리보기에서는 전체 {pages.length}쪽 중 <b className={GOLD}>앞 {PREVIEW_OPEN_PAGES - 1}쪽</b>만 볼 수 있어요. {PREVIEW_OPEN_PAGES}쪽부터는 풀이가 가려져 있어요.
              </>
            ) : (
              <>
                전체 {pages.length}쪽 중 <b className={GOLD}>{lockedTotal}개 풀이</b>가 잠겨 있어요. 흐리게 보이는 부분이 가장 궁금한 ‘언제’와 ‘어떻게’예요.
              </>
            )}
          </p>
          {unlock}
          {unlockMsg && (
            <p role="status" data-testid="unlock-message" className="mt-2 text-center text-[11.5px] font-bold text-[#f6dfa8]">
              지금은 베타 테스트 중이라 결제를 받지 않아요. 정식 오픈하면 여기서 전체 사주서를 열 수 있어요 🫧
            </p>
          )}
        </div>
      )}

      <article aria-labelledby="book-title" data-testid="book-page" data-page={page.no} className="mt-4 flex flex-col gap-[18px]">
        <h3 id="book-title" className="sr-only">
          {page.title}
        </h3>
        <ChapterCover page={page} mascot={mascot} />

        {/* 도리 한 마리에 말풍선 하나: AI 한 줄이 있으면 그것을, 없으면 쪽 첫 문장을 보여요. */}
        <div data-testid={page.key === "concernTop" ? "book-opening" : page.note ? "book-note" : "book-lead"}>
          <BubbleRow text={page.key === "concernTop" ? openingBubble(report.viewerName) : page.note ? `도리의 한 줄 · ${page.note}` : page.lead} img={pic} />
        </div>

        {/* 손님이 고른 고민에 대한 답은 첫 쪽 위가 아니라, 같은 주제를 다루는 '요즘 고민 맞춤 풀이' 쪽에 둬요. */}
        {page.key === "concern" && report.concern && <ConcernCard concern={report.concern} dark />}

        {/* 미리보기에서 가려진 쪽은 계산 값을 서버가 비워 보내서, 그림도 보여주지 않아요. */}
        {!blurred && (
          <div className="rounded-[14px] border border-[#2c3260] bg-[#1a1f40] p-4 empty:hidden">
            <Visual page={page} report={report} />
          </div>
        )}

        {page.key === "topic:love" && !blurred && report.partnerImage && (
          <figure data-testid="partner-image" className="mx-auto w-full max-w-[340px] rounded-[14px] border border-[#2c3260] bg-[#1a1f40] p-4 text-center">
            <p className={`mb-3 text-[14px] font-bold tracking-[0.04em] ${GOLD}`}>{report.partnerImage.title}</p>
            {report.partnerImage.src && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={report.partnerImage.src} alt={report.partnerImage.alt} className="w-full rounded-[10px]" />
                <figcaption className="mt-2 text-[11px] leading-relaxed text-[#e8dfca]/60">{report.partnerImage.notice}</figcaption>
              </>
            )}
            <dl data-testid="partner-profile" className="mt-4 space-y-3 text-left">
              {report.partnerImage.profile.map((row) => (
                <div key={row.label}>
                  <dt className="text-[13px] font-bold text-[#f3ecdc]">{row.label}</dt>
                  <dd className="mt-1.5 flex flex-wrap gap-1.5">
                    {row.tags.map((t) => (
                      <span key={t} className="rounded-full border border-[#e6c887]/60 bg-[#e6c887]/10 px-3 py-1 text-[13px] font-semibold text-[#f3ecdc]">
                        {t}
                      </span>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-[11px] text-[#e8dfca]/50">사주로 가볍게 그려 본 재미용 상상이에요.</p>
          </figure>
        )}

        {page.explainer && !blurred && (
          <aside data-testid="book-explainer" className="rounded-[14px] border border-[#e6c887]/40 bg-[#e6c887]/[0.07] px-4 py-3.5">
            <p className={`text-[12px] font-bold tracking-[0.12em] ${GOLD}`}>쉬운 설명 · {page.explainer.title}</p>
            <p className="mt-2 text-[14px] leading-[1.7] text-[#f3ecdc]">{page.explainer.body}</p>
          </aside>
        )}

        {groups.map((g, gi) => (
          <div key={`${gi}-${g[0]?.heading}`} className="flex flex-col gap-[18px]">
            {gi > 0 && <BubbleRow text={`이어서 ‘${g[0].heading.replace(/ · .*$/, "")}’ 이야기를 들려드릴게요.`} img={pic} right={gi % 2 === 1} />}
            <div className="rounded-md border-[3px] border-double border-[#2a3260] bg-[#f3ecdc] px-5 pb-[18px] pt-[22px] text-[#26233a] shadow-[0_2px_0_#00000040]">
              {gi === 0 && (
                <>
                  <p className="text-center text-[11px] tracking-[0.3em] text-[#5b5670]">사 주 풀 이</p>
                  <p className="mb-4 mt-1 text-center font-serifKr text-[20px] font-bold text-[#26233a]">{tp.main}</p>
                </>
              )}
              <div className={`space-y-5 ${blurred ? "[&_p]:blur-[6px] [&_li]:blur-[6px] select-none" : ""}`} aria-hidden={blurred ? "true" : undefined}>
                {g.map((s, n) => (
                  <section key={`${n}-${s.heading}`} data-testid={s.locked ? "book-section-locked" : "book-section"}>
                    <h4 className="border-b border-dotted border-[#9a93b0] pb-1.5 text-[15px] font-bold text-[#26233a]">
                      <span aria-hidden="true" className="mr-1.5">{s.locked ? "🔒" : ""}</span>
                      {s.heading}
                    </h4>
                    {s.locked ? (
                      <div className="relative mt-2">
                        <p aria-hidden="true" className="select-none text-[15px] leading-[1.85] text-[#322f47] blur-[6px]">
                          {s.body}
                        </p>
                        <span className="sr-only">잠긴 풀이예요. 전체 열기를 누르면 볼 수 있어요.</span>
                      </div>
                    ) : (
                      <RichBody text={s.body} />
                    )}
                    {!s.locked && s.checks && s.checks.length > 0 && <CheckList items={s.checks} />}
                    {!s.locked && s.reality && <RealityPick rc={s.reality} />}
                  </section>
                ))}
              </div>
            </div>
          </div>
        ))}

        {page.tables.map((t) => (
          <div key={t.title} aria-hidden={blurred ? "true" : undefined} className={`rounded-[14px] border border-[#2c3260] bg-[#1a1f40] px-4 pb-4 ${blurred ? BLUR : ""}`}>
            <Table t={t} />
          </div>
        ))}

        {page.advice && (
          <div data-testid="book-advice" aria-hidden={blurred ? "true" : undefined} className={`rounded-2xl border border-[#e6c887]/40 bg-[#e6c887]/[0.08] px-4 py-4 ${blurred ? BLUR : ""}`}>
            <p className={`text-[12px] font-bold tracking-wide ${GOLD}`}>{MASCOT_EMOJI[mascot]} 도리의 맞춤 조언</p>
            <p className="mt-1.5 font-serifKr text-[14px] leading-[1.85] text-[#fbf3de]">{page.advice}</p>
          </div>
        )}

        {page.evidence && page.evidence.length > 0 && (
          <div aria-hidden={blurred ? "true" : undefined} className={blurred ? BLUR : ""}>
            <Evidence rows={page.evidence} />
          </div>
        )}

        {blurred && (
          <div data-testid="preview-blur-note" className={`rounded-2xl border ${HAIR} bg-[#e6c887]/[0.06] px-4 py-4 text-center`}>
            <p className={`text-[13px] font-bold ${GOLD}`}>🔒 핵심 풀이는 흐리게 가려져 있어요</p>
            <p className="mt-1 text-[12px] leading-relaxed text-[#e8dfca]/80">미리 보기에서는 1~4쪽만 전부 볼 수 있어요. 내 사주의 진짜 이야기는 프리미엄 사주서에서 확인해 보세요.</p>
          </div>
        )}
      </article>

      {finale && i === pages.length - 1 && (
        <section data-testid="book-finale" className={`mt-6 rounded-2xl border ${HAIR} bg-[#e6c887]/[0.05] px-3 py-5`}>
          <p className={`text-center text-[11px] font-bold tracking-[0.2em] ${GOLD}`}>도리의 마지막 한 줄</p>
          {finale}
        </section>
      )}

      {lockedHere > 0 && !blurred && (
        <p data-testid="page-lock-hint" className="mt-6 text-center text-[12px] text-[#e6c887]">
          이 페이지에 잠긴 풀이 {lockedHere}개 · 위의 ‘전체 열기’로 볼 수 있어요
        </p>
      )}

      <ChapterEnd cur={page} next={pages[i + 1]} />

      <div className="mt-8 flex items-center gap-3">
        <button
          type="button"
          data-testid="book-prev"
          onClick={() => go(i - 1)}
          disabled={i === 0}
          className={`flex-1 rounded-full border ${HAIR} py-3 text-sm font-bold text-[#f5efe0] disabled:opacity-30 active:scale-95 transition-transform`}
        >
          ‹ 이전
        </button>
        <button
          type="button"
          data-testid="book-next"
          onClick={() => go(i + 1)}
          disabled={i === pages.length - 1}
          className="flex-1 rounded-full bg-gradient-to-r from-[#f0d9a0] to-[#d3ac62] py-3 text-sm font-bold text-[#1b1824] disabled:opacity-30 active:scale-95 transition-transform"
        >
          다음 ›
        </button>
      </div>
      <p className="mt-4 text-center text-[11px] leading-relaxed text-[#8f95c0]">명리학의 일반적인 관점으로 풀어 쓴 재미와 참고용 해석이에요.</p>
    </div>
  );
}
