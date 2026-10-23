"use client";

import { useEffect, useState } from "react";
import { getBrowserStorage } from "@/lib/drawCounter";
import { followupPrompt, markAnswered, pickVaultFollowup, readAnswered, type FollowupPick } from "@/lib/vaultFollowup";

/** 보관함에 있는 지난 풀이를 현실과 견줘 보게 물어요. 로그인한 회원에게만 보이고, 어느 쪽을 골라도 응원으로 마무리해요. */
export function VaultFollowupCard() {
  const [pick, setPick] = useState<FollowupPick | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/vault", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { items?: Array<{ id: string; topic: string; premium?: boolean; created_at: string }> } | null) => {
        if (!alive || !data?.items) return;
        setPick(pickVaultFollowup(data.items, new Date(), readAnswered(getBrowserStorage())));
      })
      .catch(() => {
        /* 못 불러와도 조용히 넘어가요 */
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!pick || hidden) return null;
  const { title, check } = followupPrompt(pick);
  const choose = (i: number) => {
    setChosen(i);
    markAnswered(getBrowserStorage(), pick.id);
  };

  return (
    <section data-testid="vault-followup" aria-label="지난 풀이 안부" className="mb-4 rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3.5 shadow-sm">
      <p className="text-sm font-bold text-gray-900">🦦 {title}</p>
      <p className="mt-1 text-[13px] leading-relaxed text-slate-700">{check.question}</p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {check.options.map((o, i) => (
          <button
            key={o.label}
            type="button"
            aria-pressed={chosen === i}
            disabled={chosen !== null}
            onClick={() => choose(i)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors ${chosen === i ? "border-amber-500 bg-amber-500 text-white" : "border-amber-300 bg-white text-amber-800 hover:border-amber-500 disabled:opacity-60"}`}
          >
            {o.label}
          </button>
        ))}
      </div>
      {chosen !== null && (
        <div role="status" className="mt-2.5">
          <p data-testid="vault-followup-reply" className="text-[13.5px] leading-relaxed text-gray-800">{check.options[chosen].message}</p>
          <div className="mt-2.5 flex items-center gap-3 text-xs">
            <a href="/vault" className="rounded-full bg-brand-500 px-3.5 py-1.5 font-bold text-white">그때 풀이 다시 보기</a>
            <button type="button" onClick={() => setHidden(true)} className="text-gray-500 underline">닫기</button>
          </div>
        </div>
      )}
      {chosen === null && (
        <button type="button" onClick={() => { markAnswered(getBrowserStorage(), pick.id); setHidden(true); }} className="mt-2 text-[11px] text-gray-400 underline">이 풀이는 괜찮아요</button>
      )}
    </section>
  );
}
