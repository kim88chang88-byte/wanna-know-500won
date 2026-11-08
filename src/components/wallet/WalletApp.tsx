"use client";

import { useCallback, useEffect, useState } from "react";
import LoginButtons from "@/components/landing/LoginButtons";
import PurchaseModal from "@/components/pay/PurchaseModal";
import { pebbleText } from "@/lib/currency";
import { FREE_PER_DAY } from "@/lib/db/config";
import { getBrowserStorage, readCounts } from "@/lib/drawCounter";
import { readTickets } from "@/lib/stampReward";
import type { HistoryItem } from "@/lib/coinHistory";

type View = { kind: "loading" } | { kind: "login" } | { kind: "error"; message: string } | { kind: "ready"; balance: number; items: HistoryItem[] };

function when(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(iso));
  } catch {
    return "";
  }
}

function Need({ label, need, have }: { label: string; need: number; have: number }) {
  const ok = have >= need;
  const times = Math.floor(have / need);
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl bg-white px-3.5 py-2.5 border border-brand-100">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <span className={`text-sm font-black ${ok ? "text-brand-700" : "text-slate-400"}`}>{ok ? `${times}번 가능` : `${pebbleText(need)} 필요`}</span>
    </li>
  );
}

export default function WalletApp() {
  const [view, setView] = useState<View>({ kind: "loading" });
  const [freeLeft, setFreeLeft] = useState(0);
  const [tickets, setTickets] = useState(0);
  const [payOpen, setPayOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/coins/history", { cache: "no-store" });
      if (res.status === 401) return setView({ kind: "login" });
      const data = (await res.json().catch(() => null)) as { balance?: number; items?: HistoryItem[]; error?: string } | null;
      if (!res.ok || typeof data?.balance !== "number") return setView({ kind: "error", message: data?.error ?? "지갑을 불러오지 못했어요." });
      setView({ kind: "ready", balance: data.balance, items: data.items ?? [] });
    } catch {
      setView({ kind: "error", message: "지갑을 불러오지 못했어요. 인터넷 연결을 확인해 주세요." });
    }
  }, []);

  useEffect(() => {
    void load();
    const on = () => void load();
    window.addEventListener("wanna500:coins", on);
    return () => window.removeEventListener("wanna500:coins", on);
  }, [load]);

  useEffect(() => {
    setTickets(readTickets(getBrowserStorage()));
    let done = false;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { counts?: { today?: number } | null }) => {
        if (done) return;
        const today = typeof d?.counts?.today === "number" ? d.counts.today : readCounts(getBrowserStorage(), new Date()).today;
        setFreeLeft(Math.max(0, FREE_PER_DAY - today));
      })
      .catch(() => setFreeLeft(Math.max(0, FREE_PER_DAY - readCounts(getBrowserStorage(), new Date()).today)));
    return () => {
      done = true;
    };
  }, []);

  if (view.kind === "loading") return <p className="text-sm text-slate-500">지갑을 열고 있어요…</p>;
  if (view.kind === "login")
    return (
      <div className="rounded-2xl border border-brand-100 bg-white p-5 space-y-3">
        <p className="text-sm text-slate-600">로그인하면 내 조약돌과 진주를 볼 수 있어요.</p>
        <LoginButtons className="flex flex-col gap-2.5" />
      </div>
    );
  if (view.kind === "error") return <p className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{view.message}</p>;

  const { balance, items } = view;
  return (
    <div className="space-y-5" data-testid="wallet-page">
      <section className="rounded-2xl border border-brand-100 bg-white p-5 text-center space-y-1">
        <p className="text-xs font-bold text-slate-500">내 잔액</p>
        <p className="font-serifKr font-black text-3xl text-brand-700" data-testid="wallet-total">{pebbleText(balance)}</p>
        <p className="text-sm text-slate-600">{(balance * 500).toLocaleString("ko-KR")}원 어치</p>
        <p className="text-xs text-slate-400">조약돌 6개가 모이면 진주 1개로 묶어서 보여줘요</p>
        <button type="button" onClick={() => setPayOpen(true)} className="mt-3 rounded-full bg-brand-600 px-6 py-2.5 text-sm font-black text-white active:scale-95">
          충전하기
        </button>
      </section>

      <section className="rounded-2xl border border-pink-100 bg-white p-4 space-y-1">
        <p className="text-sm font-black text-slate-700">오늘의 무료 뽑기</p>
        <p className="text-sm text-slate-600">
          오늘 무료 {freeLeft}회 남음{tickets > 0 ? ` · 보너스 뽑기권 ${tickets}장` : ""}
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-black text-slate-700">이 잔액으로 할 수 있는 것</h2>
        <ul className="space-y-2">
          <Need label="일반 풀이" need={1} have={balance} />
          <Need label="둘의 궁합" need={2} have={balance} />
          <Need label="프리미엄 종합 사주" need={19} have={balance} />
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-black text-slate-700">최근 내역</h2>
        {items.length === 0 ? (
          <p className="rounded-xl bg-white border border-brand-100 p-4 text-sm text-slate-500">아직 내역이 없어요.</p>
        ) : (
          <ul className="divide-y divide-brand-100 rounded-xl border border-brand-100 bg-white">
            {items.map((it, i) => (
              <li key={`${it.at}-${i}`} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-slate-700">{it.label}</span>
                  <span className="block text-[11px] text-slate-400">{when(it.at)}</span>
                </span>
                <span className={`shrink-0 text-sm font-black ${it.delta > 0 ? "text-emerald-600" : "text-slate-500"}`}>
                  {it.delta > 0 ? "+" : "−"}
                  {pebbleText(Math.abs(it.delta))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-xs text-slate-500 leading-relaxed">무료로 받는 방법: 정성 후기(월 2개) · 친구 초대 · 도장 3일 연속</p>

      {payOpen && (
        <PurchaseModal
          onClose={() => {
            setPayOpen(false);
            void load();
          }}
        />
      )}
    </div>
  );
}
