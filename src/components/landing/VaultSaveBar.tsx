"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { PremiumReportView } from "@/lib/premium/types";

export interface VaultSnapshotInput {
  topic: string;
  premium: boolean;
  report: PremiumReportView;
  /** 도리의 풀이 카드(AI 풀이 전체). 없으면 null */
  reading?: unknown;
  kkotgeoji: string | null;
  reason: string | null;
  story?: string | null;
  folds?: object | null;
  heads?: object | null;
  note: string | null;
}

type Status = "idle" | "saving" | "saved" | "full" | "error";

/** 결과 화면의 "내 보관함에 저장" 줄. autoSave 면 결과가 뜰 때 한 번 저장하고, 아니면 버튼을 눌러 저장해요. */
export function VaultSaveBar({ snapshot, autoSave, luxe = false }: { snapshot: VaultSnapshotInput; autoSave: boolean; luxe?: boolean }) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const tried = useRef(false);

  async function save() {
    setStatus("saving");
    setMessage(null);
    try {
      const res = await fetch("/api/vault", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(snapshot) });
      const data = (await res.json().catch(() => null)) as { error?: string; code?: string } | null;
      if (res.ok) setStatus("saved");
      else if (res.status === 409 && data?.code === "full") {
        setStatus("full");
        setMessage(data.error ?? null);
      } else {
        setStatus("error");
        setMessage(data?.error ?? "보관함에 저장하지 못했어요.");
      }
    } catch {
      setStatus("error");
      setMessage("보관함에 저장하지 못했어요. 인터넷 연결을 확인해 주세요.");
    }
  }

  useEffect(() => {
    if (autoSave && !tried.current) {
      tried.current = true;
      void save();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div data-testid="vault-save-bar" className={`mt-4 flex items-center justify-between gap-2 rounded-2xl border px-3.5 py-2.5 text-xs ${luxe ? "border-[#e6c887]/25 bg-white/[0.03]" : "border-brand-100 bg-white"}`}>
      <span className={`leading-snug ${luxe ? "text-[#efe7d3]" : "text-gray-700"}`}>
        {status === "saved" && <>📚 내 보관함에 저장했어요. 언제든 다시 볼 수 있어요.</>}
        {status === "saving" && <>📚 보관함에 저장하는 중…</>}
        {status === "idle" && <>📚 이 풀이를 내 보관함에 넣어 둘까요?</>}
        {(status === "error" || status === "full") && <span className={luxe ? "text-[#f6dfa8]" : "text-amber-800"}>{message}</span>}
      </span>
      {status === "saved" ? (
        <Link href="/vault" className={`shrink-0 font-bold underline underline-offset-2 ${luxe ? "text-[#e6c887]" : "text-brand-600"}`}>
          보관함 보기
        </Link>
      ) : (
        status !== "saving" &&
        status !== "full" && (
          <button type="button" onClick={() => void save()} className={`shrink-0 font-bold underline underline-offset-2 ${luxe ? "text-[#e6c887]" : "text-brand-600"}`}>
            {status === "error" ? "다시 저장" : "저장하기"}
          </button>
        )
      )}
    </div>
  );
}
