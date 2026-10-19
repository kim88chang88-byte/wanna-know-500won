"use client";

import { useState, type FormEvent } from "react";
import type { PremiumErrorBody, PremiumReportView } from "@/lib/premium/types";
import type { BirthInput } from "@/lib/saju/types";
import ManseReport from "./ManseReport";

const field = "w-full rounded-2xl border border-brand-200 bg-white px-4 py-3 text-base text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-300";
const seg = (active: boolean) =>
  `flex-1 rounded-full py-2.5 text-sm font-bold border transition-colors ${active ? "bg-brand-500 text-white border-brand-500" : "bg-white text-brand-600 border-brand-200"}`;

export default function PremiumReportApp() {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("12:00");
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [isFemale, setIsFemale] = useState<boolean | null>(null);
  const [isLunar, setIsLunar] = useState(false);
  const [isLeap, setIsLeap] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<PremiumReportView | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    if (!m) return setError("생년월일을 입력해 주세요.");
    if (isFemale === null) return setError("성별을 선택해 주세요.");
    const [hh, mm] = time.split(":").map(Number);
    const body: BirthInput = {
      year: Number(m[1]),
      month: Number(m[2]),
      day: Number(m[3]),
      hour: timeUnknown || Number.isNaN(hh) ? null : hh,
      minute: timeUnknown || Number.isNaN(mm) ? null : mm,
      calendar: isLunar ? "lunar" : "solar",
      isLeapMonth: isLunar && isLeap,
      gender: isFemale ? "female" : "male",
    };
    setBusy(true);
    try {
      const res = await fetch("/api/premium", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...body, level: "full", topic: "프리미엄 사주 원국 리포트" }) });
      const json = (await res.json()) as { report?: PremiumReportView } & Partial<PremiumErrorBody>;
      if (!res.ok || !json.report) {
        setError(json.error ?? "리포트를 만들지 못했어요. 잠시 뒤에 다시 시도해 주세요.");
        return;
      }
      setReport(json.report);
    } catch {
      setError("네트워크 연결을 확인하고 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  if (report) {
    return (
      <div className="space-y-6">
        <ManseReport report={report} />
        <button type="button" onClick={() => setReport(null)} className="w-full rounded-full border border-brand-200 bg-white py-3 text-sm font-bold text-brand-600">
          다시 입력하기
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5 rounded-3xl bg-white border border-brand-100 p-5 sm:p-7 shadow-[0_8px_30px_rgba(128,87,224,0.08)]">
      <div>
        <label htmlFor="birth-date" className="block text-sm font-bold text-slate-700 mb-1.5">
          생년월일
        </label>
        <input id="birth-date" type="date" min="1900-01-01" max="2100-12-31" value={date} onChange={(e) => setDate(e.target.value)} className={field} />
        <div className="mt-2 flex gap-2" role="group" aria-label="음양력">
          <button type="button" aria-pressed={!isLunar} onClick={() => setIsLunar(false)} className={seg(!isLunar)}>
            양력
          </button>
          <button type="button" aria-pressed={isLunar} onClick={() => setIsLunar(true)} className={seg(isLunar)}>
            음력
          </button>
        </div>
        {isLunar && (
          <label className="mt-2 flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={isLeap} onChange={(e) => setIsLeap(e.target.checked)} className="h-4 w-4 accent-brand-500" />
            윤달이에요
          </label>
        )}
      </div>

      <div>
        <label htmlFor="birth-time" className="block text-sm font-bold text-slate-700 mb-1.5">
          태어난 시간
        </label>
        <input id="birth-time" type="time" value={time} disabled={timeUnknown} onChange={(e) => setTime(e.target.value)} className={`${field} disabled:bg-slate-100 disabled:text-slate-400`} />
        <label className="mt-2 flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={timeUnknown} onChange={(e) => setTimeUnknown(e.target.checked)} className="h-4 w-4 accent-brand-500" />
          시간을 몰라요
        </label>
      </div>

      <div>
        <span className="block text-sm font-bold text-slate-700 mb-1.5">성별</span>
        <div className="flex gap-2" role="group" aria-label="성별">
          <button type="button" aria-pressed={isFemale === true} onClick={() => setIsFemale(true)} className={seg(isFemale === true)}>
            여성
          </button>
          <button type="button" aria-pressed={isFemale === false} onClick={() => setIsFemale(false)} className={seg(isFemale === false)}>
            남성
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" data-testid="form-error" className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      )}

      <button type="submit" disabled={busy} className="w-full rounded-full bg-gradient-to-r from-brand-500 to-indigo-600 py-3.5 font-serifKr font-bold text-white shadow-md disabled:opacity-60 active:scale-95 transition-transform">
        {busy ? "물길을 읽는 중… 🫧" : "내 사주 리포트 보기"}
      </button>
    </form>
  );
}
