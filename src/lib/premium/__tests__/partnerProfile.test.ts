import { describe, expect, it } from "vitest";
import { partnerProfile, partnerTitle, profileSeed } from "../partnerProfile";

describe("partnerProfile", () => {
  it("직업·외모·성격·특징 네 줄이고 태그가 비어 있지 않아요", () => {
    for (const el of ["wood", "fire", "earth", "metal", "water"] as const) {
      for (let seed = 0; seed < 6; seed++) {
        const rows = partnerProfile("female", el, seed);
        expect(rows.map((r) => r.label)).toEqual(["직업", "외모", "성격", "특징"]);
        for (const r of rows) expect(r.tags.length).toBeGreaterThan(0);
      }
    }
  });
  it("키는 상대 성별에 맞는 범위예요", () => {
    for (let seed = 0; seed < 12; seed++) {
      const f = Number(partnerProfile("female", "water", seed)[1].tags[0].replace("cm", ""));
      const m = Number(partnerProfile("male", "water", seed)[1].tags[0].replace("cm", ""));
      expect(f).toBeGreaterThanOrEqual(158);
      expect(f).toBeLessThanOrEqual(166);
      expect(m).toBeGreaterThanOrEqual(172);
      expect(m).toBeLessThanOrEqual(182);
    }
  });
  it("같은 입력이면 같은 결과예요", () => {
    expect(partnerProfile("male", "fire", 3)).toEqual(partnerProfile("male", "fire", 3));
  });
  it("사람(생년월일시)마다 프로필이 고르게 달라져요", () => {
    const set = new Set<string>();
    for (let d = 1; d <= 28; d++) set.add(JSON.stringify(partnerProfile("female", "water", profileSeed({ year: 1990, month: 5, day: d, hour: 8 }))));
    expect(set.size).toBeGreaterThan(20);
    expect(profileSeed({ year: 1990, month: 5, day: 3, hour: 8 })).toBe(profileSeed({ year: 1990, month: 5, day: 3, hour: 8 }));
  });
  it("한 줄 안에서 같은 태그가 겹치지 않아요", () => {
    for (let s = 0; s < 200; s++) for (const r of partnerProfile("male", "fire", s * 7919)) expect(new Set(r.tags).size).toBe(r.tags.length);
  });
  it("제목에 닉네임이 들어가고 없으면 '당신'이에요", () => {
    expect(partnerTitle("철수")).toBe("철수 님의 미래 운명의 짝");
    expect(partnerTitle(null)).toBe("당신 님의 미래 운명의 짝");
  });
});
