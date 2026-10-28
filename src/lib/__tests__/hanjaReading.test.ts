import { describe, expect, it } from "vitest";
import { readingFirst, readingFirstDeep } from "../hanjaReading";

describe("readingFirst: 음 먼저, 괄호 안에 한자", () => {
  it("한자만 있으면 음을 앞에 붙인다", () => {
    expect(readingFirst("甲木 일간")).toBe("갑목(甲木) 일간");
    expect(readingFirst("丙壬충과 午戌반합")).toBe("병임(丙壬)충과 오술(午戌)반합");
  });
  it("한자(음) 은 뒤집는다", () => {
    expect(readingFirst("丙午(병오)는 불의 해")).toBe("병오(丙午)는 불의 해");
    expect(readingFirst("丙(병)이 들어와요")).toBe("병(丙)이 들어와요");
  });
  it("십성이 붙은 한자는 한 괄호 안에 함께 둔다", () => {
    expect(readingFirst("丁(편재)과 戊戌(정관)")).toBe("정(丁, 편재)과 무술(戊戌, 정관)");
  });
  it("앞 글자가 읽기가 아니면 읽기를 덧붙인다", () => {
    expect(readingFirst("2024년(甲辰)에는")).toBe("2024년 갑진(甲辰)에는");
  });
  it("이미 음(한자) 모양이면 그대로, 여러 번 돌려도 같다", () => {
    for (const t of ["목(木)과 쇠(金)", "병오(丙午)는", "정(丁, 편재)과 무술(戊戌, 정관)", "일간 갑(甲, 큰 나무)"]) {
      expect(readingFirst(t)).toBe(t);
    }
    const once = readingFirst("丙(병)이 午戌반합");
    expect(readingFirst(once)).toBe(once);
  });
  it("오행의 금(金)은 쇠로 부른다", () => {
    expect(readingFirst("금(金) 기운이 강해요")).toBe("쇠(金) 기운이 강해요");
    expect(readingFirst("金 기운")).toBe("쇠(金) 기운");
    expect(readingFirst("용신은 금·목·화예요")).toBe("용신은 쇠·목·화예요");
    expect(readingFirst("금 기운이 적어요")).toBe("쇠 기운이 적어요");
  });
  it("금요일·금전·지금 같은 다른 말은 그대로 둔다", () => {
    for (const t of ["금요일에 만나요", "금전운이 좋아요", "지금 시작해요", "금방 돼요"]) expect(readingFirst(t)).toBe(t);
  });
  it("읽는 법을 모르는 한자는 그대로 둔다", () => {
    expect(readingFirst("龍 한 마리")).toBe("龍 한 마리");
  });
});

describe("readingFirstDeep", () => {
  it("skip 에 든 칸(기둥 한자)은 건드리지 않는다", () => {
    const out = readingFirstDeep({ pillars: [{ full: "庚午", label: "연주" }], summary: "庚午 일주예요", yongsin: ["丙(병)"] }, new Set(["pillars"]));
    expect(out.pillars[0].full).toBe("庚午");
    expect(out.summary).toBe("경오(庚午) 일주예요");
    expect(out.yongsin[0]).toBe("병(丙)");
  });
});
