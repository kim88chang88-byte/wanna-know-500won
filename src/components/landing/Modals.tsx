"use client";

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
            : "간편 가입하고 매일 첫 1회 무료 뽑기를 챙기세요!\n로그인하시면 도리가 생년월일시를 기억해서 다시 입력할 필요가 없어요!"}
        </p>
      </div>

      {user ? (
        <div className="flex flex-col gap-2.5 mb-4">
          {profile && onDeleteProfile && (
            <div data-testid="saved-profile-box" className="rounded-2xl bg-brand-50 border border-brand-100 p-3 text-center">
              <p className="text-[11px] font-bold text-brand-700">도리가 기억하고 있는 정보</p>
              <p className="text-xs text-gray-700 mt-1">{profileSummary(profile)}</p>
              {profileError && (
                <p role="alert" className="text-[11px] font-bold text-brand-600 mt-1">
                  지우지 못했어요. 잠시 뒤에 다시 시도해 주세요.
                </p>
              )}
              <button
                type="button"
                data-testid="delete-profile"
                disabled={profileBusy}
                onClick={async () => {
                  setProfileBusy(true);
                  setProfileError(false);
                  const done = await onDeleteProfile();
                  setProfileBusy(false);
                  if (!done) setProfileError(true);
                }}
                className="mt-1.5 text-[11px] text-gray-500 underline underline-offset-2 hover:text-gray-700 disabled:opacity-50"
              >
                {profileBusy ? "지우는 중…" : "기억한 정보 지우기"}
              </button>
            </div>
          )}
          <SavedPeopleBox />
          <a
            href="/vault"
            data-testid="open-vault"
            className="w-full py-2.5 px-4 rounded-full bg-brand-50 border border-brand-100 text-brand-700 font-bold text-xs text-center hover:bg-brand-100"
          >
            📚 내 보관함 (봤던 풀이 다시 보기)
          </a>
          <button
            onClick={async () => {
              await onLogout?.();
              onClose();
            }}
            type="button"
            className="w-full py-2.5 px-4 rounded-full bg-gray-100 text-gray-700 font-bold text-xs hover:bg-gray-200"
          >
            로그아웃
          </button>
          {onWithdraw && !confirmWithdraw && (
            <button
              onClick={() => setConfirmWithdraw(true)}
              type="button"
              className="text-[11px] text-gray-400 underline underline-offset-2 hover:text-gray-600"
            >
              회원 탈퇴
            </button>
          )}
          {onWithdraw && confirmWithdraw && (
            <div role="group" aria-label="회원 탈퇴 확인" className="rounded-2xl bg-sky-50 border border-sky-200 p-3 text-center">
              <p className="text-xs font-bold text-gray-800">정말 탈퇴할까요?</p>
              <p className="text-[11px] text-gray-600 mt-1">
                저장된 회원 정보(회원번호·닉네임), 뽑기 기록, 기억해 둔 생년월일시, 동의해서 남긴 고민 통계, 로그인해서 남긴 후기가 모두 삭제되고 되돌릴 수 없어요.
              </p>
              {withdrawError && (
                <p role="alert" className="text-[11px] font-bold text-brand-600 mt-1">
                  탈퇴 처리에 실패했어요. 잠시 뒤에 다시 시도해 주세요.
                </p>
              )}
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  disabled={withdrawing}
                  onClick={() => {
                    setConfirmWithdraw(false);
                    setWithdrawError(false);
                  }}
                  className="flex-1 py-2 rounded-full bg-white border border-gray-200 text-xs font-bold text-gray-700"
                >
                  취소
                </button>
                <button
                  type="button"
                  disabled={withdrawing}
                  onClick={async () => {
                    setWithdrawing(true);
                    setWithdrawError(false);
                    const ok = await onWithdraw();
                    setWithdrawing(false);
                    if (ok) onClose();
                    else setWithdrawError(true);
                  }}
                  className="flex-1 py-2 rounded-full bg-brand-600 text-white text-xs font-bold disabled:opacity-60"
                >
                  {withdrawing ? "처리 중…" : "탈퇴하기"}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 mb-4">
          {/* 카카오 로그인은 서버 주소로 이동해서 진행해요 (카카오 로그인 화면 → 다시 이 서비스로) */}
          <a
            href="/api/auth/kakao"
            className="w-full py-2.5 px-4 rounded-full bg-[#FEE500] text-[#191919] font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
          >
            <span>카카오 3초 간편 로그인</span>
          </a>
          <a
            href="/api/auth/google"
            data-testid="google-login"
            className="w-full py-2.5 px-4 rounded-full bg-white text-[#3c4043] border border-gray-300 font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
          >
            <svg width="14" height="14" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/>
              <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z"/>
              <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/>
            </svg>
            <span>Google로 로그인</span>
          </a>
          <a
            href="/api/auth/naver"
            data-testid="naver-login"
            className="w-full py-2.5 px-4 rounded-full bg-[#03C75A] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
          >
            <span>네이버 로그인</span>
          </a>
        </div>
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
        * 현재 Beta 테스트 버전으로 별도 결제 없이 무료 체험이 가능합니다.
      </div>
    </ModalShell>
  );
}
