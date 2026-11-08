import { beforeEach, describe, expect, it } from "vitest";
import { FREE_COMPAT, FREE_DAILY, FREE_RESULT, freeFor, roomKey, memQuota, scopeFor } from "../chatQuota";
import type { BirthInput } from "../saju/types";

const me: BirthInput = { year: 1988, month: 12, day: 29, hour: 9, minute: 30, calendar: "solar", gender: "male" };
const other: BirthInput = { year: 1990, month: 3, day: 5, hour: null, calendar: "solar", gender: "female" };
const now = new Date("2026-11-02T05:00:00Z");

describe("상담방 질문 횟수", () => {
  beforeEach(() => memQuota.reset());

  it("카드는 하루 3번, 풀이 방은 5번, 궁합 방은 10번이 무료예요", () => {
    expect(freeFor("daily")).toBe(FREE_DAILY);
    expect(freeFor("reading")).toBe(FREE_RESULT);
    expect(freeFor("compat")).toBe(FREE_COMPAT);
    expect([FREE_RESULT, FREE_COMPAT]).toEqual([5, 10]);
  });

  it("범위: 카드는 날짜별, 결과서는 사람·달별이에요", () => {
    expect(scopeFor("daily", null, null, now)).toBe("d:2026-11-02");
    const a = scopeFor("reading", me, null, now);
    expect(a).toMatch(/^r:2026-11:[0-9a-f]{16}$/);
    expect(scopeFor("reading", me, null, now)).toBe(a);
    expect(scopeFor("reading", other, null, now)).not.toBe(a);
    expect(scopeFor("compat", me, other, now)).toMatch(/^c:2026-11:/);
    expect(scopeFor("compat", me, other, now)).not.toBe(scopeFor("compat", other, me, now));
    expect(scopeFor("reading", me, null, new Date("2026-12-01T05:00:00Z"))).not.toBe(a);
  });

  it("풀이 방마다 무료 횟수를 따로 세요 (주제·신년운·프리미엄별)", () => {
    const k = (summary: string, topic?: "study", premium?: boolean) => scopeFor("reading", me, null, now, roomKey(summary, topic, premium));
    expect(k("주제: 건강운\n결론")).toBe(k("주제: 건강운\n다른 요약"));
    expect(k("주제: 건강운")).not.toBe(k("주제: 재물운"));
    expect(k("주제: 성공운")).not.toBe(k("주제: 재물운"));
    expect(k("주제: 성공운")).not.toBe(k("주제: 성공운", undefined, true));
    expect(k("", "study")).not.toBe(k(""));
  });

  it("메모리 대체: 무료를 다 쓰면 -1, 돌려주면 다시 쓸 수 있어요", () => {
    const u = "u1";
    const s = "d:2026-11-02";
    expect(memQuota.get(u, s, 3)).toBe(3);
    expect(memQuota.take(u, s, 3)).toBe(2);
    expect(memQuota.take(u, s, 3)).toBe(1);
    expect(memQuota.take(u, s, 3)).toBe(0);
    expect(memQuota.take(u, s, 3)).toBe(-1);
    memQuota.refund(u, s);
    expect(memQuota.take(u, s, 3)).toBe(0);
  });
});
