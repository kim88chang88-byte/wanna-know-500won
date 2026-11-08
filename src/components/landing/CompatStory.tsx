"use client";

import { possessive } from "@/lib/callName";
import { useState, type ReactNode } from "react";
import type { CompatLink, CompatPerson, CompatScore, CompatView, PremiumReportView } from "@/lib/premium/types";
import { josa } from "@/lib/premium/josa";
import { buildCompatAnswer, buildShareSummary, buildTogether, elementNote, plainPointTitle } from "@/lib/premium/compatAnswer";
import { getBrowserStorage } from "@/lib/drawCounter";
import { readMyCode, withRef } from "@/lib/referral";
import { EL_LABEL, elementOfChar } from "@/lib/elementColor";
import ElementTile from "@/components/ElementTile";
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
          <div key={i} className="w-[3.75rem]">
            <ElementTile ch={c.ch} el={c.el} reading={c.reading} compact sizeClass="text-[28px]" label={`${name}의 일주`} />
          </div>
        ))}
      </div>
      {p.hourUnknown && <p className="mt-1.5 text-[10.5px] text-amber-700">시간 모름 · 시주 제외</p>}
    </div>
  );
}


const REL_STYLE: Record<string, string> = {
  합: "bg-emerald-100 text-emerald-800",
  충: "bg-orange-100 text-orange-800",
  해: "bg-amber-100 text-amber-800",
};

/** 같은 자리끼리 만나는 모습: 합이면 초록, 충이면 주황으로 표시해요. */
function LinkStrip({ links, partnerName }: { links: CompatLink[]; partnerName: string }) {
  return (
    <div data-testid="compat-links" className="mt-3.5">
      <p className="text-[11px] font-bold text-gray-500">같은 자리끼리 이렇게 만나요</p>
      <ul className="mt-1.5 space-y-1.5">
        {links.map((l) => (
          <li key={l.place} className="flex items-center gap-2 rounded-xl bg-brand-50/60 px-3 py-2 text-[12.5px]">
            <span className="w-[8.5rem] shrink-0 font-bold text-gray-700">{l.place}</span>
            <span className="font-serifKr text-[17px] font-black text-gray-900" aria-label="나">{l.me}</span>
            <span aria-hidden="true" className="text-gray-300">—</span>
            <span className="font-serifKr text-[17px] font-black text-gray-900" aria-label={partnerName}>{l.partner}</span>
            <span className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold ${l.rel ? REL_STYLE[l.rel] : "bg-gray-100 text-gray-500"}`}>{l.rel ?? "무난"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const EL_BAR: Record<string, string> = { wood: "bg-emerald-500", fire: "bg-rose-500", earth: "bg-amber-500", metal: "bg-slate-400", water: "bg-sky-500", unknown: "bg-brand-500" };

/** 한 사람의 오행을 한 줄 비율 막대로 보여요. */
function ElementStack({ person, label, tone }: { person: CompatPerson; label: string; tone: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-[4.5rem] shrink-0 truncate text-[12px] font-bold ${tone}`}>● {label}</span>
      <div role="img" aria-label={`${label} ${person.elements.map((e) => `${e.name} ${e.count}`).join(", ")}`} className="flex h-4 flex-1 gap-0.5 overflow-hidden rounded-full bg-gray-100">
        {person.elements.filter((e) => e.count > 0).map((e) => (
          <span key={e.name} className={EL_BAR[e.kind] ?? EL_BAR.unknown} style={{ flexGrow: e.count, flexBasis: 0 }} />
        ))}
      </div>
    </div>
  );
}

/** 두 사람의 오행을 비율 막대 두 줄로 견줘요. 숫자는 나 · 상대 순서. */
function ElementBars({ me, partner, partnerName }: { me: CompatPerson; partner: CompatPerson; partnerName: string }) {
  const gaps = me.elements.map((e, i) => Math.abs(e.count - (partner.elements[i]?.count ?? 0)));
  const maxGap = Math.max(0, ...gaps);
  return (
    <div data-testid="compat-elbars" className="mt-3.5">
      <p className="text-[11px] font-bold text-gray-500">오행 비교</p>
      <div className="mt-1.5 space-y-1.5">
        <ElementStack person={me} label="나" tone="text-brand-500" />
        <ElementStack person={partner} label={partnerName} tone="text-pink-500" />
      </div>
      <ul className="mt-2 grid grid-cols-5 gap-1 text-center text-[11.5px]">
        {me.elements.map((e, i) => {
          const o = partner.elements[i];
          const el = e.kind === "unknown" ? { icon: "", name: e.name } : EL_LABEL[e.kind];
          const zero = e.count === 0 && (o?.count ?? 0) === 0;
          return (
            <li key={e.name} className={`rounded-xl bg-brand-50/60 px-0.5 py-1.5 ${zero ? "opacity-45" : ""}`}>
              <span aria-hidden="true" className={`mx-auto mb-0.5 block h-2 w-2 rounded-full ${EL_BAR[e.kind] ?? EL_BAR.unknown}`} />
              <span className="font-bold text-gray-700">{el.name}</span>
              <span className={`block text-[10.5px] ${maxGap >= 2 && gaps[i] === maxGap ? "font-bold text-orange-600" : "text-gray-500"}`}>{e.count} · {o?.count ?? 0}</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-1.5 text-[10.5px] text-gray-400">숫자는 나 · {partnerName} 순서예요.</p>
      <p data-testid="compat-elnote" className="mt-2 text-[12.5px] leading-relaxed text-gray-600 break-keep">{elementNote(me, partner, partnerName)}</p>
    </div>
  );
}

function ScoreBars({ scores }: { scores: CompatScore[] }) {
  return (
    <ul data-testid="compat-scores" className="mt-3.5 space-y-2">
      {scores.map((s) => (
        <li key={s.label}>
          <div className="flex items-baseline justify-between text-[12.5px]">
            <span className="font-bold text-gray-800">{s.label}</span>
            <span className="text-[11.5px] text-gray-500">{s.note} · <b className="text-brand-700">{s.score}</b></span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-brand-100">
            <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-pink-400" style={{ width: `${s.score}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** 둘이 마주 앉아 해 볼 질문 3개 + 이번 주 작은 행동 + 상대에게 보낼 한 장 요약 */
function TogetherCard({ c, name, partnerName, hideSend = false }: { c: CompatView; name: string | null; partnerName: string; hideSend?: boolean }) {
  const [msg, setMsg] = useState("");
  const base = buildTogether(c);
  const together = { questions: c.ai?.questions ?? base.questions, action: c.ai?.action ?? base.action };
  async function send() {
    const origin = typeof window === "undefined" ? "" : withRef(window.location.origin, readMyCode(getBrowserStorage()));
    const text = buildShareSummary(c, { me: name, partner: partnerName === "상대" || partnerName === "상대방" ? null : partnerName }, together, origin);
    try {
      if (navigator.share) {
        await navigator.share({ title: "도유 사주 · 둘의 궁합", text });
        setMsg("");
        return;
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setMsg("요약을 복사했어요. 상대에게 붙여넣어 보내 주세요 ❄️");
    } catch {
      setMsg("복사하지 못했어요. 글을 길게 눌러 직접 복사해 주세요.");
    }
  }
  return (
    <section data-testid="compat-together" aria-label="둘이 같이 해 보기" className="rounded-2xl border border-brand-100 bg-white p-4">
      <p className="text-[11px] font-bold text-brand-500">💞 둘이 같이 해 보기</p>
      <p className="mt-1 text-[15px] font-bold leading-snug text-gray-900">마주 앉아 서로에게 물어보세요</p>
      <ol className="mt-2.5 space-y-2">
        {together.questions.map((q, i) => (
          <li key={i} className="flex gap-2 rounded-xl bg-brand-50/60 px-3 py-2 text-[14.5px] leading-relaxed text-gray-800 break-keep">
            <span className="font-bold text-brand-600">{i + 1}</span>
            <span>{q}</span>
          </li>
        ))}
      </ol>
      <div data-testid="compat-action" className="mt-3 rounded-xl bg-amber-50/80 px-3.5 py-2.5">
        <p className="text-[11px] font-bold text-amber-700">이번 주 작은 행동</p>
        <p className="mt-0.5 text-[14.5px] leading-relaxed text-gray-800 break-keep">{together.action}</p>
      </div>
      {!hideSend && (
        <button type="button" data-testid="compat-send" onClick={send} className="mt-3.5 w-full rounded-full border border-brand-300 bg-white py-2.5 text-sm font-bold text-brand-700">
          💌 상대방에게 우리 궁합 결과 보내기
        </button>
      )}
      {msg && <p role="status" className="mt-2 text-center text-xs text-gray-500">{msg}</p>}
    </section>
  );
}

export default function CompatStory({ report, intro, closing, lastWord, partnerName = "상대", name = null, shareInCard = false }: { report: PremiumReportView; intro: string | null; closing?: ReactNode; lastWord?: ReactNode; partnerName?: string; name?: string | null; /** 결과 카드 공유가 같이 있는 화면: 상대에게 보내기 버튼은 그쪽으로 합쳐졌어요 */ shareInCard?: boolean }) {
  const c = report.compat;
  if (!c) return null;
  const mark = MARK.marriage;
  const good = c.points.filter((p) => p.tone === "good");
  const tip = c.points.filter((p) => p.tone === "tip");
  const groups = [
    { key: "good", label: "잘 맞는 점", emoji: "💗", list: good },
    { key: "tip", label: "맞춰 가면 좋은 점", emoji: "🌱", list: tip },
  ].filter((g) => g.list.length > 0);
  const concern = report.concern;
  const concernText = concern?.text?.trim() || (concern?.answers.length ? concern.answers.map((a) => a.title).join(" · ") : "");
  const answer = buildCompatAnswer(c);
  const who = name?.trim();
  const answerTitle = concernText || answer?.hasRelation ? `${who ? possessive(who) : "나의"} 고민에 대한 도리의 답은...` : "두 사람에 대한 도리의 답은...";
  const stars = Math.max(1, Math.min(5, Math.round(c.score / 20)));
  return (
    <div data-testid="story-report" className="mt-5 space-y-5">
      {concernText && (
        <section data-testid="compat-concern" aria-label="내가 고른 고민" className="-mb-2.5 rounded-2xl bg-brand-50/70 px-4 py-3">
          <p className="text-[11px] font-bold text-gray-500">내가 고른 고민</p>
          <p className="mt-0.5 text-sm leading-relaxed text-gray-800">{concernText}</p>
        </section>
      )}
      {(answer || c.ai?.answer) && (
        <section data-testid="compat-answer" aria-label="도리의 답" className="rounded-2xl border border-brand-100 bg-gradient-to-br from-white to-amber-50/60 px-4 py-3.5">
          <p className="text-[11px] font-bold text-brand-700">{answerTitle}</p>
          <Paras mark={mark} text={c.ai?.answer ?? answer?.body ?? ""} className="mt-1.5 text-[15px] leading-[1.85] text-gray-800 break-keep" />
        </section>
      )}

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
        <Paras mark={mark} text={c.ai?.summary ?? c.summary ?? `${c.headline}\n\n${c.closing}`} className="mt-3 text-[16px] leading-[1.85] text-gray-800 break-keep" />
        {c.scores && <ScoreBars scores={c.scores} />}
        <p className="mt-2 text-[11px] text-gray-500">점수는 재미로 보는 참고 지수예요.</p>
      </section>

      <section aria-label="두 사람 정보" className="rounded-2xl border border-brand-100 bg-white p-4">
        {intro && <p data-testid="story-intro" className="text-xs font-semibold text-brand-700">{intro}</p>}
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <PersonCard p={c.me} name="나" />
          <PersonCard p={c.partner} name={partnerName} />
        </div>
        {c.links && <LinkStrip links={c.links} partnerName={partnerName} />}
        <ElementBars me={c.me} partner={c.partner} partnerName={partnerName} />
        {c.partnerTrait?.body && (
          <div data-testid="compat-trait" className="mt-3.5 rounded-xl bg-pink-50/70 px-3.5 py-2.5">
            <p className="text-[11px] font-bold text-gray-500">{josa(partnerName, "은/는")} 이런 사람이에요</p>
            <p className="mt-0.5 text-[13.5px] leading-relaxed text-gray-800 break-keep">{c.partnerTrait.body}</p>
          </div>
        )}
        <details open data-testid="compat-pillars" className="group mt-3.5 rounded-xl border border-brand-100">
          <summary className="flex cursor-pointer list-none items-center justify-between px-3.5 py-2.5 text-[13px] font-bold text-gray-700">
            <span>두 사람의 사주 네 기둥 자세히 보기</span>
            <span aria-hidden="true" className="text-gray-400 transition-transform group-open:rotate-180">⌄</span>
          </summary>
          <div className="px-3.5 pb-3.5">
            <p className="mt-3.5 text-[11px] font-bold text-gray-500">나의 사주 네 기둥</p>
            <Pillars report={report} pillars={c.me.pillars} owner="내" hint="위 칸은 겉으로 드러나는 기운(하늘 글자), 아래 칸은 바탕이 되는 기운(뿌리 글자)이에요. 두 사람의 같은 자리(특히 일주)를 견주어 보세요." />
            {c.partner.pillars && (
              <>
                <p className="mt-5 text-[11px] font-bold text-gray-500">{partnerName}의 사주 네 기둥</p>
                <Pillars pillars={c.partner.pillars} owner={`${partnerName}의`} hint="같은 자리끼리 글자가 어울리면 합, 부딪히면 충이에요. 어떤 자리가 어떻게 만나는지는 아래 풀이에서 풀어 드려요." />
              </>
            )}
          </div>
        </details>
      </section>

      <section aria-label="자세한 풀이" data-testid="story-folds" className="rounded-2xl border border-brand-100 bg-white px-4">
        <p className="pt-3.5 text-xs text-gray-500">각 제목을 누르면 풀이가 펼쳐져요</p>
        {groups.map((g) =>
          g.list.map((pt, n) => (
            <Fold key={`${g.key}-${n}`} testId="story-fold" label={`${g.emoji} ${g.label}`} title={plainPointTitle(pt.title)}>
              <Paras mark={mark} text={pt.body} />
            </Fold>
          )),
        )}
        {(c.timing ?? []).map((t) => (
          <Fold key={t.title} testId="story-fold" label="📅 올해·내년 흐름" title={t.title}>
            <Paras mark={mark} text={t.body} />
          </Fold>
        ))}
        {(c.tips ?? []).map((t) => (
          <Fold key={t.title} testId="story-fold" label={`${t.emoji} 도리의 팁`} title={t.title}>
            <Paras mark={mark} text={t.body} />
          </Fold>
        ))}
        {lastWord && (
          <Fold testId="story-fold-last" label="마지막 한마디" title="도리가 마지막으로 전하는 말이에요" defaultOpen>
            {lastWord}
          </Fold>
        )}
      </section>

      <TogetherCard c={c} name={who ?? null} partnerName={partnerName} hideSend={shareInCard} />

      <section data-testid="story-note" aria-label="도리의 쪽지" className="relative rounded-2xl border border-amber-200 bg-[#fff9e6] p-4 shadow-sm">
        <span aria-hidden="true" className="absolute -top-2.5 left-6 h-4 w-16 -rotate-2 rounded-sm bg-amber-200/80" />
        <p className="text-[11px] font-bold text-amber-700">🦦 도리의 쪽지 · 더 물어보기</p>
        <p className="mt-1 text-[14.5px] font-bold leading-relaxed text-gray-900">읽다가 더 궁금한 게 생겼어? 도리한테 편하게 물어봐 ❄️</p>
        {closing}
      </section>
    </div>
  );
}
