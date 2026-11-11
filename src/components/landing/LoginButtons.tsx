"use client";

import { useEffect, useState } from "react";
import EmailLogin from "./EmailLogin";

/** 로그인 버튼 세 개 (카카오 · 구글 · 네이버 순서, 로그인 창과 보관함에서 같이 써요) */
export default function LoginButtons({ className = "flex flex-col gap-2.5" }: { className?: string }) {
  const base = "w-full py-2.5 px-4 rounded-full font-bold text-xs flex items-center justify-center gap-2 shadow-sm";
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);
  // 메일 발송 설정이 끝났을 때만 이메일 로그인 버튼을 보여줘요.
  useEffect(() => {
    let alive = true;
    fetch("/api/auth/email", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { enabled?: boolean } | null) => {
        if (alive && d?.enabled) setEmailEnabled(true);
      })
      .catch(() => {
        /* 못 읽으면 소셜 로그인만 보여요 */
      });
    return () => {
      alive = false;
    };
  }, []);

  if (emailOpen) {
    return (
      <div className={className}>
        <EmailLogin onBack={() => setEmailOpen(false)} />
      </div>
    );
  }
  return (
    <div className={className}>
      {/* 카카오 로그인은 서버 주소로 이동해서 진행해 (카카오 로그인 화면 → 다시 이 서비스로) */}
      <a href="/api/auth/kakao" data-testid="kakao-login" className={`${base} bg-[#FEE500] text-[#191919]`}>
        <span>카카오로 로그인</span>
      </a>
      <a href="/api/auth/google" data-testid="google-login" className={`${base} bg-white text-[#3c4043] border border-gray-300`}>
        <svg width="14" height="14" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
          <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z" />
          <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
        </svg>
        <span>구글로 로그인</span>
      </a>
      <a href="/api/auth/naver" data-testid="naver-login" className={`${base} bg-[#03C75A] text-white`}>
        <span>네이버로 로그인</span>
      </a>
      {emailEnabled && (
        <>
          <div className="flex items-center gap-2 text-[10px] text-gray-400" aria-hidden="true">
            <i className="h-px flex-1 bg-gray-200" />
            <span>또는</span>
            <i className="h-px flex-1 bg-gray-200" />
          </div>
          <button type="button" data-testid="email-login" onClick={() => setEmailOpen(true)} className={`${base} border-[1.5px] border-brand-400 bg-white text-brand-700`}>
            <span aria-hidden="true">✉️</span>
            <span>이메일로 로그인</span>
          </button>
        </>
      )}
    </div>
  );
}
