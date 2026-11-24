"use client";
import { useState } from "react";
import { POPULAR_TABS, popularRows } from "@/lib/popularQuestions";

/** 인기질문 바텀시트: 질문을 누르면 입력창에 채워 주기만 해요 (보내기는 사용자가 직접). */
export default function PopularSheet({ onPick, onClose }: { onPick: (q: string) => void; onClose: () => void }) {
  const [tab, setTab] = useState(0);
  const rows = popularRows(tab);
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="주간 인기 질문" onClick={(e) => e.stopPropagation()} className="flex h-[78vh] max-h-[640px] w-full max-w-[480px] flex-col rounded-t-3xl bg-white">
        <div className="flex h-14 shrink-0 items-center justify-between px-5">
          <b className="text-[17px] text-gray-900">주간 인기 질문</b>
          <button type="button" aria-label="닫기" onClick={onClose} className="grid h-11 w-11 place-items-center text-gray-800">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <div className="flex shrink-0 gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {POPULAR_TABS.map((label, i) => (
            <button key={label} type="button" onClick={() => setTab(i)} aria-pressed={tab === i} className={`min-h-[40px] shrink-0 whitespace-nowrap rounded-full border px-4 text-[14px] ${tab === i ? "border-gray-900 bg-gray-900 font-bold text-white" : "border-brand-200 bg-white text-[#4a3d63]"}`}>
              {label}
            </button>
          ))}
        </div>
        <p className="shrink-0 px-5 pb-2 text-xs text-[#6f6385]">많이들 궁금해하는 질문이야. 누르면 입력창에 채워 줄게</p>
        <div className="flex-1 overflow-y-auto px-2 pb-[max(24px,env(safe-area-inset-bottom))]">
          {rows.map((r) => (
            <button key={r.tag + r.q} type="button" onClick={() => onPick(r.q)} className="flex min-h-[64px] w-full items-center gap-3 border-b border-[#f1ebf8] px-3 py-2.5 text-left active:bg-brand-50">
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-xs font-bold text-[#b03a78]">{r.tag}</span>
                <span className="text-[15px] leading-snug text-gray-900">{r.q}</span>
              </span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8a7da0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0"><path d="M9 6l6 6-6 6" /></svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
