import { describe, expect, it } from "vitest";
import { markNavSeen, markVaultNew, readNavDots, writeDrawAvail } from "../navDots";
import type { StorageLike } from "../drawCounter";

function mem(): StorageLike {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
}
const d1 = new Date(2026, 10, 6, 10);
const d2 = new Date(2026, 10, 7, 10);

describe("하단 메뉴 빨간 점", () => {
  it("처음에는 아무 점도 없고, 상담실만 열려 있으면 오늘 첫 방문에 켜져요", () => {
    const st = mem();
    expect(readNavDots(st, false, d1)).toEqual({ draw: false, chat: false, vault: false });
    expect(readNavDots(st, true, d1).chat).toBe(true);
  });

  it("상담실을 열면 그날은 꺼지고, 다음 날 다시 켜져요", () => {
    const st = mem();
    markNavSeen(st, "chat", d1);
    expect(readNavDots(st, true, d1).chat).toBe(false);
    expect(readNavDots(st, true, d2).chat).toBe(true);
  });

  it("운세 뽑기: 무료 뽑기가 남아 있으면 켜지고, 열면 꺼지고, 새 조약돌을 받으면 다시 켜져요", () => {
    const st = mem();
    writeDrawAvail(st, true, 0, d1);
    expect(readNavDots(st, false, d1).draw).toBe(true);
    markNavSeen(st, "draw", d1);
    expect(readNavDots(st, false, d1).draw).toBe(false);
    writeDrawAvail(st, true, 1, d1);
    expect(readNavDots(st, false, d1).draw).toBe(true);
    writeDrawAvail(st, false, 0, d1);
    expect(readNavDots(st, false, d1).draw).toBe(false);
  });

  it("보관함: 새 풀이가 저장되면 켜지고 열면 꺼져요", () => {
    const st = mem();
    markVaultNew(st);
    expect(readNavDots(st, false, d1).vault).toBe(true);
    markNavSeen(st, "vault", d1);
    expect(readNavDots(st, false, d1).vault).toBe(false);
  });

  it("저장소가 없어도 오류 없이 점 없음으로 돌아가요", () => {
    expect(readNavDots(null, true, d1)).toEqual({ draw: false, chat: true, vault: false });
  });
});
