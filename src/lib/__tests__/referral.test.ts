import { describe, expect, it } from "vitest";
import { cleanRefCode, isFinalRedeem, readMyCode, readRef, redeemMessage, refFromSearch, saveMyCode, saveRef, clearRef, withRef } from "../referral";

function mem() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
}

describe("추천 코드 도우미", () => {
  it("코드는 영문 대문자·숫자 6~12자만 받고, 소문자는 대문자로 바꿔요", () => {
    expect(cleanRefCode(" ab12cd34 ")).toBe("AB12CD34");
    expect(cleanRefCode("짧아")).toBeNull();
    expect(cleanRefCode("AB12-CD34")).toBeNull();
    expect(cleanRefCode("A".repeat(13))).toBeNull();
    expect(cleanRefCode(123)).toBeNull();
  });

  it("주소에서 ref 를 읽어요", () => {
    expect(refFromSearch("?ref=ab12cd34&x=1")).toBe("AB12CD34");
    expect(refFromSearch("?x=1")).toBeNull();
    expect(refFromSearch("?ref=<script>")).toBeNull();
  });

  it("공유 주소에 코드를 붙이고, 코드가 없으면 그대로 둬요", () => {
    expect(withRef("https://a.example", "AB12CD34")).toBe("https://a.example/?ref=AB12CD34");
    expect(withRef("https://a.example", null)).toBe("https://a.example");
    expect(withRef("not a url", "AB12CD34")).toBe("not a url");
  });

  it("저장소에 넣고 읽고 지워요. 이상한 값은 읽지 않아요", () => {
    const st = mem();
    saveRef(st, "AB12CD34");
    expect(readRef(st)).toBe("AB12CD34");
    clearRef(st);
    expect(readRef(st)).toBeNull();
    st.setItem("wanna500:mycode:v1", "bad code!");
    expect(readMyCode(st)).toBeNull();
    saveMyCode(st, "ZZ99YY88");
    expect(readMyCode(st)).toBe("ZZ99YY88");
    expect(readRef(null)).toBeNull();
  });

  it("입력 결과를 쉬운 말로 바꾸고, 네트워크 실패만 코드를 남겨 둬요", () => {
    expect(redeemMessage("ok").ok).toBe(true);
    for (const r of ["bad_code", "self", "already", "too_old", "used_draw", "failed"]) expect(redeemMessage(r).ok).toBe(false);
    expect(redeemMessage("too_old").text).toContain("7일");
    expect(isFinalRedeem("ok")).toBe(true);
    expect(isFinalRedeem("already")).toBe(true);
    expect(isFinalRedeem("failed")).toBe(false);
  });
});
