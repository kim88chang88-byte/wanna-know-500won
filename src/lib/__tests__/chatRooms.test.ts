import { describe, expect, it } from "vitest";
import { leftLabel, loadRooms, MAX_ROOMS, roomAnimal, removeRoom, roomIdFor, roomLook, saveRooms, upsertRoom, withMsgs, type ChatRoom } from "../chatRooms";
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
    expect(roomIdFor({ kind: "daily", summary: "" })).toBe("daily");
  });

  it("방 이름은 풀이에 맞게 붙어요", () => {
    expect(roomLook(reading()).title).toBe("성공운");
    expect(roomLook({ ...reading(), topic: "study" }).title).toBe("2027 신년운");
    expect(roomLook({ kind: "compat", summary: "", partnerName: "지은" }).title).toBe("지은님과의 궁합");
  });

  it("같은 풀이로 다시 들어오면 대화를 이어가요", () => {
    const a = upsertRoom([], reading(), new Date("2026-11-04T10:00:00"));
    const withChat = withMsgs(a.rooms, a.id, [{ role: "user", text: "안녕", at: 1 }]);
    const b = upsertRoom(withChat, reading(), new Date("2026-11-05T10:00:00"));
    expect(b.rooms).toHaveLength(1);
    expect(b.rooms[0].msgs).toHaveLength(1);
  });

  it("오늘의 한마디 방은 날짜가 바뀌면 새로 시작하고, 빈 요약은 기존 요약을 덮지 않아요", () => {
    const a = upsertRoom([], { kind: "daily", summary: "오늘 카드" }, new Date("2026-11-04T10:00:00"));
    const chat = withMsgs(a.rooms, "daily", [{ role: "user", text: "q", at: 1 }]);
    const same = upsertRoom(chat, { kind: "daily", summary: "" }, new Date("2026-11-04T20:00:00"));
    expect(same.rooms[0].msgs).toHaveLength(1);
    expect(same.rooms[0].ctx.summary).toBe("오늘 카드");
    const next = upsertRoom(chat, { kind: "daily", summary: "" }, new Date("2026-11-05T09:00:00"));
    expect(next.rooms[0].msgs).toHaveLength(0);
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
    expect(roomAnimal({ kind: "compat", summary: "" })).toBe("/images/animal-panda-couple.webp");
    expect(roomAnimal({ kind: "reading", summary: "주제: 연애운" })).toBe("/images/animal-rabbit.webp");
    expect(roomAnimal({ kind: "reading", summary: "주제: 재물운" })).toBe("/images/animal-rabbit-rich.webp");
    expect(roomAnimal({ kind: "reading", summary: "주제: 건강운" })).toBe("/images/animal-fox-run.webp");
    expect(roomAnimal({ kind: "reading", summary: "주제: 종합운" })).toBe("/images/animal-dragon.webp");
    expect(roomAnimal({ kind: "reading", summary: "", topic: "study" })).toBe("/images/animal-otter-study.webp");
    expect(leftLabel({ kind: "daily", summary: "" }, 3)).toBe("오늘 3번");
    expect(leftLabel({ kind: "reading", summary: "" }, 7)).toBe("이번 달 7번");
  });
});
