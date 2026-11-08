"use client";

/*
 * 프리미엄 종합 사주·둘의 궁합 카드를 눌렀는데 동전이 모자랄 때, 생년월일을 묻기 전에 먼저 보여주는 안내창.
 * 이 풀이들은 무료 뽑기·보너스 뽑기권으로는 열 수 없고 동전으로만 열려요.
 */
export interface PaywallInfo {
  fortune: string;
  price: string;
  premium: boolean;
  /** 필요한 동전 수 */
  need: number;
  /** 지금 가진 동전 수 */
  have: number;
  compat: boolean;
}

export default function PaywallPopup({ info, onClose, onCharge }: { info: PaywallInfo; onClose: () => void; onCharge: () => void }) {
  const name = info.compat ? "둘의 궁합" : "프리미엄 종합 사주";
  const some = info.have > 0;
  // 일반 500원 풀이: 오늘 무료를 다 쓰고 동전도 없을 때
  const title = !info.premium ? "잔액이 부족해요" : some ? "동전이 모자라요" : `${name}은\n무료 뽑기로는 볼 수 없어요`;
  const sub = !info.premium
    ? `${info.fortune} 풀이를 보려면 동전 ${info.need}개가 필요한데\n오늘의 무료 뽑기는 이미 썼고\n동전이 ${info.have}개예요.\n동전을 충전해서 이어서 볼까요?`
    : some
      ? `${name}은 동전 ${info.need}개가 필요한데\n지금은 ${info.have}개가 있어요.\n부족한 만큼 충전해서 이어서 볼까요?`
      : "오늘의 무료 뽑기와 보너스 뽑기권으로는\n열 수 없는 풀이예요.\n동전을 충전해서 이어서 볼까요?";
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 px-6" role="alertdialog" aria-modal="true" aria-label="유료 풀이 안내" data-testid="paywall-popup" onClick={onClose}>
      <div className="w-full max-w-[300px] rounded-[22px] bg-white p-5 pb-4 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex h-[46px] items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/coin-500.webp" alt="" style={{ height: 46 }} className="w-auto drop-shadow" />
        </div>
        <h4 className="mt-1.5 whitespace-pre-line text-[16.5px] font-extrabold leading-snug text-gray-900">{title}</h4>
        <p className="mt-1.5 whitespace-pre-line text-[12.5px] leading-relaxed text-slate-500">{sub}</p>
        <div className="mt-2.5 flex items-center justify-between rounded-xl bg-brand-50 px-3 py-2 text-[12.5px] font-bold text-brand-600">
          <span>필요한 동전</span>
          <b className="text-[13.5px]">
            {info.need}개 ({(info.need * 500).toLocaleString("ko-KR")}원)
          </b>
        </div>
        <div className="mt-1.5 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-[12.5px] font-bold text-slate-600">
          <span>내 동전</span>
          <b className="text-[13.5px]">{info.have}개</b>
        </div>
        <div className="mt-3.5 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-full bg-brand-50 py-2.5 text-sm font-extrabold text-brand-600 active:scale-[0.98]">
            나중에
          </button>
          <button type="button" onClick={onCharge} data-testid="paywall-charge" className="flex-1 rounded-full bg-brand-600 py-2.5 text-sm font-extrabold text-white active:scale-[0.98]">
            동전 충전하기
          </button>
        </div>
        <p className="mt-2.5 text-[10.5px] text-gray-400">* 베타 기간이라 실제 결제는 발생하지 않아요.</p>
      </div>
    </div>
  );
}
