"use client";

import { useEffect, useState } from "react";

/*
 * 이메일 인증번호 로그인 화면: 이메일 입력 → 6자리 번호 입력. 비밀번호는 없어요.
 * 로그인에 성공하면 소셜 로그인과 똑같이 "/?login=success" 로 돌아가 로그인 상태를 새로 읽어요.
 */

type Step = "email" | "code";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function EmailLogin({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // 재전송 대기 시간(초)을 1초씩 줄여요.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function send() {
    const v = email.trim();
    if (!EMAIL_RE.test(v)) {
      setError("이메일 주소를 다시 확인해 주세요.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/email/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: v }) });
      const data = (await res.json().catch(() => null)) as { error?: string; resendAfterSec?: number; retryAfterSec?: number } | null;
      if (res.ok) {
        setStep("code");
        setCode("");
        setCooldown(data?.resendAfterSec ?? 60);
      } else if (res.status === 503) {
        setError("이메일 로그인이 아직 열리지 않았어요. 곧 열릴 예정이에요 ❄️");
      } else {
        if (res.status === 429 && data?.retryAfterSec) setCooldown(Math.min(data.retryAfterSec, 3600));
        setError(data?.error ?? "인증번호를 보내지 못했어요. 잠시 뒤에 다시 시도해 주세요.");
      }
    } catch {
      setError("인증번호를 보내지 못했어요. 잠시 뒤에 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    if (!/^\d{6}$/.test(code)) {
      setError("인증번호 6자리를 입력해 주세요.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/email/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim(), code }) });
      if (res.ok) {
        window.location.href = "/?login=success";
        return;
      }
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "로그인에 실패했어요. 잠시 뒤에 다시 시도해 주세요.");
    } catch {
      setError("로그인에 실패했어요. 잠시 뒤에 다시 시도해 주세요.");
    }
    setBusy(false);
  }

  return (
    <div data-testid="email-login-form" className="flex flex-col gap-2.5">
      {step === "email" ? (
        <>
          <p className="text-center text-sm font-extrabold text-gray-900">이메일로 로그인</p>
          <p className="text-center text-[11px] text-gray-500">가입 여부와 상관없이 이 주소로 바로 시작해요.</p>
          <label htmlFor="email-login-input" className="text-xs font-bold text-gray-700">
            이메일 주소
          </label>
          <input
            id="email-login-input"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoFocus
            value={email}
            maxLength={254}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && !busy && send()}
            placeholder="me@example.com"
            className="w-full rounded-xl border-[1.5px] border-brand-200 px-3 py-2.5 text-sm"
          />
          <button type="button" onClick={send} disabled={busy || email.trim().length < 6} className="w-full rounded-full bg-brand-600 py-2.5 text-xs font-bold text-white disabled:opacity-50">
            {busy ? "보내는 중…" : "인증번호 받기"}
          </button>
          <p className="text-center text-[11px] leading-relaxed text-gray-500">입력한 주소로 6자리 인증번호를 보내요. 메일이 안 보이면 스팸함도 확인해 주세요.</p>
        </>
      ) : (
        <>
          <p className="text-center text-sm font-extrabold text-gray-900">인증번호를 입력해 주세요</p>
          <p className="text-center text-[11px] text-gray-500">{email.trim()} 으로 보냈어요</p>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            value={code}
            maxLength={6}
            aria-label="인증번호 6자리"
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
              setError(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && !busy && verify()}
            placeholder="000000"
            className="w-full rounded-xl border-[1.5px] border-brand-300 bg-brand-50/40 px-3 py-3 text-center font-mono text-2xl font-extrabold tracking-[0.5em]"
          />
          <button type="button" onClick={verify} disabled={busy || code.length !== 6} className="w-full rounded-full bg-brand-600 py-2.5 text-xs font-bold text-white disabled:opacity-50">
            {busy ? "확인하는 중…" : "로그인하기"}
          </button>
          <p className="text-center text-[11px] leading-relaxed text-gray-500">
            인증번호는 <b className="text-brand-700">10분</b> 동안만 쓸 수 있어요.{" "}
            <button type="button" onClick={send} disabled={busy || cooldown > 0} className="font-bold text-brand-700 underline underline-offset-2 disabled:text-gray-400 disabled:no-underline">
              {cooldown > 0 ? `인증번호 다시 받기 (${cooldown}초)` : "인증번호 다시 받기"}
            </button>
          </p>
        </>
      )}
      {error && (
        <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-center text-[11px] font-bold text-rose-700">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={() => {
          if (step === "code") {
            setStep("email");
            setError(null);
          } else {
            onBack();
          }
        }}
        className="text-center text-[11px] text-gray-500 underline underline-offset-2"
      >
        {step === "code" ? "← 이메일 다시 입력" : "← 다른 방법으로 로그인"}
      </button>
      <p className="text-center text-[10px] leading-relaxed text-gray-400">이메일 주소는 인증번호를 보내는 데만 쓰고, 원문은 저장하지 않아요.</p>
    </div>
  );
}
