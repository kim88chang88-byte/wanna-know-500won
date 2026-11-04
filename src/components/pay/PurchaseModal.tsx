"use client";

import { useState } from "react";
import { track } from "@/lib/track";

/*
 * 동전 구매 화면. 결제 수단(사업자 등록 뒤 붙일 결제창)만 비어 있고 나머지 흐름은 실제와 같아요.
 * 지금은 "결제하기"를 누르면 "결제는 곧 열려요 + 오픈 알림 받기"로 이어져요. 결제가 된 것처럼 보이게 하지 않아요.
 * 알림 신청은 이름·연락처 없이 "눌렀다"는 사실만 익명으로 세요.
 */
export const COIN_PRICE = 500;

export default function PurchaseModal({ purpose, onClose }: { purpose: string; onClose: () => void }) {
  const [step, setStep] = useState<"buy" | "soon">("buy");
  const [agree, setAgree] = useState(false);
  const [notified, setNotified] = useState(false);

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/45 sm:items-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="동전 구매" onClick={(e) => e.stopPropagation()} className="max-h-[92vh] w-full max-w-[380px] space-y-3 overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-3xl">
        {step === "buy" ? (
          <>
            <h2 className="text-base font-extrabold text-gray-900">동전 구매하기</h2>
            <div className="flex items-center justify-between gap-2 rounded-2xl border-2 border-brand-500 bg-brand-50 px-3.5 py-3">
              <div>
                <p className="text-sm font-bold text-gray-900">동전 1개</p>
                <p className="text-xs text-slate-500">{purpose}</p>
              </div>
              <p className="text-sm font-extrabold text-gray-900">{COIN_PRICE.toLocaleString("ko-KR")}원</p>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">결제 금액</span>
              <b className="text-gray-900">{COIN_PRICE.toLocaleString("ko-KR")}원</b>
            </div>
            <label className="flex items-start gap-2 text-xs leading-relaxed text-slate-500">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                <a href="/terms" target="_blank" rel="noreferrer" className="underline">이용약관</a>·<a href="/refund" target="_blank" rel="noreferrer" className="underline">환불 안내</a>에 동의해요. 결과를 열람하면 단순 변심 환불은 어려울 수 있어요.
              </span>
            </label>
            <button
              type="button"
              disabled={!agree}
              onClick={() => {
                track("pay_open");
                setStep("soon");
              }}
              className="w-full rounded-2xl bg-brand-500 py-3 text-sm font-extrabold text-white disabled:opacity-50"
            >
              결제하기
            </button>
            <p className="rounded-xl border border-dashed border-slate-300 px-3 py-2 text-xs leading-relaxed text-slate-500">
              <b className="text-slate-700">무료로 받는 방법</b>
              <br />
              로그인 선물 · 정성 후기(월 2개) · 친구 초대 · 도장 3일 연속
            </p>
            <button type="button" onClick={onClose} className="w-full py-1.5 text-xs text-slate-400">
              닫기
            </button>
          </>
        ) : (
          <>
            <h2 className="text-base font-extrabold text-gray-900">결제는 곧 열려요</h2>
            <p className="text-sm leading-relaxed text-slate-600">지금은 베타 기간이라 결제를 받지 않아요. 열리면 가장 먼저 알려 드릴게요. 알림만 받으면 되고, 아무것도 결제되지 않아요.</p>
            {notified ? (
              <p role="status" className="rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">알림 신청 완료! 결제가 열리면 알려 드릴게요 ❄️</p>
            ) : (
              <button
                type="button"
                onClick={() => {
                  track("pay_notify");
                  setNotified(true);
                }}
                className="w-full rounded-2xl bg-brand-500 py-3 text-sm font-extrabold text-white"
              >
                오픈 알림 받기
              </button>
            )}
            <button type="button" onClick={onClose} className="w-full py-1.5 text-xs text-slate-400">
              닫기
            </button>
          </>
        )}
      </div>
    </div>
  );
}
