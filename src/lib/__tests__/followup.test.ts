import { describe, expect, it } from "vitest";
import { answerFollowup, dueFollowup, followupQuestion, followupReply, FOLLOWUP_KEY, readFollowup, rememberConcern } from "../followup";

const mem = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
};

describe("고민 후속 체크인", () => {
  it("고른 항목 이름만 기억하고 글은 저장하지 않는다", () => {
    const st = mem();
    rememberConcern(st, ["job", "money"], "2026-10-10");
    expect(readFollowup(st)).toEqual({ day: "2026-10-10", tag: "job" });
    expect(st.getItem(FOLLOWUP_KEY)).not.toContain("text");
  });
  it("2~45일 사이에만 묻고, 대답하면 다시 묻지 않는다", () => {
    const f = { day: "2026-10-10", tag: "job" as const };
    expect(dueFollowup(f, "2026-10-11")).toBe(false);
    expect(dueFollowup(f, "2026-10-12")).toBe(true);
    expect(dueFollowup(f, "2026-12-10")).toBe(false);
    expect(dueFollowup({ ...f, answered: "2026-10-13" }, "2026-10-14")).toBe(false);
    expect(dueFollowup(null, "2026-10-14")).toBe(false);
  });
  it("대답을 기록한다", () => {
    const st = mem();
    rememberConcern(st, ["job"], "2026-10-10");
    answerFollowup(st, "2026-10-13");
    expect(readFollowup(st)?.answered).toBe("2026-10-13");
  });
  it("질문과 답변은 부드럽고 숫자·겁주기가 없다", () => {
    expect(followupQuestion("job")).toContain("이직");
    for (const m of ["better", "same", "heavier"] as const) {
      const r = followupReply(m);
      expect(r.length > 30).toBe(true);
      expect(/(위험|망|불행)/.test(r)).toBe(false);
    }
    expect(followupReply("heavier")).toContain("전문가");
  });
  it("깨진 저장값은 없는 것으로 본다", () => {
    const st = mem();
    st.setItem(FOLLOWUP_KEY, "{not json");
    expect(readFollowup(st)).toBeNull();
  });
});
