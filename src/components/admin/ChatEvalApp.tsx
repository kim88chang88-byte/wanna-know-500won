"use client";

import { useState } from "react";

interface Row {
  n: number;
  q: string;
  expect: string | null;
  route: string;
  answer: string;
  followups?: string[];
  visual?: string | null;
  ms: number;
}

const ROUTE: Record<string, string> = { ai: "AI 답", "ai-unable": "AI가 사과", prefilter: "미리 걸러서 사과", crisis: "위기 안내", error: "오류" };

/** 관리자 전용: 연애 질문 30개를 실제 도리로 한꺼번에 돌려 보고 결과를 복사해요. 질문 횟수는 쓰지 않아요. */
export default function ChatEvalApp() {
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState(false);

  async function run(set: "love" | "menu" | "work" = "love") {
    setBusy(true);
    setRows([]);
    setMsg("");
    try {
      const info = (await (await fetch(`/api/admin/chat-eval?set=${set}`)).json()) as { total?: number };
      const total = info.total ?? 0;
      for (let i = 0; i < total; i++) {
        setMsg(`${i + 1} / ${total} 돌리는 중…`);
        const res = await fetch("/api/admin/chat-eval", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ index: i, set }) });
        const d = (await res.json().catch(() => null)) as (Omit<Row, "n"> & { error?: string }) | null;
        if (!res.ok || !d) {
          setMsg(d?.error ?? "점검을 멈췄어. 관리자 로그인과 AI 키를 확인해 줘.");
          return;
        }
        setRows((r) => [...r, { ...d, n: i + 1 }]);
      }
      setMsg("끝났어. 아래 '전체 복사'를 눌러서 보내 줘.");
    } catch {
      setMsg("점검 중 연결이 끊겼어.");
    } finally {
      setBusy(false);
    }
  }

  const asText = () =>
    rows
      .map((r) => `${r.n}. [${ROUTE[r.route] ?? r.route}${r.expect ? ` / 기대:${r.expect}` : ""}${r.visual ? ` / 카드:${r.visual}` : ""}] ${r.q}\n${r.answer}`)
      .join("\n\n");

  async function copy() {
    try {
      await navigator.clipboard.writeText(asText());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setMsg("복사가 막혔어. 아래 글을 직접 선택해서 복사해 줘.");
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="font-cute text-xl">상담실 점검 · 연애 30문</h1>
      <p className="mt-1 text-[13px] text-neutral-600">내 저장된 사주로 연애운 풀이 방에서 묻는 것처럼 돌려요. 질문 횟수와 조약돌은 쓰지 않고, AI 비용은 조금 나가요.</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => void run("love")} disabled={busy} className="rounded-full bg-brand-500 px-4 py-2 text-sm font-extrabold text-white disabled:opacity-50">
          {busy ? "돌리는 중…" : "연애 30개 돌리기"}
        </button>
        <button type="button" onClick={() => void run("menu")} disabled={busy} className="rounded-full bg-brand-500 px-4 py-2 text-sm font-extrabold text-white disabled:opacity-50">
          메뉴·취미 17개 돌리기
        </button>
        <button type="button" onClick={() => void run("work")} disabled={busy} className="rounded-full bg-brand-500 px-4 py-2 text-sm font-extrabold text-white disabled:opacity-50">
          일·창업 고민 10개 돌리기
        </button>
        {rows.length > 0 && (
          <button type="button" onClick={() => void copy()} className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-bold">
            {copied ? "복사됨 ✓" : "전체 복사"}
          </button>
        )}
        <span className="text-[12.5px] text-neutral-600" role="status">{msg}</span>
      </div>
      <ol className="mt-4 space-y-3">
        {rows.map((r) => (
          <li key={r.n} className="rounded-2xl border border-neutral-200 bg-white p-3">
            <div className="flex flex-wrap items-center gap-1.5 text-[11.5px]">
              <span className="font-extrabold">{r.n}</span>
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-bold">{ROUTE[r.route] ?? r.route}</span>
              {r.expect && <span className="rounded-full bg-amber-100 px-2 py-0.5">기대: {r.expect}</span>}
              {r.visual && <span className="rounded-full bg-sky-100 px-2 py-0.5">카드: {r.visual}</span>}
              <span className="text-neutral-400">{(r.ms / 1000).toFixed(1)}초</span>
            </div>
            <p className="mt-1 text-[13.5px] font-bold">{r.q}</p>
            <p className="mt-1 whitespace-pre-wrap text-[13.5px] leading-relaxed">{r.answer || "(답 없음)"}</p>
          </li>
        ))}
      </ol>
    </main>
  );
}
