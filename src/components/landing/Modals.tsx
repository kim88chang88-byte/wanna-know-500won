"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export interface SpinState {
  fortune: string;
  price: string;
}

interface ShellProps {
  labelId: string;
  panelClass: string;
  onClose: () => void;
  children: ReactNode;
}

/** 공통 모달 틀: 배경 클릭 / Esc 로 닫히고, 열릴 때 포커스를 옮겼다가 닫히면 되돌려줍니다. */
function ModalShell({ labelId, panelClass, onClose, children }: ShellProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
      data-testid="modal-overlay"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        tabIndex={-1}
        className={`relative w-full bg-white rounded-3xl shadow-2xl outline-none ${panelClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      onClick={onClose}
      type="button"
      aria-label="닫기"
      className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
    >
      <span className="material-symbols-outlined text-[20px]">close</span>
    </button>
  );
}

export function LoginModal({ onClose }: { onClose: () => void }) {
  const [notice, setNotice] = useState(false);

  return (
    <ModalShell labelId="login-title" panelClass="max-w-sm p-6 sm:p-7 border border-brand-200" onClose={onClose}>
      <CloseButton onClose={onClose} />
      <div className="text-center mb-5">
        <div className="w-12 h-12 rounded-full bg-brand-50 text-2xl flex items-center justify-center mx-auto mb-2">
          🌸
        </div>
        <h4 id="login-title" className="font-serifKr font-bold text-lg text-gray-900">
          꽃거지의 사주방 로그인
        </h4>
        <p className="text-xs text-gray-500 mt-1">간편 가입하고 매일 첫 1회 무료 뽑기를 챙기세요!</p>
      </div>

      <div className="flex flex-col gap-2.5 mb-4">
        <button
          onClick={() => setNotice(true)}
          type="button"
          className="w-full py-2.5 px-4 rounded-full bg-[#FEE500] text-[#191919] font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
        >
          <span>카카오 3초 간편 로그인</span>
        </button>
        <button
          onClick={() => setNotice(true)}
          type="button"
          className="w-full py-2.5 px-4 rounded-full bg-[#03C75A] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
        >
          <span>네이버 로그인</span>
        </button>
      </div>

      {notice && (
        <p role="status" className="text-center text-xs font-bold text-brand-600 mb-2">
          로그인 기능은 아직 준비 중이에요. 곧 열릴 예정이에요 🌸
        </p>
      )}

      <div className="text-center text-[10px] text-gray-400 mt-3">
        * 현재 Beta 테스트 버전으로 별도 결제 없이 무료 체험이 가능합니다.
      </div>
    </ModalShell>
  );
}

export function SpinModal({ spin, onClose }: { spin: SpinState; onClose: () => void }) {
  return (
    <ModalShell
      labelId="spin-title"
      panelClass="max-w-md p-6 sm:p-7 border-2 border-brand-300 text-center"
      onClose={onClose}
    >
      <CloseButton onClose={onClose} />
      <div className="w-14 h-14 rounded-full bg-brand-50 text-3xl flex items-center justify-center mx-auto mb-3">
        🌸
      </div>
      <span className="px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-700 text-xs font-bold">
        {spin.fortune} 뽑기 완료 ({spin.price})
      </span>
      <h3 id="spin-title" className="font-serifKr font-black text-xl text-gray-900 mt-2 mb-1">
        찰칵-! {spin.fortune} 캡슐이 나왔어요!
      </h3>
      <p className="text-xs text-gray-500 mb-4 font-serifKr">
        꽃거지가 넣어 둔 한마디가 캡슐에 담겼어요.
      </p>

      <div className="p-4 rounded-2xl bg-brand-50/60 border border-brand-100 text-left mb-3">
        <div className="text-[11px] font-bold text-brand-700 mb-1">✧ 캡슐 속 한마디 (예시)</div>
        <p className="font-serifKr text-xs text-gray-800 leading-relaxed">
          “오늘 이 마음, 맞지? 설레는 소식이 가까이 오고 있어요. 걱정은 잠깐 내려놓고 미소부터 챙겨요.”
        </p>
      </div>
      <p className="text-[11px] text-gray-400 mb-4">
        * 지금은 둘러보기용 화면이에요. 실제 풀이는 준비 중입니다.
      </p>

      <button
        onClick={onClose}
        type="button"
        className="w-full py-2.5 rounded-full bg-brand-600 text-white font-serifKr font-bold text-sm shadow-md hover:bg-brand-700 transition-colors"
      >
        확인했어요 ✧
      </button>
    </ModalShell>
  );
}
