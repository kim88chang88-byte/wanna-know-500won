import { describe, expect, it } from "vitest";
import { adminIds, isAdmin } from "../auth";
import { buildStats, concernsToCsv, csvCell, daysBetween, sinceDayFor } from "../stats";

describe("관리자 판별", () => {
  it("환경변수에 있는 고유번호만 관리자", () => {
    const env = { ADMIN_USER_IDS: " 123 , g_abc ,," };
    expect(adminIds(env)).toEqual(["123", "g_abc"]);
    expect(isAdmin("123", env)).toBe(true);
    expect(isAdmin("g_abc", env)).toBe(true);
    expect(isAdmin("12", env)).toBe(false);
    expect(isAdmin("1234", env)).toBe(false);
  });
  it("목록이 비어 있거나 로그인 안 했으면 아무도 관리자가 아님", () => {
    expect(isAdmin("123", {})).toBe(false);
    expect(isAdmin("123", { ADMIN_USER_IDS: "" })).toBe(false);
    expect(isAdmin("", { ADMIN_USER_IDS: "," })).toBe(false);
    expect(isAdmin(null, { ADMIN_USER_IDS: "123" })).toBe(false);
  });
});

describe("집계", () => {
  const now = new Date("2026-10-18T03:00:00Z"); // KST 12시
  it("기간 날짜를 빠짐없이 채워요", () => {
    expect(sinceDayFor(7, now)).toBe("2026-10-12");
    expect(daysBetween("2026-10-12", "2026-10-18")).toHaveLength(7);
  });
  it("뽑기·가입·고민 집계", () => {
    const s = buildStats({
      days: 7,
      now,
      totals: { users: 5, profiles: 2, draws: 9, concernLogs: 3 },
      draws: [
        { day: "2026-10-17", topic: "love" },
        { day: "2026-10-17", topic: "money" },
        { day: "2026-10-18", topic: "love" },
      ],
      signups: [{ created_at: "2026-10-17T15:30:00Z" }], // KST 10-18 00:30
      concerns: [
        { day: "2026-10-18", topic: "love", tags: ["crush", "job", "hack"], concern_text: "썸이 고민", gender: "female", age_band: "30s" },
        { day: "2026-10-17", topic: "general", tags: ["job"], concern_text: null, gender: "female", age_band: "20s" },
        { day: "2026-10-17", topic: "general", tags: [], concern_text: "그냥 힘들어요", gender: "male", age_band: "30s" },
      ],
    });
    expect(s.drawsByDay).toHaveLength(7);
    expect(s.drawsByDay.find((d) => d.day === "2026-10-17")?.count).toBe(2);
    expect(s.drawsByDay.find((d) => d.day === "2026-10-13")?.count).toBe(0);
    expect(s.drawsByTopic[0]).toEqual({ topic: "연애운", count: 2 });
    expect(s.signupsByDay.find((d) => d.day === "2026-10-18")?.count).toBe(1);
    expect(s.concernTags[0]).toEqual({ id: "job", label: "이직·퇴사 타이밍", count: 2 });
    expect(s.concernTags.some((t) => t.id === "hack")).toBe(false); // 모르는 id 는 집계하지 않음
    expect(s.concernByAge.map((a) => [a.ageBand, a.total])).toEqual([["20s", 1], ["30s", 1]]);
    expect(s.genderSplit.find((g) => g.gender === "여성")?.count).toBe(2);
    expect(s.recentTexts.map((t) => t.text)).toEqual(["썸이 고민", "그냥 힘들어요"]);
    expect(JSON.stringify(s)).not.toMatch(/user_id|1990/);
  });
});

describe("CSV", () => {
  it("엑셀 수식 주입을 막고 따옴표를 처리", () => {
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(csvCell("+1")).toBe("'+1");
    expect(csvCell('a,"b"')).toBe('"a,""b"""');
    expect(csvCell(null)).toBe("");
  });
  it("머리글 + BOM + 줄 수", () => {
    const csv = concernsToCsv([{ day: "2026-10-18", topic: "love", tags: ["crush"], concern_text: "=1+1", gender: "female", age_band: "30s" }]);
    expect(csv.startsWith("﻿날짜,")).toBe(true);
    expect(csv.trim().split("\r\n")).toHaveLength(2);
    expect(csv).toContain("'=1+1");
    expect(csv).toContain("썸·짝사랑이 어떻게 될지");
  });
});
