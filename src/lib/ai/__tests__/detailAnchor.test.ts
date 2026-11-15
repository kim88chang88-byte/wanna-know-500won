import { describe, expect, it } from "vitest";
import type { SajuChart } from "@/lib/saju/types";
import { dropOrphanBold, tidyFold, trimToLastSentence } from "@/lib/storyHelpers";
import type { CoreFacts } from "../coreFacts";
import { buildDetailMessage, DETAIL_SYSTEM_PROMPT } from "../detail";
import { detailAnchor } from "../detailAnchor";

const chart: SajuChart = {
  year: { stem: "丙", branch: "午" },
  month: { stem: "丁", branch: "巳" },
  day: { stem: "己", branch: "未" },
  hour: { stem: "戊", branch: "辰" },
  solarDate: { year: 1990, month: 5, day: 17 },
  uncertainPillars: [],
  warnings: [],
};
const core = (s: string): CoreFacts => ({ 신강신약: s });

describe("공통 진단", () => {
  it("신강·신약·중화에 따라 진단이 달라지고, 많은/적은 오행을 밝힌다", () => {
    const strong = detailAnchor(chart, "general", core("신강(자기 기운이 센 편)"));
    const weak = detailAnchor(chart, "general", core("신약(주변 기운에 영향을 잘 받는 편)"));
    expect(strong).toContain("[공통 진단");
    expect(strong).toContain("밀고 나가는 힘");
    expect(weak).toContain("섬세한 결");
    expect(strong).not.toBe(weak);
    expect(strong).toMatch(/많은 기운: .*적은 기운: /);
    expect(detailAnchor(chart, "general", null)).toContain("균형");
  });
  it("재물운은 돈에 맞춘 진단을 쓴다", () => {
    expect(detailAnchor(chart, "money", core("신강"))).toContain("지출이 늘기 쉬움");
    expect(detailAnchor(chart, "love", core("신강"))).not.toContain("지출");
  });
  it("새는 돈이 고민이면 '이미 잘 지킨다'로 뒤집지 못하게 한다", () => {
    const a = detailAnchor(chart, "money", core("신강"), { tags: ["spending"], text: "" });
    expect(a).toContain("마음이 급하거나 지칠 때 지출이 늘기 쉬움");
    expect(a).toContain("뒤집지 마");
    expect(a).not.toContain("지갑을 단단");
  });
  it("모든 호출 메시지에 같은 진단이 들어간다", () => {
    const m1 = buildDetailMessage(chart, "money", "female", { tags: ["spending"], text: "" }, { core: core("신강") }, "두 글만 써줘");
    const m2 = buildDetailMessage(chart, "money", "female", { tags: ["spending"], text: "" }, { core: core("신강") }, "행운 처방만 써줘");
    const block = (m: string) => m.slice(m.indexOf("[공통 진단"), m.indexOf("- 많은 기운"));
    expect(block(m1).length).toBeGreaterThan(50);
    expect(block(m1)).toBe(block(m2));
  });
});

describe("프롬프트 규칙", () => {
  it("학생·직장인 전제 장면과 지어낸 사실을 막는다", () => {
    expect(DETAIL_SYSTEM_PROMPT).toContain("단정하지 마");
    expect(DETAIL_SYSTEM_PROMPT).toMatch(/등굣길·교실·시험·회사·회의/);
    expect(DETAIL_SYSTEM_PROMPT).not.toContain("(등굣길, 시험 전날");
  });
  it("공통 진단·행동 나누기·시기 규칙이 있다", () => {
    expect(DETAIL_SYSTEM_PROMPT).toContain("[공통 진단]");
    expect(DETAIL_SYSTEM_PROMPT).toContain("행동 제안은 글마다 나눠서");
    expect(DETAIL_SYSTEM_PROMPT).toContain("다가오는 달");
  });
  it("아쉬움 글은 겁주거나 재촉하지 않는다", () => {
    expect(DETAIL_SYSTEM_PROMPT).not.toContain("그대로 두면 손해인 점");
    expect(DETAIL_SYSTEM_PROMPT).toContain("겁주는 말");
    expect(DETAIL_SYSTEM_PROMPT).toContain("훈계로 끝내지 말고");
  });
});

describe("남은 강조 표시(**) 정리", () => {
  it("문장을 자르다 여는 표시만 남으면 지운다", () => {
    expect(dropOrphanBold("차분하게 가 보자. **")).toBe("차분하게 가 보자.");
    expect(dropOrphanBold("**좋은** 날이야.")).toBe("**좋은** 날이야.");
    expect(trimToLastSentence("지혜를 빌려보자. **그러면 좋은")).toBe("지혜를 빌려보자.");
    expect(tidyFold("lucky", "물 한 잔이 좋아. **")).toBe("물 한 잔이 좋아.");
  });
});
