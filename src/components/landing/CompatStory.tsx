"use client";

import type { ReactNode } from "react";
import type { CompatPerson, PremiumReportView } from "@/lib/premium/types";
import { ELEMENT_BOX, EL_LABEL, elementOfChar } from "@/lib/elementColor";
import { Fold, MARK, Paras, Pillars } from "./StoryReport";

/*
 * 둘의 궁합 결과. 500원 풀이(StoryReport)와 같은 순서·같은 밝은 카드 틀로 보여줘요.
 * 두 사람의 정보 → 요약하자면(지수·한 줄) → 접어 둔 풀이(잘 맞는 점 / 맞춰 가면 좋은 점) → 마무리 → 도리의 쪽지.
 * 계산 결과(report.compat)만 쓰고, AI 를 새로 부르지 않아요.
 */

function PersonCard({ p, name }: { p: CompatPerson; name: string }) {
  const [stem, branch] = p.dayPillar ? Array.from(p.dayPillar) : [null, null];
  const cells = [stem, branch].map((ch, i) => ({ ch, el: ch ? elementOfChar(ch, i === 1) : null, reading: p.dayReading ? Array.from(p.dayReading)[i] : "" }));
  return (
    <div data-testid="compat-person" className="rounded-xl bg-brand-50/60 p-3 text-center">
      <p className="text-[11px] font-bold text-gray-500">{name}의 일주</p>
      <div className="mt-1.5 flex justify-center gap-1.5">
        {cells.map((c, i) => (
          <div key={i} className={`relative flex w-12 flex-col items-center rounded-xl pb-1.5 pt-5 ${c.el ? ELEMENT_BOX[c.el] : "bg-gray-100"}`}>
            {c.el && <span className="absolute right-1 top-1 rounded-full bg-black/10 px-1 py-px text-[9px] font-bold leading-tight">{EL_LABEL[c.el].icon}</span>}
            <span className="font-serifKr text-xl font-black leading-none">{c.ch ?? "?"}</span>
            <span className="text-[10px] font-bold opacity-85">{c.reading}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 flex flex-wrap justify-center gap-1">
        {p.elements.map((e) => {
          const el = EL_LABEL[e.kind];
          return (
            <span key={e.name} data-testid="compat-el" className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${e.count > 0 ? "bg-white text-gray-700" : "bg-white/50 text-gray-400"}`}>
              {el.icon} {el.name} {e.count}
            </span>
          );
        })}
      </p>
      {p.hourUnknown && <p className="mt-1.5 text-[10.5px] text-amber-700">시간 모름 · 시주 제외</p>}
    </div>
  );
}

export default function CompatStory({ report, intro, closing, lastWord, partnerName = "상대" }: { report: PremiumReportView; intro: string | null; closing?: ReactNode; lastWord?: ReactNode; partnerName?: string }) {
  const c = report.compat;
  if (!c) return null;
  const mark = MARK.marriage;
  const good = c.points.filter((p) => p.tone === "good");
  const tip = c.points.filter((p) => p.tone === "tip");
  const groups = [
    { key: "good", label: "잘 맞는 점", emoji: "💗", list: good },
    { key: "tip", label: "맞춰 가면 좋은 점", emoji: "🌱", list: tip },
  ].filter((g) => g.list.length > 0);
  const stars = Math.max(1, Math.min(5, Math.round(c.score / 20)));
  return (
    <div data-testid="story-report" className="mt-5 space-y-5">
      <section aria-label="두 사람 정보" className="rounded-2xl border border-brand-100 bg-white p-4">
        {intro && <p data-testid="story-intro" className="text-xs font-semibold text-brand-700">{intro}</p>}
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <PersonCard p={c.me} name="나" />
          <PersonCard p={c.partner} name={partnerName} />
        </div>
        <p className="mt-3.5 text-[11px] font-bold text-gray-500">나의 사주 네 기둥</p>
        <Pillars report={report} pillars={c.me.pillars} owner="내" hint="위 칸은 겉으로 드러나는 기운(하늘), 아래 칸은 바탕이 되는 기운(땅)이에요. 두 사람의 같은 자리(특히 일주)를 견주어 보세요." />
        {c.partner.pillars && (
          <>
            <p className="mt-5 text-[11px] font-bold text-gray-500">{partnerName}의 사주 네 기둥</p>
            <Pillars pillars={c.partner.pillars} owner={`${partnerName}의`} hint="같은 자리끼리 글자가 어울리면 합, 부딪히면 충이에요. 어떤 자리가 어떻게 만나는지는 아래 풀이에서 풀어 드려요." />
          </>
        )}
      </section>

      <section data-testid="story-lead" aria-labelledby="story-lead-h" className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-amber-50/60 p-4">
        <div className="flex items-center justify-between gap-2">
          <h5 id="story-lead-h" className="font-cute text-lg font-normal text-brand-700">요약하자면</h5>
          <span className="flex items-center gap-1.5 text-xs">
            <span className="whitespace-nowrap text-amber-400" aria-label={`5점 만점에 ${stars}점`}>
              {"★".repeat(stars)}
              <span className="text-gray-200">{"★".repeat(5 - stars)}</span>
            </span>
            <span data-testid="compat-score" className="rounded-full border border-brand-100 bg-white px-2 py-0.5 text-[11px] font-bold text-brand-700">{c.score}점</span>
          </span>
        </div>
        <Paras mark={mark} text={c.summary ?? `${c.headline}\n\n${c.closing}`} className="mt-3 text-[16px] leading-[1.85] text-gray-800 break-keep" />
        <p className="mt-2 text-[11px] text-gray-500">점수는 재미로 보는 참고 지수예요.</p>
      </section>

      <section aria-label="자세한 풀이" data-testid="story-folds" className="rounded-2xl border border-brand-100 bg-white px-4">
        <p className="pt-3.5 text-xs text-gray-500">각 제목을 누르면 풀이가 펼쳐져요</p>
        {groups.map((g) =>
          g.list.map((pt, n) => (
            <Fold key={`${g.key}-${n}`} testId="story-fold" label={`${g.emoji} ${g.label}`} title={pt.title}>
              {pt.body}
            </Fold>
          )),
        )}
        {lastWord && (
          <Fold testId="story-fold-last" label="마지막 한마디" title="도리가 마지막으로 전하는 말이에요" defaultOpen>
            {lastWord}
          </Fold>
        )}
      </section>

      <section data-testid="story-note" aria-label="도리의 쪽지" className="relative rounded-2xl border border-amber-200 bg-[#fff9e6] p-4 shadow-sm">
        <span aria-hidden="true" className="absolute -top-2.5 left-6 h-4 w-16 -rotate-2 rounded-sm bg-amber-200/80" />
        <p className="text-[11px] font-bold text-amber-700">🦦 도리의 쪽지 · 더 물어보기</p>
        <p className="mt-1 text-[14.5px] font-bold leading-relaxed text-gray-900">읽다가 더 궁금한 게 생겼어? 도리한테 편하게 물어봐 🫧</p>
        {closing}
      </section>
    </div>
  );
}
