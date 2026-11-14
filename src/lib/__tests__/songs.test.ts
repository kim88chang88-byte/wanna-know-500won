import { describe, expect, it } from "vitest";
import { SONGS, songCatalog, songSearchUrl, stripUnknownSongs } from "../songs";
import { cleanVisual, visualAllowed } from "../ai/chat";

describe("노래 목록", () => {
  it("모든 곡은 '가수 - 곡명' 모양이고 분위기가 고루 있다", () => {
    const keys = Object.keys(SONGS);
    expect(keys.length).toBeGreaterThanOrEqual(50);
    for (const k of keys) expect(k).toMatch(/^.+ - .+$/);
    for (const m of ["차분", "위로", "신남", "연주", "연말"]) expect(Object.values(SONGS).some((s) => s.mood === m)).toBe(true);
    expect(songCatalog()).toContain("아이유 - 밤편지");
  });
  it("듣기 링크는 검색 주소다", () => {
    expect(songSearchUrl("아이유 - 밤편지")).toBe("https://www.youtube.com/results?search_query=%EC%95%84%EC%9D%B4%EC%9C%A0%20-%20%EB%B0%A4%ED%8E%B8%EC%A7%80");
  });
  it("목록에 없는 곡은 카드에서 빠진다", () => {
    const v = cleanVisual({ kind: "songs", title: "오늘 들을 노래", items: [
      { icon: "", label: "아이유 - 밤편지", sub: "잠들기 전 한 번", best: false },
      { icon: "", label: "없는가수 - 없는곡", sub: "지어낸 곡", best: false },
      { icon: "", label: "이루마 - River Flows in You", sub: "조용한 오후에", best: false },
    ] });
    expect(v?.items.map((i) => i.label)).toEqual(["아이유 - 밤편지", "이루마 - River Flows in You"]);
  });
  it("목록 곡이 한 곡뿐이면 카드를 만들지 않는다", () => {
    expect(cleanVisual({ kind: "songs", title: "t", items: [{ icon: "", label: "아이유 - 밤편지", sub: "x", best: false }, { icon: "", label: "가짜 - 가짜", sub: "x", best: false }] })).toBeNull();
  });
  it("노래를 물었을 때만 카드가 허용된다", () => {
    expect(visualAllowed("songs", "들어볼만한 곡 추천해줘")).toBe(true);
    expect(visualAllowed("songs", "오늘 조심할 게 뭐야?")).toBe(false);
  });
  it("목록 밖 곡을 말한 문장은 지우고 목록 곡은 남긴다", () => {
    const a = "오늘 오후엔 창가에 앉아서 넬의 '기억을 지워주는 병'이나 잔나비의 '주저하는 연인들을 위해' 같은 노래를 들어봐. 편하게 쉬어도 충분해.";
    expect(stripUnknownSongs(a)).toBe("편하게 쉬어도 충분해.");
    const b = "잔나비의 '주저하는 연인들을 위해' 같은 노래를 들어봐. 차분해질 거야.";
    expect(stripUnknownSongs(b)).toBe(b);
    expect(stripUnknownSongs("이루마의 'River Flows in You'가 좋아.")).toContain("River Flows");
    expect(stripUnknownSongs("오늘은 '쉬는 날'로 정해 봐.")).toBe("오늘은 '쉬는 날'로 정해 봐.");
  });
});
