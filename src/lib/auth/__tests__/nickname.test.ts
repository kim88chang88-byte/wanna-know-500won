import { describe, expect, it } from "vitest";
import { checkNickname } from "../nickname";

describe("checkNickname", () => {
  it("한글·영문·숫자·공백 2~10자는 통과하고 공백을 정리해요", () => {
    expect(checkNickname("서윤")).toEqual({ ok: true, nick: "서윤" });
    expect(checkNickname("  달토끼   7 ")).toEqual({ ok: true, nick: "달토끼 7" });
    expect(checkNickname("Seoyun")).toEqual({ ok: true, nick: "Seoyun" });
  });
  it("너무 짧거나 길면 막아요", () => {
    expect(checkNickname("서").ok).toBe(false);
    expect(checkNickname("열한글자짜리이름이에요요요").ok).toBe(false);
  });
  it("이모지·특수문자·문자열이 아닌 값은 막아요", () => {
    expect(checkNickname("서윤★").ok).toBe(false);
    expect(checkNickname("서윤😊").ok).toBe(false);
    expect(checkNickname("a<b>").ok).toBe(false);
    expect(checkNickname(123).ok).toBe(false);
  });
  it("운영자 사칭·거친 말은 막아요", () => {
    expect(checkNickname("운영자").ok).toBe(false);
    expect(checkNickname("Ad min").ok).toBe(false);
    expect(checkNickname("도유 사주").ok).toBe(false);
  });
});
