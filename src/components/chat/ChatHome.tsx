"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ChatApp from "@/components/chat/ChatApp";
import BottomTabs from "@/components/landing/BottomTabs";
import { markNavSeen, pingNav } from "@/lib/navDots";
import SafeImage from "@/components/landing/SafeImage";
import { CHAT_CTX_KEY, CHAT_LOG_KEY, readChatCtx } from "@/lib/chatContext";
import type { BirthInput } from "@/lib/saju/types";
import { pullRooms, pushRooms, mergeRooms, readSynced, sameRooms, writeSynced } from "@/lib/chatRoomsSync";
import { isStaleDaily, leftLabel, loadRooms, removeRoom, roomAnimal, roomColor, saveRooms, upsertRoom, withMsgs, type ChatRoom, type RoomMsg } from "@/lib/chatRooms";
import { getBrowserStorage } from "@/lib/drawCounter";

/** 도유 상담실 첫 화면: 대화방 목록. 결과서에서 넘어오면 그 풀이의 방으로 바로 들어가요. */
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
  return m ? m.text.replace(/\*\*/g, "").replace(/\s+/g, " ") : "아직 나눈 말이 없어";
}

export default function ChatHome() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  /** 서버에서 대화방을 받아 왔으면 true (서버 보관이 켜져 있다는 뜻) */
  const [cloud, setCloud] = useState(false);
  const [, setLeft] = useState<number | null>(null);
  const [roomLeft, setRoomLeft] = useState<Record<string, number>>({});
  const [delId, setDelId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const ref = useRef<ChatRoom[]>([]);

  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);
  /** 서버에서 대화방을 한 번 받아 온 뒤에만 서버로 보내요. (못 받았는데 보내면 서버의 기존 방이 지워질 수 있어서) */
  const pulled = useRef(false);

  /** 로그인한 회원이면 바뀐 대화방을 서버에도 한 부 두어요 (잠깐 모아서 한 번에) */
  const flush = (keepalive = false) => {
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = null;
    if (!dirty.current) return;
    dirty.current = false;
    void pushRooms(ref.current, keepalive).then((ok) => {
      if (ok) writeSynced(getBrowserStorage(), Date.now());
      else dirty.current = true;
    });
  };
  const schedulePush = () => {
    if (!pulled.current) return;
    dirty.current = true;
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => flush(), 1200);
  };

  const commit = (next: ChatRoom[]) => {
    ref.current = next;
    setRooms(next);
    saveRooms(getBrowserStorage(), next);
    schedulePush();
  };

  // 화면을 떠나거나 숨길 때 아직 못 보낸 대화를 서둘러 보내요
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") flush(true);
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      flush(true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let alive = true;
    void (async () => {
      let list = loadRooms(getBrowserStorage());
      // 로그인한 회원이면 서버의 대화방과 합쳐요 (다른 기기·다시 로그인한 뒤에도 이어져요). 느리면 이 기기 것만 먼저 써요.
      const server = await pullRooms();
      if (!alive) return;
      let needPush = false;
      if (server) {
        pulled.current = true;
        setCloud(true);
        const merged = mergeRooms(list, server, readSynced(getBrowserStorage()));
        needPush = !sameRooms(merged, server);
        list = merged;
        saveRooms(getBrowserStorage(), list);
        if (!needPush) writeSynced(getBrowserStorage(), Date.now());
      }
      const c = readChatCtx();
      if (c) {
        // 결과서·오늘 카드에서 넘어왔어요: 그 풀이의 방을 만들거나 이어서 열어요
        const r = upsertRoom(list, c);
        list = r.rooms;
        saveRooms(getBrowserStorage(), list);
        needPush = needPush || server !== null;
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
      if (needPush) schedulePush();
      // 상담실을 열었으니 하단 메뉴의 빨간 점을 꺼요
      markNavSeen(getBrowserStorage(), "chat", new Date());
      pingNav();
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 목록에서는 오늘 남은 무료 질문 수를 보여 줘요
  useEffect(() => {
    if (!ready || open) return;
    let alive = true;
    fetch("/api/chat/quota", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ctx: { kind: "daily", summary: "" }, ctxs: ref.current.slice(0, 10).map((r) => r.ctx) }) })
      .then((r) => (r.ok ? (r.json() as Promise<{ left?: number; lefts?: Array<number | null> }>) : null))
      .then((d) => {
        if (!alive || !d) return;
        if (typeof d.left === "number") setLeft(d.left);
        if (Array.isArray(d.lefts)) {
          const m: Record<string, number> = {};
          ref.current.slice(0, 10).forEach((r, i) => {
            const v = d.lefts?.[i];
            if (typeof v === "number") m[r.id] = v;
          });
          setRoomLeft(m);
        }
      })
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

  const startDaily = async () => {
    if (starting) return;
    setStarting(true);
    // 저장된 내 정보를 받아 와서, 첫 화면에서 사주 기둥을 보여 줄 수 있게 해요. (못 받아도 그냥 시작해요)
    let birth: BirthInput | null = null;
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const d = res.ok ? ((await res.json()) as { profile?: BirthInput | null }) : null;
      birth = d?.profile ?? null;
    } catch {
      birth = null;
    }
    const r = upsertRoom(ref.current, { kind: "daily", summary: "", ...(birth ? { birth } : {}) });
    commit(r.rooms);
    setOpen(r.id);
    setStarting(false);
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-[34rem] flex-col bg-gradient-to-b from-[#fbf7ff] to-[#f1ecfb] pb-28 lg:pb-0">
      <header className="flex items-center gap-2.5 border-b border-brand-100 bg-white/80 px-3 py-2.5 backdrop-blur">
        <Link href="/" aria-label="처음으로" className="grid h-9 w-9 place-items-center rounded-full text-xl text-gray-600 hover:bg-gray-100">
          ‹
        </Link>
        <SafeImage src="/images/dori-icon.webp" alt="" className="h-9 w-9 rounded-full border-2 border-brand-200 bg-white object-contain" fallback="🦦" fallbackClass="text-2xl" />
        <div className="min-w-0 flex-1">
          <p className="font-bold leading-tight text-gray-900">도유 상담실</p>
          <p className="text-[11px] text-[#8a7fa8]">{cloud ? "대화는 30일 동안 보관돼" : "대화는 이 기기에만 저장돼"}</p>
        </div>
      </header>

      <p data-testid="chat-free-hint" className="mx-4 mt-3 text-[12px] leading-relaxed text-[#8a7fa8]">
        💬 질문은 <b className="text-brand-600">방마다 따로</b> 세. 풀이 방은 이번 달 5번, 궁합 방은 10번, 오늘의 한마디는 하루 3번이 무료야.
      </p>

      {ready && rooms.length === 0 ? (
        <div className="m-auto flex flex-col items-center gap-3 px-6 py-16 text-center text-sm text-[#8a7fa8]">
          <SafeImage src="/images/dori-icon.webp" alt="" className="h-[72px] w-[72px] rounded-full border-2 border-brand-200 bg-white object-contain" fallback="🦦" fallbackClass="text-4xl" />
          <b className="text-gray-900">아직 나눈 대화가 없어</b>
          <span className="leading-relaxed">
            풀이를 본 뒤 &ldquo;도유 상담실에서 이어 묻기&rdquo;를 누르거나,
            <br />
            오늘의 한마디로 가볍게 시작해 봐.
          </span>
          <button type="button" onClick={() => void startDaily()} className="rounded-2xl bg-brand-500 px-5 py-3 text-sm font-extrabold text-white">
            오늘의 한마디로 시작하기
          </button>
        </div>
      ) : (
        <div className="mt-3 flex-1">
          <ul className="flex flex-col gap-[7px] px-3">
            {rooms.map((r) => (
              <li key={r.id} data-testid="room-card" className="relative flex flex-wrap items-center gap-1 overflow-hidden rounded-2xl border border-brand-100 bg-white pr-2.5">
                <i aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5" style={{ background: roomColor(r.ctx) }} />
                <button type="button" onClick={() => (isStaleDaily(r) ? void startDaily() : setOpen(r.id))} className="flex min-w-0 flex-1 items-center gap-3 py-2.5 pl-5 pr-1 text-left">
                  <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-brand-50" style={{ boxShadow: `0 0 0 2px #fff, 0 0 0 4px ${roomColor(r.ctx)}` }} aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={roomAnimal(r.ctx)} alt="" className="h-full w-full origin-[50%_30%] scale-[1.35] object-cover object-[50%_22%]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-sm font-extrabold text-gray-900">
                      <i aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ background: roomColor(r.ctx) }} />
                      <span className="truncate">{r.title}</span>
                      <span className="shrink-0 rounded-full bg-brand-50 px-2 py-px text-[10.5px] font-bold text-brand-600">{r.chip}</span>
                    </span>
                    <span className="block truncate text-[12.5px] text-[#8a7fa8]">{lastText(r)}</span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1 self-start pt-0.5">
                    <span className="min-h-[16px] text-[11px] text-[#a99bd0]">{r.msgs.length > 0 ? whenLabel(r.updatedAt) : ""}</span>
                    {roomLeft[r.id] !== undefined && (
                      <span
                        data-testid="room-left"
                        className={`whitespace-nowrap rounded-full px-2.5 py-px text-[11px] font-extrabold ${roomLeft[r.id] === 0 ? "bg-gray-100 text-[#8a7fa8]" : roomLeft[r.id] <= 2 ? "bg-amber-50 text-amber-800" : "bg-brand-50 text-brand-600"}`}
                      >
                        {leftLabel(r.ctx, roomLeft[r.id])}
                      </span>
                    )}
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={`${r.title} 대화방 나가기`}
                  onClick={() => {
                    if (delId === r.id) {
                      commit(removeRoom(ref.current, r.id));
                      setDelId(null);
                    } else setDelId(r.id);
                  }}
                  className={`flex min-w-[34px] shrink-0 flex-col items-center gap-px rounded-xl px-1.5 py-1 text-[10.5px] ${delId === r.id ? "bg-red-50 font-bold text-red-600" : "text-[#9a8fb8]"}`}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <path d="M16 17l5-5-5-5" />
                    <path d="M21 12H9" />
                  </svg>
                  {delId === r.id ? "정말 나갈까?" : "나가기"}
                </button>
                {delId === r.id && (
                  <p data-testid="room-leave-note" role="status" className="basis-full py-2 pl-5 pr-1 text-right text-[11.5px] leading-snug text-red-600">
                    대화 내용만 지워져. 남은 질문과 조약돌은 그대로야.
                  </p>
                )}
              </li>
            ))}
          </ul>
          {/* 오늘의 한마디 방이 목록에 없을 때만 시작 버튼을 보여 줘요. (있으면 위 카드가 그 방이고, 날짜가 바뀌었으면 카드를 누를 때 오늘 것으로 새로 시작해요) */}
          {!rooms.some((r) => r.ctx.kind === "daily") && (
            <button type="button" onClick={() => void startDaily()} className="mx-3.5 mb-6 mt-3 w-[calc(100%-1.75rem)] rounded-2xl border-[1.5px] border-dashed border-brand-300 py-3 text-sm font-extrabold text-brand-600">
              ＋ 오늘의 한마디로 상담하기
            </button>
          )}
        </div>
      )}
      <BottomTabs page="chat" />
    </div>
  );
}
