"use client";

import { plainAnswer } from "@/lib/chatMarkup";

import { useEffect, useState } from "react";

interface Row {
  n: number;
  q: string;
  expect: string | null;
  route: string;
  answer: string;
  followups?: string[];
  choices?: string[];
  visual?: string | null;
  ms: number;
}

interface Cat {
  id: string;
  label: string;
  group: "p500" | "p1000" | "etc";
  total: number;
}
const GROUPS: Array<{ id: Cat["group"]; title: string }> = [
  { id: "p500", title: "500원 사주 (주제별 풀이 방)" },
  { id: "p1000", title: "1,000원 궁합" },
  { id: "etc", title: "기타 점검" },
];

const ROUTE: Record<string, string> = { ai: "AI 답", "ai-unable": "AI가 사과", prefilter: "미리 걸러서 사과", crisis: "위기 안내", error: "오류" };

/** 관리자 전용: 카테고리별 상담 질문을 실제 도리로 한꺼번에 돌려 보고 결과를 복사해요. 질문 횟수는 쓰지 않아요. (프리미엄은 제외) */
/** 점검 화면은 표시를 변환하지 않으니, [[땅]]·**굵게** 표시를 걷어 읽기 쉽게 보여 줘요. */
const shown = (t: string) => plainAnswer(t).replace(/\*\*/g, "");

export default function ChatEvalApp() {
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [cats, setCats] = useState<Cat[]>([]);
  const [current, setCurrent] = useState("");

  useEffect(() => {
    fetch("/api/admin/chat-eval", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { categories?: Cat[] } | null) => setCats(d?.categories ?? []))
      .catch(() => setMsg("점검 목록을 불러오지 못했어."));
  }, []);

  async function run(set: string) {
    setBusy(true);
    setCurrent(cats.find((c) => c.id === set)?.label ?? "");
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
    `# 상담실 점검 · ${current}\n\n` +
    rows
      .map((r) => `${r.n}. [${ROUTE[r.route] ?? r.route}${r.expect ? ` / 기대:${r.expect}` : ""}${r.visual ? ` / 카드:${r.visual}` : ""}] ${r.q}\n${shown(r.answer)}${r.followups?.length && !r.answer.includes("▶") ? `\n(${[r.choices?.length ? `선택지: ${r.choices.join(" / ")}` : "", `다음 질문 칩: ${r.followups.join(" / ")}`].filter(Boolean).join(" · ")})` : ""}`)
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
      <h1 className="font-cute text-xl">상담실 점검{current ? ` · ${current}` : ""}</h1>
      <p className="mt-1 text-[13px] text-neutral-600">내 저장된 사주로 해당 풀이 방에서 묻는 것처럼 돌려요. 질문 횟수와 조약돌은 쓰지 않고, AI 비용은 조금 나가요. 한 시간에 120번까지 돌릴 수 있어요.</p>
      <div className="mt-3 space-y-3">
        {GROUPS.map((g) => {
          const list = cats.filter((c) => c.group === g.id);
          if (list.length === 0) return null;
          return (
            <section key={g.id} data-testid={`eval-group-${g.id}`}>
              <h2 className="text-[12.5px] font-bold text-neutral-500">{g.title}</h2>
              <div className="mt-1 flex flex-wrap gap-2">
                {list.map((c) => (
                  <button key={c.id} type="button" onClick={() => void run(c.id)} disabled={busy} data-testid={`eval-run-${c.id}`} className="rounded-full bg-brand-500 px-3.5 py-2 text-sm font-extrabold text-white disabled:opacity-50">
                    {c.label} {c.total}개
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
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
            <p className="mt-1 whitespace-pre-wrap text-[13.5px] leading-relaxed">{shown(r.answer) || "(답 없음)"}</p>
            {r.followups && r.followups.length > 0 && !r.answer.includes("▶") && (
              <p className="mt-1 text-[12px] text-neutral-500">{r.choices && r.choices.length > 0 ? `선택지: ${r.choices.join(" / ")} · ` : ""}다음 질문 칩: {r.followups.join(" / ")}</p>
            )}
          </li>
        ))}
      </ol>
    </main>
  );
}
