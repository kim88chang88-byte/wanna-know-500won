"use client";

import { useEffect, useState, type FormEvent } from "react";
import { CONCERN_CHIPS } from "@/lib/concerns";
import { analyzeBook, overallLevel, pageTexts, THRESHOLDS, type Level, type QualityReport } from "@/lib/premium/bookQuality";
import { conclusionOf, fetchRestChapters, mergeChapters } from "@/lib/premium/mergeChapters";
import type { PremiumReportView } from "@/lib/premium/types";

const TONE: Record<Level, string> = { ok: "bg-emerald-100 text-emerald-800", warn: "bg-amber-100 text-amber-800", fail: "bg-rose-100 text-rose-800" };
const LABEL: Record<Level, string> = { ok: "통과", warn: "주의", fail: "실패" };

/** 관리자 전용(재홍용): 프리미엄 책 한 권을 만들고, 반복·말투·오타를 코드로 세어 점수표로 보여줘요. 조약돌은 쓰지 않고 AI 비용은 프리미엄 1회분이에요. */
export default function PremiumEvalApp() {
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [date, setDate] = useState("1994-03-15");
  const [time, setTime] = useState("10:30");
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [female, setFemale] = useState(true);
  const [chip, setChip] = useState("relationship");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [report, setReport] = useState<PremiumReportView | null>(null);
  const [quality, setQuality] = useState<QualityReport | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/admin/me").then((r) => r.json()).then((d: { admin?: boolean }) => setAdmin(d.admin === true)).catch(() => setAdmin(false));
  }, []);

  async function run(e: FormEvent) {
    e.preventDefault();
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    if (!m) return setMsg("생년월일을 입력해 줘.");
    const [hh, mm] = time.split(":").map(Number);
    const body = {
      year: Number(m[1]), month: Number(m[2]), day: Number(m[3]),
      hour: timeUnknown || Number.isNaN(hh) ? null : hh, minute: timeUnknown || Number.isNaN(mm) ? null : mm,
      calendar: "solar", isLeapMonth: false, gender: female ? "female" : "male",
      level: "full", topic: "프리미엄 사주 원국 리포트", concern: { tags: chip ? [chip] : [], text: text.trim().slice(0, 200) },
    };
    setBusy(true);
    setReport(null);
    setQuality(null);
    const t0 = Date.now();
    try {
      setMsg("1/4 첫 묶음을 만드는 중… (1~2분 걸려요)");
      const res = await fetch("/api/premium", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const json = (await res.json().catch(() => null)) as { report?: PremiumReportView; error?: string; pendingChapters?: string[]; chapterNote?: string } | null;
      if (!res.ok || !json?.report) return setMsg(json?.error ?? "책을 만들지 못했어. 관리자 로그인과 AI 키를 확인해 줘.");
      let cur = json.report;
      setReport(cur);
      if (json.pendingChapters?.length) {
        setMsg("2~4/4 나머지 장을 만드는 중…");
        const rest = await fetchRestChapters({ ...body, conclusion: conclusionOf(cur) });
        cur = mergeChapters(cur, rest.replaced ?? undefined);
        setReport(cur);
        if (rest.aiNotice) setMsg("일부 장은 AI 풀이를 못 받았어요(기본 글로 대체). 아래 점수는 그대로 계산했어요.");
      }
      setQuality(analyzeBook(cur));
      setMsg((p) => (p.startsWith("일부") ? p : `끝났어. ${Math.round((Date.now() - t0) / 1000)}초 걸렸어.`));
    } catch {
      setMsg("만드는 중 연결이 끊겼어.");
    } finally {
      setBusy(false);
    }
  }

  const scoreText = () =>
    quality
      ? [`프리미엄 점검 (${date} ${timeUnknown ? "시간모름" : time} ${female ? "여" : "남"} / 고민:${chip}) 총평:${LABEL[overallLevel(quality)]} · ${quality.pages}쪽 · ${quality.chars}자`, ...quality.metrics.map((m) => `[${LABEL[m.level]}] ${m.title}: ${m.summary}${m.details.length ? "\n  - " + m.details.slice(0, 6).join("\n  - ") : ""}`)].join("\n")
      : "";
  const bookText = () => (report ? report.book.map((p) => `# ${p.no}쪽 ${p.title}\n${pageTexts(p).join("\n")}`).join("\n\n") : "");
  async function copy(kind: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setMsg("복사가 막혔어. 아래 글을 직접 선택해서 복사해 줘.");
    }
  }

  if (admin === false) return <main className="mx-auto max-w-xl px-4 py-10 text-sm">관리자만 볼 수 있어요. 관리자 계정으로 로그인해 줘.</main>;

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="font-cute text-xl">프리미엄 사주 점검</h1>
      <p className="mt-1 text-[13px] text-neutral-600">책 한 권을 만들고 반복·말투·오타를 코드로 세어요. 조약돌은 쓰지 않고, AI 비용은 프리미엄 1회분이에요. 기준값은 <code>src/lib/premium/bookQuality.ts</code>의 THRESHOLDS에서 고쳐요.</p>
      <form onSubmit={(e) => void run(e)} className="mt-3 grid gap-2 rounded-2xl border border-neutral-200 bg-white p-3 text-[13px]">
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border px-2 py-1" aria-label="생년월일 (양력)" />
          <input type="time" value={time} disabled={timeUnknown} onChange={(e) => setTime(e.target.value)} className="rounded-lg border px-2 py-1 disabled:opacity-40" aria-label="태어난 시간" />
          <label className="flex items-center gap-1"><input type="checkbox" checked={timeUnknown} onChange={(e) => setTimeUnknown(e.target.checked)} />시간 모름</label>
          <label className="flex items-center gap-1"><input type="radio" checked={female} onChange={() => setFemale(true)} />여</label>
          <label className="flex items-center gap-1"><input type="radio" checked={!female} onChange={() => setFemale(false)} />남</label>
        </div>
        <label className="flex flex-wrap items-center gap-2">고민
          <select value={chip} onChange={(e) => setChip(e.target.value)} className="rounded-lg border px-2 py-1">
            <option value="">(없음)</option>
            {CONCERN_CHIPS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </label>
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={200} placeholder="직접 적은 고민 (선택)" className="rounded-lg border px-2 py-1" />
        <div className="flex items-center gap-2">
          <button type="submit" disabled={busy || admin !== true} className="rounded-full bg-brand-500 px-4 py-2 font-extrabold text-white disabled:opacity-50">{busy ? "만드는 중…" : "프리미엄 만들고 점검하기"}</button>
          <span className="text-[12.5px] text-neutral-600" role="status">{msg}</span>
        </div>
      </form>

      {quality && (
        <section className="mt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-sm font-extrabold ${TONE[overallLevel(quality)]}`}>총평 {LABEL[overallLevel(quality)]}</span>
            <span className="text-[12.5px] text-neutral-600">{quality.pages}쪽 · {quality.chars.toLocaleString()}자</span>
            <button type="button" onClick={() => void copy("score", scoreText())} className="rounded-full border px-3 py-1 text-[12.5px] font-bold">{copied === "score" ? "복사됨 ✓" : "점수표 복사"}</button>
            <button type="button" onClick={() => void copy("all", `${scoreText()}\n\n${bookText()}`)} className="rounded-full border px-3 py-1 text-[12.5px] font-bold">{copied === "all" ? "복사됨 ✓" : "점수표+전체 글 복사"}</button>
          </div>
          <ul className="mt-3 space-y-2">
            {quality.metrics.map((m) => (
              <li key={m.id} className="rounded-2xl border border-neutral-200 bg-white p-3">
                <div className="flex flex-wrap items-center gap-2 text-[13px]">
                  <span className={`rounded-full px-2 py-0.5 text-[11.5px] font-extrabold ${TONE[m.level]}`}>{LABEL[m.level]}</span>
                  <span className="font-bold">{m.title}</span>
                  <span className="text-neutral-600">{m.summary}</span>
                </div>
                {m.details.length > 0 && (
                  <details className="mt-1.5 text-[12.5px] text-neutral-700">
                    <summary className="cursor-pointer">자세히</summary>
                    <ul className="mt-1 list-disc pl-5">{m.details.map((d, i) => <li key={i}>{d}</li>)}</ul>
                  </details>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11.5px] text-neutral-500">기준(주의/실패): 같은 끝맺음 {THRESHOLDS.endingRepeat.warn}/{THRESHOLDS.endingRepeat.fail}번, 같은 시작 {THRESHOLDS.startRepeat.warn}/{THRESHOLDS.startRepeat.fail}번, 한 낱말 {THRESHOLDS.wordRepeat.warn}/{THRESHOLDS.wordRepeat.fail}번, 같은 비유 {THRESHOLDS.metaphorPages.warn}/{THRESHOLDS.metaphorPages.fail}쪽. 임시 기준이라 결과를 보며 조정해요.</p>
        </section>
      )}
    </main>
  );
}
