import { describe, expect, it } from "vitest";
import { parseAbout } from "../chatServer";

describe("다른 사람 풀이(about) 입력 검사", () => {
  const birth = { year: 2007, month: 3, day: 9, hour: 14, minute: 0, calendar: "solar", gender: "male" };
  it("이름을 다듬고 생년월일을 검사해요", () => {
    const a = parseAbout({ name: "  형님   아들<b> ", birth });
    expect(a?.name).toBe("형님 아들 b");
    expect(a?.birth.year).toBe(2007);
  });
  it("이름이 비면 기본 호칭, 생년월일이 이상하면 null", () => {
    expect(parseAbout({ name: "", birth })?.name).toBe("그 사람");
    expect(parseAbout({ name: "x", birth: { year: 1 } })).toBeNull();
    expect(parseAbout(null)).toBeNull();
    expect(parseAbout("abc")).toBeNull();
  });
});
