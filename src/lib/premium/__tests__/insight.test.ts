import { describe, expect, it } from "vitest";
import { gzTopic, careerSections, comboSections, hiddenGods, hiddenGroupCount, interactionLine, interactions, johuSection, loveSections, mainStemOf, monthSection, natalRelations, yongsinRoleSection, GOD_MONTH_LINE, GOD_PAST_YEAR, PLACE_GROUP } from "../book/insight";
import { buildLookBack } from "../book/resonance";

// 1988-11-04 16:55 남자: 戊辰 壬戌 癸亥 庚申
const P = { year: "戊辰", month: "壬戌", day: "癸亥", hour: "庚申" } as const;

describe("지장간", () => {
  it("본기를 돌려준다", () => {
    expect(mainStemOf("亥")).toBe("壬");
    expect(mainStemOf("午")).toBe("丁");
    expect(mainStemOf("寅")).toBe("甲");
  });
  it("재성이 겉으로는 0개여도 戌 속 丁(편재)이 잡힌다", () => {
    const h = hiddenGods("癸", P);
    expect(h.some((x) => x.stem === "丁" && x.god === "편재" && x.pos === "month")).toBe(true);
    expect(hiddenGroupCount(h).재성).toBe(1);
  });
});

describe("원국 안의 관계", () => {
  const rels = natalRelations(P);
  it("辰戌충(연-월), 申辰 반합(연-시), 亥申해(일-시), 辰亥 원진(연-일)을 찾는다", () => {
    const keys = rels.map((r) => `${r.type}:${r.a}-${r.b}`);
    expect(keys).toContain("충:year-month");
    expect(keys).toContain("반합:year-hour");
    expect(keys).toContain("해:day-hour");
    expect(keys).toContain("원진:year-day");
  });
  it("제목이 관계 이름으로 시작하고(잠금 규칙), 자리 이야기가 들어간다", () => {
    for (const r of rels) expect(/^(충|육합|반합|형|해|원진)/.test(r.heading)).toBe(true);
    expect(rels.find((r) => r.type === "충")?.body).toContain("사회로 나아가는 자리");
    expect(rels.find((r) => r.type === "해")?.body).toContain("배우자 자리");
  });
});

describe("세운·대운·월운과 원국의 만남", () => {
  it("2026 丙午: 丙壬충(월간)과 午戌반합(월지)", () => {
    const list = interactions(P, { label: "2026년 세운", ganzhi: "丙午" }).map((x) => x.text);
    expect(list.some((t) => t.startsWith("丙壬충"))).toBe(true);
    expect(list.some((t) => t.startsWith("午戌반합"))).toBe(true);
  });
  it("대운 丙寅: 寅亥육합(일지)과 寅申충(시지)", () => {
    const list = interactions(P, { label: "대운", ganzhi: "丙寅" }).map((x) => x.text);
    expect(list.some((t) => t.startsWith("寅亥육합"))).toBe(true);
    expect(list.some((t) => t.startsWith("寅申충"))).toBe(true);
  });
  it("10월 戊戌: 戊癸합(일간), 戌辰충(연지)", () => {
    const list = interactions(P, { label: "10월", ganzhi: "戊戌" }).map((x) => x.text);
    expect(list.some((t) => t.startsWith("戊癸합"))).toBe(true);
    expect(list.some((t) => t.startsWith("戌辰충"))).toBe(true);
  });
  it("조사는 한글 읽기로 붙는다 (丙(병)이, 午(오)가)", () => {
    const l = interactionLine(P, { label: "2026년 세운", ganzhi: "丙午" }) ?? "";
    expect(l).toContain("丙(병)이");
    expect(l).toContain("午(오)가");
    expect(l).not.toMatch(/병이\)|오가\)/);
  });
  it("관계가 없으면 null", () => {
    expect(interactionLine({ year: "甲子" }, { label: "x", ganzhi: "丙寅" })).toBeNull();
  });
});

describe("조후·용신·십성 조합", () => {
  it("癸水가 戌월(가을)에 태어나면 득령으로 풀고 온기·윤기를 말한다", () => {
    const s = johuSection("癸", "戌");
    expect(s?.heading).toContain("조후");
    expect(s?.body).toContain("가을");
    expect(s?.body).toContain("득령");
  });
  it("용신 금·목·화를 일간 癸 기준 인성·식상·재성의 길로 푼다", () => {
    const b = yongsinRoleSection("癸", ["금", "목", "화"], "신강")?.body ?? "";
    expect(b).toContain("금은 인성의 길");
    expect(b).toContain("목은 식상의 길");
    expect(b).toContain("화는 재성의 길");
  });
  it("정관+정인이면 관인상생", () => {
    expect(comboSections(["정관", "겁재", "정인", "정관"]).map((c) => c.heading)[0]).toContain("관인상생");
  });
  it("조합이 없으면 빈 배열", () => {
    expect(comboSections(["비견"])).toEqual([]);
  });
});

describe("연애 심층(배우자 별)", () => {
  const base = { dayStem: "癸", gender: "남", pillars: P, dayBranchGod: "겁재", year: 2026, seyun: "丙午", seyunNext: "丁未", daeunNow: { ganzhi: "丙寅", startAge: 31, endAge: 40 }, daeunNext: { ganzhi: "丁卯", startAge: 41 } };
  it("재성이 겉으로 0개면 지장간의 丁(편재)을 짚고, 대운에서 드러난다고 말한다", () => {
    const l = loveSections(base);
    expect(l.core[0].body).toContain("지장간");
    expect(l.core[0].body).toContain("丁(편재)");
    expect(l.core[1].heading).toContain("겁재");
    expect(l.timing?.heading).toBe("2026년 흐름 · 인연의 시기");
    expect(l.timing?.body).toContain("숨어 있던");
    expect(l.timing?.body).toContain("丙(병)이");
  });
  it("여성이면 관성이 배우자 별", () => {
    const l = loveSections({ ...base, gender: "여" });
    expect(l.core[0].heading).toContain("관성");
  });
  it("단정·겁주는 표현이 없다", () => {
    const l = loveSections(base);
    const all = JSON.stringify([l.core, l.timing]);
    expect(all).not.toMatch(/이혼|사망|파산|불행|반드시|틀림없이/);
  });
});

describe("월별·지난해 변주", () => {
  it("월운 한 줄이 십성마다 다르다", () => {
    expect(new Set(Object.values(GOD_MONTH_LINE)).size).toBe(10);
    expect(new Set(Object.values(GOD_PAST_YEAR)).size).toBe(10);
    expect(Object.keys(PLACE_GROUP).sort()).toEqual(["day", "hour", "month", "year"]);
  });
  it("이번 달 섹션이 간지·십성과 관계를 담는다", () => {
    const s = monthSection(P, [{ label: "10월경(이번 달)", ganzhi: "戊戌", stemGod: "정관" }]);
    expect(s?.body).toContain("戊戌(정관)");
    expect(s?.body).toContain("戌辰충");
    expect(monthSection(P, [])).toBeNull();
  });
  it("지난 두 해 되짚기: 십성이 다르면 문장도 다르다", () => {
    const s = buildLookBack([{ year: 2024, ganzhi: "甲辰", group: "식상", god: "상관" }, { year: 2025, ganzhi: "乙巳", group: "식상", god: "식신" }]);
    expect(s?.checks?.[0]).not.toBe(s?.checks?.[1]?.replace("2025년(乙巳)", "2024년(甲辰)"));
    expect(s?.checks?.[0]).toContain(GOD_PAST_YEAR["상관"]);
    expect(s?.checks?.[1]).toContain(GOD_PAST_YEAR["식신"]);
  });
});

describe("재물·성공 심층", () => {
  const base = { dayStem: "癸", gender: "남", pillars: P, year: 2026, seyun: "丙午", seyunNext: "丁未", daeunNow: { ganzhi: "丙寅", startAge: 31, endAge: 40 }, daeunNext: null, monthStemGod: "겁재", monthBranchGod: "정관" };
  it("재물: 재성이 겉으론 0개, 지장간 丁(편재), 대운·세운에서 재성이 들어온다고 풀이", () => {
    const c = careerSections(base, "money");
    expect(c.core[0].heading).toContain("재물의 별");
    expect(c.core[0].body).toContain("丁(편재)");
    expect(c.timing?.heading).toBe("2026년 흐름 · 재물의 시기");
    expect(c.timing?.body).toContain("丙午");
    expect(c.timing?.body).toContain("丙(병)이");
  });
  it("성공: 월주 정관을 일·직업 자리로 풀고, 관성이 여러 개임을 말한다", () => {
    const c = careerSections(base, "success");
    expect(c.core[0].body).toContain("정관");
    expect(c.core[1].heading).toContain("일·직업 자리(월주)");
    expect(c.core[1].body).toContain("안정적인 직장");
  });
  it("월주가 충·합에 얽히면 일·직업 자리의 어울림 섹션이 붙는다", () => {
    const c = careerSections(base, "success");
    expect(c.core.some((x) => x.heading.startsWith("일·직업 자리의 어울림"))).toBe(true);
  });
});

describe("간지 조사", () => {
  it("丙午 → 丙午(병오)는, 丙寅 → 丙寅(병인)은", () => {
    expect(gzTopic("丙午")).toBe("丙午(병오)는");
    expect(gzTopic("丙寅")).toBe("丙寅(병인)은");
  });
});

describe("사주 vs 현실 3갈래", () => {
  it("모든 갈래가 응원으로 끝나고 금액·나이 같은 숫자 단정이 없다", async () => {
    const { realityCheck } = await import("../book/reality");
    for (const k of ["money", "career", "love"] as const) {
      const rc = realityCheck(k);
      expect(rc.options.length).toBe(3);
      expect(rc.options.map((o) => o.label)).toEqual(["아직 못 미쳐요", "딱 맞아요", "이미 넘어섰어요"]);
      for (const o of rc.options) {
        expect(/[0-9]+\s?(억|원|만원|세)/.test(o.message)).toBe(false);
        expect(/(망|불행|파산|이혼|위험)/.test(o.message)).toBe(false);
      }
      expect(rc.options[0].message).toContain("이 운을 잡아 봐요");
      expect(rc.options[1].message).toContain("맞죠");
    }
  });
});
