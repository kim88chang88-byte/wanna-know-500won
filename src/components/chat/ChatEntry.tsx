"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { saveChatCtx, type ChatCtx } from "@/lib/chatContext";

let cached: boolean | null = null;

/** 상담방이 나에게 열려 있는지(지금은 관리자만). 한 번만 물어보고 기억해요. */
export function useChatEnabled(): boolean {
  const [on, setOn] = useState(cached === true);
  useEffect(() => {
    if (cached !== null) {
      setOn(cached);
      return;
    }
    let alive = true;
    fetch("/api/chat", { cache: "no-store" })
      .then((r) => r.json() as Promise<{ enabled?: boolean }>)
      .then((d) => {
        cached = d.enabled === true;
        if (alive) setOn(cached);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);
  return on;
}

/** "도리에게 더 물어보기" 버튼: 맥락을 담아 상담방으로 가요. 열려 있지 않은 사람에게는 보이지 않아요. */
export function ChatEntry({ ctx, luxe = false, className = "", inScene = false }: { ctx: ChatCtx; luxe?: boolean; className?: string; /** 오늘 카드 말풍선 안에 넣을 때: 글자·여백을 장면 너비(cqw)에 맞춰 */ inScene?: boolean }) {
  const enabled = useChatEnabled();
  const router = useRouter();
  if (!enabled) return null;
  return (
    <button
      type="button"
      data-testid="chat-entry"
      onClick={() => {
        saveChatCtx(ctx);
        router.push("/chat");
      }}
      style={inScene ? { fontSize: "3cqw", padding: "2cqw 0", width: "100%" } : undefined}
      className={`rounded-full font-bold shadow-sm active:scale-95 ${inScene ? "" : "px-4 py-2 text-xs"} ${luxe ? "bg-[#e6c887] text-[#1b1824]" : "bg-brand-500 text-white"} ${className}`}
    >
      💬 도유 상담실에서 이어 묻기
    </button>
  );
}
