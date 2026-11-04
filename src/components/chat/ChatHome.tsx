"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ChatApp from "@/components/chat/ChatApp";
import SafeImage from "@/components/landing/SafeImage";
import { CHAT_CTX_KEY, CHAT_LOG_KEY, readChatCtx } from "@/lib/chatContext";
import { loadRooms, removeRoom, saveRooms, upsertRoom, withMsgs, type ChatRoom, type RoomMsg } from "@/lib/chatRooms";
import { getBrowserStorage } from "@/lib/drawCounter";

/** 도리 상담실 첫 화면: 대화방 목록. 결과서에서 넘어오면 그 풀이의 방으로 바로 들어가요. */
function whenLabel(at: number, now = new Date()): string {
  const d = new Date(at);
  const day = (x: Date) => Math.floor(new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime() / 86_400_000);
  const diff = day(now) - day(d);
  if (diff <= 0) return d.toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit" });
  if (diff === 1) return "어제";
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function lastText(r: ChatRoom): string {
  const m = [...r.msgs].reverse().find((x) => !x.error);
  return m ? m.text.replace(/\*\*/g, "").replace(/\s+/g, " ") : "아직 나눈 말이 없어요";
}

export default function ChatHome() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [left, setLeft] = useState<number | null>(null);
  const [delId, setDelId] = useState<string | null>(null);
  const ref = useRef<ChatRoom[]>([]);

  const commit = (next: ChatRoom[]) => {
    ref.current = next;
    setRooms(next);
    saveRooms(getBrowserStorage(), next);
  };

  useEffect(() => {
    let list = loadRooms(getBrowserStorage());
    const c = readChatCtx();
    if (c) {
      // 결과서·오늘 카드에서 넘어왔어요: 그 풀이의 방을 만들거나 이어서 열어요
      const r = upsertRoom(list, c);
      list = r.rooms;
      saveRooms(getBrowserStorage(), list);
      try {
        sessionStorage.removeItem(CHAT_CTX_KEY);
        sessionStorage.removeItem(CHAT_LOG_KEY);
      } catch {
        /* 무시 */
      }
      setOpen(r.id);
    }
    ref.current = list;
    setRooms(list);
    setReady(true);
  }, []);

  // 목록에서는 오늘 남은 무료 질문 수를 보여 줘요
  useEffect(() => {
    if (!ready || open) return;
    let alive = true;
    fetch("/api/chat/quota", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ctx: { kind: "daily", summary: "" } }) })
      .then((r) => (r.ok ? (r.json() as Promise<{ left?: number }>) : null))
      .then((d) => alive && typeof d?.left === "number" && setLeft(d.left))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [ready, open]);

  useEffect(() => {
    if (!delId) return;
    const t = setTimeout(() => setDelId(null), 3000);
    return () => clearTimeout(t);
  }, [delId]);

  const room = open ? rooms.find((r) => r.id === open) : undefined;
  if (room) {
    return (
      <ChatApp
        key={room.id}
        initialCtx={room.ctx}
        initialMsgs={room.msgs}
        onChange={(msgs: RoomMsg[]) => commit(withMsgs(ref.current, room.id, msgs))}
        onBack={() => setOpen(null)}
      />
    );
  }

  const startDaily = () => {
    const r = upsertRoom(ref.current, { kind: "daily", summary: "" });
    commit(r.rooms);
    setOpen(r.id);
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-[34rem] flex-col bg-gradient-to-b from-[#fbf7ff] to-[#f1ecfb]">
      <header className="flex items-center gap-2.5 border-b border-brand-100 bg-white/80 px-3 py-2.5 backdrop-blur">
        <Link href="/" aria-label="처음으로" className="grid h-9 w-9 place-items-center rounded-full text-xl text-gray-600 hover:bg-gray-100">
          ‹
        </Link>
        <SafeImage src="/images/dori-icon.webp" alt="" className="h-9 w-9 rounded-full border-2 border-brand-200 bg-white object-contain" fallback="🦦" fallbackClass="text-2xl" />
        <div className="min-w-0 flex-1">
          <p className="font-bold leading-tight text-gray-900">도리 상담실</p>
          <p className="text-[11px] text-[#8a7fa8]">대화는 이 기기에만 저장돼요</p>
        </div>
      </header>

      {left !== null && (
        <div className="mx-3 mt-3 flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-3.5 py-3">
          <div>
            <p className="text-[13px] font-bold text-gray-900">오늘의 무료 질문</p>
            <p className="text-[11.5px] text-amber-800">자정에 다시 채워져요</p>
          </div>
          <p className="text-[15px] font-extrabold text-brand-600">{left}번 남음</p>
        </div>
      )}

      {ready && rooms.length === 0 ? (
        <div className="m-auto flex flex-col items-center gap-3 px-6 py-16 text-center text-sm text-[#8a7fa8]">
          <SafeImage src="/images/dori-icon.webp" alt="" className="h-[72px] w-[72px] rounded-full border-2 border-brand-200 bg-white object-contain" fallback="🦦" fallbackClass="text-4xl" />
          <b className="text-gray-900">아직 나눈 대화가 없어요</b>
          <span className="leading-relaxed">
            풀이를 본 뒤 &ldquo;도리 상담실에서 이어 묻기&rdquo;를 누르거나,
            <br />
            오늘의 한마디로 가볍게 시작해 보세요.
          </span>
          <button type="button" onClick={startDaily} className="rounded-2xl bg-brand-500 px-5 py-3 text-sm font-extrabold text-white">
            오늘의 한마디로 시작하기
          </button>
        </div>
      ) : (
        <div className="mt-2 flex-1">
          <ul>
            {rooms.map((r) => (
              <li key={r.id} className="flex items-center gap-1 pr-3">
                <button type="button" onClick={() => setOpen(r.id)} className="flex min-w-0 flex-1 items-center gap-3 px-3.5 py-3 text-left hover:bg-brand-50">
                  <span className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-full border-[1.5px] border-brand-100 bg-brand-50 text-[22px]" aria-hidden="true">
                    {r.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-sm font-extrabold text-gray-900">
                      <span className="truncate">{r.title}</span>
                      <span className="shrink-0 rounded-full bg-brand-50 px-2 py-px text-[10.5px] font-bold text-brand-600">{r.chip}</span>
                    </span>
                    <span className="block truncate text-[12.5px] text-[#8a7fa8]">{lastText(r)}</span>
                  </span>
                  <span className="shrink-0 self-start pt-1 text-[11px] text-[#a99bd0]">{r.msgs.length > 0 ? whenLabel(r.updatedAt) : ""}</span>
                </button>
                <button
                  type="button"
                  aria-label={`${r.title} 대화 삭제`}
                  onClick={() => {
                    if (delId === r.id) {
                      commit(removeRoom(ref.current, r.id));
                      setDelId(null);
                    } else setDelId(r.id);
                  }}
                  className={`shrink-0 rounded-full px-2 py-1 text-[11px] ${delId === r.id ? "bg-red-50 font-bold text-red-600" : "text-[#b3a8cc]"}`}
                >
                  {delId === r.id ? "정말 삭제?" : "삭제"}
                </button>
              </li>
            ))}
          </ul>
          <button type="button" onClick={startDaily} className="mx-3.5 mb-6 mt-3 w-[calc(100%-1.75rem)] rounded-2xl border-[1.5px] border-dashed border-brand-300 py-3 text-sm font-extrabold text-brand-600">
            ＋ 오늘의 한마디로 상담하기
          </button>
        </div>
      )}
    </div>
  );
}
