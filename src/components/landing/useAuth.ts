"use client";

import type { SavedProfile } from "@/lib/profile";
import { useCallback, useEffect, useState } from "react";

export interface AuthUser {
  nickname: string | null;
}

/** 서버가 센 뽑기 횟수 (로그인 + DB 연결 시) */
export interface ServerCounts {
  today: number;
  month: number;
}

/** 로그인 후 돌아왔을 때 주소에 붙는 결과 (?login=...) */
export type LoginResult = "unavailable" | "cancelled" | "error";

const RESULTS: LoginResult[] = ["unavailable", "cancelled", "error"];

export const LOGIN_RESULT_MESSAGE: Record<LoginResult, string> = {
  unavailable: "이 로그인 방식이 아직 열리지 않았어요. 곧 열릴 예정이에요 🫧",
  cancelled: "로그인을 취소했어요. 언제든 다시 해볼 수 있어요.",
  error: "로그인에 실패했어요. 잠시 뒤에 다시 시도해줘요.",
};

/** 서버에 로그인 상태를 물어보고(쿠키는 서버만 읽어요), 로그아웃을 요청해요. */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [result, setResult] = useState<LoginResult | null>(null);
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const [serverCounts, setServerCounts] = useState<ServerCounts | null>(null);
  const [profile, setProfile] = useState<SavedProfile | null>(null);

  useEffect(() => {
    let alive = true;
    // 로그인 결과 표시 후 주소에서 지워서 새로고침 때 다시 뜨지 않게 해요.
    try {
      const url = new URL(window.location.href);
      const r = url.searchParams.get("login");
      if (r === "success" || (r && RESULTS.includes(r as LoginResult))) {
        if (r === "success") setJustLoggedIn(true);
        else setResult(r as LoginResult);
        url.searchParams.delete("login");
        window.history.replaceState(null, "", url.pathname + url.search + url.hash);
      }
    } catch {
      /* 무시 */
    }
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { loggedIn?: boolean; nickname?: string | null; counts?: ServerCounts | null; profile?: SavedProfile | null } | null) => {
        if (!alive || !data?.loggedIn) return;
        setUser({ nickname: data.nickname ?? null });
        setServerCounts(data.counts ?? null);
        setProfile(data.profile ?? null);
      })
      .catch(() => {
        /* 로그인 상태를 못 읽어도 비로그인으로 동작해요 */
      });
    return () => {
      alive = false;
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* 무시 */
    }
    setUser(null);
    setServerCounts(null);
    setProfile(null);
  }, []);

  /** 회원 탈퇴. 성공하면 true. (서버가 회원 정보와 뽑기 기록을 지워요) */
  const withdraw = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/withdraw", { method: "POST" });
      if (!res.ok) return false;
    } catch {
      return false;
    }
    setUser(null);
    setServerCounts(null);
    setProfile(null);
    return true;
  }, []);

  /** 기억해 둔 생년월일시만 지워요. 성공하면 true */
  const deleteProfile = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/profile", { method: "DELETE" });
      if (!res.ok) return false;
    } catch {
      return false;
    }
    setProfile(null);
    return true;
  }, []);

  const clearResult = useCallback(() => setResult(null), []);
  const clearWelcome = useCallback(() => setJustLoggedIn(false), []);

  return { user, profile, setProfile, deleteProfile, serverCounts, setServerCounts, result, clearResult, justLoggedIn, clearWelcome, logout, withdraw };
}
