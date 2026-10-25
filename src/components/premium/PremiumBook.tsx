"use client";

import ConcernCard from "./ConcernCard";
import { useEffect, useRef, useState } from "react";
import { checkMessage } from "@/lib/premium/book/resonance";
import type { BookPage, BookRow, BookTable, ElementKind, PremiumReportView, RealityCheck } from "@/lib/premium/types";

/*
 * 프리미엄 10페이지 리포트 리더. 한 번에 한 페이지씩 넘겨 보는 고급스러운 책 형태예요.
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
      <strong key={i} className="font-bold text-[#fbf3de]">{t.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{t}</span>
    ),
  );
}

function RichBody({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="mt-1.5 space-y-3 text-[14px] leading-[1.8] text-[#efe7d3]">
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
            on[i] ? "border-[#e6c887] bg-[#e6c887]/15 text-[#fbf3de]" : "border-[#e6c887]/25 bg-white/[0.03] text-[#efe7d3] hover:border-[#e6c887]/60"
          }`}
        >
          <span
            aria-hidden="true"
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-black ${on[i] ? "border-[#e6c887] bg-[#e6c887] text-[#2a1f45]" : "border-[#e6c887]/50 text-transparent"}`}
          >
            ✓
          </span>
          <span>{t}</span>
        </button>
      ))}
      <p role="status" data-testid="book-checks-result" className="min-h-[1.25rem] pt-0.5 text-[12.5px] font-bold text-[#f6dfa8]">
        {touched ? `${items.length}개 중 ${hit}개가 나와 비슷해요. ${checkMessage(hit, items.length)}` : ""}
      </p>
    </div>
  );
}

/** 사주가 보여 준 흐름과 지금 내 현실을 견줘 보는 세 갈래. 어느 쪽이든 응원으로 마무리해요. */
function RealityPick({ rc }: { rc: RealityCheck }) {
  const [pick, setPick] = useState<number | null>(null);
  return (
    <div data-testid="book-reality" className="mt-4 rounded-xl border border-[#e6c887]/30 bg-white/[0.03] px-4 py-3.5">
      <p className="text-[13px] font-bold text-[#e6c887]">🔎 지금 내 현실과 견줘 보기</p>
      <p className="mt-1 text-[13px] leading-relaxed text-[#efe7d3]">{rc.question}</p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {rc.options.map((o, i) => (
          <button
            key={o.label}
            type="button"
            aria-pressed={pick === i}
            onClick={() => setPick(i)}
            className={`rounded-full border px-3.5 py-1.5 text-[12.5px] font-bold transition-colors ${
              pick === i ? "border-[#e6c887] bg-[#e6c887] text-[#2a1f45]" : "border-[#e6c887]/40 text-[#efe7d3] hover:border-[#e6c887]"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <p role="status" data-testid="book-reality-result" className="min-h-[1.25rem] pt-2.5 text-[13.5px] leading-relaxed text-[#fbf3de]">
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

function Visual({ page, report }: { page: BookPage; report: PremiumReportView }) {
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
                      <div className="font-serifKr font-black text-3xl text-[#fbf3de] leading-tight mt-1" aria-label={`${p.label} ${p.full}`}>
                        <div>{stem}</div>
                        <div>{branch}</div>
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
                  <span className={`w-10 shrink-0 text-center text-xs font-bold rounded-full py-1 border ${HAIR} ${GOLD}`}>{e.name}</span>
                  <div className="flex-1 space-y-1" role="img" aria-label={`${e.name} 나 ${e.count} 상대 ${o}`}>
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
              <span className={`w-10 shrink-0 text-center text-xs font-bold rounded-full py-1 border ${HAIR} ${GOLD}`}>{e.name}</span>
              <div className="flex-1 h-2.5 rounded-full bg-white/10 overflow-hidden" role="img" aria-label={`${e.name} ${e.count}`}>
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

/** 장별로 어울리는 도리 친구(기존 이미지만 사용) */
function coverImage(key: string, title: string): string {
  if (title.startsWith("재물")) return "/images/animal-rabbit-rich.webp";
  if (title.startsWith("연애") || key.includes("love")) return "/images/animal-panda-couple.webp";
  if (key === "daeun" || key === "years") return "/images/premium-scene-dragon.webp";
  if (key === "nature" || key === "elements") return "/images/animal-fox.webp";
  return "/images/animal-otter.webp";
}

/** 웹툰 느낌의 장 표지: 도리 컷 + 말풍선 */
function ChapterCover({ page }: { page: BookPage }) {
  return (
    <div data-testid="chapter-cover" className="mb-6 flex items-end gap-3 rounded-2xl border border-[#e6c887]/25 bg-gradient-to-br from-[#26223a] to-[#16131f] p-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={coverImage(page.key, page.title)} alt="" width={84} height={84} className="h-[84px] w-[84px] shrink-0 rounded-xl object-contain" />
      <div className="relative flex-1 rounded-2xl rounded-bl-sm bg-[#fbf3de] px-3.5 py-2.5 text-[#2a2438]">
        <p className="text-[11px] font-bold tracking-wide text-[#a07a2c]">도리가 말해요</p>
        <p className="mt-0.5 text-[13.5px] font-semibold leading-snug">이번 장에서는 ‘{page.title}’을 차분히 살펴볼게요.</p>
      </div>
    </div>
  );
}

const NEXT_PRODUCTS = [
  { t: "올해 월별 운세 한눈에", d: "달마다 조심할 일과 기회를 짚어드려요", h: "/" },
  { t: "궁합이 궁금하다면", d: "둘의 사주를 겹쳐 보는 500원 풀이", h: "/" },
  { t: "요즘 고민, 한 가지만 콕", d: "500원으로 고민에 맞춘 한 줄 답을 받아요", h: "/" },
];

/** 장 끝: 다음 장 예고 + 다음 상품 배너 */
function ChapterEnd({ next, idx }: { next?: BookPage; idx: number }) {
  const prod = NEXT_PRODUCTS[idx % NEXT_PRODUCTS.length];
  return (
    <div className="mt-8 space-y-3">
      {next && (
        <div data-testid="next-teaser" className="rounded-2xl border border-dashed border-[#e6c887]/40 px-4 py-3 text-center">
          <p className="text-[11px] font-bold tracking-widest text-[#e6c887]">NEXT CHAPTER</p>
          <p className="mt-1 font-serifKr text-[14.5px] text-[#fbf3de]">다음 장에서는 ‘{next.title}’을 알아봐요.</p>
        </div>
      )}
      <a
        href={prod.h}
        data-testid="next-product-banner"
        className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[#f0d9a0] to-[#d3ac62] px-4 py-3.5 text-[#1b1824] active:scale-[0.99] transition-transform"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/animal-otter.webp" alt="" width={44} height={44} className="h-11 w-11 shrink-0 object-contain" />
        <span className="flex-1">
          <span className="block text-[10px] font-bold tracking-widest opacity-70">다음 상품</span>
          <span className="block text-[14px] font-bold leading-tight">{prod.t}</span>
          <span className="block text-[12px] opacity-80">{prod.d}</span>
        </span>
        <span aria-hidden="true" className="text-lg font-bold">›</span>
      </a>
    </div>
  );
}

/** flush: 이미 미드나잇 톤의 틀 안에 들어갈 때 바깥 테두리·배경을 빼고 내용만 보여요. */
export default function PremiumBook({ report, flush = false }: { report: PremiumReportView; flush?: boolean }) {
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
      2,990원으로 전체 열기
    </button>
  );

  return (
    <div
      ref={top}
      data-testid="premium-book"
      tabIndex={-1}
      onKeyDown={(e: { key: string }) => {
        if (e.key === "ArrowRight") go(i + 1);
        if (e.key === "ArrowLeft") go(i - 1);
      }}
      className={`text-[#f5efe0] scroll-mt-4 ${flush ? "pt-2" : "rounded-[1.75rem] bg-gradient-to-b from-[#1d1a28] via-[#171520] to-[#12101a] p-5 sm:p-8 shadow-[0_20px_60px_rgba(20,16,34,0.45)] border border-[#e6c887]/30"}`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-bold tracking-[0.3em] ${GOLD}`}>DORI PREMIUM REPORT</span>
        <span data-testid="book-counter" className="text-xs tabular-nums text-[#e8dfca]/70">
          {num(page.no)} / {num(pages.length)}
        </span>
      </div>

      {i === 0 && report.concern && (
        <div className="mt-3">
          <ConcernCard concern={report.concern} dark />
        </div>
      )}

      <nav aria-label="리포트 페이지" className="mt-1 flex gap-1">
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
            전체 {pages.length}쪽 중 <b className={GOLD}>{lockedTotal}개 풀이</b>가 잠겨 있어요. 흐리게 보이는 부분이 가장 궁금한 ‘언제’와 ‘어떻게’예요.
          </p>
          {unlock}
          {unlockMsg && (
            <p role="status" data-testid="unlock-message" className="mt-2 text-center text-[11.5px] font-bold text-[#f6dfa8]">
              결제는 아직 준비 중이에요. 베타 기간에는 과금되지 않아요 🫧
            </p>
          )}
        </div>
      )}

      <article aria-labelledby="book-title" data-testid="book-page" data-page={page.no} className="mt-7">
        <div className="relative">
          <span aria-hidden="true" className="absolute -top-3 right-0 font-serifKr font-black text-[5.5rem] leading-none text-[#e6c887]/[0.09] select-none">
            {num(page.no)}
          </span>
          <p className={`text-[10px] font-bold tracking-[0.28em] ${GOLD}`}>{page.subtitle}</p>
          <h3 id="book-title" className="mt-2 font-serifKr font-bold text-[1.4rem] leading-snug text-[#fbf3de]">
            {page.title}
          </h3>
        </div>
        <div className="my-4 h-px bg-gradient-to-r from-[#e6c887] via-[#e6c887]/40 to-transparent" />
        <p data-testid="book-lead" className="mb-6 font-serifKr italic text-[15px] leading-relaxed text-[#f3e7c9]">
          {page.lead}
        </p>

        {page.note && (
          <p data-testid="book-note" className="mb-6 -mt-2 rounded-xl border border-[#e6c887]/30 bg-[#e6c887]/[0.07] px-3.5 py-2.5 text-[13px] leading-relaxed text-[#f3e7c9]">
            <span aria-hidden="true" className="mr-1">🦦</span>
            <span className={`mr-1.5 font-bold ${GOLD}`}>도리의 한 줄</span>
            {page.note}
          </p>
        )}

        <ChapterCover page={page} />

        <Visual page={page} report={report} />

        <div className="space-y-5">
          {page.sections.map((s, n) => (
            <section key={`${n}-${s.heading}`} data-testid={s.locked ? "book-section-locked" : "book-section"}>
              <h4 className={`text-[13px] font-bold ${GOLD}`}>
                <span aria-hidden="true" className="mr-1.5">{s.locked ? "🔒" : "◆"}</span>
                {s.heading}
              </h4>
              {s.locked ? (
                <div className="relative mt-1.5">
                  <p aria-hidden="true" className="select-none text-[14px] leading-[1.8] text-[#efe7d3] blur-[6px]">
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

        {page.tables.map((t) => (
          <div key={t.title}>
            <Table t={t} />
          </div>
        ))}

        {page.advice && (
          <div data-testid="book-advice" className="mt-6 rounded-2xl border border-[#e6c887]/40 bg-[#e6c887]/[0.08] px-4 py-4">
            <p className={`text-[12px] font-bold tracking-wide ${GOLD}`}>🦦 도리의 맞춤 조언</p>
            <p className="mt-1.5 font-serifKr text-[14px] leading-[1.85] text-[#fbf3de]">{page.advice}</p>
          </div>
        )}

        {page.evidence && page.evidence.length > 0 && <Evidence rows={page.evidence} />}

        <ChapterEnd next={pages[i + 1]} idx={i} />
      </article>

      {lockedHere > 0 && (
        <p data-testid="page-lock-hint" className="mt-6 text-center text-[12px] text-[#e6c887]">
          이 페이지에 잠긴 풀이 {lockedHere}개 · 위의 ‘전체 열기’로 볼 수 있어요
        </p>
      )}

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
      <p className="mt-4 text-center text-[11px] leading-relaxed text-[#e8dfca]/50">명리학의 일반적인 관점으로 풀어 쓴 재미와 참고용 해석이에요.</p>
    </div>
  );
}
