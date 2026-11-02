import { describe, expect, it } from "vitest";
import { isTrackEvent, refererHost, sourceLabel } from "../visitTrack";

describe("visitTrack", () => {
  it("정해진 행동 이름만 받아요", () => {
    expect(isTrackEvent("draw_done")).toBe(true);
    expect(isTrackEvent("birthday=2000-01-01")).toBe(false);
    expect(isTrackEvent(undefined)).toBe(false);
  });
  it("레퍼러는 도메인만 남기고 우리 사이트는 버려요", () => {
    expect(refererHost("https://l.instagram.com/?u=https%3A%2F%2Fx&secret=1", "dori.kr")).toBe("instagram.com");
    expect(refererHost("https://www.google.com/search?q=사주", "dori.kr")).toBe("google.com");
    expect(refererHost("https://dori.kr/chat", "dori.kr")).toBe("");
    expect(refererHost("not a url", "dori.kr")).toBe("");
    expect(refererHost("", "dori.kr")).toBe("");
  });
  it("출처 이름은 친구 > utm > 도메인 > 직접 순서예요", () => {
    expect(sourceLabel({ friend: true, utm: "insta", host: "a.com" })).toBe("friend");
    expect(sourceLabel({ utm: "Insta Story!", host: "a.com" })).toBe("utm:instastory");
    expect(sourceLabel({ host: "naver.com" })).toBe("web:naver.com");
    expect(sourceLabel({})).toBe("direct");
  });
});
