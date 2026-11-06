"use client";

import { useState } from "react";
import { track } from "@/lib/track";
import { DEMO_COINS, DEMO_MONTH_CAP } from "@/lib/demoBuy";

/*
 * 도리 메뉴판(구매 화면). 지금은 결제창이 없어서 "베타 구매 체험"으로 이어져요.
 * 체험은 실제로 결제되지 않고, 상품에 맞는 동전만 들어와요. (한 계정 한 달 3번)
 * 모든 단계에 "베타 체험 · 실제 결제 없음"을 적어서, 진짜로 결제된 것처럼 보이지 않게 해요.
 * 한도(3번)를 다 쓰면 "오픈 알림 받기"로 이어지고, 알림 신청은 이름·연락처 없이 "눌렀다"는 사실만 익명으로 세요.
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
  { id: "premium", name: "프리미엄 종합 사주", price: 9500, line: "20쪽 사주서 전체", bonus: "+ 동전 5개 보너스!", use: "원국·월별 12개월·10년 대운 + 보너스 동전으로 풀이 5회 · 질문 25번", best: true },
];

const DemoNote = ({ className = "" }: { className?: string }) => (
  <p data-testid="demo-note" className={`rounded-xl border border-orange-300 bg-orange-50 px-3 py-2 text-xs font-bold leading-relaxed text-orange-800 ${className}`}>🧪 베타 체험 · 실제 결제는 없어요</p>
);

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

export default function PurchaseModal({ preselect, onClose }: { preselect?: ProductId; onClose: () => void }) {
  const [step, setStep] = useState<"buy" | "confirm" | "done" | "soon">("buy");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<"" | "login" | "fail">("");
  const [gotCoins, setGotCoins] = useState(0);
  const [balance, setBalance] = useState(0);
  const [sel, setSel] = useState<ProductId | null>(preselect ?? null);
  const [agree, setAgree] = useState(false);
  const [notified, setNotified] = useState(false);
  const picked = PRODUCTS.find((p) => p.id === sel) ?? null;

  async function buyDemo() {
    if (!picked || busy) return;
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/pay/demo-buy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ product: picked.id }) });
      const d = (await res.json().catch(() => null)) as { ok?: boolean; coins?: number; balance?: number; error?: string } | null;
      if (res.ok && d?.ok) {
        track("pay_demo");
        setGotCoins(d.coins ?? DEMO_COINS[picked.id]);
        setBalance(d.balance ?? 0);
        window.dispatchEvent(new Event("wanna500:coins"));
        setStep("done");
      } else if (res.status === 429) {
        setStep("soon");
      } else {
        setErr(res.status === 401 ? "login" : "fail");
      }
    } catch {
      setErr("fail");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/45 sm:items-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="도리 메뉴판" onClick={(e) => e.stopPropagation()} className="max-h-[92vh] w-full max-w-[380px] overflow-y-auto rounded-t-3xl bg-white shadow-xl sm:rounded-3xl">
        {step === "buy" ? (
          <>
            <div className="flex items-center justify-between bg-brand-600 px-4 py-3.5 text-white">
              <h2 className="text-base font-extrabold">도리 메뉴판</h2>
              <button type="button" onClick={onClose} aria-label="닫기" className="text-lg leading-none">✕</button>
            </div>
            <p className="border-b border-orange-200 bg-orange-50 px-4 py-2 text-center text-xs font-bold text-orange-800">🧪 베타 체험 · 실제 결제는 없어요</p>
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
                  <a href="/terms" target="_blank" rel="noreferrer" className="underline">이용약관</a>·<a href="/refund" target="_blank" rel="noreferrer" className="underline">환불 안내</a>에 동의해요. 지금은 체험이라 환불할 돈이 없어요.
                </span>
              </label>
              <button
                type="button"
                disabled={!picked || !agree}
                onClick={() => {
                  track("pay_open");
                  setErr("");
                  setStep("confirm");
                }}
                className="w-full rounded-2xl bg-brand-500 py-3 text-sm font-extrabold text-white disabled:opacity-50"
              >
                {picked ? `${won(picked.price)} 체험 결제하기` : "상품을 골라 주세요"}
              </button>
              <p className="rounded-xl border border-dashed border-slate-300 px-3 py-2 text-xs leading-relaxed text-slate-500">
                <b className="text-slate-700">무료로 받는 방법</b>
                <br />
                로그인 선물 · 정성 후기(월 2개) · 친구 초대 · 도장 3일 연속
              </p>
            </div>
          </>
        ) : step === "confirm" && picked ? (
          <div className="space-y-3 p-5">
            <h2 className="text-base font-extrabold text-gray-900">체험 결제 확인</h2>
            <DemoNote />
            <p className="text-sm leading-relaxed text-slate-600">돈이 나가지 않고, 카드·계좌 정보도 받지 않아요. 구매 흐름을 미리 써 보는 베타 체험이에요.</p>
            <dl className="space-y-2 text-[13px]">
              <div className="flex justify-between border-t border-slate-100 pt-2"><dt className="text-slate-500">상품</dt><dd className="font-bold">{picked.name}</dd></div>
              <div className="flex justify-between border-t border-slate-100 pt-2"><dt className="text-slate-500">받게 되는 것</dt><dd className="font-bold">동전 {DEMO_COINS[picked.id]}개</dd></div>
              <div className="flex justify-between border-t border-slate-100 pt-2"><dt className="text-slate-500">결제 금액</dt><dd className="font-bold">0원 (체험)</dd></div>
              <div className="flex justify-between border-t border-slate-100 pt-2"><dt className="text-slate-500">체험 한도</dt><dd className="font-bold">한 달 {DEMO_MONTH_CAP}번</dd></div>
            </dl>
            {err === "login" && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">로그인한 뒤에 체험할 수 있어요. 위쪽 로그인 버튼을 눌러 주세요.</p>}
            {err === "fail" && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">지금은 체험을 받지 못했어요. 잠시 뒤 다시 눌러 주세요.</p>}
            <button type="button" disabled={busy} onClick={buyDemo} className="w-full rounded-2xl bg-brand-500 py-3 text-sm font-extrabold text-white disabled:opacity-50">
              {busy ? "받는 중…" : "체험으로 받기"}
            </button>
            <button type="button" onClick={() => setStep("buy")} className="w-full py-1.5 text-xs text-slate-400">돌아가기</button>
          </div>
        ) : step === "done" ? (
          <div className="space-y-3 p-5">
            <h2 className="text-base font-extrabold text-gray-900">구매 완료 (체험)</h2>
            <p className="text-center text-xl font-black text-gray-900">🎉 동전 {gotCoins}개가 들어왔어요</p>
            <p role="status" className="rounded-xl bg-emerald-50 px-3 py-2.5 text-center text-sm font-bold text-emerald-700">베타 체험으로 받은 동전이에요. 실제 결제는 없었어요.</p>
            <DemoNote />
            {balance > 0 && <p className="text-center text-[13px] text-slate-600">내 동전 <b>{balance}개</b> · 풀이 뽑기나 상담실 질문에 쓸 수 있어요</p>}
            <button type="button" onClick={onClose} className="w-full rounded-2xl bg-brand-500 py-3 text-sm font-extrabold text-white">확인</button>
          </div>
        ) : (
          <div className="space-y-3 p-5">
            <h2 className="text-base font-extrabold text-gray-900">결제는 곧 열려요</h2>
            <p className="text-sm leading-relaxed text-slate-600">이번 달 체험 구매 3번을 모두 썼어요. 다음 달 1일에 다시 열려요. 정식 결제가 열리면 가장 먼저 알려 드릴게요. 알림만 받으면 되고, 아무것도 결제되지 않아요.</p>
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
