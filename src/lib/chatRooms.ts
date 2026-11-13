import type { OutfitPick } from "@/lib/outfits";
import type { ChatCtx, ChatMsg } from "@/lib/chatContext";
import type { ChatVisual } from "@/lib/ai/chat";

/*
 * 도유 상담실 대화방 목록. 풀이(오늘의 한마디·결과서·궁합)마다 방이 하나씩 생겨요.
 * 대화는 이 기기(브라우저)에 저장하고, 로그인한 회원은 서버에도 한 부 두어요(마지막 대화 후 30일 보관, chatRoomsSync.ts).
 * 로그아웃하면 이 기기의 대화는 지우고, 다시 로그인하면 서버에서 불러와요. 탈퇴하면 서버 것도 함께 지워요.
 */
export const CHAT_ROOMS_KEY = "wanna500:chat:rooms:v1";
export const MAX_ROOMS = 10;
/** 오늘의 한마디 방은 날짜별로 하나씩 쌓이고, 오늘 포함 이 일수만 남겨요 */
export const DAILY_KEEP_DAYS = 7;
/** 서버에는 마지막 대화 후 이 기간만 보관해요 */
export const RETENTION_DAYS = 30;
/** 서버와 마지막으로 맞춘 시각(ms). 이 기기에만 둬요. */
export const CHAT_SYNCED_KEY = "wanna500:chat:synced:v1";
export const MAX_ROOM_MSGS = 40;

export interface RoomMsg extends ChatMsg {
  at: number;
  error?: boolean;
  liked?: boolean;
  /** 조약돌 충전처럼 대화 중간에 남기는 안내 한 줄 (질문 수·AI 대화·복사에는 넣지 않아요) */
  log?: boolean;
  follow?: string[];
  /** 도리 답 아래에 크게 보여 주는 그림 카드 */
  visual?: ChatVisual | null;
  /** 옷 질문에 붙는 착장 카드 */
  outfit?: OutfitPick | null;
}

export interface ChatRoom {
  id: string;
  ctx: ChatCtx;
  title: string;
  chip: string;
  icon: string;
  msgs: RoomMsg[];
  updatedAt: number;
  /** 방을 처음 만든 날(YYYY-MM-DD). 오늘의 한마디 방은 날짜마다 따로 만들어져요 */
  day: string;
  /** 방을 처음 열 때 하나씩 보여 주는 사주 소개 말풍선을 이미 다 보았는지. 보았다면 다시 들어와도 애니메이션 없이 그대로 보여 줘요. */
  introSeen?: boolean;
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

/** 날짜가 지난 "오늘의 한마디" 방인지. 이런 방은 지난 대화를 볼 수만 있고, 이어 묻기는 오늘 방에서 해요. */
export function isStaleDaily(room: Pick<ChatRoom, "ctx" | "day">, now: Date = new Date()): boolean {
  return room.ctx.kind === "daily" && room.day !== dayOf(now);
}

/** 같은 풀이는 같은 방이 되게 하는 값. 오늘의 한마디는 날짜마다 다른 방이에요. */
export function roomIdFor(ctx: ChatCtx, now: Date = new Date()): string {
  if (ctx.kind === "daily") return `daily:${dayOf(now)}`;
  return `${ctx.kind}:${hash(JSON.stringify([ctx.birth ?? null, ctx.partnerBirth ?? null, ctx.topic ?? null, topicLine(ctx.summary), ...(ctx.premium ? ["premium"] : [])]))}`;
}

const mmdd = (day: string) => {
  const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(day);
  return m ? `${Number(m[1])}/${Number(m[2])}` : "";
};

/** 오늘의 한마디 방 칩: 오늘 · 어제 · 11/12 */
export function dayChip(day: string, now: Date = new Date()): string {
  if (day === dayOf(now)) return "오늘";
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  if (day === dayOf(y)) return "어제";
  return mmdd(day) || "지난 날";
}

export function roomLook(ctx: ChatCtx, day = ""): { title: string; chip: string; icon: string } {
  if (ctx.kind === "daily") return { title: mmdd(day) ? `오늘의 한마디 · ${mmdd(day)}` : "오늘의 한마디", chip: "오늘", icon: "🌙" };
  if (ctx.kind === "compat") return { title: `${ctx.partnerName?.trim() || "상대"}님과의 궁합`, chip: "궁합", icon: "💞" };
  if (isStudyRoom(ctx)) return { title: "2027 신년운", chip: "신년운", icon: "📜" };
  // 풀이 결과에 "성공·재물운"으로 저장된 이름도 카드 이름대로 "성공운"으로 보여요 (예전에 만든 방도 같이)
  const t = topicLine(ctx.summary).replace(/^성공\s*[·⋅・]\s*재물운$/, "성공운");
  return { title: t || "사주 풀이", chip: t || "풀이", icon: "📜" };
}

/** 방 목록 맨 왼쪽에 보여 줄 도유사주 동물 얼굴 (주제로 정해요) */
export function roomAnimal(ctx: ChatCtx): string {
  const img = (n: string) => `/images/animal-${n}.webp`;
  if (ctx.kind === "daily") return img("otter");
  if (ctx.kind === "compat") return img("panda-wedding");
  if (ctx.premium) return img("otter-awakened");
  if (isStudyRoom(ctx)) return img("otter-newyear");
  const t = topicLine(ctx.summary);
  if (/연애|결혼/.test(t)) return img("panda-couple");
  if (/재물/.test(t)) return img("rabbit-rich");
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
    const day = typeof r.day === "string" ? r.day : "";
    // 예전에 하나뿐이던 오늘의 한마디 방은 만든 날짜의 방으로 옮겨요
    const legacyDay = day || (typeof r.updatedAt === "number" ? dayOf(new Date(r.updatedAt)) : "");
    const id = c.kind === "daily" && r.id === "daily" ? `daily:${legacyDay}` : r.id;
    out.push({
      id,
      ctx: c,
      ...roomLook(c, c.kind === "daily" ? legacyDay : ""),
      msgs: Array.isArray(r.msgs) ? r.msgs.filter(validMsg).slice(-MAX_ROOM_MSGS) : [],
      updatedAt: typeof r.updatedAt === "number" ? r.updatedAt : 0,
      day: c.kind === "daily" ? legacyDay : day,
      ...(r.introSeen === true ? { introSeen: true } : {}),
    });
  }
  return limitRooms(out);
}

/** 방 수를 줄여요: 일주일이 지난 오늘의 한마디 방을 빼고, 그래도 많으면 오래된 한마디 방부터 빼요(풀이·궁합 방이 밀려나지 않게). */
export function limitRooms(rooms: ChatRoom[], now: Date = new Date()): ChatRoom[] {
  const cut = new Date(now);
  cut.setDate(cut.getDate() - (DAILY_KEEP_DAYS - 1));
  const oldest = dayOf(cut);
  const out = sortRooms(rooms.filter((r) => !(r.ctx.kind === "daily" && r.day && r.day < oldest)));
  while (out.length > MAX_ROOMS) {
    let i = out.length - 1;
    while (i > 0 && out[i].ctx.kind !== "daily") i--;
    out.splice(out[i].ctx.kind === "daily" ? i : out.length - 1, 1);
  }
  return out;
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
    st?.setItem(CHAT_ROOMS_KEY, JSON.stringify(limitRooms(rooms)));
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

/** 맥락으로 방을 열어요. 같은 풀이(오늘의 한마디는 같은 날)면 기존 방(대화 이어서), 아니면 새 방. */
export function upsertRoom(rooms: ChatRoom[], ctx: ChatCtx, now: Date = new Date()): { rooms: ChatRoom[]; id: string } {
  const id = roomIdFor(ctx, now);
  const day = dayOf(now);
  const old = rooms.find((r) => r.id === id);
  let room: ChatRoom;
  if (!old) {
    room = { id, ctx, ...roomLook(ctx, day), msgs: [], updatedAt: now.getTime(), day };
  } else {
    const merged: ChatCtx = { ...old.ctx, ...ctx, summary: ctx.summary || old.ctx.summary };
    room = { ...old, ctx: merged, ...roomLook(merged, old.day || day), day: old.day || day };
  }
  return { rooms: limitRooms([room, ...rooms.filter((r) => r.id !== id)], now), id };
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
