"use client";

import { useEffect, useState } from "react";
import { dayKey, getBrowserStorage } from "@/lib/drawCounter";
import { answerFollowup, dueFollowup, followupQuestion, followupReply, forgetFollowup, MOODS, readFollowup, type Followup, type Mood } from "@/lib/followup";

/** 지난번 고민을 도리가 다시 물어봐요. 이 기기에 저장된 고른 항목 이름으로만 만들어요. */
export function FollowupCard() {
  const [f, setF] = useState<Followup | null>(null);
  const [mood, setMood] = useState<Mood | null>(null);

  useEffect(() => {
    const cur = readFollowup(getBrowserStorage());
    if (dueFollowup(cur, dayKey(new Date()))) setF(cur);
  }, []);

  if (!f) return null;
  const pick = (m: Mood) => {
    setMood(m);
    answerFollowup(getBrowserStorage(), dayKey(new Date()));
  };
  const close = () => {
    setF(null);
  };
  const forget = () => {
    forgetFollowup(getBrowserStorage());
    setF(null);
  };

  return (
    <section data-testid="followup-card" aria-label="도리의 안부 인사" className="mb-4 rounded-2xl border border-brand-200 bg-white/90 px-4 py-3.5 shadow-sm">
      <p className="text-sm font-bold text-gray-900">🦦 {followupQuestion(f.tag)}</p>
      {mood === null ? (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <button key={m.id} type="button" onClick={() => pick(m.id)} className="rounded-full border border-brand-200 bg-white px-3.5 py-1.5 text-xs font-bold text-gray-800 hover:bg-brand-50">
              {m.label}
            </button>
          ))}
        </div>
      ) : (
        <div role="status" className="mt-2.5">
          <p data-testid="followup-reply" className="text-[13.5px] leading-relaxed text-gray-800">{followupReply(mood)}</p>
          <div className="mt-2.5 flex items-center gap-3 text-xs">
            <a href="#machines" onClick={close} className="rounded-full bg-brand-500 px-3.5 py-1.5 font-bold text-white">오늘의 운세 뽑으러 가기</a>
            <button type="button" onClick={close} className="text-gray-500 underline">닫기</button>
          </div>
        </div>
      )}
      {mood === null && (
        <button type="button" onClick={forget} className="mt-2 text-[11px] text-gray-400 underline">이 안부 기록 지우기</button>
      )}
    </section>
  );
}
