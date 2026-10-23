"use client";

import { useCallback, useEffect, useState } from "react";
import ManseReport from "@/components/premium/ManseReport";
import PhotoCard, { ResultHero } from "@/components/landing/PhotoCard";
import { ReadingCard } from "@/components/landing/ReadingCard";
import type { VaultSnapshot } from "@/lib/vault";
import { summarizeVault } from "@/lib/vaultStats";

interface Row {
  id: string;
  topic: string;
  premium: boolean;
  title: string;
  summary: string | null;
  created_at: string;
}
interface Detail {
  id: string;
  title: string;
  created_at: string;
  snapshot: VaultSnapshot;
}

type View = { kind: "loading" } | { kind: "login" } | { kind: "error"; message: string } | { kind: "list"; items: Row[] };

function day(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "long", day: "numeric" }).format(new Date(iso));
  } catch {
    return "";
  }
}

export default function VaultApp() {
  const [view, setView] = useState<View>({ kind: "loading" });
  const [detail, setDetail] = useState<Detail | null>(null);
  const [opening, setOpening] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/vault", { cache: "no-store" });
      if (res.status === 401) return setView({ kind: "login" });
      const data = (await res.json().catch(() => null)) as { items?: Row[]; error?: string } | null;
      if (!res.ok || !data?.items) return setView({ kind: "error", message: data?.error ?? "보관함을 불러오지 못했어요." });
      setView({ kind: "list", items: data.items });
    } catch {
      setView({ kind: "error", message: "보관함을 불러오지 못했어요. 인터넷 연결을 확인해 줘요." });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function open(id: string) {
    setOpening(id);
    setNotice(null);
    try {
      const res = await fetch(`/api/vault/${id}`, { cache: "no-store" });
      const data = (await res.json().catch(() => null)) as { item?: Detail; error?: string } | null;
      if (!res.ok || !data?.item) setNotice(data?.error ?? "열지 못했어요.");
      else setDetail(data.item);
    } catch {
      setNotice("열지 못했어요. 인터넷 연결을 확인해 줘요.");
    }
    setOpening(null);
  }

  async function remove(id: string) {
    if (!window.confirm("이 풀이를 보관함에서 지울까요? 지우면 되돌릴 수 없어요.")) return;
    try {
      const res = await fetch(`/api/vault/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setDetail(null);
      await load();
    } catch {
      setNotice("지우지 못했어요. 잠시 뒤에 다시 해줘요.");
    }
  }

  if (detail) {
    const s = detail.snapshot;
    return (
      <div data-testid="vault-detail">
        <button type="button" onClick={() => setDetail(null)} className="text-xs font-bold text-brand-600 underline underline-offset-2">
          ← 보관함 목록
        </button>
        <p className="mt-2 text-xs text-gray-500">
          {detail.title} · {day(detail.created_at)}에 저장
        </p>
        <div className="mt-3">
          <ResultHero report={s.report} aiQuote={s.kkotgeoji} />
        </div>
        {s.note && <p className="mt-4 p-3 rounded-2xl bg-brand-50 border border-brand-100 text-xs text-gray-700 leading-relaxed">{s.note}</p>}
        {s.card && (
          <ReadingCard
            reading={{
              keyword: s.card.keyword,
              total: { score: s.card.score, summary: s.card.summary },
              indicators: s.card.indicators.map((i, k) => ({ key: (["love", "money", "mind"] as const)[k] ?? "mind", label: i.label, score: i.score, comment: i.comment, locked: false })),
              reason: s.reason ?? undefined,
            }}
          />
        )}
        {!s.card && s.reason && (
          <div className="mt-4 p-4 rounded-2xl bg-white border border-brand-100 text-sm text-gray-800 leading-relaxed">
            <p className="text-xs font-semibold text-brand-700 mb-1">🔎 도리가 본 이유</p>
            {s.reason}
          </div>
        )}
        <div className="mt-6">
          <ManseReport report={s.report} hideHeadline />
        </div>
        <PhotoCard report={s.report} aiQuote={s.kkotgeoji} />
        {notice && <p role="alert" className="mt-3 text-xs text-amber-800">{notice}</p>}
        <button type="button" onClick={() => void remove(detail.id)} className="mt-6 text-[11px] text-gray-400 underline underline-offset-2 hover:text-gray-600">
          이 풀이 보관함에서 지우기
        </button>
      </div>
    );
  }

  if (view.kind === "loading") return <p className="text-sm text-gray-500">불러오는 중…</p>;
  if (view.kind === "login")
    return (
      <div data-testid="vault-login" className="rounded-2xl border border-brand-100 bg-white p-5 text-center">
        <p className="text-sm font-bold text-gray-900">로그인하면 보관함을 볼 수 있어요</p>
        <p className="mt-1 text-xs text-gray-500">로그인한 상태로 본 풀이만 보관함에 저장돼요.</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs font-bold">
          <a href="/api/auth/kakao" className="px-4 py-2 rounded-full bg-yellow-300 text-gray-900">카카오</a>
          <a href="/api/auth/naver" className="px-4 py-2 rounded-full bg-green-500 text-white">네이버</a>
          <a href="/api/auth/google" className="px-4 py-2 rounded-full bg-white border border-gray-300 text-gray-700">구글</a>
        </div>
      </div>
    );
  if (view.kind === "error") return <p role="alert" className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">{view.message}</p>;

  if (view.items.length === 0)
    return (
      <div data-testid="vault-empty" className="rounded-2xl border border-brand-100 bg-white p-6 text-center text-sm text-gray-600">
        아직 보관한 풀이가 없어요.
        <br />
        풀이를 보고 &lsquo;내 보관함에 저장&rsquo;을 누르면 여기에 모여요.
        <div className="mt-3">
          <a href="/" className="text-xs font-bold text-brand-600 underline underline-offset-2">풀이 보러 가기</a>
        </div>
      </div>
    );

  return (
    <div>
      {notice && <p role="alert" className="mb-2 text-xs text-amber-800">{notice}</p>}
      <VaultSummaryBar items={view.items} />
      <ul data-testid="vault-list" className="space-y-2.5">
        {view.items.map((it) => (
          <li key={it.id}>
            <button
              type="button"
              onClick={() => void open(it.id)}
              disabled={opening === it.id}
              className="w-full text-left rounded-2xl border border-brand-100 bg-white p-4 hover:border-brand-300 transition-colors disabled:opacity-60"
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-gray-900">{it.title}</span>
                <span className="text-[11px] text-gray-400 shrink-0">{day(it.created_at)}</span>
              </span>
              {it.summary && <span className="mt-1 block text-xs text-gray-600 leading-relaxed line-clamp-2">{it.summary}</span>}
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-center text-[11px] text-gray-400">최대 300개까지 보관할 수 있어요.</p>
    </div>
  );
}

/** 모은 풀이를 한눈에. 이번 달에 모은 개수와 주제별 개수를 보여 줘요. (부담 주는 목표 없이 모인 것만 알려 줘요) */
function VaultSummaryBar({ items }: { items: Row[] }) {
  const s = summarizeVault(items, new Date());
  return (
    <div data-testid="vault-summary" className="mb-3 rounded-2xl border border-brand-100 bg-white px-4 py-3">
      <p className="text-sm font-bold text-gray-900">
        {s.month > 0 ? `이번 달 ${s.month}개의 풀이가 모였어요 🌱` : "이번 달엔 아직 새 풀이가 없어요. 천천히 모아 봐요 🌱"}
        <span className="ml-2 text-[11px] font-medium text-gray-400">지금까지 모두 {s.total}개</span>
      </p>
      {s.byTopic.length > 0 && (
        <p className="mt-1.5 flex flex-wrap gap-1.5">
          {s.byTopic.map((t) => (
            <span key={t.name} className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-bold text-brand-700">
              {t.name} {t.n}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
