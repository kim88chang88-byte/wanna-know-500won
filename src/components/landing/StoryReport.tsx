"use client";

import type { ReactNode } from "react";
import ManseReport from "@/components/premium/ManseReport";
import { RealityLight } from "@/components/premium/RealityLight";
import type { PremiumReportView } from "@/lib/premium/types";
import { ELEMENT_BOX, elementOfChar } from "@/lib/elementColor";
import type { Element } from "@/lib/saju/constants";
import { Stars } from "./ReadingCard";
import { firstSentence, iyeyo, splitBold, stripSummaryLead, tidyFold, toParagraphs, trimToLastSentence } from "@/lib/storyHelpers";


/*
 * 500원 풀이의 "읽는 순서". 내 정보·고민 → 네 기둥 → 요약하자면 → 접어 둔 풀이 → 도리의 쪽지(이어 묻기).
 * 새로 AI 를 부르지 않고, 이미 받은 풀이(도리의 풀이 카드 + 주제 분석 + 고민 답)를 이야기 순서로 다시 배치해요.
 */

type FoldKey = "elements" | "self" | "praise" | "lack" | "flow" | "improve";

const STEPS: Array<{ key: FoldKey; name: string }> = [
  { key: "elements", name: "오행으로 보는 사주" },
  { key: "self", name: "나는 어떤 사람인가?" },
  { key: "praise", name: "이건 정말 칭찬해요 👏" },
  { key: "lack", name: "그렇지만 이건 조금 부족해요" },
  { key: "flow", name: "올해와 이번 달의 흐름" },
  { key: "improve", name: "이렇게 개선해보아요 🌱" },
];

/** 형광펜 색: 주제별 동물 그림에 맞춰요. (용 노랑 · 토끼 분홍 · 남자 팬더 연보라 · 여자 팬더 장미 · 여우 주황 · 수달 하늘색) */
const MARK: Record<string, string> = {
  success: "rgba(253,224,71,0.75)",
  money: "rgba(249,168,212,0.7)",
  love: "rgba(196,181,253,0.75)",
  marriage: "rgba(251,146,160,0.6)",
  health: "rgba(253,186,116,0.7)",
  study: "rgba(125,211,252,0.7)",
  general: "rgba(196,181,253,0.75)",
};

export interface StoryReading {
  keyword: string;
  total: { score: number; summary: string };
  indicators: Array<{ key?: string; label: string; score: number; comment: string | null }>;
  reason?: string;
  story?: string;
  folds?: Partial<Record<FoldKey | "lucky", string>>;
  /** 항목마다 그 사람 얘기를 담은 한 줄 제목 */
  heads?: Partial<Record<FoldKey | "lucky", string>>;
}

const EL_LABEL: Record<Element, { name: string; icon: string }> = {
  wood: { name: "나무", icon: "🌳" },
  fire: { name: "불", icon: "🔥" },
  earth: { name: "땅", icon: "⛰️" },
  metal: { name: "금", icon: "🪙" },
  water: { name: "물", icon: "💧" },
};
const EL_ORDER: Element[] = ["wood", "fire", "earth", "metal", "water"];
/** 기둥 이름 아래에 붙이는 쉬운 뜻 */
const PILLAR_HINT: Record<string, string> = { hour: "태어난 시", day: "나", month: "태어난 달", year: "태어난 해" };

function Pillars({ report }: { report: PremiumReportView }) {
  // 한국식 만세력 순서: 시 · 일 · 월 · 연
  const order = ["hour", "day", "month", "year"] as const;
  const list = order.map((k) => report.pillars.find((p) => p.key === k)).filter((p): p is NonNullable<typeof p> => Boolean(p));
  // 여덟 글자 중 오행별로 몇 개인지 세요.
  const counts: Record<Element, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  for (const p of list) {
    if (!p.full) continue;
    const [st, br] = Array.from(p.full);
    const a = elementOfChar(st, false);
    const b = elementOfChar(br, true);
    if (a) counts[a]++;
    if (b) counts[b]++;
  }
  const top = EL_ORDER.reduce((m, e) => (counts[e] > counts[m] ? e : m), "wood" as Element);
  const total = EL_ORDER.reduce((n, e) => n + counts[e], 0);
  return (
    <div data-testid="story-pillars" className="mt-3">
      <div className="grid grid-cols-4 gap-1.5 overflow-hidden rounded-2xl text-center">
        {list.map((p) => {
          const [stem, branch] = p.full ? Array.from(p.full) : [null, null];
          const se = stem ? elementOfChar(stem, false) : null;
          const be = branch ? elementOfChar(branch, true) : null;
          const cell = (ch: string | null, el: Element | null, reading: string | undefined, label: string) => (
            <div className={`flex flex-col items-center gap-0.5 py-2.5 ${el ? ELEMENT_BOX[el] : "bg-gray-100"}`} aria-label={label}>
              <span className="font-serifKr text-2xl font-black leading-none">{ch}</span>
              <span className="text-[10px] font-bold opacity-85">{reading ?? ""}</span>
              {el && (
                <span className="mt-0.5 rounded-full bg-black/10 px-1.5 py-px text-[10px] font-bold">
                  {EL_LABEL[el].icon} {EL_LABEL[el].name}
                </span>
              )}
            </div>
          );
          return (
            <div key={p.key} className="space-y-1.5">
              <div className="leading-tight">
                <div className={`text-[11px] font-bold ${p.key === "day" ? "text-brand-600" : "text-gray-500"}`}>{p.label}</div>
                <div className={`text-[10px] ${p.key === "day" ? "font-bold text-brand-500" : "text-gray-400"}`}>{PILLAR_HINT[p.key] ?? ""}</div>
              </div>
              {p.full ? (
                <>
                  {cell(stem, se, p.reading?.[0], `${p.label} ${p.full}`)}
                  {cell(branch, be, p.reading?.[1], `${p.label} ${p.full}`)}
                </>
              ) : (
                <div className="rounded-xl bg-gray-100 py-9 text-xs text-gray-400">시간 미상</div>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-gray-500">위 칸은 겉으로 드러나는 기운(하늘), 아래 칸은 바탕이 되는 기운(땅)이에요. 색은 다섯 가지 기운을 뜻해요.</p>
      <div data-testid="element-legend" className="mt-2 flex flex-wrap items-center gap-1.5">
        {EL_ORDER.map((e) => (
          <span key={e} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${ELEMENT_BOX[e]} ${counts[e] === 0 ? "opacity-40" : ""}`}>
            {EL_LABEL[e].icon} {EL_LABEL[e].name} {counts[e]}
          </span>
        ))}
      </div>
      {total > 0 && counts[top] > 0 && (
        <p data-testid="element-summary" className="mt-1.5 text-[12px] font-bold text-gray-700">
          내 사주엔 {EL_LABEL[top].icon} {EL_LABEL[top].name}의 기운이 가장 많아요 ({counts[top]}/{total})
        </p>
      )}
    </div>
  );
}

/** 긴 글을 문단으로 나눠 보여줘요. (내용이 바뀌는 곳마다 한 줄 띄움) */
function Paras({ text, className = "", mark }: { text: string; className?: string; mark: string }) {
  return (
    <div className={`space-y-3.5 ${className}`}>
      {toParagraphs(text).map((p, i) => (
        <p key={i}>
          {splitBold(p).map((x, j) => (x.bold ? (
            <mark
              key={j}
              className="rounded-sm px-0.5 text-gray-900 [box-decoration-break:clone] [-webkit-box-decoration-break:clone]"
              style={{ background: `linear-gradient(transparent 38%, ${mark} 38%, ${mark} 92%, transparent 92%)` }}
            >
              {x.text}
            </mark>
          ) : (
            <span key={j}>{x.text}</span>
          )))}
        </p>
      ))}
    </div>
  );
}

/** AI 풀이를 받지 못한 접이식 칸에 넣는 안내 */
function PendingNote() {
  return (
    <p data-testid="fold-pending" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[14px] font-bold leading-relaxed text-amber-800">
      풀이를 준비 중이에요, 잠시 뒤에 다시 시도해 주세요
    </p>
  );
}

function Fold({ label, title, children, testId, defaultOpen = false }: { label: string; title: string; children: ReactNode; testId?: string; defaultOpen?: boolean }) {
  return (
    <details data-testid={testId ?? "story-fold"} open={defaultOpen} className="group border-t border-brand-100 first:border-t-0">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-1 py-3.5">
        <span className="min-w-0">
          <span className="block text-[11px] font-bold text-brand-500">{label}</span>
          <span className="mt-0.5 block text-[16.5px] font-bold leading-snug text-gray-900 break-keep">{title}</span>
        </span>
        <span aria-hidden="true" className="shrink-0 text-gray-400 transition-transform group-open:rotate-180">⌄</span>
      </summary>
      <div className="whitespace-pre-line px-1 pb-4 text-[16px] leading-[1.85] text-gray-700 break-keep">{children}</div>
    </details>
  );
}

export default function StoryReport({
  report,
  reading,
  intro,
  closing,
  lastWord,
}: {
  report: PremiumReportView;
  reading: StoryReading | null;
  /** 예: "1988.12.29 (양력) 시간 모름 · 남성" */
  intro: string | null;
  /** 도리의 쪽지 안에 넣을 '이어 묻기' 칩 */
  closing?: ReactNode;
  /** 접이식 맨 아래 "마지막 한마디"에 넣을 내용 (한 줄 결론 + 해시태그 + 행운 컬러) */
  lastWord?: ReactNode;
}) {
  const t = report.topic;
  const mark = MARK[t.key] ?? MARK.general;
  const concern = report.concern;
  const concernText = concern?.text?.trim() || (concern?.answers.length ? concern.answers.map((a) => a.title).join(" · ") : "");
  const rawFolds = reading?.folds ?? {};
  // 이미 저장된 풀이에도 같은 다듬기를 해요. (제목 따라 쓰기, 끊긴 끝 문장)
  const f = {
    elements: rawFolds.elements ? tidyFold("elements", rawFolds.elements) : undefined,
    self: rawFolds.self ? tidyFold("self", rawFolds.self) : undefined,
    praise: rawFolds.praise ? tidyFold("praise", rawFolds.praise) : undefined,
    lack: rawFolds.lack ? tidyFold("lack", rawFolds.lack) : undefined,
    flow: rawFolds.flow ? tidyFold("flow", rawFolds.flow) : undefined,
    improve: rawFolds.improve ? tidyFold("improve", rawFolds.improve) : undefined,
    lucky: rawFolds.lucky ? tidyFold("lucky", rawFolds.lucky) : undefined,
  };
  const hasFolds = Boolean(f.elements || f.self || f.praise || f.lack || f.flow || f.improve);
  const heads = reading?.heads ?? {};
  // 요약하자면: 총운 한 줄 → 도리가 본 이유 → 고민에 대한 답을 라벨 없이 한 흐름으로 이어요.
  const joinFlow = (parts: Array<string | undefined | null>) =>
    parts
      .map((x) => x?.trim())
      .filter((x): x is string => Boolean(x))
      .map((x) => (/[.!?…~]$/.test(x) ? x : `${x}.`))
      .join(" ");
  const summary = (reading?.story?.trim() ? trimToLastSentence(stripSummaryLead(reading.story.trim())) : "") || joinFlow([reading?.total.summary, reading?.reason, concern?.answers[0]?.body]);

  return (
    <div data-testid="story-report" className="mt-5 space-y-5">
      {/* 1) 내 정보와 고민 */}
      <section aria-label="내 정보" className="rounded-2xl border border-brand-100 bg-white p-4">
        {intro && <p data-testid="story-intro" className="text-xs font-semibold text-brand-700">{intro}</p>}
        {concernText && (
          <div data-testid="story-concern" className="mt-2.5 rounded-xl bg-brand-50/70 px-3.5 py-2.5">
            <p className="text-[11px] font-bold text-gray-500">내가 고른 고민</p>
            <p className="mt-0.5 text-sm leading-relaxed text-gray-800">{concernText}</p>
          </div>
        )}
        <p className="mt-3.5 text-[11px] font-bold text-gray-500">나의 사주 네 기둥</p>
        <Pillars report={report} />
        {report.hourUnknown && <p className="mt-2 text-[11px] leading-relaxed text-amber-700">태어난 시간을 몰라 정오(12시) 기준으로 계산했어요. 시주는 비워 뒀어요.</p>}
      </section>

      {/* 2) 요약하자면 */}
      {summary && (
        <section data-testid="story-lead" aria-labelledby="story-lead-h" className="rounded-2xl bg-gradient-to-br from-brand-50 via-white to-amber-50/60 border border-brand-100 p-4">
          <div className="flex items-center justify-between gap-2">
            <h5 id="story-lead-h" className="font-cute text-lg font-normal text-brand-700">요약하자면</h5>
            {reading && (
              <span className="flex items-center gap-1.5 text-xs">
                <Stars score={reading.total.score} />
                <span className="rounded-full border border-brand-100 bg-white px-2 py-0.5 text-[11px] font-bold text-brand-700">#{reading.keyword}</span>
              </span>
            )}
          </div>
          <Paras mark={mark} text={summary} className="mt-3 text-[16px] leading-[1.85] text-gray-800 break-keep" />
        </section>
      )}

      {/* 3) 접어 둔 풀이: 오행 → 나는 누구 → 칭찬 → 아쉬움 → 개선 → 행운 처방 → 원국 → 마지막 한마디 */}
      <section aria-label="자세한 풀이" data-testid="story-folds" className="rounded-2xl border border-brand-100 bg-white px-4">
        <p className="pt-3.5 text-xs text-gray-500">각 제목을 누르면 풀이가 펼쳐져요</p>
        {hasFolds ? (
          <>
            {STEPS.map((st, n) => (
              <Fold
                key={st.key}
                testId={`story-fold-${st.key}`}
                label={heads[st.key] ? `STEP ${n + 1} · ${st.name}` : `STEP ${n + 1}`}
                title={heads[st.key] || st.name}
              >
                {st.key === "elements" && (
                  <p className="mb-2.5 flex flex-wrap gap-1.5">
                    {report.elements.map((e) => (
                      <span key={e.name} className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-gray-700">
                        {e.name} {e.count}
                      </span>
                    ))}
                  </p>
                )}
                {f[st.key] ? <Paras mark={mark} text={f[st.key] as string} /> : <PendingNote />}
                {st.key === "improve" && concern && concern.answers.length > 1 && (
                  <ul className="mt-3 space-y-2.5">
                    {concern.answers.slice(1).map((a) => (
                      <li key={a.id} className="rounded-xl bg-brand-50/60 px-3.5 py-2.5">
                        <b className="text-gray-900">{a.emoji} {a.title}</b>
                        <p className="mt-0.5 text-[13.5px]">{a.body}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </Fold>
            ))}
          </>
        ) : (
          <>
            {t.points.map((pt, n) => (
              <Fold key={`${n}-${pt.title}`} label={`${t.label} · ${pt.title}`} title={firstSentence(pt.body)}>
                {pt.body}
                <PendingNote />
              </Fold>
            ))}
            {t.timing.length > 0 && (
              <Fold label="올해와 이번 달의 흐름" title={firstSentence(t.timing[0].body)}>
                <ul className="space-y-2.5">
                  {t.timing.map((x) => (
                    <li key={x.title}>
                      <b className="text-gray-900">{x.title}</b>
                      <p>{x.body}</p>
                    </li>
                  ))}
                </ul>
                <PendingNote />
              </Fold>
            )}
          </>
        )}
        <Fold testId="story-fold-lucky" label="행운 처방" title={heads.lucky || `행운 컬러는 ${t.lucky.color}, 방향은 ${t.lucky.direction}${iyeyo(t.lucky.direction)}`}>
          {f.lucky && <Paras mark={mark} text={f.lucky} className="mb-3.5" />}
          <p className="flex items-center gap-2">
            <span aria-hidden="true" className="h-4 w-4 shrink-0 rounded-full border border-black/10" style={{ backgroundColor: t.lucky.hex }} />
            행운 컬러 <b className="text-gray-900">{t.lucky.color}</b> · 행운 방향 <b className="text-gray-900">{t.lucky.direction}</b>
          </p>
          {!f.lucky && <PendingNote />}
          {!f.lucky && <p className="mt-1 text-[13px] text-gray-500">비어 있는 {t.lucky.element} 기운을 가볍게 채워 주는 전통 오행 대응이에요. 소품이나 옷 색으로 기분 전환하듯 써 보세요.</p>}
        </Fold>
        <Fold testId="story-fold-chart" label="내 사주 원국" title="십성·오행 분포·신강신약을 표로 자세히 볼래요">
          <ManseReport report={report} hideHeadline parts="base" />
        </Fold>
        {lastWord && (
          <Fold testId="story-fold-last" label="마지막 한마디" title="도리가 마지막으로 전하는 말이에요" defaultOpen>
            {lastWord}
          </Fold>
        )}
      </section>

      {/* 현실 견주기: 도리의 쪽지 바로 위 */}
      {t.reality && <RealityLight rc={t.reality} />}

      {/* 4) 도리의 쪽지 */}
      <section data-testid="story-note" aria-label="도리의 쪽지" className="relative rounded-2xl border border-amber-200 bg-[#fff9e6] p-4 shadow-sm">
        <span aria-hidden="true" className="absolute -top-2.5 left-6 h-4 w-16 -rotate-2 rounded-sm bg-amber-200/80" />
        <p className="text-[11px] font-bold text-amber-700">🦦 도리의 쪽지 · 더 물어보기</p>
        <p className="mt-1 text-[14.5px] font-bold leading-relaxed text-gray-900">읽다가 더 궁금한 게 생겼어? 도리한테 편하게 물어봐 🫧</p>
        {closing}
      </section>
    </div>
  );
}
