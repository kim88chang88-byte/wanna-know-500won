"use client";

import { possessive } from "@/lib/callName";
import type { ReactNode } from "react";
import { useChatEnabled } from "@/components/chat/ChatEntry";
import { BodyPicks } from "@/components/premium/BodyFigure";
import ManseReport from "@/components/premium/ManseReport";
import { bodyStates } from "@/lib/premium/bodyMap";
import { RealityLight } from "@/components/premium/RealityLight";
import type { PremiumReportView } from "@/lib/premium/types";
import { ELEMENT_BOX, elEasyName, elementOfChar } from "@/lib/elementColor";
import { ElIconName } from "@/components/ElIcon";
import type { Element } from "@/lib/saju/constants";
import { Stars } from "./ReadingCard";
import ElementTile from "@/components/ElementTile";
import { firstSentence, casualHead, iya, splitBold, stripSummaryLead, tidyFold, toParagraphs, trimToLastSentence } from "@/lib/storyHelpers";


/*
 * 500원 풀이의 "읽는 순서". 내 정보·고민 → 네 기둥 → 요약하자면 → 접어 둔 풀이 → 도리의 쪽지(이어 묻기).
 * 새로 AI 를 부르지 않고, 이미 받은 풀이(도리의 풀이 카드 + 주제 분석 + 고민 답)를 이야기 순서로 다시 배치해요.
 */

type FoldKey = "elements" | "self" | "praise" | "lack" | "flow" | "improve";

const STEPS: Array<{ key: FoldKey; name: string }> = [
  { key: "elements", name: "오행으로 보는 사주" },
  { key: "self", name: "나는 어떤 사람인가?" },
  { key: "praise", name: "이건 정말 칭찬해 줄게 👏" },
  { key: "lack", name: "그렇지만 이건 아쉬워" },
  { key: "improve", name: "이렇게 개선해 보자 🌱" },
  { key: "flow", name: "올해와 이번 달의 흐름" },
];

/** 신년운에서는 "올해와 이번 달" 대신 2027년 기준 이름을 써요. */
function stepName(key: FoldKey, name: string, topic: string): string {
  return key === "flow" && topic === "study" ? "2027년의 흐름" : name;
}

/** 형광펜 색: 주제별 동물 그림에 맞춰요. (용 노랑 · 토끼 분홍 · 남자 팬더 연보라 · 여자 팬더 장미 · 여우 주황 · 수달 하늘색) */
/** 강조 색: 풀이 종류와 상관없이 모두 도유사주 대표색인 분홍빛 연보라로 맞췄어요. */
const LILAC = "#f3dcff";
export const MARK: Record<string, string> = {
  success: LILAC,
  money: LILAC,
  love: LILAC,
  marriage: LILAC,
  health: LILAC,
  study: LILAC,
  general: LILAC,
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

const EL_ORDER: Element[] = ["wood", "fire", "earth", "metal", "water"];
/** 기둥 이름 아래에 붙이는 쉬운 뜻 */
const PILLAR_HINT: Record<string, string> = { hour: "태어난 시", day: "나", month: "태어난 달", year: "태어난 해" };

export interface PillarLike {
  key: "year" | "month" | "day" | "hour";
  label: string;
  full: string | null;
  reading: string | null;
}

export function Pillars({ report, pillars, owner = "내", hint }: { report?: PremiumReportView; pillars?: PillarLike[]; owner?: string; hint?: string }) {
  // 한국식 만세력 순서: 시 · 일 · 월 · 연
  const order = ["hour", "day", "month", "year"] as const;
  const source: PillarLike[] = pillars ?? report?.pillars ?? [];
  const list = order.map((k) => source.find((p) => p.key === k)).filter((p): p is PillarLike => Boolean(p));
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
  const tops = EL_ORDER.filter((e) => counts[e] === counts[top]);
  const total = EL_ORDER.reduce((n, e) => n + counts[e], 0);
  return (
    <div data-testid="story-pillars" className="mt-3">
      <div className="grid grid-cols-4 gap-1.5 overflow-hidden rounded-2xl text-center">
        {list.map((p) => {
          const [stem, branch] = p.full ? Array.from(p.full) : [null, null];
          const se = stem ? elementOfChar(stem, false) : null;
          const be = branch ? elementOfChar(branch, true) : null;
          const cell = (ch: string | null, el: Element | null, reading: string | undefined, label: string) => (
            <ElementTile ch={ch} el={el} reading={reading ?? ""} label={label} />
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
      <p className="mt-2 text-[11px] leading-relaxed text-gray-500">{hint ?? "위 칸은 겉으로 드러나는 기운(하늘 글자), 아래 칸은 바탕이 되는 기운(뿌리 글자)이에요. 색은 다섯 가지 기운을 뜻해요."}</p>
      <div data-testid="element-legend" className="mt-2 flex flex-wrap items-center gap-1.5">
        {EL_ORDER.map((e) => (
          <span key={e} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${ELEMENT_BOX[e]} ${counts[e] === 0 ? "opacity-40" : ""}`}>
            <ElIconName e={e} /> {counts[e]}
          </span>
        ))}
      </div>
      {total > 0 && counts[top] > 0 && (
        <p data-testid="element-summary" className="mt-1.5 text-[12px] font-bold text-gray-700">
          {tops.length >= 2 ? (
            <>
              {owner} 사주엔{" "}
              {tops.map((e, i) => (
                <span key={e}>
                  {i > 0 && "과 "}
                  <ElIconName e={e} />
                </span>
              ))}
              의 기운이 {tops.length === 2 ? "똑같이 " : ""}가장 많아요 (각 {counts[top]}/{total})
            </>
          ) : (
            <>
              {owner} 사주엔 <ElIconName e={top} />의 기운이 가장 많아요 ({counts[top]}/{total})
            </>
          )}
        </p>
      )}
    </div>
  );
}

/** 긴 글을 문단으로 나눠 보여줘요. (내용이 바뀌는 곳마다 한 줄 띄움) */
export function Paras({ text, className = "", mark }: { text: string; className?: string; mark: string }) {
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
      풀이를 준비 중이에요. 잠시 뒤에 다시 시도해 주세요.
    </p>
  );
}

export function Fold({ label, title, children, testId, defaultOpen = false }: { label: string; title: string; children: ReactNode; testId?: string; defaultOpen?: boolean }) {
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
  chat,
  lastWord,
  name,
}: {
  report: PremiumReportView;
  reading: StoryReading | null;
  /** 예: "1988.12.29 (양력) 시간 모름 · 남성" */
  intro: string | null;
  /** 도리의 쪽지 안에 넣을 '이어 묻기' 칩 */
  closing?: ReactNode;
  /** 도유 상담실 입구 버튼. 상담실이 열려 있으면 쪽지 대신 현실 견주기 바로 아래에 보여요 */
  chat?: ReactNode;
  /** 접이식 맨 아래 "마지막 한마디"에 넣을 내용 (한 줄 결론 + 해시태그 + 행운 컬러) */
  lastWord?: ReactNode;
  /** 로그인 닉네임. 고민 답 제목("○○님의 고민에 대한 도리의 답은...")에 써요. */
  name?: string | null;
}) {
  const chatOn = useChatEnabled() && Boolean(chat);
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
  const heads = Object.fromEntries(Object.entries(reading?.heads ?? {}).map(([k, v]) => [k, typeof v === "string" ? casualHead(v) : v])) as Partial<Record<FoldKey | "lucky", string>>;
  // 요약하자면: 총운 한 줄 → 도리가 본 이유를 한 흐름으로 이어요. (고민에 대한 답은 고민 바로 아래 "도리의 답" 카드로 따로 보여줘요)
  const joinFlow = (parts: Array<string | undefined | null>) =>
    parts
      .map((x) => x?.trim())
      .filter((x): x is string => Boolean(x))
      .map((x) => (/[.!?…~]$/.test(x) ? x : `${x}.`))
      .join(" ");
  const summary = (reading?.story?.trim() ? trimToLastSentence(stripSummaryLead(reading.story.trim())) : "") || joinFlow([reading?.total.summary, reading?.reason]);

  // 고민 칩이 아니라 질문 문장으로 고른 경우엔 미리 만든 답이 없어서, AI 요약(=답)을 고민 바로 아래로 올려요.
  const summaryFirst = Boolean(concernText && !concern?.answers[0] && summary);
  const who = (name ?? report.viewerName ?? "").trim();
  const leadTitle = summaryFirst ? `${who ? possessive(who) : "나의"} 고민에 대한 도리의 답은...` : "요약하자면";
  const summaryBlock = summary ? (
        <section data-testid="story-lead" aria-labelledby="story-lead-h" className="rounded-2xl bg-gradient-to-br from-brand-50 via-white to-amber-50/60 border border-brand-100 p-4">
          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
            <h5 id="story-lead-h" className="min-w-0 basis-[11rem] flex-1 font-cute text-lg font-normal text-brand-700">{leadTitle}</h5>
            {reading && (
              <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs">
                <Stars score={reading.total.score} />
                <span className="rounded-full border border-brand-100 bg-white px-2 py-0.5 text-[11px] font-bold text-brand-700">#{reading.keyword}</span>
              </span>
            )}
          </div>
          <Paras mark={mark} text={summary} className="mt-3 text-[16px] leading-[1.85] text-gray-800 break-keep" />
        </section>
      ) : null;
  const pillarsBlock = (
    <>
      <p className="mt-3.5 text-[11px] font-bold text-gray-500">나의 사주 네 기둥</p>
      <Pillars report={report} />
      {report.hourUnknown && <p className="mt-2 text-[11px] leading-relaxed text-amber-700">태어난 시간을 몰라 정오(12시) 기준으로 계산했어요. 시주는 비워 뒀어요.</p>}
    </>
  );
  return (
    <div data-testid="story-report" data-no-click-fx="" className="mt-5 space-y-5">
      {/* 1) 내 정보와 고민 (질문 문장 고민이면: 고민 → 요약하자면(답) → 네 기둥) */}
      <section aria-label="내 정보" className="rounded-2xl border border-brand-100 bg-white p-4">
        {intro && <p data-testid="story-intro" className="text-xs font-semibold text-brand-700">{intro}</p>}
        {concernText && (
          <div data-testid="story-concern" className="mt-2.5 rounded-xl bg-brand-50/70 px-3.5 py-2.5">
            <p className="text-[11px] font-bold text-gray-500">내가 고른 고민</p>
            <p className="mt-0.5 text-sm leading-relaxed text-gray-800">{concernText}</p>
          </div>
        )}
        {concernText && concern?.answers[0] && (
          <div data-testid="story-concern-answer" className="mt-2 rounded-xl border border-brand-100 bg-gradient-to-br from-white to-amber-50/60 px-3.5 py-3">
            <p className="text-[11px] font-bold text-brand-700">도리의 답</p>
            <p className="mt-1 text-sm font-bold text-gray-900">{concern.answers[0].emoji} {concern.answers[0].title}</p>
            <Paras mark={mark} text={concern.answers[0].body} className="mt-1.5 text-[14.5px] leading-[1.8] text-gray-800 break-keep" />
          </div>
        )}
        {!summaryFirst && pillarsBlock}
      </section>

      {summaryFirst && summaryBlock}
      {summaryFirst && (
        <section aria-label="나의 사주 네 기둥" className="rounded-2xl border border-brand-100 bg-white p-4 [&>p:first-child]:mt-0">
          {pillarsBlock}
        </section>
      )}

      {!summaryFirst && summaryBlock}

      {t.key === "health" && <BodyPicks states={bodyStates(report.elements)} elements={report.elements} />}

      {/* 3) 접어 둔 풀이: 오행 → 나는 누구 → 칭찬 → 아쉬움 → 개선 → 행운 처방 → 원국 → 마지막 한마디 */}
      <section aria-label="자세한 풀이" data-testid="story-folds" className="rounded-2xl border border-brand-100 bg-white px-4">
        <p className="pt-3.5 text-xs text-gray-500">각 제목을 누르면 풀이가 펼쳐져!</p>
        {hasFolds ? (
          <>
            {STEPS.map((st, n) => (
              <Fold
                key={st.key}
                testId={`story-fold-${st.key}`}
                label={heads[st.key] ? `STEP ${n + 1} · ${stepName(st.key, st.name, t.key)}` : `STEP ${n + 1}`}
                title={heads[st.key] || stepName(st.key, st.name, t.key)}
              >
                {st.key === "elements" && (
                  <p className="mb-2.5 flex flex-wrap gap-1.5">
                    {report.elements.map((e) => (
                      <span key={e.name} className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-gray-700">
                        {elEasyName(e.name)} {e.count}
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
              <Fold label={stepName("flow", "올해와 이번 달의 흐름", t.key)} title={firstSentence(t.timing[0].body)}>
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
        <Fold testId="story-fold-lucky" label={`STEP ${STEPS.length + 1} · 행운 처방`} title={heads.lucky || `행운 컬러는 ${t.lucky.color}, 방향은 ${t.lucky.direction}${iya(t.lucky.direction)}`}>
          {f.lucky && <Paras mark={mark} text={f.lucky} className="mb-3.5" />}
          <p className="flex items-center gap-2">
            <span aria-hidden="true" className="h-4 w-4 shrink-0 rounded-full border border-black/10" style={{ backgroundColor: t.lucky.hex }} />
            행운 컬러 <b className="text-gray-900">{t.lucky.color}</b> · 행운 방향 <b className="text-gray-900">{t.lucky.direction}</b>
          </p>
          {!f.lucky && <PendingNote />}
          {!f.lucky && <p className="mt-1 text-[13px] text-gray-500">비어 있는 {t.lucky.element} 기운을 가볍게 채워 주는 전통 오행 대응이에요. 소품이나 옷 색으로 기분 전환하듯 써 보세요.</p>}
        </Fold>
        <Fold testId="story-fold-chart" label="내 사주 원국" title="십성·오행 분포·신강신약을 표로 자세히 볼래?">
          <ManseReport report={report} hideHeadline parts="base" />
        </Fold>
        {lastWord && (
          <Fold testId="story-fold-last" label="마지막 한마디" title="도리가 마지막으로 전하는 말이야" defaultOpen>
            {lastWord}
          </Fold>
        )}
      </section>

      {/* 현실 견주기: 도리의 쪽지 바로 위 */}
      {t.reality && <RealityLight rc={t.reality} />}

      {/* 도유 상담실이 열려 있으면: 현실 견주기 바로 아래에서 상담실로 안내하고, 쪽지(질문 칩)는 숨겨요 */}
      {chatOn && (
        <section data-testid="story-chat-cta" aria-label="도유 상담실" className="rounded-2xl border border-brand-300 bg-gradient-to-br from-brand-50 to-white p-4 text-center shadow-sm">
          <p className="text-[14.5px] font-bold text-gray-900">🦦 읽다가 더 궁금한 게 생겼어?</p>
          <p className="mt-1 text-xs text-gray-500">도리가 방금 본 풀이를 기억하고 있어요. 편하게 이야기해 봐요 ❄️</p>
          <div className="mt-3">{chat}</div>
        </section>
      )}

      {/* 4) 도리의 쪽지 (상담실이 꺼져 있을 때만) */}
      {!chatOn && (
      <section data-testid="story-note" aria-label="도리의 쪽지" className="relative rounded-2xl border border-amber-200 bg-[#fff9e6] p-4 shadow-sm">
        <span aria-hidden="true" className="absolute -top-2.5 left-6 h-4 w-16 -rotate-2 rounded-sm bg-amber-200/80" />
        <p className="text-[11px] font-bold text-amber-700">🦦 도리의 쪽지 · 더 물어보기</p>
        <p className="mt-1 text-[14.5px] font-bold leading-relaxed text-gray-900">읽다가 더 궁금한 게 생겼어? 도리한테 편하게 물어봐 ❄️</p>
        {closing}
      </section>
      )}
    </div>
  );
}
