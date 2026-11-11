"use client";

import { getBrowserStorage } from "@/lib/drawCounter";
import { readRealityPick, saveRealityPick } from "@/lib/realityPick";
import { ConfirmChoice } from "@/components/ConfirmChoice";
import { PREVIEW_OPEN_PAGES } from "@/lib/premium/config";
import ConcernCard from "./ConcernCard";
import { josa } from "@/lib/premium/josa";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { checkMessage } from "@/lib/premium/book/resonance";
import type { BookChart, BookPage, BookRow, BookTable, ElementKind, PremiumReportView, RealityCheck } from "@/lib/premium/types";
import { elementOfChar, elName } from "@/lib/elementColor";
import ElementTile from "@/components/ElementTile";
import { DAYMASTER_BRIEF, MBTI_BRIEF, cleanMbti } from "@/lib/mbtiBrief";
import { formatWon } from "@/lib/premium/book/charts";
import { callName } from "@/lib/ai/nameRepair";
import BodyFigure from "./BodyFigure";
import { BODY_GROUPS, STATE_SHORT, STATE_TEXT, bodyElName, bodyStates, bodyWhy, dailyRoutine, monthlyCondition, monthlySummary, yearFocus, type BodyEl, type BodyState } from "@/lib/premium/bodyMap";

/*
 * 프리미엄 20페이지 리포트 리더. 한 번에 한 페이지씩 넘겨 보는 고급스러운 책 형태예요.
 * 색: 미드나잇 + 샴페인 골드. 글씨는 항상 충분히 밝은 대비를 유지해요.
 */

const BAR: Record<ElementKind, string> = {
  wood: "bg-emerald-400",
  fire: "bg-rose-400",
  earth: "bg-amber-400",
  metal: "bg-slate-300",
  water: "bg-blue-400",
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
        {touched ? `${items.length}개 중 ${hit}개가 나와 비슷해. ${checkMessage(hit, items.length)}` : ""}
      </p>
    </div>
  );
}

/** 사주가 보여 준 흐름과 지금 내 현실을 견줘 보는 세 갈래. 어느 쪽이든 응원으로 마무리해요. */
function RealityPick({ rc }: { rc: RealityCheck }) {
  const [pick, setPick] = useState<number | null>(null);
  const [asking, setAsking] = useState<number | null>(null);
  // 한 번 고른 답은 새로고침이나 다시 들어와도 그대로 잠겨 있어요.
  useEffect(() => {
    const saved = readRealityPick(getBrowserStorage(), rc.question, rc.options.length);
    if (saved !== null) setPick(saved);
  }, [rc.question, rc.options.length]);
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
            disabled={pick !== null}
            onClick={() => setAsking(i)}
            className={`rounded-full border px-3.5 py-1.5 text-[12.5px] font-bold transition-colors ${
              pick === i ? "border-[#b98a2f] bg-[#b98a2f] text-white" : "border-[#9a93b0] text-[#322f47] hover:border-[#b98a2f] disabled:opacity-50 disabled:hover:border-[#9a93b0]"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      {asking !== null && pick === null && (
        <ConfirmChoice
          label={rc.options[asking].label}
          onNo={() => setAsking(null)}
          onYes={() => {
            saveRealityPick(getBrowserStorage(), rc.question, asking);
            setPick(asking);
            setAsking(null);
          }}
        />
      )}
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
      <p className="mt-2.5 text-[11.5px] leading-relaxed text-[#e8dfca]/60">입력한 생년월일시로 계산한 값이야. 풀이는 재미와 참고용이야.</p>
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
              {row.locked && <span className="sr-only">잠긴 칸이야</span>}
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

/** 달별 막대: 달마다 이 주제의 기운이 얼마나 힘을 받는지 (표의 bar 값을 그려요) */
function MonthBars({ table }: { table: BookTable }) {
  const rows = table.rows;
  if (rows.length === 0) return null;
  const monthOf = (label: string) => `${label.match(/(\d+)월경/)?.[1] ?? "?"}월`;
  return (
    <div data-testid="month-bars">
      <p className={`text-[12px] font-bold tracking-[0.12em] ${GOLD}`}>{table.title}</p>
      <div className="mt-3 flex h-[120px] items-end gap-[5px] border-b border-white/15" role="img" aria-label={`${table.title} 막대 그래프`}>
        {rows.map((r, i) => (
          <div key={`${r.label}-${i}`} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
            <span className="mb-0.5 h-3 text-[10px] leading-none text-[#f6dfa8]">{r.locked ? "🔒" : r.highlight ? "★" : ""}</span>
            {r.locked ? (
              <i className="block w-full rounded-t-[5px] border border-dashed border-white/30" style={{ height: "28%" }} />
            ) : (
              <i
                data-testid={r.highlight ? "month-bar-hit" : "month-bar"}
                className={`block w-full rounded-t-[5px] ${r.highlight ? "bg-gradient-to-b from-[#f6dfa8] to-[#e6c887]" : "bg-[#e6c887]/40"} ${r.current ? "outline outline-2 outline-offset-1 outline-white" : ""}`}
                style={{ height: `${Math.max(12, Math.min(100, r.bar ?? 40)) * 0.8}%` }}
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-[5px]">
        {rows.map((r, i) => (
          <span key={`${r.label}-l${i}`} className={`min-w-0 flex-1 text-center text-[10px] ${r.current ? "font-bold text-white" : "text-[#e8dfca]/80"}`}>
            {monthOf(r.label)}
          </span>
        ))}
      </div>
      <p className="mt-2 flex flex-wrap gap-x-3 text-[11px] text-[#e8dfca]/80">
        <span><b aria-hidden="true" className="mr-1 inline-block h-2 w-2 rounded-sm bg-[#f6dfa8]" />포인트 달 ★</span>
        <span><b aria-hidden="true" className="mr-1 inline-block h-2 w-2 rounded-sm bg-[#e6c887]/40" />잔잔한 달</span>
        <span>흰 테두리 = 지금</span>
      </p>
      <p className="mt-2 text-[11px] leading-relaxed text-[#e8dfca]/60">달마다 이 주제와 닿는 기운이 얼마나 힘을 받는지 보여 주는 상대 지수야. 높다고 꼭 좋은 일이 생긴다는 뜻은 아니고, 힘을 쏟기 좋은 때를 읽는 참고용 그림이야.</p>
    </div>
  );
}

/** 십성 막대: 5가지 기운 중 어디에 힘이 실려 있는지 (오행 막대와 같은 모양) */
function GodBars({ table }: { table: BookTable }) {
  const rows = table.rows.map((r) => ({ ...r, n: r.locked ? 0 : Number(r.value.match(/\d+/)?.[0] ?? 0) }));
  if (rows.length === 0) return null;
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <div data-testid="god-bars">
      <p className={`text-[12px] font-bold tracking-[0.12em] ${GOLD}`}>내가 가진 기운의 크기</p>
      <ul className="mt-3 space-y-3">
        {rows.map((r) => (
          <li key={r.label} data-testid="god-row">
            <div className="flex items-center gap-3">
              <span className={`w-12 shrink-0 rounded-full border py-1 text-center text-xs font-bold ${HAIR} ${GOLD}`}>{r.label}</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10" role="img" aria-label={`${r.label} ${r.n}`}>
                <div className={`h-full rounded-full ${r.highlight ? "bg-gradient-to-r from-[#f0d9a0] to-[#d3ac62]" : "bg-[#e6c887]/60"}`} style={{ width: `${(r.n / max) * 100}%` }} />
              </div>
              <span className="w-6 text-right text-sm font-bold tabular-nums text-[#f5efe0]">{r.locked ? "🔒" : r.n}</span>
            </div>
            {r.highlight && !r.locked && r.note && <p className="ml-[3.75rem] mt-1 text-[11px] text-[#e8dfca]/70">{r.note} · 가장 두드러져</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 올해 앞뒤 5년 띠: 해마다 이 주제의 기운이 얼마나 힘을 받는지 */
function YearStrip({ table }: { table: BookTable }) {
  const rows = table.rows.slice(0, 5);
  if (rows.length < 2) return null;
  const curIdx = rows.findIndex((r) => r.current);
  const top = Math.max(...rows.filter((r) => !r.locked).map((r) => r.bar ?? 0));
  const tag = (i: number) => {
    if (curIdx < 0) return "";
    const d = i - curIdx;
    return d === 0 ? "올해" : d === -1 ? "지난해" : d === 1 ? "내년" : d < -1 ? "돌아보기" : "미리 보기";
  };
  return (
    <div data-testid="year-strip" className="mb-5">
      <p className={`text-[12px] font-bold tracking-[0.12em] ${GOLD}`}>{table.title}</p>
      <ol className="mt-3 grid grid-cols-5 gap-1.5">
        {rows.map((r, i) => (
          <li key={r.label} aria-current={r.current ? "true" : undefined} className={`rounded-xl border px-0.5 py-2 text-center ${r.current ? "border-[#e6c887] bg-[#e6c887] text-[#1b1824]" : `${HAIR} bg-white/[0.04] text-[#f5efe0]`}`}>
            <div className="text-[11px] font-bold">{r.label.replace("년", "")}</div>
            <div className="my-0.5 font-serifKr text-[15px] font-bold">{r.locked ? "●●" : r.value}</div>
            <div className={`text-[10px] ${r.current ? "text-[#1b1824]/75" : "text-[#e8dfca]/70"}`}>{tag(i)}{!r.locked && top > 0 && r.bar === top ? " ★" : ""}</div>
            {r.locked ? (
              <span className="mt-1 block text-[10px]">🔒</span>
            ) : (
              <i
                aria-hidden="true"
                className={`mx-auto mt-1.5 block rounded-full ${r.current ? "bg-[#1b1824]" : "bg-[#e6c887]"}`}
                style={{ width: 6 + ((r.bar ?? 40) / 100) * 10, height: 6 + ((r.bar ?? 40) / 100) * 10, opacity: 0.35 + ((r.bar ?? 40) / 100) * 0.65 }}
              />
            )}
          </li>
        ))}
      </ol>
      <p className="mt-2 text-[11px] leading-relaxed text-[#e8dfca]/60">점이 크고 밝을수록 그 해에 이 주제의 기운이 힘을 받아. 흐름의 높낮이를 보는 참고용이야.</p>
    </div>
  );
}

/** 십이운성 단계별 기운의 높이(0~100). 좋고 나쁨이 아니라 "기운의 세기"를 보여 주는 그림용 값이에요. */
const STAGE_LEVEL: Record<string, number> = { 장생: 62, 목욕: 48, 관대: 76, 건록: 92, 제왕: 100, 쇠: 70, 병: 46, 사: 30, 묘: 24, 절: 12, 태: 22, 양: 40 };

/** 대운별 십이운성 곡선: 10년 단위로 기운이 오르내리는 모양 (잠긴 칸은 점선 자리만) */
function StageCurve({ table }: { table: BookTable }) {
  const rows = table.rows;
  if (rows.length < 2) return null;
  const W = 300;
  const H = 110;
  const px = (i: number) => 20 + (i * (W - 40)) / (rows.length - 1);
  const stageOf = (r: BookRow) => (r.locked ? "" : (r.value.split(" · ")[1] ?? ""));
  const py = (lv: number) => H - 14 - (lv / 100) * (H - 34);
  const open = rows.map((r, i) => ({ r, i, lv: STAGE_LEVEL[stageOf(r)] })).filter((x) => x.lv !== undefined);
  const path = open.map((x, k) => `${k === 0 ? "M" : "L"}${px(x.i).toFixed(1)} ${py(x.lv).toFixed(1)}`).join(" ");
  return (
    <div data-testid="stage-curve" className="mb-6">
      <p className={`text-[12px] font-bold tracking-[0.12em] ${GOLD}`}>10년마다 달라지는 기운의 세기</p>
      <svg viewBox={`0 0 ${W} ${H + 22}`} className="mt-3 w-full" role="img" aria-label="대운별 십이운성 곡선">
        <line x1="12" x2={W - 12} y1={H - 12} y2={H - 12} stroke="rgba(255,255,255,0.15)" />
        {path && <path d={path} fill="none" stroke="#e6c887" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}
        {rows.map((r, i) => {
          const st = stageOf(r);
          const lv = STAGE_LEVEL[st];
          return (
            <g key={`${r.label}-${i}`}>
              {lv !== undefined ? (
                <>
                  <circle cx={px(i)} cy={py(lv)} r={r.highlight ? 6 : 3.5} fill={r.highlight ? "#fff" : "#e6c887"} stroke={r.highlight ? "#e6c887" : "none"} strokeWidth="2" />
                  <text x={px(i)} y={py(lv) - 10} textAnchor="middle" fontSize="9" fill="#f5efe0">{st}</text>
                </>
              ) : (
                <circle cx={px(i)} cy={H - 40} r="3.5" fill="none" stroke="rgba(255,255,255,0.35)" strokeDasharray="2 2" />
              )}
              <text x={px(i)} y={H + 4} textAnchor="middle" fontSize="8.5" fill={r.highlight ? "#fff" : "rgba(232,223,202,0.75)"} fontWeight={r.highlight ? 700 : 400}>{r.label.replace("세", "")}</text>
            </g>
          );
        })}
      </svg>
      <p className="mt-1 text-[11px] leading-relaxed text-[#e8dfca]/60">높은 때는 힘이 차오르는 시기, 낮은 때는 쉬며 준비하는 시기야. 낮다고 나쁜 때가 아니고 &lsquo;지금 어울리는 속도&rsquo;를 보는 참고용 그림이야. 흰 점이 지금이야.</p>
    </div>
  );
}

/** 건강운 장기 지도: 인체 그림 + 기운별 상태. 많은 기운은 쉬어 가기, 적은 기운은 채워 주기로만 안내해요 */
function BodyMap({ report }: { report: PremiumReportView }) {
  const els = report.elements;
  if (els.length === 0) return null;
  const states = bodyStates(els);
  const focus = yearFocus(report.seyun?.ganzhi);
  const focusGroup = focus ? BODY_GROUPS.find((g) => g.el === focus) : undefined;
  const chip = (st: BodyState | undefined) => (st === "fill" ? { t: STATE_TEXT.fill, c: "bg-sky-300/20 text-sky-100" } : st === "rest" ? { t: STATE_TEXT.rest, c: "bg-rose-300/20 text-rose-100" } : { t: STATE_TEXT.ok, c: "bg-white/10 text-[#e8dfca]" });
  return (
    <div data-testid="body-map" className="mb-6">
      <p className={`text-[12px] font-bold tracking-[0.12em] ${GOLD}`}>기운별로 챙기면 좋은 곳</p>
      <div className="mt-3">
        <BodyFigure states={states} focus={focus} />
      </div>
      {focusGroup && report.seyun && (
        <p data-testid="body-year" className={`mt-3 rounded-2xl border ${HAIR} bg-white/[0.04] px-3 py-2.5 text-[12.5px] leading-relaxed text-[#f3ecdc]`}>
          <b className={GOLD}>올해 살펴볼 곳</b> · {report.seyun.year}년은 {elName(focusGroup.el)} 기운이 들어오는 해야. {focusGroup.area} 쪽을 한 번 더 챙겨 봐. (그림에서 노란 물결로 반짝여)
        </p>
      )}
      <ul className="mt-3 space-y-2">
        {els.map((e) => {
          const g = BODY_GROUPS.find((x) => x.el === e.name);
          if (!g) return null;
          const k = chip(states[g.el]);
          return (
            <li key={e.name} data-testid="body-row" className={`rounded-2xl border ${HAIR} bg-white/[0.04] px-3 py-2.5`}>
              <div className="flex items-center gap-2">
                <span className={`w-9 shrink-0 rounded-full border py-0.5 text-center text-xs font-bold ${HAIR} ${GOLD}`}>{elName(e.name)}</span>
                <span className="flex-1 text-sm font-bold text-[#f5efe0]">{g.area}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${k.c}`}>{k.t}</span>
              </div>
              <p data-testid="body-why" className={`ml-11 mt-1.5 rounded-r-lg border-l-[3px] border-[#e6c887] bg-white/[0.05] px-2 py-1 text-[12px] leading-relaxed text-[#f3ecdc]`}>{bodyWhy(g.el, states[g.el] ?? "ok", els)}</p>
              <p className="ml-11 mt-1 text-[11px] text-[#e8dfca]/70">{g.habit}</p>
            </li>
          );
        })}
      </ul>
      <MonthCalendar report={report} states={states} />
      <DailyRoutine states={states} />
      <p className="mt-2 text-[11px] leading-relaxed text-[#e8dfca]/60">병이나 증상을 알려 주는 그림이 아니야. 생활 습관을 정할 때 참고하는 전통 오행 대응이고, 몸이 불편하면 꼭 전문가와 상담해 줘.</p>
    </div>
  );
}

const BODY_DOT: Record<BodyEl, string> = { 목: "#3fa66b", 화: "#e5484d", 토: "#d9a21b", 금: "#8a9bb0", 수: "#3b82f6" };

/** 월별 컨디션 달력: 올해 월운 천간 오행 → 그 달에 챙길 부위 */
function MonthCalendar({ report, states }: { report: PremiumReportView; states: Partial<Record<BodyEl, BodyState>> }) {
  const cal = monthlyCondition(report.wolun, states, report.wolunNow);
  const [sel, setSel] = useState<number | null>(null);
  if (cal.length === 0) return null;
  const cur = cal.findIndex((c) => c.current);
  const at = sel ?? (cur >= 0 ? cur : 0);
  const sum = monthlySummary(cal);
  return (
    <div data-testid="body-calendar" className="mt-6">
      <p className={`text-[12px] font-bold tracking-[0.12em] ${GOLD}`}>월별 컨디션 달력</p>
      <p className="mt-1 text-[11.5px] leading-relaxed text-[#e8dfca]/70">올해 달마다 어느 부위를 챙기면 좋은지 보여 줘. 칸을 눌러 봐.</p>
      <div className="mt-3 grid grid-cols-4 gap-1.5">
        {cal.map((c, i) => (
          <button
            key={c.label}
            type="button"
            data-testid="body-month"
            aria-pressed={i === at}
            onClick={() => setSel(i)}
            className={`relative rounded-2xl border px-1 py-2 text-center ${i === at ? "border-[#e6c887] bg-[#e6c887]/15" : `${HAIR} bg-white/[0.04]`}`}
          >
            {c.current && <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-[#e6c887] px-2 text-[9.5px] font-extrabold text-[#1b1824]">지금</span>}
            <span className="block text-[11px] text-[#e8dfca]/70">{c.label}</span>
            <i
              aria-hidden="true"
              className="mx-auto my-1 block h-3.5 w-3.5 rounded-full"
              style={{ background: BODY_DOT[c.el], outline: c.state === "fill" ? "2px dashed rgba(255,255,255,0.5)" : undefined, outlineOffset: 2, boxShadow: c.state === "rest" ? "0 0 0 3px rgba(253,164,175,0.5)" : undefined }}
            />
            <span className="block text-[12px] font-bold text-[#f5efe0]">{c.group.label}</span>
            <span className={`block text-[10px] ${c.state === "fill" ? "text-sky-200" : c.state === "rest" ? "text-rose-200" : "text-[#e8dfca]/60"}`}>{STATE_SHORT[c.state]}</span>
          </button>
        ))}
      </div>
      <p data-testid="body-month-detail" className={`mt-3 rounded-2xl border border-[#e6c887]/60 bg-[#e6c887]/10 px-3 py-2.5 text-[12.5px] leading-relaxed text-[#f3ecdc]`}>{cal[at].text}</p>
      <div className="mt-2 space-y-1 text-[12px] leading-relaxed text-[#e8dfca]/80">
        {sum.rest && <p><b className={GOLD}>쉬어 가는 달</b> · {sum.rest}</p>}
        {sum.fill && <p><b className={GOLD}>채우기 좋은 달</b> · {sum.fill}</p>}
      </div>
    </div>
  );
}

/** 하루 루틴 처방: 부위별 상태를 하루 시간표로 */
function DailyRoutine({ states }: { states: Partial<Record<BodyEl, BodyState>> }) {
  const slots = dailyRoutine(states);
  if (slots.length === 0) return null;
  return (
    <div data-testid="body-routine" className="mt-6">
      <p className={`text-[12px] font-bold tracking-[0.12em] ${GOLD}`}>하루 루틴 처방</p>
      <p className="mt-1 text-[11.5px] leading-relaxed text-[#e8dfca]/70">내 기운 상태를 하루 시간표로 옮겼어. 점 색은 어느 부위를 위한 습관인지 알려 줘.</p>
      <div className="mt-3 space-y-2">
        {slots.map((sl) => (
          <div key={sl.time} className={`flex gap-3 rounded-2xl border ${HAIR} bg-white/[0.04] px-3 py-2.5`}>
            <span className={`w-12 shrink-0 text-[13px] font-extrabold ${GOLD}`}>{sl.time}</span>
            <ul className="min-w-0 flex-1 space-y-1.5">
              {sl.items.map((it) => {
                const g = BODY_GROUPS.find((x) => x.el === it.el);
                return (
                  <li key={it.text} className="flex items-start gap-2 text-[13px] text-[#f5efe0]">
                    <i aria-hidden="true" className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: BODY_DOT[it.el] }} />
                    <span>
                      {it.text}
                      <small className="block text-[11px] text-[#e8dfca]/60">{g?.area} · {bodyElName(it.el)} 기운 {STATE_TEXT[states[it.el] ?? "ok"]}</small>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 서문: 네 기둥 이름표 + "왜 해마다/매일 다시 보나" + 도유사주 이용 안내. 모두에게 같은 글이라 AI 를 쓰지 않아요. */
function PrefaceExtras({ report }: { report: PremiumReportView }) {
  const mbti = cleanMbti(report.mbti);
  const dayStem = report.pillars.find((p) => p.key === "day")?.full?.[0] ?? null;
  const lane: Array<[string, string]> = [
    ["타고난 집", "내 여덟 글자 (1~3장)"],
    ["10년의 계절", "대운"],
    ["한 해의 날씨", "세운"],
    ["달마다의 분위기", "월운"],
    ["오늘 하루의 기분", "일운"],
  ];
  return (
    <div data-testid="preface-extras" className="mt-4 space-y-3">
      {mbti && dayStem && (
        <div data-testid="preface-mbti" className="rounded-xl bg-white/[0.06] px-3 py-2.5 text-[12.5px] leading-relaxed text-[#e8dfca]/90">
          <div className="flex gap-4">
            <span>나의 일간 <b className={GOLD}>{dayStem}</b></span>
            <span>MBTI <b className={GOLD}>{mbti}</b></span>
          </div>
          <p className="mt-1 text-[11.5px] text-[#e8dfca]/65">MBTI는 곁에 놓고 보는 참고야. 네 글자로 사람 속을 다 알 수는 없어서, 사주와 나란히 놓고 같은 말을 하는 곳을 살펴봐.</p>
        </div>
      )}
      <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-[12px] text-[#e8dfca]/70">
        <span>네 기둥 = <b className={GOLD}>사주 四柱</b></span>
        <span>여덟 글자 = <b className={GOLD}>팔자 八字</b></span>
      </div>
      <p className="text-[13px] leading-relaxed text-[#e8dfca]/85">
        여덟 글자는 따로 놀지 않고 서로 돕고, 부딪히고, 어울려. 그 어울림으로 타고난 바탕과 힘이 나는 때를 읽어.
      </p>
      <div className={`rounded-xl border-l-4 border-[#e6c887] bg-white/[0.05] px-3 py-2.5 text-[14px] font-bold leading-snug ${GOLD}`}>
        기둥은 태어날 때 한 번 세워졌는데, 왜 해마다 (그리고 매일) 운세를 다시 볼까?
      </div>
      <p className="text-[13px] leading-relaxed text-[#e8dfca]/85">
        집은 그대로여도 계절과 날씨는 바뀌기 때문이야. 같은 집에서도 봄엔 창을 열고 겨울엔 난방을 하듯, 같은 사람도 지나는 때에 따라 힘을 쓸 곳이 달라져.
      </p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[13px]">
        {lane.map(([a, b]) => (
          <div key={b} className="contents">
            <dt className={`font-bold ${GOLD}`}>{a}</dt>
            <dd className="text-[#e8dfca]/85">{b}</dd>
          </div>
        ))}
      </dl>
      <p className="text-[13px] leading-relaxed text-[#e8dfca]/85">
        그중 <b>일운</b>은 날마다 바뀌는 하루치 기운이야. 오늘 하루의 일기예보 같아서, 중요한 약속이나 마음 쓸 일을 고를 때 가볍게 참고하면 좋아. 그래서 매일 다시 봐도 의미가 있어.
      </p>
      <div className="rounded-xl bg-white/[0.06] px-3 py-3 text-[13px] leading-relaxed text-[#e8dfca]/90">
        <b className={GOLD}>🐾 매일 곁에 있는 친구가 필요하다면</b>
        <ul className="mt-1.5 space-y-1">
          <li>🪙 <b>오늘의 풀이는 조약돌 하나(500원)</b>야. 커피 한 모금 값으로 오늘 날씨를 알 수 있어.</li>
          <li>💬 <b>도유 상담실</b>에서는 도리가 편하게 말 걸어 주고, 궁금한 걸 물어볼 수 있어.</li>
          <li>🎁 <b>매일 무료 1회</b>는 로그인만 하면 조약돌이 채워져 있어. 부담 없이 놀러 와!</li>
        </ul>
      </div>
    </div>
  );
}

function Visual({ page, report }: { page: BookPage; report: PremiumReportView }) {
  if (page.chart) return <LifeChart chart={page.chart} />;
  const max = Math.max(1, ...report.elements.map((e) => e.count));
  switch (page.key) {
    case "preface":
    case "pillars":
      return (
        <div className="mb-6">
          {page.key === "preface" && (
            <p className="mb-3 text-[13px] leading-relaxed text-[#e8dfca]/85">
              태어난 <b className={GOLD}>해·달·날·시간</b>, 이 네 때마다 글자를 위아래 두 개씩 적어. 위는 하늘의 기운(천간), 아래는 땅의 기운(지지)이야.
            </p>
          )}
          <div className="grid grid-cols-4 gap-2">
            {report.pillars.map((p) => {
              const [stem, branch] = p.full ? Array.from(p.full) : [null, null];
              return (
                <div key={p.key} data-testid="pillar-card" className={`rounded-2xl border ${HAIR} bg-white/[0.04] py-3 text-center`}>
                  <div className={`text-[11px] font-bold ${GOLD}`}>{p.label}</div>
                  {p.full ? (
                    <>
                      <div className="mt-1.5 space-y-1 px-1.5" aria-label={`${p.label} ${p.full}`}>
                        <ElementTile ch={stem} el={elementOfChar(stem, false)} reading={p.reading?.[0] ?? ""} tone="dark" sizeClass="text-[36px]" />
                        <ElementTile ch={branch} el={elementOfChar(branch, true)} reading={p.reading?.[1] ?? ""} tone="dark" sizeClass="text-[36px]" />
                      </div>
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
              태어난 시간을 몰라 정오(12시)를 기준으로 계산했어. 신강·신약, 격국, 용신은 태어난 시간에 따라 달라질 수 있어.
            </p>
          )}
          {page.key === "preface" && <PrefaceExtras report={report} />}
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
            <p className="mt-3 text-[12px] text-[#e8dfca]/60">재미로 보는 참고 점수야</p>
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
          {(() => {
            const mbti = cleanMbti(report.mbti);
            const stem = report.pillars.find((p) => p.key === "day")?.full?.[0] ?? null;
            const el = stem ? elementOfChar(stem, false) : null;
            if (!mbti || !el || !DAYMASTER_BRIEF[el]) return null;
            return (
              <div data-testid="nature-mbti" className="mt-3 w-full rounded-xl bg-white/[0.06] px-3 py-2.5 text-[12.5px] leading-relaxed text-[#e8dfca]/90">
                <b className={GOLD}>사주와 MBTI, 나란히 보면</b>
                <div className="mt-1">🔮 사주가 말하는 나: {DAYMASTER_BRIEF[el]}</div>
                <div>🧩 MBTI({mbti})가 말하는 나: {MBTI_BRIEF[mbti]}</div>
                <p className="mt-1 text-[11.5px] text-[#e8dfca]/65">두 가지가 같은 말을 하는 곳은 진짜 내 모습일 가능성이 높고, 다른 말을 하는 곳은 상황에 따라 달라지는 모습일 수 있어.</p>
              </div>
            );
          })()}
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
                <span className="sr-only">잠긴 칸이야</span>
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
      return (
        <>
          {page.tables[0] && <YearStrip table={page.tables[0]} />}
          {report.seyun ? (
            <p data-testid="seyun" className={`mb-6 rounded-2xl border ${HAIR} bg-white/[0.04] px-4 py-3 text-sm text-[#f5efe0]`}>
              <span className={`font-bold ${GOLD}`}>{report.seyun.year}년</span> 세운 {report.seyun.ganzhi}
              <span className="text-[#e8dfca]/60"> ({report.seyun.tenGodStem} · {report.seyun.tenGodBranch})</span>
            </p>
          ) : null}
        </>
      );
    case "years:2":
      return page.tables[0] ? <MonthBars table={page.tables[0]} /> : null;
    case "stage12":
      return page.tables[0] ? <StageCurve table={page.tables[0]} /> : null;
    case "topic:health":
      return <BodyMap report={report} />;
    case "tengods":
      return page.tables[0] ? <GodBars table={page.tables[0]} /> : null;
    default:
      return null;
  }
}

/** 리포트마다 한 동물만 나와요: 연애 결혼 = 토끼, 그 밖(성공·재물·궁합 등) = 수달 (용 그림은 쓰지 않아요) */
type Mascot = "rabbit" | "otter";
function mascotOf(report: PremiumReportView): Mascot {
  if (report.compat) return "otter";
  const k = report.topic.key;
  if (k === "love" || k === "marriage") return "rabbit";
  return "otter";
}
const MASCOT_EMOJI: Record<Mascot, string> = { rabbit: "🐰", otter: "🦦" };
const avatarOf = (m: Mascot) => `/images/animal-${m}.webp`;
/** 장 표지 그림은 프리미엄 대문 그림 한 장을 모든 장이 같이 써요. */
const COVER_SCENE = "/images/premium-main.webp";

/** "제7장 · 재물운" → 작은 글씨 "제 7 장", 큰 제목 "재물운", 부제 */
function titleParts(title: string): { small: string; main: string; sub: string } {
  if (!title.includes(" · ")) return { small: "", main: title, sub: "" };
  const [pre, rest = ""] = title.split(" · ");
  const small = pre.replace(/제(\d+)장/, "제 $1 장").replace("서문", "서 문").replace("부록", "부 록");
  const [a, b] = rest.split(" - ");
  return b ? { small, main: b, sub: a } : { small, main: a, sub: "" };
}

/** 3쪽 "먼저 결론부터" 쪽의 도리 말풍선(고정 문구). 서문에서 사주 기본을 본 뒤 이어지는 말이야. */
export const openingBubble = (name?: string | null) => `${name ? `${callName(name)}, ` : ""}${OPENING_BODY}`;
const OPENING_BODY = "여기까지 사주가 뭔지, 네 사주가 어떻게 생겼는지 한눈에 봤어. 이제 네 고민부터 얘기해 볼게. 먼저 결론부터 말하고, 그다음에 분야별로 하나씩 깊게 들어가 보자. 자, 렛츠 시작! 🚀";

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
function ChapterCover({ page }: { page: BookPage }) {
  const t = titleParts(page.title);
  return (
    <section data-testid="chapter-cover" aria-label={`${page.title} 표지`} className="relative flex aspect-[3/4] md:aspect-[16/9] flex-col justify-start overflow-hidden rounded-[14px] bg-gradient-to-b from-[#0b0e22] to-[#1d2350] px-5 pt-7">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={COVER_SCENE} alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" />
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
  { t: "올해 월별 운세 한눈에", d: "달마다 조심할 일과 기회를 짚어줘", h: "/" },
  { t: "궁합이 궁금하다면", d: "둘의 사주를 겹쳐 보는 1,000원 풀이", h: "/" },
  { t: "요즘 고민, 한 가지만 콕", d: "500원으로 고민에 맞춘 한 줄 답을 받아", h: "/" },
];

/** 장 끝: 다음 장 예고(말풍선 박스). 다음 상품 배너는 결과 맨 끝(별점 후기 위)에 한 번만 보여요. */
function ChapterEnd({ cur, next }: { cur: BookPage; next?: BookPage }) {
  if (!next) return null;
  const here = titleParts(cur.title).main;
  const there = titleParts(next.title).main;
  return (
    <div className="mt-9 flex flex-col items-center gap-4">
      <div data-testid="next-teaser" className="border-2 border-[#20203a] bg-[#fffdf7] px-[18px] py-3 text-center text-[15px] font-bold leading-[1.5] text-[#26233a] shadow-[4px_4px_0_#b98a2f]">
        지금까지 ‘{here}’{josa(here, "을/를").slice(here.length)} 살펴봤어.
        <br />
        다음 장에서는 ‘{there}’{josa(there, "을/를").slice(there.length)} 함께 볼게!
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
export default function PremiumBook({ report, flush = false, finale, previewBlur = false }: { report: PremiumReportView; flush?: boolean; /** 프리미엄 "미리 보기" 화면에서만 true: 5쪽부터 핵심 풀이를 흐리게 가려 */ previewBlur?: boolean; /** 마지막 쪽 끝에 붙는 마무리(한 줄 결론 등) */ finale?: ReactNode }) {
  const pages = report.book;
  const [i, setI] = useState(0);
  const [unlockMsg, setUnlockMsg] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
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
  const won = report.compat ? "조약돌 2개" : "진주 3개 + 조약돌 1개";
  const unlock = (
    <button
      type="button"
      data-testid="unlock-button"
      onClick={() => setUnlockMsg(true)}
      className="mt-3 w-full rounded-full bg-gradient-to-r from-[#f0d9a0] to-[#d3ac62] py-2.5 text-[13px] font-bold text-[#1b1824] active:scale-95 transition-transform"
    >
      {previewBlur ? `전체 사주서 열기 (정식 오픈 후 ${won})` : `${won}으로 전체 열기`}
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
      data-no-click-fx=""
      tabIndex={-1}
      onKeyDown={(e: { key: string }) => {
        if (e.key === "ArrowRight") go(i + 1);
        if (e.key === "ArrowLeft") go(i - 1);
      }}
      className={`mx-auto max-w-[440px] md:max-w-[720px] text-[#efe7d3] scroll-mt-4 ${flush ? "pt-2" : "rounded-[1.75rem] bg-[#10142b] p-5 sm:p-6 shadow-[0_20px_60px_rgba(20,16,34,0.45)] border border-[#e6c887]/30"}`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-[11px] font-bold tracking-[0.18em] ${GOLD}`}>DORI 20쪽 사주서</span>
        <span className="flex items-center gap-2">
          <button
            type="button"
            data-testid="book-toc-toggle"
            aria-expanded={tocOpen}
            aria-controls="book-toc"
            onClick={() => setTocOpen((v) => !v)}
            className={`rounded-full border ${HAIR} px-2.5 py-0.5 text-[11px] font-bold ${GOLD} active:scale-95 transition-transform`}
          >
            목차 {tocOpen ? "▴" : "▾"}
          </button>
          <span data-testid="book-counter" className="text-xs tabular-nums text-[#e8dfca]/70">
            {num(page.no)} / {num(pages.length)}
          </span>
        </span>
      </div>

      {tocOpen && (
        <ol id="book-toc" data-testid="book-toc" aria-label="목차" className={`mt-2 rounded-2xl border ${HAIR} bg-white/[0.04] px-3 py-2`}>
          {pages.map((p, k) => {
            const t = titleParts(p.title);
            const closed = previewBlur && p.no >= PREVIEW_OPEN_PAGES;
            return (
              <li key={p.key}>
                <button
                  type="button"
                  data-testid={`book-toc-${p.no}`}
                  onClick={() => {
                    go(k);
                    setTocOpen(false);
                  }}
                  aria-current={k === i ? "page" : undefined}
                  className={`flex w-full items-baseline gap-3 py-1.5 text-left text-[13px] ${k === i ? `font-bold ${GOLD}` : "text-[#efe7d3]"}`}
                >
                  <span className="w-6 shrink-0 tabular-nums text-[11px] text-[#e8dfca]/60">{num(p.no)}</span>
                  <span className="flex-1">{t.small ? `${t.small} · ${t.main}` : t.main}</span>
                  {closed && <span aria-label="잠김" className="text-[11px]">🔒</span>}
                </button>
              </li>
            );
          })}
        </ol>
      )}

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
                미리보기에서는 전체 {pages.length}쪽 중 <b className={GOLD}>앞 {PREVIEW_OPEN_PAGES - 1}쪽</b>만 볼 수 있어. {PREVIEW_OPEN_PAGES}쪽부터는 풀이가 가려져 있어.
              </>
            ) : (
              <>
                전체 {pages.length}쪽 중 <b className={GOLD}>{lockedTotal}개 풀이</b>가 잠겨 있어. 흐리게 보이는 부분이 가장 궁금한 ‘언제’와 ‘어떻게’야.
              </>
            )}
          </p>
          {unlock}
          {unlockMsg && (
            <p role="status" data-testid="unlock-message" className="mt-2 text-center text-[11.5px] font-bold text-[#f6dfa8]">
              지금은 베타 테스트 중이라 결제를 받지 않아. 정식 오픈하면 여기서 전체 사주서를 열 수 있어 ❄️
            </p>
          )}
        </div>
      )}

      <article aria-labelledby="book-title" data-testid="book-page" data-page={page.no} className="mt-4 flex flex-col gap-[18px]">
        <h3 id="book-title" className="sr-only">
          {page.title}
        </h3>
        <ChapterCover page={page} />

        {/* 도리 한 마리에 말풍선 하나: AI 한 줄이 있으면 그것을, 없으면 쪽 첫 문장을 보여. */}
        <div data-testid={page.key === "concernTop" ? "book-opening" : page.note ? "book-note" : "book-lead"}>
          <BubbleRow text={page.key === "concernTop" ? openingBubble(report.viewerName) : page.note ? `도리의 한 줄 · ${page.note}` : page.lead} img={pic} />
        </div>

        {/* 손님이 고른 고민에 대한 답은 첫 쪽 위가 아니라, 같은 주제를 다루는 '요즘 고민 맞춤 풀이' 쪽에 둬. */}
        {page.key === "concern" && report.concern && <ConcernCard concern={report.concern} dark />}

        {/* 미리보기에서 가려진 쪽은 계산 값을 서버가 비워 보내서, 그림도 보여주지 않아. */}
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
            <p className="mt-3 text-[11px] text-[#e8dfca]/50">사주로 가볍게 그려 본 재미용 상상이야.</p>
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
            {gi > 0 && <BubbleRow text={`이어서 ‘${g[0].heading.replace(/ · .*$/, "")}’ 이야기를 들려줄게.`} img={pic} right={gi % 2 === 1} />}
            <div className="hanji-wrap">
            <div className="hanji-page px-5 pb-[18px] pt-[22px] text-[#26233a]">
              <span aria-hidden="true" className="hanji-tex" />
              <i aria-hidden="true" className="hanji-curl bl" />
              <i aria-hidden="true" className="hanji-curl br" />
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
                        <span className="sr-only">잠긴 풀이야. 전체 열기를 누르면 볼 수 있어.</span>
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
            <p className={`text-[13px] font-bold ${GOLD}`}>🔒 핵심 풀이는 흐리게 가려져 있어</p>
            <p className="mt-1 text-[12px] leading-relaxed text-[#e8dfca]/80">미리 보기에서는 1~4쪽만 전부 볼 수 있어. 내 사주의 진짜 이야기는 프리미엄 사주서에서 확인해 봐.</p>
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
          이 페이지에 잠긴 풀이 {lockedHere}개 · 위의 ‘전체 열기’로 볼 수 있어
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
      <p className="mt-4 text-center text-[11px] leading-relaxed text-[#8f95c0]">명리학의 일반적인 관점으로 풀어 쓴 재미와 참고용 해석이야.</p>
    </div>
  );
}
