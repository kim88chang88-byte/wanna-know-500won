"use client";

import type { ReactNode } from "react";
import ManseReport from "@/components/premium/ManseReport";
import { RealityLight } from "@/components/premium/RealityLight";
import type { PremiumReportView } from "@/lib/premium/types";
import { BRANCHES, STEMS, type Element } from "@/lib/saju/constants";
import { Stars } from "./ReadingCard";
import { firstSentence, iyeyo, stripSummaryLead, tidyFold, toParagraphs, trimToLastSentence } from "@/lib/storyHelpers";


/*
 * 500원 풀이의 "읽는 순서". 내 정보·고민 → 네 기둥 → 요약하자면 → 접어 둔 풀이 → 도리의 쪽지(이어 묻기).
 * 새로 AI 를 부르지 않고, 이미 받은 풀이(도리의 풀이 카드 + 주제 분석 + 고민 답)를 이야기 순서로 다시 배치해요.
 */

export interface StoryReading {
  keyword: string;
  total: { score: number; summary: string };
  indicators: Array<{ key?: string; label: string; score: number; comment: string | null }>;
  reason?: string;
  story?: string;
  folds?: { elements?: string; self?: string; praise?: string; lack?: string; improve?: string; lucky?: string };
}

const EL_CLASS: Record<Element, string> = {
  wood: "bg-emerald-400 text-white",
  fire: "bg-rose-400 text-white",
  earth: "bg-amber-300 text-amber-950",
  metal: "bg-slate-200 text-slate-700",
  water: "bg-sky-500 text-white",
};

/** 간지 한 글자의 오행 (천간이면 천간표, 지지면 지지표에서 찾아요) */
function elementOfChar(ch: string, branch: boolean): Element | null {
  const hit = branch ? BRANCHES.find((b) => b.hanja === ch) : STEMS.find((s) => s.hanja === ch);
  return hit ? hit.element : null;
}

function Pillars({ report }: { report: PremiumReportView }) {
  // 한국식 만세력 순서: 시 · 일 · 월 · 연
  const order = ["hour", "day", "month", "year"] as const;
  const list = order.map((k) => report.pillars.find((p) => p.key === k)).filter((p): p is NonNullable<typeof p> => Boolean(p));
  return (
    <div data-testid="story-pillars" className="mt-3 grid grid-cols-4 gap-1.5 overflow-hidden rounded-2xl text-center">
      {list.map((p) => {
        const [stem, branch] = p.full ? Array.from(p.full) : [null, null];
        const se = stem ? elementOfChar(stem, false) : null;
        const be = branch ? elementOfChar(branch, true) : null;
        return (
          <div key={p.key} className="space-y-1.5">
            <div className="text-[11px] font-bold text-gray-500">{p.label}</div>
            {p.full ? (
              <>
                <div className={`py-2.5 font-serifKr text-2xl font-black leading-none ${se ? EL_CLASS[se] : "bg-gray-100"}`} aria-label={`${p.label} ${p.full}`}>
                  {stem}
                  <div className="mt-1 text-[10px] font-bold opacity-80">{p.reading?.[0] ?? ""}</div>
                </div>
                <div className={`py-2.5 font-serifKr text-2xl font-black leading-none ${be ? EL_CLASS[be] : "bg-gray-100"}`}>
                  {branch}
                  <div className="mt-1 text-[10px] font-bold opacity-80">{p.reading?.[1] ?? ""}</div>
                </div>
              </>
            ) : (
              <div className="rounded-xl bg-gray-100 py-9 text-xs text-gray-400">시간 미상</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** 긴 글을 문단으로 나눠 보여줘요. (내용이 바뀌는 곳마다 한 줄 띄움) */
function Paras({ text, className = "" }: { text: string; className?: string }) {
  return (
    <div className={`space-y-3.5 ${className}`}>
      {toParagraphs(text).map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}

function Fold({ label, title, children, testId, defaultOpen = false }: { label: string; title: string; children: ReactNode; testId?: string; defaultOpen?: boolean }) {
  return (
    <details data-testid={testId ?? "story-fold"} open={defaultOpen} className="group border-t border-brand-100 first:border-t-0">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-1 py-3.5">
        <span className="min-w-0">
          <span className="block text-[11px] font-bold text-brand-500">{label}</span>
          <span className="mt-0.5 block text-[15px] font-bold leading-snug text-gray-900 break-keep">{title}</span>
        </span>
        <span aria-hidden="true" className="shrink-0 text-gray-400 transition-transform group-open:rotate-180">⌄</span>
      </summary>
      <div className="whitespace-pre-line px-1 pb-4 text-[14px] leading-[1.9] text-gray-700 break-keep">{children}</div>
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
  const concern = report.concern;
  const concernText = concern?.text?.trim() || (concern?.answers.length ? concern.answers.map((a) => a.title).join(" · ") : "");
  const rawFolds = reading?.folds ?? {};
  // 이미 저장된 풀이에도 같은 다듬기를 해요. (제목 따라 쓰기, 끊긴 끝 문장)
  const f = {
    elements: rawFolds.elements ? tidyFold("elements", rawFolds.elements) : undefined,
    self: rawFolds.self ? tidyFold("self", rawFolds.self) : undefined,
    praise: rawFolds.praise ? tidyFold("praise", rawFolds.praise) : undefined,
    lack: rawFolds.lack ? tidyFold("lack", rawFolds.lack) : undefined,
    improve: rawFolds.improve ? tidyFold("improve", rawFolds.improve) : undefined,
    lucky: rawFolds.lucky ? tidyFold("lucky", rawFolds.lucky) : undefined,
  };
  const hasFolds = Boolean(f.elements || f.self || f.praise || f.lack || f.improve);
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
          <Paras text={summary} className="mt-3 text-[14.5px] leading-[1.9] text-gray-800 break-keep" />
        </section>
      )}

      {/* 3) 접어 둔 풀이: 오행 → 나는 누구 → 칭찬 → 아쉬움 → 개선 → 행운 처방 → 원국 → 마지막 한마디 */}
      <section aria-label="자세한 풀이" data-testid="story-folds" className="rounded-2xl border border-brand-100 bg-white px-4">
        <p className="pt-3.5 text-xs text-gray-500">각 제목을 누르면 풀이가 펼쳐져요</p>
        {hasFolds ? (
          <>
            {f.elements && (
              <Fold testId="story-fold-elements" label="STEP 1" title="오행으로 보는 사주">
                <p className="mb-2.5 flex flex-wrap gap-1.5">
                  {report.elements.map((e) => (
                    <span key={e.name} className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-gray-700">
                      {e.name} {e.count}
                    </span>
                  ))}
                </p>
                <Paras text={f.elements} />
              </Fold>
            )}
            {f.self && (
              <Fold testId="story-fold-self" label="STEP 2" title="나는 어떤 사람인가?">
                <Paras text={f.self} />
              </Fold>
            )}
            {f.praise && (
              <Fold testId="story-fold-praise" label="STEP 3" title="이건 정말 칭찬해요 👏">
                <Paras text={f.praise} />
              </Fold>
            )}
            {f.lack && (
              <Fold testId="story-fold-lack" label="STEP 4" title="그렇지만 이건 조금 부족해요">
                <Paras text={f.lack} />
              </Fold>
            )}
            {(f.improve || (concern && concern.answers.length > 1)) && (
              <Fold testId="story-fold-improve" label="STEP 5" title="이렇게 개선해보아요 🌱">
                {f.improve && <Paras text={f.improve} />}
                {concern && concern.answers.length > 1 && (
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
            )}
          </>
        ) : (
          <>
            {t.points.map((pt, n) => (
              <Fold key={`${n}-${pt.title}`} label={`${t.label} · ${pt.title}`} title={firstSentence(pt.body)}>
                {pt.body}
              </Fold>
            ))}
          </>
        )}
        <Fold testId="story-fold-lucky" label="행운 처방" title={`행운 컬러는 ${t.lucky.color}, 방향은 ${t.lucky.direction}${iyeyo(t.lucky.direction)}`}>
          {f.lucky && <Paras text={f.lucky} className="mb-3.5" />}
          <p className="flex items-center gap-2">
            <span aria-hidden="true" className="h-4 w-4 shrink-0 rounded-full border border-black/10" style={{ backgroundColor: t.lucky.hex }} />
            행운 컬러 <b className="text-gray-900">{t.lucky.color}</b> · 행운 방향 <b className="text-gray-900">{t.lucky.direction}</b>
          </p>
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
