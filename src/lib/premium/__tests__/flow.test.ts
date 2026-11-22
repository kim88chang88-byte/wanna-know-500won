import { describe, expect, it } from "vitest";
import { BRIDGES, sectionLink } from "../flow";

const KEYS = ["preface", "overview", "concernTop", "pillars", "nature", "elements", "tengods", "stage12", "sinsal", "gui", "topic:money", "topic:love", "topic:career", "topic:health", "geukguk", "daeun", "years", "years:2", "concern", "lucky"];

describe("이음 문장", () => {
  it("마지막 쪽을 뺀 모든 쪽에 다음 쪽으로 건네는 말이 있다", () => {
    for (const k of KEYS.slice(0, -1)) expect(BRIDGES[k], k).toBeTruthy();
  });
  it("쪽 사이 연결 문장이 돌아가며 달라진다", () => {
    const a = sectionLink("월운", 1), b = sectionLink("월운", 2);
    expect(a).not.toBe(b);
    expect(sectionLink("재물 · 부제", 1)).toContain("‘재물’");
  });
});
