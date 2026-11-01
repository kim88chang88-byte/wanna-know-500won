"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import SafeImage from "@/components/landing/SafeImage";
import { CHAT_LOG_KEY, MSG_MAX, TURN_CAP, readChatCtx, type ChatCtx, type ChatKind, type ChatMsg } from "@/lib/chatContext";

const GREETING: Record<ChatKind, string> = {
  daily: "안녕! 오늘의 한마디 잘 받았어? 오늘 하루 더 궁금한 거 있으면 편하게 물어봐 🫧",
  reading: "방금 본 풀이, 도리도 기억하고 있어! 읽다가 더 궁금했던 부분을 편하게 물어봐 🫧",
  compat: "두 사람 궁합, 도리가 다 기억하고 있어! 둘 사이에서 더 궁금한 거 편하게 물어봐 🫧",
};

const CHIPS: Record<ChatKind, string[]> = {
  daily: ["오늘 조심하면 좋은 게 있을까?", "오늘 사람들 사이에서 마음가짐은?", "오늘 기분 좋게 보내는 작은 방법은?"],
  reading: ["이 풀이에서 가장 중요한 한 가지는 뭐야?", "이번 주에 바로 해 볼 일을 알려 줘", "내 성향이 이 고민에 어떻게 작용해?"],
  compat: ["싸웠을 때 누가 먼저 풀면 좋아?", "상대가 서운할 때 어떻게 알아챌 수 있어?", "올해 둘이 같이 해 보면 좋은 건?"],
};

interface Bubble extends ChatMsg {
  error?: boolean;
}

function readLog(): Bubble[] {
  try {
    const v = JSON.parse(sessionStorage.getItem(CHAT_LOG_KEY) ?? "[]") as Bubble[];
    return Array.isArray(v) ? v.filter((m) => (m.role === "user" || m.role === "dori") && typeof m.text === "string") : [];
  } catch {
    return [];
  }
}

export default function ChatApp() {
  const [ctx, setCtx] = useState<ChatCtx>({ kind: "daily", summary: "" });
  const [msgs, setMsgs] = useState<Bubble[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const inflight = useRef(false);

  useEffect(() => {
    const c = readChatCtx();
    if (c) setCtx(c);
    setMsgs(readLog());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      sessionStorage.setItem(CHAT_LOG_KEY, JSON.stringify(msgs.slice(-40)));
    } catch {
      /* 저장 실패는 무시 */
    }
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, busy, ready]);

  const asked = msgs.filter((m) => m.role === "user").length;
  const left = Math.max(0, TURN_CAP - asked);

  async function send(raw: string) {
    const text = raw.trim().slice(0, MSG_MAX);
    if (!text || inflight.current || left === 0) return;
    inflight.current = true;
    setInput("");
    const next: Bubble[] = [...msgs.filter((m) => !m.error), { role: "user", text }];
    setMsgs(next);
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ctx, messages: next.map(({ role, text: t }) => ({ role, text: t })) }),
      });
      const data = (await res.json().catch(() => null)) as { answer?: string; error?: string } | null;
      if (!res.ok || !data?.answer) throw new Error(data?.error ?? "도리가 잠깐 물놀이하러 갔어요. 다시 보내 볼래요?");
      setMsgs([...next, { role: "dori", text: data.answer }]);
    } catch (e) {
      setMsgs([...next, { role: "dori", text: e instanceof Error ? e.message : "답을 받지 못했어요.", error: true }]);
    } finally {
      inflight.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex h-[100dvh] max-w-[34rem] flex-col bg-[#FBF7FF]">
      <header className="flex items-center gap-3 border-b border-brand-100 bg-white/95 px-3 py-2.5">
        <Link href="/" aria-label="처음으로" className="rounded-full p-2 text-gray-600 hover:bg-gray-100">←</Link>
        <SafeImage src="/images/dori-icon.webp" alt="" className="h-10 w-10 rounded-full object-contain" fallback="🦦" fallbackClass="text-2xl" />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-gray-900">도리 상담실</p>
          <p className="text-[11px] text-gray-500">질문 {left}번 남았어요</p>
        </div>
      </header>

      <main className="flex-1 space-y-3 overflow-y-auto px-3 py-4" aria-live="polite">
        <Row who="dori" text={GREETING[ctx.kind]} />
        {msgs.length === 0 && (
          <div className="flex flex-wrap gap-2 pl-11">
            {CHIPS[ctx.kind].map((c) => (
              <button key={c} type="button" onClick={() => void send(c)} className="rounded-full border border-brand-200 bg-white px-3 py-1.5 text-left text-xs text-brand-700 shadow-sm active:scale-95">
                {c}
              </button>
            ))}
          </div>
        )}
        {msgs.map((m, i) => (
          <Row key={i} who={m.role} text={m.text} error={m.error} />
        ))}
        {busy && <p className="pl-11 text-xs text-brand-500">도리가 조개를 까며 풀이를 들여다보는 중… 🫧</p>}
        <div ref={bottom} />
      </main>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="flex items-end gap-2 border-t border-brand-100 bg-white/95 px-3 py-2.5"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, MSG_MAX))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              void send(input);
            }
          }}
          rows={1}
          disabled={left === 0}
          placeholder={left === 0 ? "이번 대화는 여기까지예요" : "도리에게 고민을 적어봐요…"}
          aria-label="도리에게 보낼 질문"
          className="max-h-28 min-h-[2.5rem] flex-1 resize-none rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400"
        />
        <button type="submit" disabled={busy || !input.trim() || left === 0} className="h-10 shrink-0 rounded-full bg-brand-500 px-4 text-sm font-bold text-white disabled:opacity-40">
          보내기
        </button>
      </form>
    </div>
  );
}

function Row({ who, text, error }: { who: "user" | "dori"; text: string; error?: boolean }) {
  if (who === "user") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-brand-100 px-3.5 py-2.5 text-sm leading-relaxed text-gray-900">{text}</p>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2">
      <SafeImage src="/images/dori-icon.webp" alt="" className="h-9 w-9 shrink-0 rounded-full object-contain" fallback="🦦" fallbackClass="text-2xl" />
      <div className="max-w-[82%]">
        <p className="mb-1 text-[11px] font-bold text-gray-500">수달 도사 도리</p>
        <p className={`whitespace-pre-wrap rounded-2xl rounded-tl-sm bg-white px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${error ? "text-amber-800" : "text-gray-900"}`}>{text}</p>
      </div>
    </div>
  );
}
