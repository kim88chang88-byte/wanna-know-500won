"use client";

import LoginButtons from "./LoginButtons";
import { profileSummary, type SavedProfile } from "@/lib/profile";
import type { SavedPerson } from "@/lib/people";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { LOGIN_RESULT_MESSAGE, type AuthUser, type LoginResult } from "./useAuth";

interface ShellProps {
  labelId: string;
  panelClass: string;
  onClose: () => void;
  /** false 로 두면 바깥을 눌러도 닫히지 않아요. (입력 중인 내용을 실수로 잃지 않게) */
  closeOnOverlay?: boolean;
  /** 프리미엄 결과처럼 미드나잇+골드 톤으로 보여줄 때 */
  luxe?: boolean;
  children: ReactNode;
}

/** 공통 모달 틀: 배경 클릭 / Esc 로 닫히고, 열릴 때 포커스를 옮겼다가 닫히면 되돌려줍니다. */
export function ModalShell({ labelId, panelClass, onClose, closeOnOverlay = true, luxe = false, children }: ShellProps) {
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
      onClick={closeOnOverlay ? onClose : undefined}
      data-testid="modal-overlay"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        tabIndex={-1}
        className={`relative w-full rounded-3xl shadow-2xl outline-none ${luxe ? "bg-gradient-to-b from-[#1d1a28] via-[#171520] to-[#12101a] text-[#f5efe0]" : "bg-white"} ${panelClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function CloseButton({ onClose, luxe = false }: { onClose: () => void; luxe?: boolean }) {
  // 안쪽이 스크롤돼도 닫기 버튼은 모달 오른쪽 위에 붙어 있도록, 높이 0 짜리 sticky 칸 안에 둬요.
  return (
    <div className="sticky top-0 z-30 h-0">
      <button
        onClick={onClose}
        type="button"
        aria-label="닫기"
        className={`absolute -top-1 -right-1 sm:-top-2 sm:-right-2 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm ${luxe ? "bg-[#12101a]/70 text-[#e6c887]/80 hover:text-[#e6c887]" : "bg-white/80 text-gray-400 hover:text-gray-600"}`}
      >
        <span className="material-symbols-outlined text-[20px]">close</span>
      </button>
    </div>
  );
}

interface LoginModalProps {
  onClose: () => void;
  user?: AuthUser | null;
  result?: LoginResult | null;
  onLogout?: () => void | Promise<void>;
  /** 회원 탈퇴. 성공하면 true */
  onWithdraw?: () => Promise<boolean>;
  /** 기억해 둔 생년월일시 (있을 때만 보여줘요) */
  profile?: SavedProfile | null;
  /** 기억해 둔 생년월일시 삭제. 성공하면 true */
  onDeleteProfile?: () => Promise<boolean>;
}

/** 기억해 둔 다른 사람 목록과 지우기 (로그인 창 안에서). 하나도 없거나 기능이 꺼져 있으면 아무것도 안 보여요. */
function SavedPeopleBox() {
  const [people, setPeople] = useState<SavedPerson[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/people", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { people?: SavedPerson[] } | null) => {
        if (alive && j && Array.isArray(j.people)) setPeople(j.people);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (people.length === 0) return null;
  return (
    <div data-testid="saved-people-box" className="rounded-2xl bg-brand-50 border border-brand-100 p-3">
      <p className="text-[11px] font-bold text-brand-700 text-center">도리가 기억하고 있는 다른 사람</p>
      <ul className="mt-1.5 space-y-1">
        {people.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-2 text-xs text-gray-700">
            <span className="min-w-0 truncate">
              <b>{p.label}</b> · {profileSummary(p.birth)}
            </span>
            <button
              type="button"
              data-testid="delete-person"
              disabled={busyId === p.id}
              onClick={async () => {
                setBusyId(p.id);
                setFailed(false);
                try {
                  const res = await fetch(`/api/people/${p.id}`, { method: "DELETE" });
                  if (res.ok) setPeople((list) => list.filter((x) => x.id !== p.id));
                  else setFailed(true);
                } catch {
                  setFailed(true);
                }
                setBusyId(null);
              }}
              className="shrink-0 text-[11px] text-gray-500 underline underline-offset-2 hover:text-gray-700 disabled:opacity-50"
            >
              {busyId === p.id ? "지우는 중…" : "지우기"}
            </button>
          </li>
        ))}
      </ul>
      {failed && (
        <p role="alert" className="text-[11px] font-bold text-brand-600 mt-1 text-center">
          지우지 못했어요. 잠시 뒤에 다시 시도해 주세요.
        </p>
      )}
    </div>
  );
}

export function LoginModal({ onClose, user = null, result = null, onLogout, onWithdraw, profile = null, onDeleteProfile }: LoginModalProps) {
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileError, setProfileError] = useState(false);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState(false);

  return (
    <ModalShell labelId="login-title" panelClass="max-w-sm p-6 sm:p-7 border border-brand-200" onClose={onClose}>
      <CloseButton onClose={onClose} />
      <div className="text-center mb-5">
        <div className="w-12 h-12 rounded-full bg-brand-50 text-2xl flex items-center justify-center mx-auto mb-2">
          🫧
        </div>
        <h4 id="login-title" className="font-cute font-normal text-lg text-gray-900">
          {user ? "내 정보" : "도리 운세 사주 로그인"}
        </h4>
        <p className="text-xs text-gray-500 mt-1 whitespace-pre-line">
          {user
            ? `${user.nickname ? `${user.nickname}님, ` : ""}어서 와요! 로그인되어 있어요.`
            : "간편 가입하고 매일 첫 1회 무료 뽑기를 챙기세요!\n로그인하면 도리가 생년월일시를 기억해서 다시 입력할 필요가 없어요!"}
        </p>
      </div>

      {user ? (
        <LoginButtons className="flex flex-col gap-2.5 mb-4" />
      )}

      {result && (
        <p role="status" className="text-center text-xs font-bold text-brand-600 mb-2">
          {LOGIN_RESULT_MESSAGE[result]}
        </p>
      )}

      {!user && (
        <p className="text-center text-[10px] text-gray-400 mb-1">
          로그인하면 카카오·구글·네이버 계정의 고유번호와 닉네임(이름)만 받아요. 자세한 내용은 개인정보처리방침을 확인해 주세요.
        </p>
      )}
      <div className="text-center text-[10px] text-gray-400 mt-3">
        * 지금은 베타 테스트 중이라 별도 결제 없이 무료로 체험할 수 있어요.
      </div>
    </ModalShell>
  );
}
