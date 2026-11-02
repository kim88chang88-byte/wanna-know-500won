"use client";

import { useEffect, useState } from "react";
import { resultToText } from "@/lib/admin/resultText";
import type { PremiumReportView } from "@/lib/premium/types";

let cachedAdmin: boolean | null = null;

/** 관리자에게만 보이는 "결과 복사" 버튼. AI 가 쓴 결과 글 전체를 클립보드에 담아요. (이용자에게는 아무것도 안 보여요) */
export default function AdminCopyResult({ report, reading, topic, name, partnerName }: { report: PremiumReportView; reading: unknown; topic?: string; name?: string | null; partnerName?: string | null }) {
  const [admin, setAdmin] = useState(cachedAdmin === true);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    if (cachedAdmin !== null) {
      setAdmin(cachedAdmin);
      return;
    }
    let alive = true;
    fetch("/api/admin/me", { cache: "no-store" })
      .then((r) => r.json() as Promise<{ admin?: boolean }>)
      .then((d) => {
        cachedAdmin = d.admin === true;
        if (alive) setAdmin(cachedAdmin);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);
  if (!admin) return null;

  async function copy() {
    const text = resultToText(report, reading, { topic, name, partnerName });
    try {
      await navigator.clipboard.writeText(text);
      setMsg(`복사했어요 (${text.length.toLocaleString("ko-KR")}자)`);
    } catch {
      // 복사가 막히면 파일로 내려받아요
      const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "dori-result.txt";
      a.click();
      URL.revokeObjectURL(url);
      setMsg("복사가 막혀서 파일로 받았어요");
    }
  }

  return (
    <div className="mt-4 text-center" data-testid="admin-copy" data-no-click-fx="">
      <button type="button" onClick={() => void copy()} className="rounded-full border border-dashed border-slate-400 bg-white/80 px-4 py-2 text-xs font-bold text-slate-600 active:scale-95">
        📋 결과 복사 (관리자 전용)
      </button>
      {msg && <p className="mt-1 text-[11px] text-slate-500">{msg}</p>}
    </div>
  );
}
