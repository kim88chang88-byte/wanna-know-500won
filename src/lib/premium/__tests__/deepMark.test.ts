import { describe, expect, it } from "vitest";
import { flattenDeep, splitDeep } from "../deepMark";

describe("deepMark", () => {
  it("표시 앞은 보이는 부분, 뒤는 접힌 부분이에요", () => {
    expect(splitDeep("앞 글\n\n[더 깊이]\n\n뒤 글")).toEqual({ shown: "앞 글", deep: "뒤 글" });
  });
  it("표시가 없으면 접힌 부분은 비어 있어요", () => {
    expect(splitDeep("그냥 글")).toEqual({ shown: "그냥 글", deep: "" });
  });
  it("접기가 없는 곳에서는 표시를 문단 나눔으로 바꿔요", () => {
    expect(flattenDeep("앞\n\n[더 깊이]\n\n뒤")).not.toContain("[더 깊이]");
  });
});
