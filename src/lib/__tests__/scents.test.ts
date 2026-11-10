import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { SCENTS, scentSrc } from "../scents";
import { cleanVisual } from "../ai/chat";

describe("scents", () => {
  it("모든 향 이미지 파일이 있다", () => {
    for (const [label, s] of Object.entries(SCENTS)) expect(existsSync(`public/images/scents/${s.key}.webp`), label).toBe(true);
  });
  it("목록 밖의 향은 이미지가 없다", () => {
    expect(scentSrc("없는향")).toBeNull();
    expect(scentSrc("라벤더")).toBe("/images/scents/lavender.webp");
  });
  it("향 카드는 목록 안의 향만 남긴다", () => {
    const v = cleanVisual({ kind: "scent", title: "어울리는 향", items: [{ label: "라벤더", sub: "마음을 편안하게" }, { label: "없는향", sub: "x" }, { label: "시트러스", sub: "기분을 가볍게" }] });
    expect(v?.items.map((i) => i.label)).toEqual(["라벤더", "시트러스"]);
  });
  it("남은 향이 하나뿐이면 카드를 만들지 않는다", () => {
    expect(cleanVisual({ kind: "scent", title: "t", items: [{ label: "라벤더", sub: "a" }, { label: "없는향", sub: "b" }] })).toBeNull();
  });
});
