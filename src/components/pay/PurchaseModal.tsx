"use client";

import { useState } from "react";
import { track } from "@/lib/track";

/*
 * 도리 메뉴판(구매 화면). 결제 수단(사업자 등록 뒤 붙일 결제창)만 비어 있고 나머지 흐름은 실제와 같아요.
 * 지금은 "결제하기"를 누르면 "결제는 곧 열려요 + 오픈 알림 받기"로 이어져요. 결제가 된 것처럼 보이게 하지 않아요.
 * 알림 신청은 이름·연락처 없이 "눌렀다"는 사실만 익명으로 세요.
 */
export type ProductId = "reading" | "compat" | "premium";

interface Product {
  id: ProductId;
  name: string;
  price: number;
  line: string;
  bonus?: string;
  use: string;
  best?: boolean;
}

export const PRODUCTS: Product[] = [
  { id: "reading", name: "오늘의 풀이", price: 500, line: "동전 1개", use: "성공·재물·연애 등 풀이 1회 (또는 상담실 질문 5번)" },
  { id: "compat", name: "둘의 궁합", price: 1000, line: "동전 2개", use: "궁합 결과서 1회 (또는 상담실 질문 10번)" },
  { id: "premium", name: "프리미엄 종합 사주", price: 9900, line: "20쪽 사주서 전체", bonus: "+ 동전 5개 보너스!", use: "원국·월별 12개월·10년 대운 + 보너스 동전으로 풀이 5회 · 질문 25번", best: true },
];

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

export default function PurchaseModal({ preselect, onClose }: { preselect?: ProductId; onClose: () => void }) {
  const [step, setStep] = useState<"buy" | "soon">("buy");
  const [sel, setSel] = useState<ProductId | null>(preselect ?? null);
  const [agree, setAgree] = useState(false);
  const [notified, setNotified] = useState(false);
  const picked = PRODUCTS.find((p) => p.id === sel) ?? null;

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/45 sm:items-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="도리 메뉴판" onClick={(e) => e.stopPropagation()} className="max-h-[92vh] w-full max-w-[380px] overflow-y-auto rounded-t-3xl bg-white shadow-xl sm:rounded-3xl">
        {step === "buy" ? (
          <>
            <div className="flex items-center justify-between bg-brand-600 px-4 py-3.5 text-white">
              <h2 className="text-base font-extrabold">도리 메뉴판</h2>
              <button type="button" onClick={onClose} aria-label="닫기" className="text-lg leading-none">✕</button>
            </div>
            <p className="bg-amber-50 px-4 py-2.5 text-center text-xs font-semibold text-amber-800">동전 1개 = 500원 · 뽑기 1회 또는 상담실 질문 5번</p>
            <div role="radiogroup" aria-label="상품 선택">
              {PRODUCTS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={sel === p.id}
                  onClick={() => setSel(p.id)}
                  className={`flex w-full items-center justify-between gap-3 border-t border-slate-100 px-4 py-3.5 text-left ${sel === p.id ? "bg-brand-50 shadow-[inset_3px_0_0_#7c3aed]" : "bg-white"}`}
                >
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-1.5 text-[15px] font-extrabold text-gray-900">
                      {p.name}
                      {p.best && <span className="rounded-md bg-orange-500 px-1.5 py-px text-[10px] font-extrabold text-white">BEST</span>}
                    </p>
                    <p className="mt-0.5 text-[12.5px] font-bold">
                      <span className="text-pink-600">{p.line}</span>
                      {p.bonus && <span className="ml-1 text-orange-600">{p.bonus}</span>}
                    </p>
                    <p className="text-[11.5px] text-slate-500">{p.use}</p>
                  </div>
                  <p className="shrink-0 text-base font-extrabold text-gray-900">{won(p.price)}</p>
                </button>
              ))}
            </div>
            <div className="space-y-2 border-t border-slate-100 px-4 pb-4 pt-3">
              <label className="flex items-start gap-2 text-[11.5px] leading-relaxed text-slate-500">
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  <a href="/terms" target="_blank" rel="noreferrer" className="underline">이용약관</a>·<a href="/refund" target="_blank" rel="noreferrer" className="underline">환불 안내</a>에 동의해요. 결과를 열람하면 단순 변심 환불은 어려울 수 있어요.
                </span>
              </label>
              <button
                type="button"
                disabled={!picked || !agree}
                onClick={() => {
                  track("pay_open");
                  setStep("soon");
                }}
                className="w-full rounded-2xl bg-brand-500 py-3 text-sm font-extrabold text-white disabled:opacity-50"
              >
                {picked ? `${won(picked.price)} 결제하기` : "상품을 골라 주세요"}
              </button>
              <p className="rounded-xl border border-dashed border-slate-300 px-3 py-2 text-xs leading-relaxed text-slate-500">
                <b className="text-slate-700">무료로 받는 방법</b>
                <br />
                로그인 선물 · 정성 후기(월 2개) · 친구 초대 · 도장 3일 연속
              </p>
            </div>
          </>
        ) : (
          <div className="space-y-3 p-5">
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
          </div>
        )}
      </div>
    </div>
  );
}
