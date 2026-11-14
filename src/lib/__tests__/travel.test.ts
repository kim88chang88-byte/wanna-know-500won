import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { TRAVEL, travelCatalog, travelFacts, regionsIn, travelImg, travelMapUrl } from "../travel";
import { cleanVisual, visualAllowed } from "../ai/chat";

describe("여행 지역 목록", () => {
  it("39곳이고 모든 지역에 그림 파일이 있다", () => {
    const names = Object.keys(TRAVEL);
    expect(names.length).toBe(39);
    expect(names.filter((n) => TRAVEL[n].intl).length).toBe(15);
    for (const n of names) expect(existsSync(`public${travelImg(n)}`)).toBe(true);
  });
  it("슬러그가 겹치지 않고, 이동 정보가 비어 있지 않다", () => {
    const slugs = Object.values(TRAVEL).map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const p of Object.values(TRAVEL)) {
      expect(p.move1.length).toBeGreaterThan(3);
      expect(p.move2.length).toBeGreaterThan(3);
      expect(p.point.length).toBeGreaterThan(3);
    }
  });
  it("코스 재료·지역 찾기·지도 링크", () => {
    expect(travelCatalog()).toContain("강릉(국내");
    expect(travelFacts("발리")).toContain("3박 4일 권장");
    expect(regionsIn("강릉 2박 3일 코스 짜 줘")).toEqual(["강릉"]);
    expect(travelMapUrl("강릉")).toContain("query=%EA%B0%95%EB%A6%89");
  });
});

describe("여행 카드 검사", () => {
  it("후보 카드: 목록에 없는 지역은 빠지고 2곳 미만이면 카드 없음", () => {
    const ok = cleanVisual({ kind: "travel", title: "가볼 만한 곳", items: [
      { icon: "", label: "강릉", sub: "바다를 오래 보면 마음이 풀려", best: false },
      { icon: "", label: "없는도시", sub: "x", best: false },
      { icon: "", label: "후쿠오카", sub: "온천에서 몸 풀기", best: false },
    ] });
    expect(ok?.items.map((i) => i.label)).toEqual(["강릉", "후쿠오카"]);
    expect(cleanVisual({ kind: "travel", title: "t", items: [{ icon: "", label: "강릉", sub: "x", best: false }, { icon: "", label: "가짜", sub: "x", best: false }] })).toBeNull();
  });
  it("코스 카드: 지역 이름이 제목에 있고 6칸 이상이어야 한다", () => {
    const items = ["1", "1", "1", "2", "2", "2"].map((d, i) => ({ icon: d, label: `낮 활동 ${i}`, sub: "메모", best: false }));
    expect(cleanVisual({ kind: "course", title: "강릉 2박 3일", items })?.items.length).toBe(6);
    expect(cleanVisual({ kind: "course", title: "어딘가 2박 3일", items })).toBeNull();
    expect(cleanVisual({ kind: "course", title: "강릉 2박 3일", items: items.slice(0, 4) })).toBeNull();
  });
  it("여행·코스를 물었을 때만 허용된다", () => {
    expect(visualAllowed("travel", "한 2박3일 떠날 여행지 추천해줄수있어?")).toBe(true);
    expect(visualAllowed("course", "강릉 2박 3일 코스 짜 줘")).toBe(true);
    expect(visualAllowed("travel", "오늘 조심할 게 뭐야?")).toBe(false);
  });
});
