import { describe, expect, it } from "vitest";
import { BODY_GROUPS, BODY_IMG, bodyStates, topBodyPicks, yearFocus } from "../bodyMap";
import type { ElementView } from "../types";

const el = (name: string, count: number): ElementView => ({ name, count, kind: "unknown" });

describe("건강운 오행 장부 지도", () => {
  it("많은 기운은 쉬어 가기, 적거나 없는 기운은 채우기로 나눠요", () => {
    const s = bodyStates([el("목", 4), el("화", 0), el("토", 1), el("금", 1), el("수", 2)]);
    expect(s.목).toBe("rest");
    expect(s.화).toBe("fill");
    expect(s.수).toBe("ok");
    expect(bodyStates([])).toEqual({});
  });

  it("올해 세운 천간의 오행으로 살펴볼 곳을 짚어요", () => {
    expect(yearFocus("丁未")).toBe("화");
    expect(yearFocus("甲子")).toBe("목");
    expect(yearFocus(null)).toBeNull();
  });

  it("500원 요약은 채울 곳부터 3가지를 골라요", () => {
    const picks = topBodyPicks(bodyStates([el("목", 4), el("화", 0), el("토", 1), el("금", 1), el("수", 0)]));
    expect(picks).toHaveLength(3);
    expect(picks.slice(0, 2).every((p) => p.state === "fill")).toBe(true);
  });

  it("표시 위치는 그림 안에 있어요", () => {
    for (const g of BODY_GROUPS) for (const [x, y] of g.marks) expect(x >= 0 && x <= BODY_IMG.w && y >= 0 && y <= BODY_IMG.h).toBe(true);
  });
});
