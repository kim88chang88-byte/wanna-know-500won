import type { ChatCtx, ChatMsg } from "@/lib/chatContext";
import type { ChatVisual } from "@/lib/ai/chat";

/*
 * 도리 상담실 대화방 목록. 풀이(오늘의 한마디·결과서·궁합)마다 방이 하나씩 생겨요.
 * 대화는 이 기기(브라우저)에 저장하고, 로그인한 회원은 서버에도 한 부 두어요(마지막 대화 후 30일 보관, chatRoomsSync.ts).
 * 로그아웃하면 이 기기의 대화는 지우고, 다시 로그인하면 서버에서 불러와요. 탈퇴하면 서버 것도 함께 지워요.
 */
export const CHAT_ROOMS_KEY = "wanna500:chat:rooms:v1";
export const MAX_ROOMS = 10;
/** 서버에는 마지막 대화 후 이 기간만 보관해요 */
export const RETENTION_DAYS = 30;
/** 서버와 마지막으로 맞춘 시각(ms). 이 기기에만 둬요. */
export const CHAT_SYNCED_KEY = "wanna500:chat:synced:v1";
export const MAX_ROOM_MSGS = 40;

export interface RoomMsg extends ChatMsg {
  at: number;
  error?: boolean;
  liked?: boolean;
  follow?: string[];
  /** 도리 답 아래에 크게 보여 주는 그림 카드 */
  visual?: ChatVisual | null;
}

export interface ChatRoom {
  id: string;
  ctx: ChatCtx;
  title: string;
  chip: string;
  icon: string;
  msgs: RoomMsg[];
  updatedAt: number;
  /** 오늘의 한마디 방은 날짜(YYYY-MM-DD)가 바뀌면 새로 시작해요 */
  day: string;
}

interface StoreLike {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem?(k: string): void;
}

const dayOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

const topicLine = (summary: string) => /^주제: (.+)$/m.exec(summary)?.[1]?.trim() ?? "";

/** 2027 신년운 방인지 (예전에 만든 방은 topic 표시가 없어서 요약의 "주제: 2027 신년운" 줄도 봐요) */
const isStudyRoom = (ctx: ChatCtx) => ctx.topic === "study" || (ctx.kind === "reading" && /신년운/.test(topicLine(ctx.summary)));

/** 같은 풀이는 같은 방이 되게 하는 값 */
export function roomIdFor(ctx: ChatCtx): string {
  if (ctx.kind === "daily") return "daily";
  return `${ctx.kind}:${hash(JSON.stringify([ctx.birth ?? null, ctx.partnerBirth ?? null, ctx.topic ?? null, topicLine(ctx.summary), ...(ctx.premium ? ["premium"] : [])]))}`;
}

export function roomLook(ctx: ChatCtx): { title: string; chip: string; icon: string } {
  if (ctx.kind === "daily") return { title: "오늘의 한마디", chip: "오늘", icon: "🌙" };
  if (ctx.kind === "compat") return { title: `${ctx.partnerName?.trim() || "상대"}님과의 궁합`, chip: "궁합", icon: "💞" };
  if (isStudyRoom(ctx)) return { title: "2027 신년운", chip: "신년운", icon: "📜" };
  const t = topicLine(ctx.summary);
  return { title: t || "사주 풀이", chip: t || "풀이", icon: "📜" };
}

/** 방 목록 맨 왼쪽에 보여 줄 도유사주 동물 얼굴 (주제로 정해요) */
export function roomAnimal(ctx: ChatCtx): string {
  const img = (n: string) => `/images/animal-${n}.webp`;
  if (ctx.kind === "daily") return img("otter");
  if (ctx.kind === "compat") return img("panda-couple");
  if (ctx.premium) return img("otter-awakened");
  if (isStudyRoom(ctx)) return img("otter-study");
  const t = topicLine(ctx.summary);
  if (/연애|결혼/.test(t)) return img("rabbit");
  if (/재물|성공/.test(t)) return img("rabbit-rich");
  if (/건강/.test(t)) return img("fox-run");
  return img("dragon");
}

/** 방 목록 카드의 주제 색 (색 띠·동물 링·이름 앞 점) */
export function roomColor(ctx: ChatCtx): string {
  if (ctx.kind === "daily") return "#6d4fd8";
  if (ctx.kind === "compat") return "#e5708a";
  if (isStudyRoom(ctx)) return "#4a90d9";
  const t = topicLine(ctx.summary);
  if (/연애|결혼/.test(t)) return "#f08fb0";
  if (/재물|성공/.test(t)) return "#e0a43a";
  if (/건강/.test(t)) return "#3fa66b";
  return "#a0714f";
}

/** 방 목록의 남은 질문 알약 글자: 오늘의 한마디는 "오늘 N번", 그 밖은 "이번 달 N번" */
export function leftLabel(ctx: ChatCtx, left: number): string {
  return `${ctx.kind === "daily" ? "오늘" : "이번 달"} ${left}번`;
}

function validMsg(m: unknown): m is RoomMsg {
  const v = m as Partial<RoomMsg> | null;
  return !!v && (v.role === "user" || v.role === "dori") && typeof v.text === "string" && typeof v.at === "number";
}

/** 저장된 값(로컬 또는 서버)을 방 목록으로 바꿔요. 모양이 맞지 않는 방은 빼요. */
export function parseRooms(raw: unknown): ChatRoom[] {
  if (!Array.isArray(raw)) return [];
  const out: ChatRoom[] = [];
  for (const r of raw as Partial<ChatRoom>[]) {
    const c = r?.ctx as ChatCtx | undefined;
    if (!r || typeof r.id !== "string" || r.id.length > 80 || !c || (c.kind !== "daily" && c.kind !== "reading" && c.kind !== "compat") || typeof c.summary !== "string") continue;
    out.push({
      id: r.id,
      ctx: c,
      ...roomLook(c),
      msgs: Array.isArray(r.msgs) ? r.msgs.filter(validMsg).slice(-MAX_ROOM_MSGS) : [],
      updatedAt: typeof r.updatedAt === "number" ? r.updatedAt : 0,
      day: typeof r.day === "string" ? r.day : "",
    });
  }
  return sortRooms(out).slice(0, MAX_ROOMS);
}

/** 마지막 대화 후 30일이 지난 방을 빼요 */
export function dropExpired(rooms: ChatRoom[], now: Date = new Date()): ChatRoom[] {
  const limit = now.getTime() - RETENTION_DAYS * 86_400_000;
  return rooms.filter((r) => r.updatedAt >= limit);
}

export function loadRooms(st: StoreLike | null): ChatRoom[] {
  try {
    return parseRooms(JSON.parse(st?.getItem(CHAT_ROOMS_KEY) ?? "[]") as unknown);
  } catch {
    return [];
  }
}

export function saveRooms(st: StoreLike | null, rooms: ChatRoom[]): void {
  try {
    st?.setItem(CHAT_ROOMS_KEY, JSON.stringify(sortRooms(rooms).slice(0, MAX_ROOMS)));
  } catch {
    /* 저장이 막혀 있으면 이번 방문에서만 써요 */
  }
}

export function clearRooms(st: StoreLike | null): void {
  try {
    st?.removeItem?.(CHAT_ROOMS_KEY);
    st?.removeItem?.(CHAT_SYNCED_KEY);
  } catch {
    /* 무시 */
  }
}

export const sortRooms = (rooms: ChatRoom[]): ChatRoom[] => [...rooms].sort((a, b) => b.updatedAt - a.updatedAt);

/** 맥락으로 방을 열어요. 같은 풀이면 기존 방(대화 이어서), 아니면 새 방. */
export function upsertRoom(rooms: ChatRoom[], ctx: ChatCtx, now: Date = new Date()): { rooms: ChatRoom[]; id: string } {
  const id = roomIdFor(ctx);
  const day = dayOf(now);
  const old = rooms.find((r) => r.id === id);
  let room: ChatRoom;
  if (!old || (ctx.kind === "daily" && old.day !== day)) {
    room = { id, ctx, ...roomLook(ctx), msgs: [], updatedAt: now.getTime(), day };
  } else {
    const merged: ChatCtx = { ...old.ctx, ...ctx, summary: ctx.summary || old.ctx.summary };
    room = { ...old, ctx: merged, ...roomLook(merged), day: ctx.kind === "daily" ? day : old.day };
  }
  return { rooms: sortRooms([room, ...rooms.filter((r) => r.id !== id)]).slice(0, MAX_ROOMS), id };
}

/** 대화가 바뀌었을 때만 갱신 시각을 올려요 */
export function withMsgs(rooms: ChatRoom[], id: string, msgs: RoomMsg[], now: Date = new Date()): ChatRoom[] {
  return rooms.map((r) => {
    if (r.id !== id) return r;
    const next = msgs.slice(-MAX_ROOM_MSGS);
    const changed = next.length !== r.msgs.length || next[next.length - 1]?.at !== r.msgs[r.msgs.length - 1]?.at;
    return { ...r, msgs: next, updatedAt: changed ? now.getTime() : r.updatedAt };
  });
}

export function removeRoom(rooms: ChatRoom[], id: string): ChatRoom[] {
  return rooms.filter((r) => r.id !== id);
}
