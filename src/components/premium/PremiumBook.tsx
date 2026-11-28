"use client";

import { TENGODS_EXPLAINER } from "@/lib/premium/book/tengodsExplainer";
import { BRIDGES, chapterOpening, elementFocus, sectionLink } from "@/lib/premium/flow";
import { softToDeep } from "@/lib/premium/deepTone";
import { getBrowserStorage } from "@/lib/drawCounter";
import { flattenDeep } from "@/lib/premium/deepMark";
import { readRealityPick, saveRealityPick } from "@/lib/realityPick";
import { ConfirmChoice } from "@/components/ConfirmChoice";
import { PREVIEW_OPEN_PAGES } from "@/lib/premium/config";
import ConcernCard from "./ConcernCard";
import { josa } from "@/lib/premium/josa";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { checkMessage } from "@/lib/premium/book/resonance";
import type { BookChart, BookPage, BookRow, BookTable, PremiumReportView, RealityCheck } from "@/lib/premium/types";
import { elementOfChar, elName } from "@/lib/elementColor";
import ElementTile from "@/components/ElementTile";
import DayMasterScene, { CAPTION as DAY_MASTER_CAPTION } from "./DayMasterScene";
import { dayMasterOf } from "@/lib/premium/dayMaster";
import { MORE_LABELS, SENTENCE_LABELS } from "@/lib/premium/partnerProfile";
import { DAYMASTER_BRIEF, MBTI_BRIEF, cleanMbti } from "@/lib/mbtiBrief";
import { fillLetterMbti, mbtiDecadeLine } from "@/lib/mbtiLine";
import { MBTI_MARK } from "@/lib/premium/book/lifeFlow";
import { formatWon } from "@/lib/premium/book/charts";
import { callName } from "@/lib/ai/nameRepair";
import BodyFigure from "./BodyFigure";
import DoriIcon from "@/components/landing/DoriIcon";
import { BODY_GROUPS, STATE_SHORT, STATE_TEXT, bodyElName, bodyStates, bodyWhy, dailyRoutine, monthlyCondition, monthlySummary, yearFocus, type BodyEl, type BodyState } from "@/lib/premium/bodyMap";

/*
 * 프리미엄 20페이지 리포트 리더. 한 번에 한 페이지씩 넘겨 보는 고급스러운 책 형태예요.
 * 색: 미드나잇 + 샴페인 골드. 글씨는 항상 충분히 밝은 대비를 유지해요.
 */

const SCENE_BRIDGE = "일단 사주팔자 글자를 보기 전에, 네가 태어난 그 순간의 너만의 날씨 지도를 먼저 그려 줄게.";
const GOLD = "text-[#e6c887]";
const HAIR = "border-[#e6c887]/25";

/** "나와 비슷해요"를 눌러 확인해 보는 목록. 누른 개수에 따라 한마디가 나와요. (저장하지 않고 화면에서만 써요) */
/** '십성이란?' 안에서 "예를 들어" 문단이 끝나고 다음 문단이 시작되는 자리 */
const TENGODS_MORE_AT = "\n\n이름이 붙고 나면";
const REL_EL = ["목", "화", "토", "금", "수"] as const;
const REL_COL: Record<string, string> = { 목: "text-[#8fd19a]", 화: "text-[#ff9d8a]", 토: "text-[#e0c27a]", 금: "text-[#d6dbe6]", 수: "text-[#8ec5ff]" };

/** 접어 둔 "자세한 글자들 간의 관계": 오행이 서로 만들어 주고 눌러 주는 관계와 일간별 십성 표 */
function TengodsRelations() {
  const gives = ["목은 불(화)을 키워 줘", "불은 타고 남아 흙(토)이 돼", "흙은 안에서 쇠(금)를 길러", "쇠는 차게 맺혀 물(수)을 만들어", "물은 나무(목)를 자라게 해"];
  const hits = ["나무(목)는 뿌리로 흙(토)을 뚫어", "흙(토)은 물(수)길을 막아", "물(수)은 불(화)을 꺼", "불(화)은 쇠(금)를 녹여", "쇠(금)는 나무(목)를 잘라"];
  return (
    <details data-testid="tengods-relations" className="group my-3 rounded-xl border border-[#e6c887]/30 bg-white/[0.04]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-[14px] font-bold text-[#e6c887] [&::-webkit-details-marker]:hidden">
        <span>자세한 글자들 간의 관계</span>
        <span className="text-[12px] font-semibold text-[#e8dfca]/70 group-open:hidden">더 보기 ▾</span>
        <span className="hidden text-[12px] font-semibold text-[#e8dfca]/70 group-open:inline">접기 ▴</span>
      </summary>
      <div className="space-y-3 px-3 pb-3.5 text-[13.5px] leading-[1.65] text-[#f3ecdc]">
        <div>
          <p className="font-bold text-[#e6c887]">서로 만들어 줘 (상생)</p>
          <ul className="mt-1 space-y-0.5">
            {gives.map((t) => (
              <li key={t}>· {t}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-bold text-[#e6c887]">서로 눌러 줘 (상극)</p>
          <ul className="mt-1 space-y-0.5">
            {hits.map((t) => (
              <li key={t}>· {t}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-bold text-[#e6c887]">내 일간이 ○일 때, 각 글자는 이런 십성</p>
          <div className="mt-1.5 overflow-x-auto">
            <table className="w-full min-w-[300px] border-collapse text-center text-[13px]">
              <thead>
                <tr className="text-[#e8dfca]/70">
                  <th className="border-b border-[#e6c887]/25 px-1 py-1.5 font-semibold">내 일간</th>
                  {["비겁", "식상", "재성", "관성", "인성"].map((g) => (
                    <th key={g} className="border-b border-[#e6c887]/25 px-1 py-1.5 font-semibold">{g}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {REL_EL.map((el, i) => (
                  <tr key={el}>
                    <th className={`border-b border-white/10 px-1 py-1.5 font-bold ${REL_COL[el]}`}>{el}</th>
                    {[0, 1, 2, 3, 4].map((k) => {
                      // 같은 기운, 내가 만들어 주는 기운, 내가 다루는 기운, 나를 눌러 주는 기운, 나를 만들어 주는 기운 (오행 순서로 0·1·2·3·4칸)
                      const idx = (i + k) % 5;
                      return (
                        <td key={k} className={`border-b border-white/10 px-1 py-1.5 font-bold ${REL_COL[REL_EL[idx]]}`}>{REL_EL[idx]}</td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-1.5 text-[12.5px] text-[#e8dfca]/70">예: 내 일간이 목이면 목=비겁, 화=식상, 토=재성, 금=관성, 수=인성. 여기에 음양이 같으면 ‘편’, 다르면 ‘정’이 붙어 열 가지 이름이 돼.</p>
        </div>
      </div>
    </details>
  );
}

/** AI 가 쓴 장은 문단(빈 줄)과 "- " 목록, **굵은 핵심**이 들어 있어요. 일반 문장은 그대로 한 문단이에요. */
function bold(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((t, i) =>
    t.startsWith("**") && t.endsWith("**") && t.length > 4 ? (
      <strong key={i} className="font-bold text-[#1d1a30] bg-[linear-gradient(transparent_50%,#cdaeff_50%)]">{withStones(t.slice(2, -2))}</strong>
    ) : (
      <span key={i}>{withStones(t)}</span>
    ),
  );
}

const GOD_GROUP: Record<string, string> = { 비견: "비겁", 겁재: "비겁", 식신: "식상", 상관: "식상", 편재: "재성", 정재: "재성", 편관: "관성", 정관: "관성", 편인: "인성", 정인: "인성" };

/** 글 속 작은 십성 돌: 관성 같은 이름 뒤 괄호 풀이("쉽게 말하면 …") 자리에 돌 그림을 넣어요 */
function InlineStone({ group }: { group: string }) {
  const img = GOD_IMG[group];
  if (!img) return null;
  return (
    <span aria-hidden="true" className="relative mx-0.5 inline-flex h-[22px] w-[22px] -translate-y-[1px] items-center justify-center align-middle">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/images/gods/${img}.webp`} alt="" width={22} height={22} className="absolute inset-0 h-full w-full select-none object-contain" draggable={false} />
      <span className="relative font-serifKr text-[10px] font-black leading-none text-[#fff3cf] [paint-order:stroke_fill] [-webkit-text-stroke:2px_rgba(10,8,20,0.85)]">{GOD_HANJA[group]}</span>
    </span>
  );
}

const PILLAR_TERMS = ["연주", "월주", "일주", "시주"];
/** 사주 용어(기둥 이름·십성 이름)를 찾는 식. 앞뒤 따옴표와 예전 풀이 괄호("(쉽게 말하면 …)"·"(돌)")는 같이 먹어서 새로 정리해요.
 * 한글 낱말 가운데이거나(일주일·상관없다), 조사·문장부호가 바로 뒤에 오지 않으면 다른 뜻으로 보고 건드리지 않아요. */
const TERM_RE = /(?<![가-힣])(?:‘|')?(연주|월주|일주|시주|비겁|식상|재성|관성|인성|비견|겁재|식신|상관|편재|정재|편관|정관|편인|정인)(?:’|')?(?:\s*\(\s*(?:쉽게 (?:말하면|말해|풀면)[^)]*|돌)\))?(?=(?:은|는|이|가|의|에|를|을|와|과|로|으로|도|만|란|라|,|\.|\)|\s|$|’|'))/g;

/** 글 속 사주 용어 꾸미기: 작은따옴표로 감싸고, 십성 이름 뒤에는 작은 십성 돌을 괄호 안에 넣어요(나올 때마다. 번잡하면 다시 줄여요) */
function withStones(text: string) {
  const out: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(TERM_RE)) {
    const at = m.index ?? 0;
    const term = m[1];
    out.push(text.slice(last, at));
    last = at + m[0].length;
    if (PILLAR_TERMS.includes(term)) {
      out.push(`‘${term}’`);
      continue;
    }
    const g = GOD_GROUP[term] ?? term;
    out.push(<span key={at}>‘{term}’({<InlineStone group={g} />})</span>);
  }
  if (last === 0) return text;
  out.push(text.slice(last));
  return out;
}

/** 실천 목록·한 줄 마무리·읽는 방법은 강조 밑줄 없이 담백하게 보여요. (AI 가 별표로 감싼 곳도 밑줄 없이 글자만 보여요) */
const PLAIN_HEADINGS = ["이렇게 해보자", "한 줄 마무리", "이 책을 읽는 방법", "이 리포트는 이렇게 읽어 줘", "이 리포트를 읽는 방법"];

function RichBlocks({ text, plain }: { text: string; plain: boolean }) {
  const blocks = (plain ? text.replace(/\*\*/g, "") : text).split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <>
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
    </>
  );
}

function RichBody({ text, plain = false }: { text: string; plain?: boolean }) {
  // 십성 장처럼 [더 깊이] 표시가 있는 글은 접지 않고, 표시만 빼서 한 흐름으로 이어 보여 줘요.
  return (
    <div className="mt-1.5 space-y-3 text-[15px] leading-[1.85] text-[#322f47] [word-break:keep-all]">
      <RichBlocks text={flattenDeep(text)} plain={plain} />
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
          className={`flex w-full items-start gap-2.5 rounded-xl border px-3.5 py-3 text-left text-[15px] leading-relaxed transition-colors ${
            on[i] ? "border-[#b98a2f] bg-[#f1d98e]/50 text-[#1d1a30]" : "border-[#9a93b0]/50 bg-white/60 text-[#322f47] hover:border-[#b98a2f]"
          }`}
        >
          <span
            aria-hidden="true"
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[13px] font-black ${on[i] ? "border-[#b98a2f] bg-[#b98a2f] text-white" : "border-[#9a93b0] text-transparent"}`}
          >
            ✓
          </span>
          <span>{t}</span>
        </button>
      ))}
      <p role="status" data-testid="book-checks-result" className="min-h-[1.25rem] pt-0.5 text-[14.5px] font-bold text-[#8a5f12]">
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
      <p className="text-[15px] font-bold text-[#8a5f12]">🔎 지금 내 현실과 견줘 보기</p>
      <p className="mt-1 text-[15px] leading-relaxed text-[#322f47]">{rc.question}</p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {rc.options.map((o, i) => (
          <button
            key={o.label}
            type="button"
            aria-pressed={pick === i}
            disabled={pick !== null}
            onClick={() => setAsking(i)}
            className={`rounded-full border px-3.5 py-1.5 text-[14.5px] font-bold transition-colors ${
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
      <p role="status" data-testid="book-reality-result" className="min-h-[1.25rem] pt-2.5 text-[15px] leading-relaxed text-[#1d1a30]">
        {pick !== null ? rc.options[pick].message : ""}
      </p>
    </div>
  );
}

/** 이 풀이를 어떤 계산에서 가져왔는지 접어서 보여줘요. */
function Evidence({ rows }: { rows: BookRow[] }) {
  return (
    <details data-testid="book-evidence" className="mt-6 rounded-xl border border-[#e6c887]/25 bg-white/[0.03] px-4 py-3 text-[15px] text-[#efe7d3]">
      <summary className="cursor-pointer select-none font-bold text-[#e6c887]">이 풀이의 근거 보기</summary>
      <ul className="mt-2.5 space-y-1.5">
        {rows.map((r, i) => (
          <li key={`${r.label}-${i}`} className="flex gap-3 leading-snug">
            <span className="w-24 shrink-0 text-[#e8dfca]/70">{r.label}</span>
            <span>{r.value}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2.5 text-[13px] leading-relaxed text-[#e8dfca]/60">입력한 생년월일시로 계산한 값이야. 풀이는 재미와 참고용이야.</p>
    </details>
  );
}

function Table({ t }: { t: BookTable }) {
  return (
    <div className="mt-6">
      <h4 className={`text-[13px] font-bold tracking-[0.18em] ${GOLD} mb-2`}>{t.title}</h4>
      <ul className={`divide-y divide-[#e6c887]/15 rounded-2xl border ${HAIR} bg-white/[0.03]`}>
        {t.rows.map((row, i) => (
          <li key={`${row.label}-${i}`} data-testid="book-row" className={`flex gap-3 px-4 py-2.5 text-[15px] leading-snug ${row.highlight ? "bg-[#e6c887]/10" : ""}`}>
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
                <span className={`ml-2 text-[13px] text-[#e6c887] ${row.locked ? "select-none blur-[4px]" : ""}`} aria-hidden={row.locked ? "true" : undefined}>
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
  const padX = chart.axis ? 28 : 14;
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
      <p className={`text-[14px] font-bold tracking-[0.12em] ${GOLD}`}>{chart.title}</p>
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
        {chart.axis && (
          <g fontSize="9" fill="#e8dfca" fillOpacity="0.6">
            <text x="2" y={y(0.9 * maxV) + 3}>{chart.axis.high}</text>
            <text x="2" y={y(0.5 * maxV) + 3}>{chart.axis.mid}</text>
            <text x="2" y={y(0.12 * maxV) + 3}>{chart.axis.low}</text>
          </g>
        )}
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
            {p.tag && !p.locked && (
              <text x={x(i)} y={y(val(p)) + 14} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#f3e7c9">{p.tag}</text>
            )}
            <text x={x(i)} y={H - 16} textAnchor="middle" fontSize="9.5" fill="#e8dfca" fillOpacity="0.85">{p.age}</text>
          </g>
        ))}
        <text x={W - padX} y={H - 3} textAnchor="end" fontSize="9" fill="#e8dfca" fillOpacity="0.6">{asset ? "나이(세, 대운 시작 기준) · 세로: 가상 누적 자산" : "나이(세, 대운 시작 기준)"}</text>
      </svg>
      <ul className="mt-2 space-y-1">
        {chart.callouts.map((c) => (
          <li key={c.label} className="text-[14.5px] leading-relaxed text-[#f5efe0]">
            <span className={`font-bold ${GOLD}`}>{c.label}</span> · {c.text}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[13px] leading-relaxed text-[#e8dfca]/60">{chart.caption}</p>
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
      <p className={`text-[14px] font-bold tracking-[0.12em] ${GOLD}`}>{table.title}</p>
      <div className="mt-3 flex h-[120px] items-end gap-[5px] border-b border-white/15" role="img" aria-label={`${table.title} 막대 그래프`}>
        {rows.map((r, i) => (
          <div key={`${r.label}-${i}`} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
            <span className="mb-0.5 h-3 text-[11.5px] leading-none text-[#f6dfa8]">{r.locked ? "🔒" : r.highlight ? "★" : ""}</span>
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
          <span key={`${r.label}-l${i}`} className={`min-w-0 flex-1 text-center text-[11.5px] ${r.current ? "font-bold text-white" : "text-[#e8dfca]/80"}`}>
            {monthOf(r.label)}
          </span>
        ))}
      </div>
      <p className="mt-2 flex flex-wrap gap-x-3 text-[13px] text-[#e8dfca]/80">
        <span><b aria-hidden="true" className="mr-1 inline-block h-2 w-2 rounded-sm bg-[#f6dfa8]" />포인트 달 ★</span>
        <span><b aria-hidden="true" className="mr-1 inline-block h-2 w-2 rounded-sm bg-[#e6c887]/40" />잔잔한 달</span>
        <span>흰 테두리 = 지금</span>
      </p>
      <p className="mt-2 text-[13px] leading-relaxed text-[#e8dfca]/60">달마다 이 주제와 닿는 기운이 얼마나 힘을 받는지 보여 주는 상대 지수야. 높다고 꼭 좋은 일이 생긴다는 뜻은 아니고, 힘을 쏟기 좋은 때를 읽는 참고용 그림이야.</p>
    </div>
  );
}

const GOD_HANJA: Record<string, string> = { 비겁: "比", 식상: "食", 재성: "財", 관성: "官", 인성: "印" };
const GOD_IMG: Record<string, string> = { 비겁: "bigyeop", 식상: "siksang", 재성: "jaeseong", 관성: "gwanseong", 인성: "inseong" };

/** 십성 돌 한 개: 묶음마다 다른 돌 그림 위에 한자를 얹어요. 가장 두드러진 묶음은 금빛 테두리로 빛나요 */
function GodStone({ label }: { label: string }) {
  const img = GOD_IMG[label];
  return (
    <div className="relative flex h-[52px] w-[52px] items-center justify-center drop-shadow-[0_3px_3px_rgba(0,0,0,0.45)]">
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/images/gods/${img}.webp`} alt="" width={52} height={52} className="absolute inset-0 h-full w-full select-none object-contain" draggable={false} />
      ) : (
        <span aria-hidden="true" className="absolute inset-0 rounded-[14px] bg-[#2d3466]" />
      )}
      <span aria-hidden="true" className="relative font-serifKr text-[22px] font-black leading-none text-[#fff3cf] [paint-order:stroke_fill] [-webkit-text-stroke:3px_rgba(10,8,20,0.85)] [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]">
        {GOD_HANJA[label] ?? label[0]}
      </span>
    </div>
  );
}

/** 십성 돌 쌓기: 5가지 기운마다 돌을 개수만큼 쌓아서 어디에 힘이 실려 있는지 보여 줘요 (오행 분포와 같은 모양) */
function GodBars({ table }: { table: BookTable }) {
  const rows = table.rows.map((r) => ({ ...r, n: r.locked ? 0 : Number(r.value.match(/\d+/)?.[0] ?? 0) }));
  if (rows.length === 0) return null;
  const hotRows = rows.filter((r) => r.highlight && !r.locked && r.n > 0);
  return (
    <div data-testid="god-bars" className="mb-2">
      <p className={`text-[14px] font-bold tracking-[0.12em] ${GOLD}`}>내가 가진 기운의 크기</p>
      <div role="img" aria-label={rows.map((r) => `${r.label} ${r.locked ? "잠김" : r.n}`).join(", ")} className="mt-3 flex items-end justify-between rounded-[20px] border border-[#d9ccb0] bg-[#f1e8d6] px-2.5 pb-4 pt-4">
        {rows.map((r) => {
                    return (
            <div key={r.label} data-testid="god-row" className="flex w-[18%] min-w-0 flex-col items-center gap-1.5">
              <div className="flex min-h-[110px] flex-col-reverse items-center gap-1 pb-0.5">
                {r.locked ? (
                  <div className="flex h-[52px] w-[52px] items-center justify-center rounded-[15px] border-[1.5px] border-dashed border-[#b9aa8a] text-[16px] opacity-70">🔒</div>
                ) : r.n === 0 ? (
                  <div className="h-[52px] w-[52px] rounded-[15px] border-[1.5px] border-dashed border-[#b9aa8a] opacity-70" />
                ) : (
                  Array.from({ length: r.n }, (_, i) => <GodStone key={i} label={r.label} />)
                )}
              </div>
              <div className="h-[1.5px] w-full bg-[#b9aa8a]" />
              <div className="text-[14px] font-bold text-[#8a5a12]">{r.label}</div>
              <div className="text-[18px] font-bold leading-none text-[#3a3020]">{r.locked ? "🔒" : r.n}<span className="text-[11px] font-normal text-[#3a3020]/60">{r.locked ? "" : "개"}</span></div>
            </div>
          );
        })}
      </div>
      {hotRows.map((r) => r.note && (
        <p key={r.label} className="mt-2 px-1 text-[13px] leading-relaxed text-[#e8dfca]/80">
          <b className={GOLD}>{r.label}</b>이 가장 많이 쌓여 있으니, {josa(r.note, "이/가")} 강하다는 뜻이야.
        </p>
      ))}
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
      <p className={`text-[14px] font-bold tracking-[0.12em] ${GOLD}`}>{table.title}</p>
      <ol className="mt-3 grid grid-cols-5 gap-1.5">
        {rows.map((r, i) => (
          <li key={r.label} aria-current={r.current ? "true" : undefined} className={`rounded-xl border px-0.5 py-2 text-center ${r.current ? "border-[#e6c887] bg-[#e6c887] text-[#1b1824]" : `${HAIR} bg-white/[0.04] text-[#f5efe0]`}`}>
            <div className="text-[13px] font-bold">{r.label.replace("년", "")}</div>
            <div className="my-0.5 font-serifKr text-[15px] font-bold">{r.locked ? "●●" : r.value}</div>
            <div className={`text-[11.5px] ${r.current ? "text-[#1b1824]/75" : "text-[#e8dfca]/70"}`}>{tag(i)}{!r.locked && top > 0 && r.bar === top ? " ★" : ""}</div>
            {r.locked ? (
              <span className="mt-1 block text-[11.5px]">🔒</span>
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
      <p className="mt-2 text-[13px] leading-relaxed text-[#e8dfca]/60">점이 크고 밝을수록 그 해에 이 주제의 기운이 힘을 받아. 흐름의 높낮이를 보는 참고용이야.</p>
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
      <p className={`text-[14px] font-bold tracking-[0.12em] ${GOLD}`}>10년마다 달라지는 기운의 세기</p>
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
      <p className="mt-1 text-[13px] leading-relaxed text-[#e8dfca]/60">높은 때는 힘이 차오르는 시기, 낮은 때는 쉬며 준비하는 시기야. 낮다고 나쁜 때가 아니고 &lsquo;지금 어울리는 속도&rsquo;를 보는 참고용 그림이야. 흰 점이 지금이야.</p>
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
      <p className={`text-[14px] font-bold tracking-[0.12em] ${GOLD}`}>기운별로 챙기면 좋은 곳</p>
      <div className="mt-3">
        <BodyFigure states={states} focus={focus} />
      </div>
      {focusGroup && report.seyun && (
        <p data-testid="body-year" className={`mt-3 rounded-2xl border ${HAIR} bg-white/[0.04] px-3 py-2.5 text-[14.5px] leading-relaxed text-[#f3ecdc]`}>
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
                <span className={`w-9 shrink-0 rounded-full border py-0.5 text-center text-[13px] font-bold ${HAIR} ${GOLD}`}>{elName(e.name)}</span>
                <span className="flex-1 text-[15px] font-bold text-[#f5efe0]">{g.area}</span>
                <span className={`rounded-full px-2 py-0.5 text-[11.5px] font-bold ${k.c}`}>{k.t}</span>
              </div>
              <p data-testid="body-why" className={`ml-11 mt-1.5 rounded-r-lg border-l-[3px] border-[#e6c887] bg-white/[0.05] px-2 py-1 text-[14px] leading-relaxed text-[#f3ecdc]`}>{bodyWhy(g.el, states[g.el] ?? "ok", els)}</p>
              <p className="ml-11 mt-1 text-[13px] text-[#e8dfca]/70">{g.habit}</p>
            </li>
          );
        })}
      </ul>
      <MonthCalendar report={report} states={states} />
      <DailyRoutine states={states} />
      <p className="mt-2 text-[13px] leading-relaxed text-[#e8dfca]/60">병이나 증상을 알려 주는 그림이 아니야. 생활 습관을 정할 때 참고하는 전통 오행 대응이고, 몸이 불편하면 꼭 전문가와 상담해 줘.</p>
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
      <p className={`text-[14px] font-bold tracking-[0.12em] ${GOLD}`}>월별 컨디션 달력</p>
      <p className="mt-1 text-[13px] leading-relaxed text-[#e8dfca]/70">올해 달마다 어느 부위를 챙기면 좋은지 보여 줘. 칸을 눌러 봐.</p>
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
            <span className="block text-[13px] text-[#e8dfca]/70">{c.label}</span>
            <i
              aria-hidden="true"
              className="mx-auto my-1 block h-3.5 w-3.5 rounded-full"
              style={{ background: BODY_DOT[c.el], outline: c.state === "fill" ? "2px dashed rgba(255,255,255,0.5)" : undefined, outlineOffset: 2, boxShadow: c.state === "rest" ? "0 0 0 3px rgba(253,164,175,0.5)" : undefined }}
            />
            <span className="block text-[14px] font-bold text-[#f5efe0]">{c.group.label}</span>
            <span className={`block text-[11.5px] ${c.state === "fill" ? "text-sky-200" : c.state === "rest" ? "text-rose-200" : "text-[#e8dfca]/60"}`}>{STATE_SHORT[c.state]}</span>
          </button>
        ))}
      </div>
      <p data-testid="body-month-detail" className={`mt-3 rounded-2xl border border-[#e6c887]/60 bg-[#e6c887]/10 px-3 py-2.5 text-[14.5px] leading-relaxed text-[#f3ecdc]`}>{cal[at].text}</p>
      <div className="mt-2 space-y-1 text-[14px] leading-relaxed text-[#e8dfca]/80">
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
      <p className={`text-[14px] font-bold tracking-[0.12em] ${GOLD}`}>하루 루틴 처방</p>
      <p className="mt-1 text-[13px] leading-relaxed text-[#e8dfca]/70">내 기운 상태를 하루 시간표로 옮겼어. 점 색은 어느 부위를 위한 습관인지 알려 줘.</p>
      <div className="mt-3 space-y-2">
        {slots.map((sl) => (
          <div key={sl.time} className={`flex gap-3 rounded-2xl border ${HAIR} bg-white/[0.04] px-3 py-2.5`}>
            <span className={`w-12 shrink-0 text-[15px] font-extrabold ${GOLD}`}>{sl.time}</span>
            <ul className="min-w-0 flex-1 space-y-1.5">
              {sl.items.map((it) => {
                const g = BODY_GROUPS.find((x) => x.el === it.el);
                return (
                  <li key={it.text} className="flex items-start gap-2 text-[15px] text-[#f5efe0]">
                    <i aria-hidden="true" className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: BODY_DOT[it.el] }} />
                    <span>
                      {it.text}
                      <small className="block text-[13px] text-[#e8dfca]/60">{g?.area} · {bodyElName(it.el)} 기운 {STATE_TEXT[states[it.el] ?? "ok"]}</small>
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
function PrefaceExtras({ withLater = true }: { withLater?: boolean }) {
  return (
    <div data-testid="preface-extras" className="mt-4 space-y-3">
      <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[14px] text-[#e8dfca]/70">
        <span>네 기둥 = <b className={GOLD}>사주 四柱</b></span>
        <span aria-hidden="true" className="text-[#e8dfca]/40">/</span>
        <span>여덟 글자 = <b className={GOLD}>팔자 八字</b></span>
      </div>
      <p className="text-[15px] leading-relaxed text-[#e8dfca]/85">
        여덟 글자는 따로 놀지 않고 서로 돕고, 부딪히고, 어울려. 그 어울림으로 타고난 바탕과 힘이 나는 때를 읽어 나갈 거야.
      </p>
      {withLater && <PrefaceLater bare />}
    </div>
  );
}

/** 서문 끝: 왜 해마다 운세를 다시 보는지, 대운·세운·월운·일운, 매일 곁에 있는 친구 안내 */
function PrefaceLater({ bare = false }: { bare?: boolean }) {
  const lane: Array<[string, string]> = [
    ["타고난 집", "내 여덟 글자 (1~3장)"],
    ["10년의 계절", "대운"],
    ["한 해의 날씨", "세운"],
    ["달마다의 분위기", "월운"],
    ["오늘 하루의 기분", "일운"],
  ];
  return (
    <div data-testid="preface-later" className={bare ? "space-y-3" : "mt-4 space-y-3"}>
      <p className={`text-[13px] font-bold tracking-[0.12em] ${GOLD}`}>[참고사항]</p>
      <div className={`rounded-xl border-l-4 border-[#e6c887] bg-white/[0.05] px-3 py-2.5 text-[15px] font-bold leading-snug ${GOLD}`}>
        기둥은 태어날 때 한 번 세워졌는데, 왜 해마다 (그리고 매일) 운세를 다시 볼까?
      </div>
      <p className="text-[15px] leading-relaxed text-[#e8dfca]/85">
        집은 그대로여도 계절과 날씨는 바뀌기 때문이야. 같은 집에서도 봄엔 창을 열고 겨울엔 난방을 하듯, 같은 사람도 지나는 때에 따라 힘을 쓸 곳이 달라져.
      </p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[15px]">
        {lane.map(([a, b]) => (
          <div key={b} className="contents">
            <dt className={`font-bold ${GOLD}`}>{a}</dt>
            <dd className="text-[#e8dfca]/85">{b}</dd>
          </div>
        ))}
      </dl>
      <p className="text-[15px] leading-relaxed text-[#e8dfca]/85">
        그중 <b>일운</b>은 날마다 바뀌는 하루치 기운이야. 오늘 하루의 일기예보 같아서, 중요한 약속이나 마음 쓸 일을 고를 때 가볍게 참고하면 좋아. 그래서 매일 다시 봐도 의미가 있어.
      </p>
      <div className="rounded-xl bg-white/[0.06] px-3 py-3 text-[15px] leading-relaxed text-[#e8dfca]/90">
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

/** 네 기둥이 각각 무엇을 뜻하는지 (칸 위에 작게 붙여요) */
const PILLAR_MEANING: Record<string, string> = { year: "초년운·조상", month: "청년운·사회", day: "나·배우자", hour: "말년운·자식" };

/** 운명의 짝 프로필 줄들: 핵심은 먼저, 나머지는 "더 알아보기"로 접어 둬요. MBTI 는 연보라 칩, 한 문장 줄은 문장 상자로 보여 줘요. */
function PartnerRows({ rows }: { rows: Array<{ label: string; tags: string[] }> }) {
  const main = rows.filter((r) => !MORE_LABELS.includes(r.label));
  const more = rows.filter((r) => MORE_LABELS.includes(r.label));
  const one = (row: { label: string; tags: string[] }) => (
    <div key={row.label}>
      <dt className="text-[15px] font-bold text-[#f3ecdc]">{row.label}</dt>
      {SENTENCE_LABELS.includes(row.label) ? (
        <dd className="mt-1.5 rounded-r-xl border-l-[3px] border-[#b9a4ff] bg-white/[0.05] px-2.5 py-1 text-[14px] leading-relaxed text-[#e8dfca]/85">{row.tags.join(" · ")}</dd>
      ) : (
        <dd className="mt-1.5 flex flex-wrap gap-1.5">
          {row.tags.map((t, i) => (
            <span
              key={t}
              className={`rounded-full border px-3 py-1 text-[15px] font-semibold text-[#f3ecdc] ${row.label === "MBTI" && i === 0 ? "border-[#b9a4ff] bg-[#b9a4ff]/20 text-[#e5dcff]" : "border-[#e6c887]/60 bg-[#e6c887]/10"}`}
            >
              {t}
            </span>
          ))}
        </dd>
      )}
    </div>
  );
  return (
    <dl data-testid="partner-profile" className="mt-4 space-y-3 text-left">
      {main.map(one)}
      {more.length > 0 && (
        <details data-testid="partner-more" className="pt-1">
          <summary className="cursor-pointer rounded-xl border border-dashed border-[#e6c887]/40 py-1.5 text-center text-[14px] text-[#f0d9a0]">더 알아보기 ▾</summary>
          <div className="mt-3 space-y-3">{more.map(one)}</div>
        </details>
      )}
    </dl>
  );
}

/** 재물 달력: 12달을 타일로. 지수가 높은 달은 금빛, 잠긴 달은 자물쇠 */
function WealthCalendar({ table }: { table: BookTable }) {
  return (
    <div data-testid="wealth-calendar" className="mt-6">
      <p className={`text-[14px] font-bold tracking-[0.12em] ${GOLD}`}>🗓️ 앞으로 12달 재물 달력</p>
      <ul className="mt-3 grid grid-cols-3 gap-2">
        {table.rows.map((r, i) => {
          const hi = !r.locked && (r.bar ?? 0) >= 75;
          return (
            <li
              key={`${r.label}-${i}`}
              className={`rounded-xl border px-2 py-2.5 text-center ${r.current ? "outline outline-2 outline-offset-1 outline-white" : ""} ${hi ? "border-[#e6c887]/70 bg-[#e6c887]/15" : "border-white/10 bg-white/[0.04]"}`}
            >
              <div className="text-[12px] text-[#e8dfca]/70">{r.label}</div>
              {r.locked ? (
                <div className="mt-1 text-[18px] leading-none">🔒</div>
              ) : (
                <>
                  <div className={`mt-0.5 font-serifKr text-[22px] font-bold leading-tight ${hi ? "text-[#f6dfa8]" : "text-[#f5efe0]"}`}>{r.bar}</div>
                  <div className="mt-0.5 text-[12px] leading-snug text-[#e8dfca]/85 [word-break:keep-all]">{r.value}</div>
                </>
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-[13px] leading-relaxed text-[#e8dfca]/60">달마다 재물 기운이 얼마나 힘을 받는지 보여 주는 상대 지수야. 높다고 꼭 돈이 들어온다는 뜻은 아니고, 계획과 지출의 속도를 정하는 참고용 달력이야. 금빛 칸이 힘이 실리는 달, 흰 테두리가 이번 달이야.</p>
    </div>
  );
}

/** 돈 팔자 유형 카드 + 돈그릇 그림. 그릇 크기는 평생 재물 기운, 물높이는 지금 대운이에요. */
function WealthCard({ w }: { w: NonNullable<BookPage["wealth"]> }) {
  const size = w.bowl.size;
  const fill = w.bowl.fill;
  const rimW = (110 + size * 1.4) / 2;
  const bodyH = 70 + size * 0.7;
  const cx = 160;
  const top = 60;
  const bottom = top + bodyH;
  const level = top + bodyH * (1 - (fill / 100) * 0.85) - 6;
  const body = `M${cx - rimW} ${top} Q${cx - rimW} ${bottom + 10} ${cx} ${bottom + 10} Q${cx + rimW} ${bottom + 10} ${cx + rimW} ${top} Z`;
  return (
    <div data-testid="wealth-card" className={`mb-6 rounded-2xl border ${HAIR} bg-white/[0.04] px-4 py-5 text-center`}>
      <p className={`text-[12px] tracking-[0.18em] ${GOLD}`}>나의 돈 팔자</p>
      <p className="mt-0.5 font-serifKr text-[26px] font-extrabold leading-tight text-[#f6dfa8]">{w.name}</p>
      <span className="mt-1.5 inline-block -rotate-3 rounded-md border-[1.5px] border-[#b44a3c] px-3 py-0.5 text-[15px] font-extrabold tracking-[0.2em] text-[#ff9c8c]">{w.code}</span>
      <p className="mt-2.5 text-[15px] text-[#e8dfca]">{w.tagline}</p>
      <div className="mt-3.5 grid grid-cols-2 gap-2">
        {w.axes.map((ax) => (
          <div key={ax.a.letter} className="flex overflow-hidden rounded-xl border border-white/10 text-[13px]">
            {(["a", "b"] as const).map((k) => (
              <span key={k} className={`flex-1 py-1.5 ${ax.pick === k ? "bg-[#e6c887]/20 font-bold text-[#f6dfa8]" : "text-[#e8dfca]/45"}`}>{ax[k].label}</span>
            ))}
          </div>
        ))}
      </div>
      <svg viewBox={`0 0 320 ${bottom + 60}`} role="img" aria-label={`돈그릇 그림, ${w.bowl.tier}`} className="mx-auto mt-4 w-full max-w-[320px]">
        <defs>
          <clipPath id="wbClip"><path d={body} /></clipPath>
          <linearGradient id="wbBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3a4166" /><stop offset="1" stopColor="#232852" /></linearGradient>
          <linearGradient id="wbWater" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f6dfa8" /><stop offset="1" stopColor="#e6c887" /></linearGradient>
        </defs>
        <ellipse cx={cx} cy={bottom + 22} rx={rimW * 0.8} ry="8" fill="#000" opacity=".25" />
        <path d={body} fill="url(#wbBody)" stroke="#e6c887" strokeOpacity=".6" strokeWidth="2" />
        <g clipPath="url(#wbClip)">
          <rect x={cx - rimW} y={level} width={rimW * 2} height={bottom - level + 14} fill="url(#wbWater)" opacity=".9" />
          <path d={`M${cx - rimW} ${level} q${rimW / 4} -7 ${rimW / 2} 0 t${rimW / 2} 0 t${rimW / 2} 0 t${rimW / 2} 0`} fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="2" />
          {[0, 1, 2, 3, 4].map((i) => (
            <circle key={i} cx={cx - rimW * 0.6 + i * rimW * 0.3} cy={level + 18 + (i % 2) * 14} r={6 + (i % 3)} fill="#fff4cf" opacity=".55" />
          ))}
        </g>
        <ellipse cx={cx} cy={top} rx={rimW} ry="12" fill="#14172f" stroke="#e6c887" strokeWidth="2.2" />
        <ellipse cx={cx} cy={top} rx={rimW - 6} ry="8" fill="none" stroke="#e6c887" strokeOpacity=".35" />
        <path d={`M${cx - 24} ${top - 12} q-8 -16 0 -26 M${cx} ${top - 14} q-8 -18 0 -30 M${cx + 24} ${top - 12} q-8 -16 0 -26`} fill="none" stroke="#f6dfa8" strokeOpacity=".4" strokeWidth="2.5" strokeLinecap="round" />
        <text x={cx} y={bottom + 46} textAnchor="middle" fontSize="11" fill="#e8dfca" fillOpacity=".7">그릇 크기 {size} · 지금 물높이 {fill}</text>
      </svg>
      <p className="mt-1 text-[17px] font-bold text-[#f6dfa8]">{w.bowl.tier}</p>
      <p className="mt-0.5 text-[13px] text-[#e8dfca]/70">평생 재물 기운으로 본 그릇이야. 크다고 부자가 된다는 뜻이 아니라 재물 기운의 높낮이를 보는 참고용 그림이야.</p>
    </div>
  );
}

const STONE_KIND: Record<string, "wood" | "fire" | "earth" | "metal" | "water"> = { 목: "wood", 화: "fire", 토: "earth", 금: "metal", 수: "water" };
const STONE_HANJA: Record<string, string> = { 목: "木", 화: "火", 토: "土", 금: "金", 수: "水" };
const STONE_FOCUS: Record<string, string> = { fire: "70%", earth: "60%", wood: "55%", water: "55%", metal: "45%" };
const STONE_TONE: Record<string, { dark: string; tint: string; strength: number }> = {
  fire: { dark: "140,20,10", tint: "255,60,30", strength: 0.75 },
  earth: { dark: "100,55,10", tint: "230,150,40", strength: 0.75 },
  wood: { dark: "10,70,30", tint: "40,200,90", strength: 0.5 },
  water: { dark: "10,40,130", tint: "40,110,255", strength: 0.75 },
  metal: { dark: "55,60,75", tint: "200,210,225", strength: 0.75 },
};
/** 돌 한 개: 사주 글자 칸과 같은 오행 그림을 깔고 한자를 얹어요 */
function StoneTile({ name }: { name: string }) {
  const kind = STONE_KIND[name] ?? "earth";
  const t = STONE_TONE[kind];
  return (
    <div className="relative h-[54px] w-[54px] overflow-hidden rounded-[16px] shadow-[0_3px_6px_rgba(0,0,0,0.45)] ring-1 ring-white/25">
      <div aria-hidden="true" className="absolute inset-0 bg-cover [filter:saturate(1.3)_contrast(1.05)]" style={{ backgroundImage: `url(/images/el-${kind}.webp)`, backgroundPosition: `50% ${STONE_FOCUS[kind]}` }} />
      <div aria-hidden="true" className="absolute inset-0 mix-blend-soft-light" style={{ background: `rgb(${t.tint})`, opacity: t.strength }} />
      <div aria-hidden="true" className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 50%, rgba(${t.dark},0.45) 0, rgba(${t.dark},0) 65%)` }} />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/30 to-transparent" />
      <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center font-serifKr text-[26px] font-black leading-none text-white [paint-order:stroke_fill] [-webkit-text-stroke:3px_rgba(20,10,8,0.9)] [text-shadow:0_2px_4px_rgba(0,0,0,0.4)]">
        {STONE_HANJA[name]}
      </span>
    </div>
  );
}
const STONE_EASY: Record<string, string> = { 목: "나무", 화: "불", 토: "땅", 금: "쇠", 수: "물" };

/** 오행 분포: 기운마다 돌을 개수만큼 쌓아서 한눈에 보여 줘요. 0개는 점선 빈 자리. */
function ElementStones({ report }: { report: PremiumReportView }) {
  const dayStem = report.pillars.find((p) => p.key === "day")?.full?.[0] ?? "";
  const focus = elementFocus(report.elements, dayStem, report.yongsin);
  const order = ["목", "화", "토", "금", "수"];
  const list = order.map((n) => report.elements.find((e) => e.name === n)).filter((e): e is NonNullable<typeof e> => !!e);
  const lows = list.filter((e) => e.count === 0).map((e) => STONE_EASY[e.name]);
  const caption = [
    "돌이 많이 쌓인 기운이 강한 기운이야.",
    focus.center ? `개수가 같아도 ‘나 자신’을 뜻하는 ${STONE_EASY[focus.center]} 기운이 중심이야.` : "",
    focus.need ? `${lows.length > 1 ? "빈 자리 중엔" : "비어 있는 것 중엔"} ${STONE_EASY[focus.need]}가 더 필요해.` : "",
  ].filter(Boolean).join(" ");
  const summary = list.map((e) => `${STONE_EASY[e.name]} ${e.count}개`).join(", ");
  return (
    <div className="mb-6">
      <div data-testid="element-stones" role="img" aria-label={summary} className="flex items-end justify-between rounded-[20px] border border-[#2c3366] bg-[#1a1f40] px-2.5 pb-4 pt-4">
        {list.map((e) => {
          const isCenter = focus.center === e.name;
          const isNeed = focus.need === e.name;
          return (
            <div key={e.name} data-testid="element-row" className="flex w-[18%] min-w-0 flex-col items-center gap-1.5">
              <div
                className="min-h-[20px] whitespace-nowrap rounded-[9px] px-1.5 py-0.5 text-[11.5px] font-bold text-[#12132b]"
                style={{ background: isCenter ? "#f1d8a0" : isNeed ? "#9be3a3" : "transparent", opacity: isCenter || isNeed ? 1 : 0 }}
              >
                {isCenter ? "나의 중심" : isNeed ? "더 필요" : "\u00a0"}
              </div>
              <div className="flex min-h-[120px] flex-col-reverse justify-start items-center gap-1 pb-0.5">
                {e.count === 0 ? (
                  <div className="h-[54px] w-[54px] rounded-[16px] border-[1.5px] border-dashed border-[#4a5290] opacity-70" />
                ) : (
                  Array.from({ length: e.count }, (_, i) => <StoneTile key={i} name={e.name} />)
                )}
              </div>
              <div className="h-[1.5px] w-full bg-[#3a4380]" />
              <div className={`text-[15px] font-bold ${GOLD}`}>{elName(e.name)}</div>
              <div className="text-[18px] font-bold leading-none text-[#f5efe0]">{e.count}<span className="text-[11px] font-normal text-[#e8dfca]/70">개</span></div>
            </div>
          );
        })}
      </div>
      <p className="mt-2 px-1 text-[13px] leading-relaxed text-[#e8dfca]/80">{caption}</p>
    </div>
  );
}

function Visual({ page, report, laterAtEnd = false }: { page: BookPage; report: PremiumReportView; laterAtEnd?: boolean }) {
  if (page.chart) {
    const cal = page.key === "topic:money" ? page.tables.find((t) => t.title === "재물 달력") : undefined;
    return cal || page.wealth ? (
      <div className="mb-6">
        {page.wealth && <WealthCard w={page.wealth} />}
        <LifeChart chart={page.chart} />
        {cal && <WealthCalendar table={cal} />}
      </div>
    ) : (
      <LifeChart chart={page.chart} />
    );
  }
  switch (page.key) {
    case "preface":
    case "pillars":
      return (
        <div className="mb-6">
          {page.key === "preface" && (
            <p className="mb-3 text-[15px] leading-relaxed text-[#e8dfca]/85">
              태어난 <b className={GOLD}>해·달·날·시간</b>, 이 네 가지마다 글자를 위아래 두 개씩 적어. <mark className="rounded-md bg-[#e6c887]/25 px-1 py-0.5 font-bold text-[#fff3cf] [box-decoration-break:clone]">이 네 기둥을 ‘연주’·‘월주’·‘일주’·‘시주’라고 불러. 이 용어는 이 분석서 전반에 나오니까 꼭 기억해 둬.</mark> 위는 하늘의 기운(천간), 아래는 땅의 기운(지지)이야.
            </p>
          )}
          <div className="grid grid-cols-4 gap-2">
            {report.pillars.map((p) => {
              const [stem, branch] = p.full ? Array.from(p.full) : [null, null];
              const me = p.key === "day";
              return (
                <div key={p.key} className="min-w-0">
                  <div className={`text-center font-bold ${me ? "text-[15.5px] text-[#f6dfa8]" : `text-[14px] ${GOLD}`}`}>{p.label}</div>
                  <div className="mb-1.5 min-h-[2.4em] text-center text-[11.5px] leading-tight text-[#e8dfca]/60">{PILLAR_MEANING[p.key]}</div>
                  <div
                    data-testid="pillar-card"
                    data-me={me ? "true" : undefined}
                    className={`relative rounded-2xl border bg-white/[0.04] py-3 text-center ${me ? "border-2 border-[#e6c887] bg-[#e6c887]/[0.12] shadow-[0_0_18px_rgba(230,200,135,0.4)]" : HAIR}`}
                  >
                    {me && (
                      <>
                        <span aria-hidden="true" data-testid="pillar-me-badge" className="absolute -right-1.5 -top-2.5 z-10 rotate-6 rounded-[9px] bg-[#e6c887] px-2 py-1 text-[13px] leading-none text-[#3a2a07] shadow-md">나</span>
                        <span aria-hidden="true" className="pointer-events-none absolute -left-1 -top-2 text-[16px] leading-none text-[#f6dfa8] [text-shadow:0_0_8px_rgba(246,223,168,0.8)]">✦</span>
                        <span aria-hidden="true" className="pointer-events-none absolute -right-1 bottom-9 text-[11px] leading-none text-[#f6dfa8]">✦</span>
                      </>
                    )}
                    {p.full ? (
                      <>
                        <div className="mx-auto max-w-[84px] space-y-1 px-1.5" aria-label={`${p.label} ${p.full}`}>
                          <ElementTile ch={stem} el={elementOfChar(stem, false)} reading={p.reading?.[0] ?? ""} tone="dark" sizeClass="text-[28px]" />
                          <ElementTile ch={branch} el={elementOfChar(branch, true)} reading={p.reading?.[1] ?? ""} tone="dark" sizeClass="text-[28px]" />
                        </div>
                        <div className="mt-1.5 text-[11.5px] text-[#e8dfca]/60 leading-tight">
                          <div className={me ? "text-[#f6dfa8]" : ""}>{me ? "본인(本人)" : p.tenGodStem}</div>
                          <div>{p.tenGodBranch}</div>
                        </div>
                      </>
                    ) : (
                      <div className="text-[13px] text-[#e8dfca]/50 mt-3 mb-2">시간 미상</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {report.hourUnknown && (
            <p data-testid="hour-unknown-note" className="mt-3 text-[13px] leading-relaxed text-[#e6c887]">
              태어난 시간을 몰라 정오(12시)를 기준으로 계산했어. 신강·신약, 격국, 용신은 태어난 시간에 따라 달라질 수 있어.
            </p>
          )}
          {page.key === "preface" && <PrefaceExtras withLater={!laterAtEnd} />}
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
                <div className={`text-[13px] font-bold ${GOLD}`}>{p.label}</div>
                <div className="mt-1 font-serifKr font-black text-3xl leading-tight text-[#fbf3de]" aria-label={`${p.label}의 일주 ${p.dayPillar ?? ""}`}>
                  {p.dayPillar ? Array.from(p.dayPillar).map((ch, n) => <div key={n}>{ch}</div>) : "?"}
                </div>
                <div className="mt-1 text-[13px] text-[#e8dfca]/70">{p.dayReading ? `${p.dayReading} 일주` : ""}</div>
              </div>,
            ])}
          </div>
          <div data-testid="compat-score" className="mt-4 text-center">
            <span className={`text-[13px] font-bold tracking-[0.2em] ${GOLD}`}>도리 궁합 지수</span>
            <div className="mt-1 font-serifKr font-black text-5xl text-[#fbf3de] tabular-nums">
              {report.compat.score}
              <span className="text-base font-bold text-[#e8dfca]/60"> / 100</span>
            </div>
            <div className="mx-auto mt-3 h-2 max-w-[16rem] rounded-full bg-white/10 overflow-hidden" role="img" aria-label={`궁합 지수 ${report.compat.score}점`}>
              <div className="h-full rounded-full bg-gradient-to-r from-[#f0d9a0] to-[#d3ac62]" style={{ width: `${report.compat.score}%` }} />
            </div>
            <p className="mt-3 text-[14px] text-[#e8dfca]/60">재미로 보는 참고 점수야</p>
          </div>
        </div>
      ) : null;
    case "c-elements":
      return report.compat ? (
        <div data-testid="compat-elements" className="mb-6">
          <div className="mb-2 flex justify-end gap-3 text-[13px] text-[#e8dfca]/70">
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
                  <span className={`w-10 shrink-0 text-center text-[13px] font-bold rounded-full py-1 border ${HAIR} ${GOLD}`}>{elName(e.name)}</span>
                  <div className="flex-1 space-y-1" role="img" aria-label={`${elName(e.name)} 나 ${e.count} 상대 ${o}`}>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full bg-[#e6c887]" style={{ width: `${(e.count / top) * 100}%` }} />
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full bg-pink-300" style={{ width: `${(o / top) * 100}%` }} />
                    </div>
                  </div>
                  <span className="w-12 text-right text-[13px] font-bold text-[#f5efe0] tabular-nums">
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
          <span className="rounded-full bg-[#e6c887] text-[#1b1824] font-bold text-[15px] px-4 py-1.5">{report.strength.grade}</span>
          {(() => {
            const mbti = cleanMbti(report.mbti);
            const stem = report.pillars.find((p) => p.key === "day")?.full?.[0] ?? null;
            const el = stem ? elementOfChar(stem, false) : null;
            if (!mbti || !el || !DAYMASTER_BRIEF[el]) return null;
            return (
              <div data-testid="nature-mbti" className="mt-3 w-full rounded-xl bg-white/[0.06] px-3 py-2.5 text-[14.5px] leading-relaxed text-[#e8dfca]/90">
                <b className={GOLD}>사주와 MBTI, 나란히 보면</b>
                <table className="mt-2 w-full border-collapse text-left text-[14px]">
                  <thead>
                    <tr className={`border-b ${HAIR} text-[12.5px] text-[#e8dfca]/70`}>
                      <th scope="col" className="w-[84px] py-1.5 pr-2 font-bold">구분</th>
                      <th scope="col" className="py-1.5 font-bold">나의 모습</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className={`border-b ${HAIR}`}>
                      <th scope="row" className="py-2 pr-2 align-top font-bold">🔮 사주</th>
                      <td className="py-2">{DAYMASTER_BRIEF[el]}</td>
                    </tr>
                    <tr>
                      <th scope="row" className="py-2 pr-2 align-top font-bold">🧩 MBTI<br />({mbti})</th>
                      <td className="py-2">{MBTI_BRIEF[mbti]}</td>
                    </tr>
                  </tbody>
                </table>
                <p className="mt-2 text-[13px] text-[#e8dfca]/65">두 가지가 같은 말을 하는 곳은 진짜 내 모습일 가능성이 높고, 다른 말을 하는 곳은 상황에 따라 달라지는 모습일 수 있어.</p>
              </div>
            );
          })()}
        </div>
      );
    case "elements":
      return <ElementStones report={report} />;
    case "geukguk":
      return (
        <dl className="mb-6 grid grid-cols-[4rem_1fr] gap-y-2 text-[15px]">
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
          <p className="mb-2 text-[13px] text-[#e8dfca]/70">
            대운 {report.daeun.direction} · {report.daeun.startAge}세 시작
          </p>
          <ol className="grid grid-cols-5 gap-2">
            {report.daeun.list.map((d) => (
              <li key={d.age} data-testid="daeun-item" aria-current={d.current ? "true" : undefined} className={`rounded-xl border py-2 text-center ${d.current ? "bg-[#e6c887] border-[#e6c887] text-[#1b1824]" : `${HAIR} bg-white/[0.04] text-[#f5efe0]`}`}>
                <div className="font-serifKr font-bold text-base">{d.ganzhi}</div>
                <div className={`text-[13px] ${d.current ? "text-[#1b1824]/70" : "text-[#e8dfca]/60"}`}>{d.age}세~</div>
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
            <p data-testid="seyun" className={`mb-6 rounded-2xl border ${HAIR} bg-white/[0.04] px-4 py-3 text-[15px] text-[#f5efe0]`}>
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

/** 책 첫 쪽 머리말. 예전에 결과서 맨 위에 접이식 말풍선으로 있던 "사주, 이렇게 읽어 봐"를 본문으로 옮긴 거예요. */
const BOOK_PREFACE = [
  "사주는 오래오래 쌓인 흐름으로 나를 살펴보는 지도 같은 거야.",
  "이 책에서는 도리가 네 곁에서 한 장씩 길을 읽어 줄게. 모르는 말은 쉽게 풀어 줄 테니 편하게 따라와 줘.",
  "“어, 맞네?” 싶은 곳은 고개를 끄덕이고, 다르게 느껴지는 곳은 “그럴 수도 있구나” 하고 지나가 줘. 지금은 안 맞아 보여도 나중에 문득 떠오르는 대목도 있어.",
  "어떤 길로 갈지는 언제나 네 선택이겠지만, 도리는 너의 선택에 작은 힌트가 되고 싶어 🌙",
] as const;

/** 책 안의 말풍선 캐릭터. 예전에는 주제별로 달랐지만(성공=용, 재물=토끼, 연애=판다 …) 지금은 도리(수달)로 통일해요. */
type Mascot = "dragon" | "rabbit-rich" | "panda-couple" | "panda-wedding" | "fox-run" | "otter-newyear" | "otter";
function mascotOf(_report: PremiumReportView): Mascot {
  // 책 안에서는 말하는 캐릭터를 도리(수달)로 통일해요. (주제별 동물은 자판기 카드·상담실에서 그대로 써요)
  return "otter";
}
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
/** 제1장(나의 사주팔자) 첫 말풍선: 사람마다 달라질 이유가 없어서 고정 문장이에요. */
export const TENGODS_BUBBLE = "사주팔자의 개별 글자들에 대해서 알아봤으니, 이제 각 개별 글자들이 어떤 관계를 맺고 있는지(십성)에 대해서 알아보자.";
export const PILLARS_BUBBLE = "먼저 네가 태어난 해·달·날·시간, 네 개의 기둥부터 하나씩 살펴볼게. 그중 ‘날의 기둥’인 ‘일주’가 바로 나를 뜻하는 기둥이야.";

/** 서문 첫 말풍선: 이름을 부르며 시작해요. 이름이 없으면 "안녕!" 으로 시작해요. */
export const prefaceBubble = (name?: string | null) => `안녕${name ? ` ${callName(name)}` : ""}! 내가 너의 사주팔자에 대해서 자세하게 분석하고 풀이해 볼게~ 그 전에 사주팔자가 뭔지만 알기 쉽게 설명해 줄게.`;
export const openingBubble = (name?: string | null) => `${name ? `${callName(name)}, ` : ""}${OPENING_BODY}`;
const OPENING_BODY = "여기까지 사주가 뭔지, 네 사주가 어떻게 생겼는지 한눈에 봤어. 이제 네 고민부터 얘기해 볼게. 먼저 결론부터 말하고, 그다음에 분야별로 하나씩 깊게 들어가 보자. 자, 렛츠 시작! 🚀";

const BUBBLE =
  "relative max-w-[78%] rounded-[22px] border-2 border-[#20203a] bg-[#fffdf7] px-4 py-3.5 text-[15px] font-medium leading-[1.55] text-[#26233a] after:absolute after:bottom-3.5 after:h-3.5 after:w-3.5 after:bg-[#fffdf7] after:content-['']";

/** 도리와 친구의 말풍선 한 줄. right 면 오른쪽에 그림이 와요. */
/** 도리 한 줄의 "가볍게"는 프리미엄 분위기와 맞지 않아 "깊이 있게"로 바꿉니다. 이미 만들어진 리포트에도 적용돼요. */
const dropLight = softToDeep;

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
        <small className="block text-[15px] tracking-[0.3em] text-[#e6c887]">{t.small}</small>
        <b className="cover-title mt-2 block text-[30px] leading-tight text-[#fbf3de]">{t.main}</b>
        {t.sub && <span className="mt-1.5 block text-[15px] text-[#e8dfca]">{t.sub}</span>}
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
  const bridge = cur.key in BRIDGES && !cur.key.startsWith("compat") ? BRIDGES[cur.key] : null;
  return (
    <div className="mt-9 flex flex-col items-center gap-4">
      <div data-testid="next-teaser" className="border-2 border-[#20203a] bg-[#fffdf7] px-[18px] py-3 text-center text-[15px] font-bold leading-[1.5] text-[#26233a] shadow-[4px_4px_0_#b98a2f]">
        {bridge ? (
          <>
            {bridge[0]}
            <br />
            {bridge[1]}
          </>
        ) : (
          <>
            지금까지 ‘{here}’{josa(here, "을/를").slice(here.length)} 살펴봤어.
            <br />
            다음 장에서는 ‘{there}’{josa(there, "을/를").slice(there.length)} 함께 볼게!
          </>
        )}
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
        <span className="block text-[11.5px] font-bold tracking-widest opacity-70">다음 상품</span>
        <span className="block text-[15px] font-bold leading-tight">{prod.t}</span>
        <span className="block text-[14px] opacity-80">{prod.d}</span>
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
      className="mt-3 w-full rounded-full bg-gradient-to-r from-[#f0d9a0] to-[#d3ac62] py-2.5 text-[15px] font-bold text-[#1b1824] active:scale-95 transition-transform"
    >
      {previewBlur ? `전체 사주서 열기 (정식 오픈 후 ${won})` : `${won}으로 전체 열기`}
    </button>
  );

  // 풀이는 종이 카드(2~3개 소제목)로 나누고, 카드 사이에 도리의 말풍선을 넣어요.
  // AI 편지가 있으면 같은 자리의 기본 "마무리 편지"는 빼요.
  // 서문(내 사주): 첫 소제목 뒤에 "날씨 지도를 그려 줄게" 한 문장을 잇고, 바로 그 아래에 날씨 지도(그림)를 놓아요.
  const sceneAfterFirst = page.key === "preface" && !report.compat && !blurred && page.sections.length > 1;
  const cardSecs0 = (page.letter ? page.sections.filter((x) => x.heading !== "마무리 편지") : page.sections).filter((x) => !(page.key === "preface" && x.heading === "한 줄 마무리"));
  const cardSecs = sceneAfterFirst ? [{ ...cardSecs0[0], body: `${cardSecs0[0].body}\n\n${SCENE_BRIDGE}` }, ...cardSecs0.slice(1)] : cardSecs0;
  const perCard = cardSecs.length > 6 ? 3 : 2;
  const groups: BookPage["sections"][] = [];
  if (sceneAfterFirst) {
    // [첫 설명] → 날씨 지도·해설 → [나의 여덟 글자 설명] → 네 기둥 그림 → 나머지 설명
    const pillarAt = Math.max(1, cardSecs.findIndex((x, n) => n > 0 && /여덟 글자|기둥/.test(x.heading)));
    // '나의 여덟 글자' 설명은 첫 문단 바로 뒤에 네 기둥 그림을 놓고, 나머지 문단은 그림 아래에 이어서 보여요.
    const paras = cardSecs[pillarAt].body.split(/\n\s*\n/);
    const split = paras.length >= 2 && !cardSecs[pillarAt].locked;
    const head = split ? { ...cardSecs[pillarAt], body: paras[0] } : cardSecs[pillarAt];
    const rest = split ? [{ ...cardSecs[pillarAt], heading: "", body: paras.slice(1).join("\n\n") }] : [];
    const tail = [...rest, ...cardSecs.slice(pillarAt + 1)];
    groups.push(cardSecs.slice(0, 1));
    groups.push([...cardSecs.slice(1, pillarAt), head]);
    for (let k = 0; k < tail.length; k += perCard) groups.push(tail.slice(k, k + perCard));
  } else {
    for (let k = 0; k < cardSecs.length; k += perCard) groups.push(cardSecs.slice(k, k + perCard));
  }
  const tp = titleParts(page.title);
  const mascot = mascotOf(report);
  const pic = avatarOf(mascot);
  const sceneBlock = sceneAfterFirst ? (
    <div className="rounded-[14px] border border-[#2c3260] bg-[#1a1f40] p-4">
      <DayMasterScene stem={Array.from(report.pillars.find((p) => p.key === "day")?.full ?? "")[0]} name={report.viewerName} />
    </div>
  ) : null;
  const dm = sceneAfterFirst ? dayMasterOf(Array.from(report.pillars.find((p) => p.key === "day")?.full ?? "")[0]) : null;
  const dmStem = Array.from(report.pillars.find((p) => p.key === "day")?.full ?? "")[0] ?? "";
  const sceneNotes =
    sceneAfterFirst && dm && DAY_MASTER_CAPTION[dmStem]
      ? [
          `이 그림은 네 여덟 글자 중 가장 중요한 ‘대장 글자(일간)’를 자연의 모습으로 그려 본 거야. 타고난 결을 ‘${DAY_MASTER_CAPTION[dmStem]}’에 빗대 눈으로 보기 쉽게 한 거라, 좋고 나쁨을 가르는 그림은 아니야.`,
          `그런데 그림에 ${dmStem}${dm.el}처럼 한자가 크게 써져 있지? 저게 무슨 뜻인지 조금 더 자세히 설명해 줄게.`,
        ]
      : null;
  const visualBlock = (
    <div className="rounded-[14px] border border-[#2c3260] bg-[#1a1f40] p-4 empty:hidden">
      <Visual page={page} report={report} laterAtEnd={sceneAfterFirst} />
    </div>
  );
  // 십성 쪽은 '십성이란?' 설명을 먼저 읽고, 그다음에 내가 가진 기운의 크기(돌 쌓기)를 봐요.
  const explainerFirst = page.key === "tengods";
  // 십성 설명은 보관함의 예전 결과서에도 최신 글이 보이게 저장본이 아니라 현재 글을 써요
  const explainer = page.key === "tengods" && page.explainer ? TENGODS_EXPLAINER : page.explainer;
  const explainerBlock =
    explainer && !blurred ? (
      <aside data-testid="book-explainer" className="rounded-[14px] border border-[#e6c887]/40 bg-[#e6c887]/[0.07] px-4 py-3.5">
        <p className={`text-[14px] font-bold tracking-[0.12em] ${GOLD}`}>{explainer.title}</p>
        {page.key === "tengods" && explainer.body.includes(TENGODS_MORE_AT) ? (
          <>
            <p className="mt-2 whitespace-pre-line text-[15px] leading-[1.7] text-[#f3ecdc]">{explainer.body.slice(0, explainer.body.indexOf(TENGODS_MORE_AT))}</p>
            <TengodsRelations />
            <p className="whitespace-pre-line text-[15px] leading-[1.7] text-[#f3ecdc]">{explainer.body.slice(explainer.body.indexOf(TENGODS_MORE_AT) + 2)}</p>
          </>
        ) : (
          <p className="mt-2 whitespace-pre-line text-[15px] leading-[1.7] text-[#f3ecdc]">{explainer.body}</p>
        )}
      </aside>
    ) : null;
  const curDaeun = report.daeun?.list.find((d) => d.current)?.ganzhi ?? null;
  const dayP = report.pillars.find((x) => x.key === "day");
  const opening =
    !blurred && !page.key.startsWith("compat")
      ? chapterOpening(page.key, {
          dayFull: dayP?.full ?? null,
          dayReading: dayP?.reading ?? null,
          elements: report.elements.map((e) => ({ name: e.name, count: e.count })),
          grade: report.strength?.grade ?? "",
          geukguk: report.geukguk ?? "",
          yongsin: report.yongsin ?? [],
          daeunNow: curDaeun,
          year: report.seyun?.year ?? null,
          yearGanzhi: report.seyun?.ganzhi ?? null,
        })
      : null;
  // 5쪽(일주 분석)·오행 쪽: AI 한 줄 대신 "앞에서 세운 네 기둥 가운데 ‘나’를 뜻하는 건 일주 ○○야…" 이음 말을 말풍선에 넣어요.
  const nature5Opening = (page.key === "nature" || page.key === "elements") && opening ? opening : null;

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
      className={`premium-cute mx-auto max-w-[440px] md:max-w-[720px] text-[#efe7d3] scroll-mt-4 ${flush ? "pt-2" : "rounded-[1.75rem] bg-[#10142b] p-5 sm:p-6 shadow-[0_20px_60px_rgba(20,16,34,0.45)] border border-[#e6c887]/30"}`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-[13px] font-bold tracking-[0.18em] ${GOLD}`}>DORI 20쪽 사주서</span>
        <span className="flex items-center gap-2">
          <button
            type="button"
            data-testid="book-toc-toggle"
            aria-expanded={tocOpen}
            aria-controls="book-toc"
            onClick={() => setTocOpen((v) => !v)}
            className={`rounded-full border ${HAIR} px-2.5 py-0.5 text-[13px] font-bold ${GOLD} active:scale-95 transition-transform`}
          >
            목차 {tocOpen ? "▴" : "▾"}
          </button>
          <span data-testid="book-counter" className="text-[13px] tabular-nums text-[#e8dfca]/70">
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
                  className={`flex w-full items-baseline gap-3 py-1.5 text-left text-[15px] ${k === i ? `font-bold ${GOLD}` : "text-[#efe7d3]"}`}
                >
                  <span className="w-6 shrink-0 tabular-nums text-[13px] text-[#e8dfca]/60">{num(p.no)}</span>
                  <span className="flex-1">{t.small ? `${t.small} · ${t.main}` : t.main}</span>
                  {closed && <span aria-label="잠김" className="text-[13px]">🔒</span>}
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
          <p className="text-[14.5px] leading-relaxed text-[#f3e7c9]">
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
            <p role="status" data-testid="unlock-message" className="mt-2 text-center text-[13px] font-bold text-[#f6dfa8]">
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
          <BubbleRow text={page.key === "pillars" ? PILLARS_BUBBLE : page.key === "tengods" ? TENGODS_BUBBLE : nature5Opening ?? (page.key === "concernTop" ? openingBubble(report.viewerName) : page.key === "preface" ? prefaceBubble(report.viewerName) : page.note ? dropLight(page.note) : page.lead)} img={pic} />
        </div>

        {opening && !nature5Opening && (
          <p data-testid="chapter-opening" className="-mt-1 px-1 text-center text-[14.5px] leading-relaxed text-[#e6c887]/90">
            {opening}
          </p>
        )}

        {/* 손님이 고른 고민에 대한 답은 첫 쪽 위가 아니라, 같은 주제를 다루는 '요즘 고민 맞춤 풀이' 쪽에 둬. */}
        {page.key === "concern" && report.concern && <ConcernCard concern={report.concern} dark />}

        {/* 미리보기에서 가려진 쪽은 계산 값을 서버가 비워 보내서, 그림도 보여주지 않아. */}
        {/* 서문은 사주팔자·오행 설명을 먼저 읽고, 그다음에 내 날씨 지도(그림)를 봐요. */}
        {explainerFirst && explainerBlock}
        {!blurred && page.key !== "preface" && visualBlock}

        {page.key === "topic:love" && !blurred && report.partnerImage && (
          <figure data-testid="partner-image" className="mx-auto w-full max-w-[340px] rounded-[14px] border border-[#2c3260] bg-[#1a1f40] p-4 text-center">
            <p className={`mb-3 text-[15px] font-bold tracking-[0.04em] ${GOLD}`}>{report.partnerImage.title}</p>
            {report.partnerImage.src && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={report.partnerImage.src} alt={report.partnerImage.alt} className="w-full rounded-[10px]" />
                <figcaption className="mt-2 text-[13px] leading-relaxed text-[#e8dfca]/60">{report.partnerImage.notice}</figcaption>
              </>
            )}
            {report.partnerImage.card && (
              <div data-testid="partner-card" className="mt-3 space-y-2 text-left">
                <p className="text-center font-serifKr text-[19px] font-bold text-[#f6dfa8]">{report.partnerImage.card.typeName}</p>
                <p className="rounded-xl bg-white/[0.06] px-3 py-2.5 text-[14px] leading-relaxed text-[#e8dfca]/90">{report.partnerImage.card.link}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-[#e6c887]/40 bg-[#e6c887]/10 px-3 py-2.5">
                    <p className="text-[12px] tracking-[0.12em] text-[#e6c887]">⏳ 인연의 문이 열리기 좋은 때</p>
                    <p className="mt-1 text-[16px] font-bold text-[#f6dfa8]">{report.partnerImage.card.when}</p>
                  </div>
                  <div className="rounded-xl border border-[#e6c887]/40 bg-[#e6c887]/10 px-3 py-2.5">
                    <p className="text-[12px] tracking-[0.12em] text-[#e6c887]">📍 처음 마주치기 쉬운 곳</p>
                    <p className="mt-1 text-[14px] font-bold leading-snug text-[#f6dfa8]">{report.partnerImage.card.where}</p>
                  </div>
                </div>
                <p className="text-[12.5px] leading-relaxed text-[#e8dfca]/60">{report.partnerImage.card.whenNote}</p>
              </div>
            )}
            <PartnerRows rows={report.partnerImage.profile} />
            <p className="mt-3 text-[13px] text-[#e8dfca]/50">사주로 가볍게 그려 본 재미용 상상이야.</p>
          </figure>
        )}

        {!explainerFirst && explainerBlock}

        {groups.map((g, gi) => (
          <div key={`${gi}-${g[0]?.heading}`} className="flex flex-col gap-[18px]">
            {gi > 0 && !(sceneNotes && gi === 1) && g[0].heading !== "" && <BubbleRow text={sectionLink(g[0].heading, gi)} img={pic} right={gi % 2 === 1} />}
            <div className="hanji-wrap">
            <div className="hanji-page px-5 pb-[18px] pt-[22px] text-[#26233a]">
              <span aria-hidden="true" className="hanji-tex" />
              <i aria-hidden="true" className="hanji-curl bl" />
              <i aria-hidden="true" className="hanji-curl br" />
              {gi === 0 && (
                <>
                  <p className="text-center text-[13px] tracking-[0.3em] text-[#5b5670]">사 주 풀 이</p>
                  <p className="mb-4 mt-1 text-center font-serifKr text-[20px] font-bold text-[#26233a]">{tp.main}</p>
                </>
              )}
              {gi === 0 && page.no === 1 && (
                <div data-testid="book-preface" className="mb-5 border-b border-dotted border-[#9a93b0] px-0.5 pb-3.5">
                  <p className="mb-1.5 text-[12px] tracking-[0.14em] text-[#8a5f12]">도리의 머리말</p>
                  {BOOK_PREFACE.map((l) => (
                    <p key={l} className="mb-2 text-[14.5px] leading-[1.85] text-[#322f47] last:mb-0">{l}</p>
                  ))}
                </div>
              )}
              <div className={`space-y-5 ${blurred ? "[&_p]:blur-[6px] [&_li]:blur-[6px] select-none" : ""}`} aria-hidden={blurred ? "true" : undefined}>
                {g.map((s, n) => (
                  <section key={`${n}-${s.heading}`} data-testid={s.locked ? "book-section-locked" : "book-section"}>
                    {s.heading !== "" && (
                      <h4 className="border-b border-dotted border-[#9a93b0] pb-1.5 text-[15px] font-bold text-[#26233a]">
                        <span aria-hidden="true" className="mr-1.5">{s.locked ? "🔒" : ""}</span>
                        {s.heading}
                      </h4>
                    )}
                    {s.locked ? (
                      <div className="relative mt-2">
                        <p aria-hidden="true" className="select-none text-[15px] leading-[1.85] text-[#322f47] blur-[6px]">
                          {s.body}
                        </p>
                        <span className="sr-only">잠긴 풀이야. 전체 열기를 누르면 볼 수 있어.</span>
                      </div>
                    ) : s.sinsalCard ? (
                      <SinsalReveal card={s.sinsalCard} body={fillLetterMbti(s.body, report.mbti)} />
                    ) : (
                      <>
                        <RichBody text={fillMbti(s.body, s.mbti, report.mbti)} plain={PLAIN_HEADINGS.includes(s.heading)} />
                      </>
                    )}
                    {!s.locked && s.checks && s.checks.length > 0 && <CheckList items={s.checks} />}
                    {!s.locked && s.reality && <RealityPick rc={s.reality} />}
                  </section>
                ))}
              </div>
            </div>
            </div>
            {gi === 0 && sceneBlock}
            {gi === 0 && sceneNotes && sceneNotes.map((t, n) => <BubbleRow key={t} text={t} img={pic} right={n % 2 === 1} />)}
            {gi === 1 && sceneAfterFirst && !blurred && visualBlock}
          </div>
        ))}

        {!blurred && page.key === "preface" && !sceneAfterFirst && visualBlock}

        {page.tables.filter((t) => t.title !== "재물 달력" && !(page.key === "pillars" && t.title === "사주 원국") && !(page.key === "elements" && t.title === "오행 분포")).map((t) => (
          <div key={t.title} aria-hidden={blurred ? "true" : undefined} className={`rounded-[14px] border border-[#2c3260] bg-[#1a1f40] px-4 pb-4 ${blurred ? BLUR : ""}`}>
            <Table t={t} />
          </div>
        ))}

        {page.advice && (
          <div data-testid="book-advice" aria-hidden={blurred ? "true" : undefined} className={`rounded-2xl border border-[#e6c887]/40 bg-[#e6c887]/[0.08] px-4 py-4 ${blurred ? BLUR : ""}`}>
            <p className={`text-[14px] font-bold tracking-wide ${GOLD}`}><DoriIcon className="!h-6 !w-6" />도리의 맞춤 조언</p>
            <p className="mt-1.5 font-serifKr text-[15px] leading-[1.85] text-[#fbf3de]">{page.advice}</p>
          </div>
        )}

        {page.letter && (
          <div data-testid="book-letter" aria-hidden={blurred ? "true" : undefined} className={`rounded-2xl border border-[#e6c887]/40 bg-[#e6c887]/[0.08] px-4 py-4 ${blurred ? BLUR : ""}`}>
            <p className={`text-[14px] font-bold tracking-wide ${GOLD}`}><DoriIcon className="!h-6 !w-6" />도리의 편지</p>
            <p className="mt-1.5 whitespace-pre-line font-serifKr text-[15px] leading-[1.85] text-[#fbf3de]">{fillLetterMbti(page.letter, report.mbti)}</p>
          </div>
        )}

        {/* [참고사항](왜 해마다 운세를 다시 보는지 + 매일 곁에 있는 친구 안내)은 첫 쪽이 아니라 책의 맨 끝에서 보여 줘요. */}
        {!blurred && !report.compat && i === pages.length - 1 && pages.some((p) => p.key === "preface" && p.sections.length > 1) && (
          <div className="rounded-[14px] border border-[#2c3260] bg-[#1a1f40] p-4">
            <PrefaceLater bare />
          </div>
        )}

        {page.evidence && page.evidence.length > 0 && (
          <div aria-hidden={blurred ? "true" : undefined} className={blurred ? BLUR : ""}>
            <Evidence rows={page.evidence} />
          </div>
        )}

        {blurred && (
          <div data-testid="preview-blur-note" className={`rounded-2xl border ${HAIR} bg-[#e6c887]/[0.06] px-4 py-4 text-center`}>
            <p className={`text-[15px] font-bold ${GOLD}`}>🔒 핵심 풀이는 흐리게 가려져 있어</p>
            <p className="mt-1 text-[14px] leading-relaxed text-[#e8dfca]/80">미리 보기에서는 1~4쪽만 전부 볼 수 있어. 내 사주의 진짜 이야기는 프리미엄 사주서에서 확인해 봐.</p>
          </div>
        )}
      </article>

      {finale && i === pages.length - 1 && (
        <section data-testid="book-finale" className={`mt-6 rounded-2xl border ${HAIR} bg-[#e6c887]/[0.05] px-3 py-5`}>
          <p className={`text-center text-[13px] font-bold tracking-[0.2em] ${GOLD}`}>도리의 마지막 한 줄</p>
          {finale}
        </section>
      )}

      {lockedHere > 0 && !blurred && (
        <p data-testid="page-lock-hint" className="mt-6 text-center text-[14px] text-[#e6c887]">
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
          className={`flex-1 rounded-full border ${HAIR} py-3 text-[15px] font-bold text-[#f5efe0] disabled:opacity-30 active:scale-95 transition-transform`}
        >
          ‹ 이전
        </button>
        <button
          type="button"
          data-testid="book-next"
          onClick={() => go(i + 1)}
          disabled={i === pages.length - 1}
          className="flex-1 rounded-full bg-gradient-to-r from-[#f0d9a0] to-[#d3ac62] py-3 text-[15px] font-bold text-[#1b1824] disabled:opacity-30 active:scale-95 transition-transform"
        >
          다음 ›
        </button>
      </div>

      {!report.compat && !blurred && (
        <PillarsPeek report={report} rootRef={top} pageKey={page.key} afterChapter1={pages.findIndex((p) => p.key === "pillars") >= 0 && i > pages.findIndex((p) => p.key === "pillars")} />
      )}
    </div>
  );
}

const PEEK_HINT_KEY = "doyu.pillarsPeekHintClosed";

/**
 * 오른쪽 아래에 떠 있는 "내 사주팔자" 버튼. 2장부터 계속 보이고, 커서를 올리면(폰에서는 누르면) 네 기둥 그림이 떠요.
 * 1장에서는 사주팔자 그림을 지나 스크롤한 뒤에야 나타나서, 말풍선으로 "여기서 언제든 다시 볼 수 있어"라고 알려 줘요.
 * 말풍선은 저절로 사라지지 않고, ✕를 눌러야 닫혀요(닫으면 다시 안 떠요).
 */
function PillarsPeek({ report, rootRef, pageKey, afterChapter1 }: { report: PremiumReportView; rootRef: { current: HTMLDivElement | null }; pageKey: string; afterChapter1: boolean }) {
  const [passed, setPassed] = useState(false);
  const [open, setOpen] = useState(false);
  const [hintClosed, setHintClosed] = useState(true);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      setHintClosed(getBrowserStorage()?.getItem(PEEK_HINT_KEY) === "1");
    } catch {
      setHintClosed(false);
    }
  }, []);

  // 1장: 사주팔자 그림(마지막 기둥 카드)이 화면 위로 지나갔는지 지켜봐요.
  useEffect(() => {
    if (pageKey !== "pillars") return;
    const cards = rootRef.current?.querySelectorAll('[data-testid="pillar-card"]');
    const last = cards && cards.length ? cards[cards.length - 1] : null;
    if (!last || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting && e.boundingClientRect.bottom < 0) setPassed(true);
    });
    io.observe(last);
    return () => io.disconnect();
  }, [pageKey, rootRef]);

  // 바깥을 누르면 닫혀요(폰)
  useEffect(() => {
    if (!open) return;
    const off = (ev: Event) => {
      if (wrap.current && !wrap.current.contains(ev.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", off);
    return () => document.removeEventListener("pointerdown", off);
  }, [open]);

  const onChapter1 = pageKey === "pillars";
  const visible = afterChapter1 || (onChapter1 && passed);
  if (!visible || report.pillars.length === 0) return null;
  const showHint = onChapter1 && !hintClosed && !open;
  const closeHint = () => {
    setHintClosed(true);
    try {
      getBrowserStorage()?.setItem(PEEK_HINT_KEY, "1");
    } catch {
      // 저장이 막혀도 이번 화면에서는 닫혀 있어요
    }
  };
  return (
    <div data-testid="pillars-peek" className="pointer-events-none sticky bottom-20 z-20 flex h-0 justify-end pr-1">
      <div ref={wrap} className="pointer-events-auto relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
        {open && (
          <div data-testid="pillars-peek-card" role="dialog" aria-label="내 사주팔자" className="absolute bottom-full right-0 mb-2 w-[min(340px,calc(100vw-2.5rem))] rounded-[18px] border border-[#2c3366] bg-[#1a1f40] p-3 shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
            <p className="mb-2 text-center text-[12px] text-[#b9b4d4]">내 사주팔자</p>
            <div className="grid grid-cols-4 gap-1.5">
              {report.pillars.map((p) => {
                const [stem, branch] = p.full ? Array.from(p.full) : [null, null];
                const me = p.key === "day";
                return (
                  <div key={p.key} className="min-w-0 text-center">
                    <div className={`text-[11px] font-bold ${me ? "text-[#f6dfa8]" : GOLD}`}>{p.label}</div>
                    <div className={`mt-1 rounded-xl border p-1 ${me ? "border-[#e6c887] bg-[#e6c887]/10" : "border-[#3a4380]"}`}>
                      {p.full ? (
                        <div className="space-y-1">
                          <ElementTile ch={stem} el={elementOfChar(stem, false)} reading={p.reading?.[0] ?? ""} tone="dark" sizeClass="text-[22px]" compact />
                          <ElementTile ch={branch} el={elementOfChar(branch, true)} reading={p.reading?.[1] ?? ""} tone="dark" sizeClass="text-[22px]" compact />
                        </div>
                      ) : (
                        <div className="py-6 text-[10px] text-[#e8dfca]/50">시간 미상</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {showHint && (
          <div data-testid="pillars-peek-hint" role="status" className="absolute bottom-full right-0 mb-2 w-[230px] rounded-2xl bg-[#fffaf0] px-3.5 py-3 pr-7 text-[13px] leading-[1.55] text-[#1c1830] shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
            <button type="button" aria-label="안내 닫기" data-testid="pillars-peek-hint-close" onClick={closeHint} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center text-[12px] text-[#8a8399]">
              ✕
            </button>
            <b>여기서 언제든 내 사주팔자를 다시 볼 수 있어.</b>
            <br />
            이 프리미엄 분석 책을 읽다가 궁금할 때 눌러 봐.
            <span aria-hidden="true" className="absolute -bottom-[7px] right-6 h-3.5 w-3.5 rotate-45 bg-[#fffaf0]" />
          </div>
        )}
        <button
          type="button"
          data-testid="pillars-peek-button"
          aria-label="내 사주팔자 보기"
          aria-expanded={open}
          onClick={() => {
            setOpen((v) => !v);
            if (showHint) closeHint();
          }}
          className="flex h-[66px] w-[58px] flex-col items-center justify-center gap-[2px] rounded-2xl border-[1.5px] border-[#e6c887] bg-gradient-to-br from-[#2d3466] to-[#1b1f45] shadow-[0_4px_12px_rgba(0,0,0,0.5)] active:scale-95"
        >
          <span aria-hidden="true" className="text-[9px] font-extrabold leading-none tracking-[0.18em] text-[#e6c887]">
            MY
          </span>
          <span aria-hidden="true" className="grid grid-cols-2 font-serif text-[16px] font-bold leading-[1.1] text-[#f1d8a0]">
            <span>四</span>
            <span>柱</span>
            <span>八</span>
            <span>字</span>
          </span>
        </button>
      </div>
    </div>
  );
}

/** 신살 조합 카드: 눌러서 열고, 한 장 이미지로 저장·공유해요. */
function SinsalReveal({ card, body }: { card: { title: string; share: string }; body: string }) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const save = () => {
    try {
      const W = 900, H = 1200;
      const c = document.createElement("canvas");
      c.width = W; c.height = H;
      const g = c.getContext("2d");
      if (!g) return;
      g.fillStyle = "#1d1a33"; g.fillRect(0, 0, W, H);
      g.strokeStyle = "#e6c887"; g.lineWidth = 4; g.strokeRect(40, 40, W - 80, H - 80);
      g.fillStyle = "#e6c887"; g.textAlign = "center";
      g.font = "bold 34px sans-serif"; g.fillText("내 신살 조합", W / 2, 150);
      g.fillStyle = "#fbf3de"; g.font = "bold 64px serif";
      const wrap = (t: string, max: number, size: number) => {
        g.font = `${size}px sans-serif`;
        const out: string[] = []; let line = "";
        for (const ch of t) { if (g.measureText(line + ch).width > max) { out.push(line); line = ch; } else line += ch; }
        if (line) out.push(line);
        return out;
      };
      g.font = "bold 64px sans-serif";
      g.fillText(`“${card.title}”`, W / 2, 300, W - 160);
      g.fillStyle = "#e9e4f7";
      wrap(card.share, W - 200, 36).slice(0, 12).forEach((l, i) => g.fillText(l, W / 2, 440 + i * 58));
      g.fillStyle = "#9a93b0"; g.font = "28px sans-serif";
      g.fillText("도유사주 · 재미로 보는 참고예요", W / 2, H - 90);
      c.toBlob((b) => {
        if (!b) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(b); a.download = "신살-조합-카드.png"; a.click();
        setMsg("카드를 저장했어.");
      }, "image/png");
    } catch { setMsg("이 기기에서는 저장이 안 돼. 화면을 캡처해 줘."); }
  };
  if (!open) {
    return (
      <button type="button" data-testid="sinsal-card-open" onClick={() => setOpen(true)} className="mt-2 w-full rounded-2xl border border-[#e6c887]/60 bg-[#e6c887]/10 px-4 py-6 text-center">
        <span className="block text-[13px] text-[#5b5670]">🔍 발견된 기운</span>
        <span className="mt-1 block font-serifKr text-[16px] font-bold text-[#26233a]">카드를 눌러 내용을 확인해 봐</span>
      </button>
    );
  }
  return (
    <div data-testid="sinsal-card">
      <RichBody text={body} />
      <button type="button" onClick={save} className="mt-3 rounded-full border border-[#9a93b0] px-4 py-2 text-[13px] font-bold text-[#26233a]">📷 한 장 카드로 저장</button>
      {msg && <p className="mt-1 text-[12px] text-[#5b5670]">{msg}</p>}
    </div>
  );
}

/** 카드 본문의 MBTI 자리(⟦MBTI⟧)를 "○○ 특유의 …" 한 문장으로 바꾸거나, MBTI 가 없으면 지워요. */
function fillMbti(body: string, meta: { group: string; tense: "past" | "now" | "future" } | undefined, mbti: unknown): string {
  if (!body.includes(MBTI_MARK)) return body;
  const line = meta ? mbtiDecadeLine(mbti, meta.group, meta.tense) : "";
  return body.split(MBTI_MARK).join(line).replace(/[ \t]+\n/g, "\n").replace(/ {2,}/g, " ").trim();
}
