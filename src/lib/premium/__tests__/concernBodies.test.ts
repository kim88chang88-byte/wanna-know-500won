import { describe, expect, it } from "vitest";
import { CONCERN_CHIPS } from "@/lib/concerns";
import { containsForbidden } from "@/lib/ai/reading";
import { buildConcernAnswers } from "../concernAnswer";
import type { ElementView } from "../types";

const elements = [
  { name: "목", count: 2 },
  { name: "화", count: 1 },
  { name: "토", count: 3 },
  { name: "금", count: 1 },
  { name: "수", count: 1 },
] as unknown as ElementView[];

describe("모든 고민 항목의 도리 답", () => {
  it("항목마다 답이 만들어지고, 겁주는 말·투자 권유·금액 단정이 없다", () => {
    for (const c of CONCERN_CHIPS) {
      const [a] = buildConcernAnswers({ tags: [c.id], text: "" }, elements, "신강");
      expect(a.id).toBe(c.id);
      expect(a.body.length > 80).toBe(true);
      expect(containsForbidden(a.body)).toBeNull();
      expect(/(투자하세요|사세요|파세요|[0-9]+\s?(억|만원))/.test(a.body)).toBe(false);
    }
  });
});
