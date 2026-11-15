import { describe, expect, it } from "vitest";
import { SLOGAN, TALISMAN, talismanBody } from "../book/closing";
import { fillLetterMbti } from "@/lib/mbtiLine";
import { ageBand } from "../letterFacts";
import { CHAPTER_TITLES } from "../book/chapterTitles";

describe("마지막 당부", () => {
  it("오행마다 슬로건과 부적 표가 있어요", () => {
    for (const e of ["목", "화", "토", "금", "수"]) {
      expect(SLOGAN[e].length).toBeGreaterThan(8);
      expect(TALISMAN[e].items.length).toBe(3);
      const b = talismanBody(e);
      expect(b).toMatch(/- 색: /);
      expect(b).toMatch(/- 숫자: /);
      expect(b).toMatch(/- 방향: /);
      expect(b).toMatch(/- 물건: /);
    }
  });
  it("편지의 MBTI 자리를 조사와 함께 채워요", () => {
    expect(fillLetterMbti("⟦MBTI⟧은(는) 다정해.", "ENFP")).toContain("ENFP 특유의");
    expect(fillLetterMbti("⟦MBTI⟧은(는) 다정해.", "ENFP")).not.toContain("⟦");
    expect(fillLetterMbti("⟦MBTI⟧이(가) 빛나.", undefined)).toBe("타고난 결이 빛나.");
  });
  it("나이는 대략으로만 말해요", () => {
    expect(ageBand(31)).toBe("30대 초반");
    expect(ageBand(36)).toBe("30대 중반");
    expect(ageBand(39)).toBe("30대 후반");
    expect(ageBand(5)).toBe("");
  });
  it("제목은 익살 제목이에요", () => {
    expect(CHAPTER_TITLES.closing).toContain("[마무리]");
  });
});
