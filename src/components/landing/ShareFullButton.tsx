"use client";

import { useState } from "react";
import type { PremiumReportView } from "@/lib/premium/types";
import { buildShareText, type ShareMode, type ShareReading } from "@/lib/shareText";
import { getBrowserStorage } from "@/lib/drawCounter";
import { readMyCode, withRef } from "@/lib/referral";

/** 풀이 글 전체(또는 핵심 요약)와 도유사주 링크를 한꺼번에 보내는 버튼. 서버에 저장하지 않고 이 기기에서 글을 만들어요. */
export default function ShareFullButton({ report, reading, topic, name, partnerName, className = "" }: { report: PremiumReportView; reading?: ShareReading | null; topic: string; name?: string | null; partnerName?: string | null; className?: string }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ShareMode>("full");
  const [withName, setWithName] = useState(true);
  const [msg, setMsg] = useState("");
  const myName = name ?? report.viewerName ?? null;

  async function send() {
    const url = withRef(typeof window === "undefined" ? "" : window.location.origin, readMyCode(getBrowserStorage()));
    const text = buildShareText(report, reading ?? null, { mode, name: myName, withName, topic, url, partnerName });
    try {
      if (navigator.share) {
        await navigator.share({ title: "도유사주", text });
        setOpen(false);
        return;
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setMsg("풀이와 링크를 복사했어. 보낼 곳에 붙여넣어 줘 ❄️");
    } catch {
      setMsg("복사하지 못했어. 잠시 뒤에 다시 시도해 줘.");
    }
    setOpen(false);
  }

  return (
    <div className={className} data-testid="share-full" data-no-click-fx="">
      <button type="button" onClick={() => { setMsg(""); setOpen(true); }} className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-brand-300 bg-white px-5 py-2 text-sm font-bold text-brand-700 shadow-sm active:scale-95">
        📤 풀이 전체 공유하기
      </button>
      {msg && <p role="status" className="mt-1.5 text-[11.5px] text-gray-600">{msg}</p>}
      {open && (
        <div className="fixed inset-0 z-[140] flex items-end justify-center bg-black/40" role="dialog" aria-modal="true" aria-label="공유 방식 고르기" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-t-[22px] bg-white px-4 pb-5 pt-4 text-left shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-center text-[14px] font-extrabold text-gray-900">어떻게 보낼까?</p>
            {([
              ["full", "📜 풀이 전체", "소제목별 풀이 글 전부 + 도유사주 링크 (잠긴 풀이는 빠져)"],
              ["short", "✨ 핵심만 요약", "한 줄 결론과 핵심 + 링크 (짧게)"],
            ] as const).map(([k, t, d]) => (
              <button key={k} type="button" aria-pressed={mode === k} onClick={() => setMode(k)} className={`mt-2 block w-full rounded-2xl border-[1.5px] px-3 py-2.5 text-left ${mode === k ? "border-brand-500 bg-brand-50" : "border-brand-100 bg-white"}`}>
                <b className="text-[13px] text-gray-900">{t}</b>
                <span className="mt-0.5 block text-[11px] leading-snug text-gray-500">{d}</span>
              </button>
            ))}
            {myName && (
              <label className="mt-3 flex cursor-pointer items-center gap-2 text-[12px] text-gray-700">
                <input type="checkbox" checked={withName} onChange={(e) => setWithName(e.target.checked)} className="h-4 w-4 accent-brand-600" />
                내 이름 넣기 (끄면 &ldquo;친구&rdquo;로 보내)
              </label>
            )}
            <button type="button" onClick={() => void send()} className="mt-3 w-full rounded-full bg-gradient-to-r from-brand-500 to-fuchsia-500 py-2.5 text-sm font-extrabold text-white active:scale-[0.98]">
              보내기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
