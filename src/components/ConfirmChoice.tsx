"use client";

import { useEffect, useRef } from "react";

/** 한 번 고르면 바꿀 수 없는 선택을 확정하기 전에 "맞나요?" 하고 한 번 더 묻는 작은 팝업이에요. */
export function ConfirmChoice({ label, onYes, onNo }: { label: string; onYes: () => void; onNo: () => void }) {
  const yesRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    yesRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onNo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onNo]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-6" onClick={onNo}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label="선택 확인"
        data-testid="confirm-choice"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[320px] rounded-2xl bg-white px-5 py-5 text-center shadow-xl"
      >
        <p className="text-[15px] font-bold leading-relaxed text-gray-900">‘{label}’ 이 맞나?</p>
        <p className="mt-1 text-xs text-slate-500">한 번 고르면 바꿀 수 없어.</p>
        <div className="mt-4 flex gap-2">
          <button type="button" data-testid="confirm-choice-no" onClick={onNo} className="flex-1 rounded-full border border-slate-300 bg-white py-2.5 text-sm font-bold text-slate-600">
            아니
          </button>
          <button type="button" data-testid="confirm-choice-yes" ref={yesRef} onClick={onYes} className="flex-1 rounded-full bg-amber-500 py-2.5 text-sm font-bold text-white">
            네, 맞아
          </button>
        </div>
      </div>
    </div>
  );
}
