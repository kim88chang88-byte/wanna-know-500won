"use client";

import DoriIcon from "./DoriIcon";
import { ConfirmChoice } from "@/components/ConfirmChoice";
import { useEffect, useState } from "react";
import { dayKey, getBrowserStorage } from "@/lib/drawCounter";
import { followupPrompt, markAnswered, pickVaultFollowup, readAnswered, readTodayChoice, saveChoice, type FollowupPick } from "@/lib/vaultFollowup";

const CLOSED_KEY = "wanna500:vault-followup:closed:v1";

function closedToday(): boolean {
  try {
    return getBrowserStorage()?.getItem(CLOSED_KEY) === dayKey(new Date());
  } catch {
    return false;
  }
}
function rememberClosed() {
  try {
    getBrowserStorage()?.setItem(CLOSED_KEY, dayKey(new Date()));
  } catch {
    /* 저장이 안 돼도 이번 방문에서만 닫혀요 */
  }
}

/**
 * 보관함에 있는 지난 풀이를 현실과 견줘 보게 묻는 안부 말풍선이에요. 헤더의 닉네임 버튼 아래에 펼쳐진 채 나타나고,
 * ✕로 닫으면 닉네임 버튼의 빨간 점만 남아요(오늘은 다시 튀어나오지 않아요). 어느 쪽을 골라도 응원으로 마무리해요.
 * 로그인한 회원에게만 보여요. 헤더가 감싸 주는 relative 상자 안에서 absolute 로 놓여요.
 */
export function VaultFollowupBubble({ onShow, onDot }: { onShow?: (shown: boolean) => void; onDot?: (dot: boolean) => void }) {
  const [pick, setPick] = useState<FollowupPick | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);
  const [asking, setAsking] = useState<number | null>(null);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch("/api/vault", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { items?: Array<{ id: string; topic: string; premium?: boolean; created_at: string }> } | null) => {
        if (!alive || !data?.items) return;
        const now = new Date();
        const store = getBrowserStorage();
        const wasClosed = closedToday();
        // 오늘 이미 고른 답이 있으면 그 말풍선을 같은 답으로 다시 보여 줘요. (풀이를 보러 갔다 오거나 새로고침해도 그대로)
        const today = readTodayChoice(store, now);
        const kept = today ? pickVaultFollowup(data.items.filter((r) => r.id === today.id), now, []) : null;
        if (kept && today && today.index < followupPrompt(kept).check.options.length) {
          setPick(kept);
          setChosen(today.index);
          setOpen(!wasClosed);
          onShow?.(true);
          return;
        }
        const next = pickVaultFollowup(data.items, now, readAnswered(store));
        setPick(next);
        setOpen(!wasClosed);
        onShow?.(Boolean(next)); // 안부는 한 번에 하나만 보여 주려고, 위쪽에 알려요
      })
      .catch(() => {
        /* 못 불러와도 조용히 넘어가요 */
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 닫았고 아직 대답하지 않았으면 닉네임 버튼에 빨간 점을 켜요
  const dot = Boolean(pick) && !open && chosen === null;
  useEffect(() => {
    onDot?.(dot);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dot]);
  // 빨간 점이 찍힌 닉네임 버튼을 누르면 말풍선이 다시 열려요
  useEffect(() => {
    if (!pick) return;
    const reopen = () => setOpen(true);
    window.addEventListener("wanna500:vault-bubble", reopen);
    return () => window.removeEventListener("wanna500:vault-bubble", reopen);
  }, [pick]);

  if (!pick || !open) return null;
  const { title, check } = followupPrompt(pick);
  const close = () => {
    rememberClosed();
    setOpen(false);
    setAsking(null);
  };
  const choose = (i: number) => {
    setChosen(i);
    markAnswered(getBrowserStorage(), pick.id);
    saveChoice(getBrowserStorage(), pick.id, i, new Date());
  };

  return (
    <div className="vf-bubble absolute right-0 top-full z-50 mt-3 w-[min(17.5rem,calc(100vw-1.5rem))]" data-testid="vault-followup" role="region" aria-label="지난 풀이 안부">
      <span aria-hidden="true" className="absolute -top-[7px] right-[5.4rem] h-3.5 w-3.5 rotate-45 border-l border-t border-amber-300 bg-amber-50 sm:right-[6.4rem]" />
      <div className="relative rounded-2xl border border-amber-300 bg-amber-50 px-3.5 py-3 shadow-[0_8px_22px_rgba(124,90,10,0.18)]">
        <div className="flex items-start gap-1">
          <p className="min-w-0 flex-1 text-[13px] font-bold leading-snug text-gray-900"><DoriIcon className="!h-6 !w-6" />{title}</p>
          <button type="button" onClick={close} aria-label="안부 말풍선 닫기" data-testid="vault-followup-close" className="-mr-1 -mt-0.5 shrink-0 px-1.5 text-base leading-none text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>
        <p className="mt-1 text-[12.5px] leading-relaxed text-slate-700">{check.question}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {check.options.map((o, i) => (
            <button
              key={o.label}
              type="button"
              aria-pressed={chosen === i}
              disabled={chosen !== null}
              onClick={() => setAsking(i)}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${chosen === i ? "border-amber-500 bg-amber-500 text-white" : "border-amber-300 bg-white text-amber-800 hover:border-amber-500 disabled:opacity-60"}`}
            >
              {o.label}
            </button>
          ))}
        </div>
        {asking !== null && chosen === null && (
          <ConfirmChoice
            label={check.options[asking].label}
            onNo={() => setAsking(null)}
            onYes={() => {
              choose(asking);
              setAsking(null);
            }}
          />
        )}
        {chosen !== null && (
          <div role="status" className="mt-2.5">
            <p data-testid="vault-followup-reply" className="text-[13px] leading-relaxed text-gray-800">{check.options[chosen].message}</p>
            <div className="mt-2.5 flex items-center justify-between gap-3 text-xs">
              <button type="button" onClick={close} className="text-gray-500 underline">접어두기</button>
              <a href="/vault" className="whitespace-nowrap rounded-full bg-brand-500 px-3.5 py-1.5 font-bold text-white">그때 풀이 다시 보기</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
