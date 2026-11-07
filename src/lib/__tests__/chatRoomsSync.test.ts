import { describe, expect, it } from "vitest";
import { CHAT_SYNCED_KEY, RETENTION_DAYS, clearRooms, dropExpired, parseRooms, type ChatRoom } from "../chatRooms";
import { mergeRooms, readSynced, sameRooms, writeSynced } from "../chatRoomsSync";

const DAY = 86_400_000;
const NOW = new Date("2026-11-07T12:00:00Z");
const room = (id: string, updatedAt: number, texts: string[] = ["안녕"]): ChatRoom => ({
  id,
  ctx: { kind: "reading", summary: "주제: 성공운" },
  title: "성공운",
  chip: "성공운",
  icon: "📜",
  msgs: texts.map((text, i) => ({ role: i % 2 ? "dori" : "user", text, at: updatedAt + i })),
  updatedAt,
  day: "",
});
const mem = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
};

describe("상담실 대화방 서버 보관", () => {
  it("마지막 대화 후 30일이 지난 방은 빠진다", () => {
    expect(RETENTION_DAYS).toBe(30);
    const fresh = room("a", NOW.getTime() - 29 * DAY);
    const old = room("b", NOW.getTime() - 31 * DAY);
    expect(dropExpired([fresh, old], NOW).map((r) => r.id)).toEqual(["a"]);
  });

  it("서버에서 온 값은 모양이 맞는 방만 남는다", () => {
    const rooms = parseRooms([room("a", 5), { id: "x" }, null, { id: "y", ctx: { kind: "hack", summary: "" } }, { ...room("c", 9), id: "z".repeat(200) }]);
    expect(rooms.map((r) => r.id)).toEqual(["a"]);
    expect(parseRooms("nope")).toEqual([]);
  });

  it("양쪽에 있는 방은 최근에 바뀐 쪽, 서버에만 있는 방은 가져온다", () => {
    const t = NOW.getTime();
    const merged = mergeRooms([room("a", t - 1000, ["기기"]), room("c", t - 5000)], [room("a", t - 2000, ["서버"]), room("b", t - 3000)], t - 10_000, NOW);
    expect(merged.map((r) => r.id).sort()).toEqual(["a", "b", "c"]);
    expect(merged.find((r) => r.id === "a")?.msgs[0].text).toBe("기기");
    expect(mergeRooms([room("a", t - 5000, ["기기"])], [room("a", t - 2000, ["서버"])], 0, NOW)[0].msgs[0].text).toBe("서버");
  });

  it("다른 기기에서 지운 방은 되살아나지 않는다, 새로 바뀐 방은 남는다", () => {
    const t = NOW.getTime();
    const lastSynced = t - 60_000;
    const merged = mergeRooms([room("old", t - 120_000), room("new", t - 1000)], [], lastSynced, NOW);
    expect(merged.map((r) => r.id)).toEqual(["new"]);
    // 처음 맞추는 기기(기록 없음)는 이 기기의 방을 모두 올린다
    expect(mergeRooms([room("old", t - 120_000)], [], 0, NOW).map((r) => r.id)).toEqual(["old"]);
  });

  it("합친 결과도 30일이 지난 방과 10개를 넘는 방은 뺀다", () => {
    const t = NOW.getTime();
    const many = Array.from({ length: 12 }, (_, i) => room(`r${i}`, t - i * 1000));
    expect(mergeRooms(many, [], 0, NOW)).toHaveLength(10);
    expect(mergeRooms([room("old", t - 40 * DAY)], [], 0, NOW)).toHaveLength(0);
  });

  it("같은 목록인지 가볍게 비교한다", () => {
    expect(sameRooms([room("a", 1)], [room("a", 1)])).toBe(true);
    expect(sameRooms([room("a", 1)], [room("a", 2)])).toBe(false);
    expect(sameRooms([room("a", 1)], [])).toBe(false);
  });

  it("마지막으로 맞춘 시각은 저장·삭제된다 (로그아웃하면 지워진다)", () => {
    const st = mem();
    expect(readSynced(st)).toBe(0);
    writeSynced(st, 1234);
    expect(readSynced(st)).toBe(1234);
    expect(st.getItem(CHAT_SYNCED_KEY)).toBe("1234");
    clearRooms(st);
    expect(readSynced(st)).toBe(0);
  });
});
