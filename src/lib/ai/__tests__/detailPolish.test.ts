import { describe, expect, it } from "vitest";
import { capEmoji, fixKkondae, fixNameSubject, headEndsWell, limitRepeats, polishDetail, softenPredictions } from "../detailPolish";

describe("detailPolish", () => {
  it("빈칸으로 새어 나온 꼰대 표기를 복구한다", () => {
    expect(fixKkondae("얘기야 (나 절대 00아님!) 해봐")).toBe("얘기야 (나 절대 꼰대 아님!) 해봐");
    expect(fixKkondae("(나 절대 꼰대 아님!)")).toBe("(나 절대 꼰대 아님!)");
  });
  it("이름 주어를 너는/네가로 바꾸되 부르는 말은 둔다", () => {
    expect(fixNameSubject("그렇지만 은혁은 마음이 앞서", "장은혁")).toBe("그렇지만 너는 마음이 앞서");
    expect(fixNameSubject("은혁이가 웃으면", "장은혁")).toBe("네가 웃으면");
    expect(fixNameSubject("은혁아, 잘 들어", "장은혁")).toBe("은혁아, 잘 들어");
    expect(fixNameSubject("은혁이의 마음", "장은혁")).toBe("은혁이의 마음");
  });
  it("반복 낱말은 두 번까지만 두고 바꾼다", () => {
    const out = limitRepeats(["든든한 힘, 든든한 마음", "든든하게 가자 추진력 추진력 추진력"]);
    expect(out.join(" ").split("든든").length - 1).toBe(2);
    expect(out[1]).toContain("믿음직하게");
  });
  it("이모지를 개수 제한한다", () => {
    expect(capEmoji("좋아 💖 최고 ✨ 야호 🌷", 2)).toBe("좋아 💖 최고 ✨ 야호");
    expect(capEmoji("따끔해 ✨", 0)).toBe("따끔해");
  });
  it("장담을 누그러뜨린다", () => {
    expect(softenPredictions("에너지가 가득 차오르는 해가 될 거야.")).toBe("에너지가 가득 차오르는 해가 될 여지가 커.");
  });
  it("제목이 명사로 끝나면 버린다", () => {
    expect(headEndsWell("큰 판을 끝까지 밀고 가는 힘이 센 사람이네!")).toBe(true);
    expect(headEndsWell("커다란 판을 끝까지 밀고 나가는 든든한 추진력")).toBe(false);
  });
  it("polishDetail 은 일곱 글을 다듬고 나쁜 제목만 뺀다", () => {
    const d = polishDetail(
      { story: "은혁은 해가 될 거야.", folds: { lack: "말해 (나 절대 00아님!) 끝 ✨", praise: "좋아 💖 ✨ 🌷" }, heads: { lack: "끝까지 가는 추진력", praise: "힘이 센 사람이네!" } },
      "장은혁",
    );
    expect(d.story).toBe("너는 해가 될 여지가 커.");
    expect(d.folds.lack).toContain("꼰대");
    expect(d.folds.lack).not.toContain("✨");
    expect(d.heads.lack).toBeUndefined();
    expect(d.heads.praise).toBeDefined();
  });
});
