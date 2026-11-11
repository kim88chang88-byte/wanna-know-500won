"use client";

/** 프리미엄 카드를 눌렀을 때 뜨는 "아직 준비 중" 안내 팝업 */
export default function PremiumSoonPopup({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/55 px-5" role="dialog" aria-modal="true" aria-label="프리미엄 사주 준비 중 안내" data-testid="premium-soon-popup" onClick={onClose}>
      <div className="w-full max-w-[292px] animate-[betaPop_.4s_cubic-bezier(.2,1.3,.4,1)] rounded-[22px] border-2 border-white bg-gradient-to-b from-[#fff4ee] via-[#fde9e2] to-[#f6e6f3] px-[18px] pb-4 pt-4 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/premium-soon.webp" alt="안전모를 쓰고 준비 중인 수달 도리" className="mx-auto -mt-1 block w-[196px] drop-shadow-[0_6px_10px_rgba(180,110,100,0.25)]" />
        <span className="mt-2.5 inline-block rounded-full bg-gradient-to-r from-[#8fb0f6] to-[#c9a7ef] px-3 py-1 text-[11px] font-extrabold text-white">👑 PREMIUM</span>
        <h4 className="mt-2 text-[18px] font-black leading-snug text-[#1f2a55]">
          프리미엄 사주는
          <br />
          아직 준비 중이야
        </h4>
        <p className="mt-2 text-[12.5px] leading-relaxed text-[#8a6a62]">
          도리가 더 정성껏 다듬고 있어.
          <br />
          조금만 기다려 주시면
          <br />
          멋진 모습으로 찾아올게 ✨
          <br />
          그동안은 매일 무료 운세로 만나!
        </p>
        <button type="button" onClick={onClose} data-testid="premium-soon-close" className="mt-3.5 w-full rounded-full bg-gradient-to-r from-[#8fb0f6] to-[#eaa1b8] py-2.5 text-[13.5px] font-black text-white active:scale-[0.98]">
          알겠어
        </button>
      </div>
    </div>
  );
}
