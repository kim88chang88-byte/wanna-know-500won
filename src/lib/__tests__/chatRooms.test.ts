import { describe, expect, it } from "vitest";
import { dayChip, isStaleDaily, leftLabel, loadRooms, MAX_ROOMS, parseRooms, roomAnimal, roomColor, removeRoom, roomIdFor, roomLook, saveRooms, upsertRoom, withMsgs, type ChatRoom } from "../chatRooms";
import type { ChatCtx } from "../chatContext";

const birth = { year: 1990, month: 1, day: 2, hour: 3, minute: 0, calendar: "solar", isLeapMonth: false, gender: "female" } as never;
const reading = (summary = "주제: 성공운\n한 줄 결론: 좋아요"): ChatCtx => ({ kind: "reading", summary, birth, name: "은혁" });
const mem = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
};

describe("상담실 대화방", () => {
  it("같은 풀이는 같은 방, 다른 주제는 다른 방이에요", () => {
    expect(roomIdFor(reading())).toBe(roomIdFor(reading("주제: 성공운\n다른 요약")));
    expect(roomIdFor(reading())).not.toBe(roomIdFor(reading("주제: 연애운")));
    expect(roomIdFor({ kind: "daily", summary: "" }, new Date("2026-11-14T10:00:00"))).toBe("daily:2026-11-14");
  });

  it("방 이름은 풀이에 맞게 붙어요", () => {
    expect(roomLook(reading()).title).toBe("성공운");
    expect(roomLook({ ...reading(), summary: "주제: 성공·재물운\n결론" })).toMatchObject({ title: "성공운", chip: "성공운" });
    expect(roomLook({ ...reading(), topic: "study" }).title).toBe("2027 신년운");
    expect(roomLook({ kind: "compat", summary: "", partnerName: "지은" }).title).toBe("지은님과의 궁합");
  });

  it("2027 신년운 방은 topic 표시가 없어도(예전 방) 도리 수달 얼굴이에요", () => {
    expect(roomAnimal({ ...reading(), topic: "study" })).toBe("/images/animal-otter-newyear.webp");
    expect(roomAnimal(reading("주제: 2027 신년운\n한 줄 결론: 좋아요"))).toBe("/images/animal-otter-newyear.webp");
    expect(roomLook(reading("주제: 2027 신년운")).title).toBe("2027 신년운");
    expect(roomAnimal(reading())).not.toBe("/images/animal-otter-newyear.webp");
  });

  it("같은 풀이로 다시 들어오면 대화를 이어가요", () => {
    const a = upsertRoom([], reading(), new Date("2026-11-04T10:00:00"));
    const withChat = withMsgs(a.rooms, a.id, [{ role: "user", text: "안녕", at: 1 }]);
    const b = upsertRoom(withChat, reading(), new Date("2026-11-05T10:00:00"));
    expect(b.rooms).toHaveLength(1);
    expect(b.rooms[0].msgs).toHaveLength(1);
  });

  it("오늘의 한마디 방은 날짜마다 따로 만들어지고, 어제 대화는 그대로 남아요", () => {
    const a = upsertRoom([], { kind: "daily", summary: "오늘 카드" }, new Date("2026-11-04T10:00:00"));
    expect(a.id).toBe("daily:2026-11-04");
    expect(a.rooms[0].title).toBe("오늘의 한마디 · 11/4");
    const chat = withMsgs(a.rooms, a.id, [{ role: "user", text: "q", at: 1 }]);
    const same = upsertRoom(chat, { kind: "daily", summary: "" }, new Date("2026-11-04T20:00:00"));
    expect(same.rooms).toHaveLength(1);
    expect(same.rooms[0].msgs).toHaveLength(1);
    expect(same.rooms[0].ctx.summary).toBe("오늘 카드");
    const next = upsertRoom(chat, { kind: "daily", summary: "새 카드" }, new Date("2026-11-05T09:00:00"));
    expect(next.rooms).toHaveLength(2);
    expect(next.id).toBe("daily:2026-11-05");
    expect(next.rooms.find((r) => r.id === "daily:2026-11-04")?.msgs).toHaveLength(1);
    expect(next.rooms.find((r) => r.id === next.id)?.msgs).toHaveLength(0);
  });

  it("한마디 방은 7일만 남기고, 풀이 방은 밀려나지 않아요", () => {
    let rooms: ChatRoom[] = [];
    rooms = upsertRoom(rooms, reading(), new Date("2026-11-01T10:00:00")).rooms;
    for (let d = 1; d <= 9; d++) rooms = upsertRoom(rooms, { kind: "daily", summary: `카드${d}` }, new Date(`2026-11-${String(d).padStart(2, "0")}T10:00:00`)).rooms;
    const dailies = rooms.filter((r) => r.ctx.kind === "daily");
    expect(dailies).toHaveLength(7);
    expect(dailies.some((r) => r.id === "daily:2026-11-02")).toBe(false);
    expect(dailies.some((r) => r.id === "daily:2026-11-03")).toBe(true);
    expect(rooms.some((r) => r.ctx.kind === "reading")).toBe(true);
    expect(rooms.length).toBeLessThanOrEqual(MAX_ROOMS);
  });

  it("방이 많으면 오래된 한마디 방부터 빠져요", () => {
    let rooms: ChatRoom[] = [];
    for (let i = 0; i < 5; i++) rooms = upsertRoom(rooms, reading(`주제: 풀이${i}`), new Date(`2026-11-0${i + 1}T08:00:00`)).rooms;
    for (let d = 8; d <= 14; d++) rooms = upsertRoom(rooms, { kind: "daily", summary: "c" }, new Date(`2026-11-${String(d).padStart(2, "0")}T10:00:00`)).rooms;
    expect(rooms).toHaveLength(MAX_ROOMS);
    expect(rooms.filter((r) => r.ctx.kind === "reading")).toHaveLength(5);
    expect(rooms.some((r) => r.id === "daily:2026-11-14")).toBe(true);
  });

  it("예전에 하나뿐이던 daily 방은 만든 날짜의 방으로 옮겨져요", () => {
    const old = [{ id: "daily", ctx: { kind: "daily", summary: "옛 카드" }, msgs: [{ role: "user", text: "옛 질문", at: 5 }], updatedAt: 5, day: "2026-11-13" }];
    const [r] = parseRooms(old);
    expect(r.id).toBe("daily:2026-11-13");
    expect(r.title).toBe("오늘의 한마디 · 11/13");
    expect(r.msgs).toHaveLength(1);
  });

  it("방 칩은 오늘·어제·날짜로 보여요", () => {
    const now = new Date("2026-11-14T10:00:00");
    expect(dayChip("2026-11-14", now)).toBe("오늘");
    expect(dayChip("2026-11-13", now)).toBe("어제");
    expect(dayChip("2026-11-10", now)).toBe("11/10");
  });

  it("방은 최대 10개, 저장했다가 다시 읽고, 삭제할 수 있어요", () => {
    let rooms: ChatRoom[] = [];
    for (let i = 0; i < 12; i++) rooms = upsertRoom(rooms, reading(`주제: 주제${i}`), new Date(2026, 10, 4, 10, i)).rooms;
    expect(rooms).toHaveLength(MAX_ROOMS);
    const st = mem();
    saveRooms(st, rooms);
    expect(loadRooms(st)).toHaveLength(MAX_ROOMS);
    expect(removeRoom(rooms, rooms[0].id)).toHaveLength(MAX_ROOMS - 1);
    expect(loadRooms(mem())).toEqual([]);
  });

  it("방마다 주제에 맞는 동물 얼굴과 남은 질문 글자를 정해요", () => {
    expect(roomAnimal({ kind: "daily", summary: "" })).toBe("/images/animal-otter.webp");
    expect(roomAnimal({ kind: "compat", summary: "" })).toBe("/images/animal-panda-wedding.webp");
    expect(roomAnimal({ kind: "reading", summary: "주제: 연애운" })).toBe("/images/animal-panda-couple.webp");
    expect(roomAnimal({ kind: "reading", summary: "주제: 재물운" })).toBe("/images/animal-rabbit-rich.webp");
    expect(roomAnimal({ kind: "reading", summary: "주제: 건강운" })).toBe("/images/animal-fox-run.webp");
    expect(roomAnimal({ kind: "reading", summary: "주제: 성공운" })).toBe("/images/animal-dragon.webp");
    expect(roomAnimal({ kind: "reading", summary: "주제: 종합운" })).toBe("/images/animal-dragon.webp");
    expect(roomAnimal({ kind: "reading", summary: "", topic: "study" })).toBe("/images/animal-otter-newyear.webp");
    expect(roomColor({ kind: "daily", summary: "" })).toBe("#6d4fd8");
    expect(roomColor({ kind: "reading", summary: "주제: 재물운" })).toBe("#e0a43a");
    expect(roomColor({ kind: "reading", summary: "주제: 종합운" })).toBe("#a0714f");
    expect(leftLabel({ kind: "daily", summary: "" }, 3)).toBe("오늘 3번");
    expect(leftLabel({ kind: "reading", summary: "" }, 7)).toBe("이번 달 7번");
  });
});

describe("날짜가 지난 오늘의 한마디 방", () => {
  it("다른 날에 만든 daily 방만 낡은 방이에요", () => {
    const d = upsertRoom([], { kind: "daily", summary: "" }, new Date("2026-11-12T10:00:00"));
    const room = d.rooms[0];
    expect(isStaleDaily(room, new Date("2026-11-12T23:00:00"))).toBe(false);
    expect(isStaleDaily(room, new Date("2026-11-13T00:10:00"))).toBe(true);
    const r = upsertRoom([], reading(), new Date("2026-11-12T10:00:00")).rooms[0];
    expect(isStaleDaily(r, new Date("2026-11-20T10:00:00"))).toBe(false);
  });
});
