import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { GOLDEN_MACHINE, MACHINES, PREMIUM_CARDS, SAMPLE_CAPSULES, SLOTS } from "../data";
import { HOBO_IMAGE, MACHINE_IMAGE, PREMIUM_MACHINE_IMAGE } from "../images";

const allKeys = [
  GOLDEN_MACHINE.key,
  ...MACHINES.map((m) => m.key),
  ...SLOTS.map((s) => s.key),
  ...PREMIUM_CARDS.map((p) => p.key),
];

describe("랜딩 카드 데이터", () => {
  it('"6대" 문구와 개수가 맞는다 (자판기 6, 슬롯 6, 프리미엄 3)', () => {
    expect(MACHINES).toHaveLength(6);
    expect(SLOTS).toHaveLength(6);
    expect(PREMIUM_CARDS).toHaveLength(3);
  });

  it("모든 뽑기 버튼의 key 가 서로 다르다 (회전 애니메이션이 한 버튼에만 걸리도록)", () => {
    expect(new Set(allKeys).size).toBe(allKeys.length);
  });

  it("자판기와 슬롯의 운 종류가 같은 순서로 짝지어진다", () => {
    const base = (name: string) => name.replace(/ ?(자판기|슬롯)$/, "");
    expect(SLOTS.map((s) => base(s.name))).toEqual(MACHINES.map((m) => base(m.name)));
  });

  it("BEST 는 연애운 자판기 하나뿐", () => {
    expect(MACHINES.filter((m) => m.best).map((m) => m.fortune)).toEqual(["연애운"]);
  });

  it("비어 있는 문구가 없다", () => {
    for (const m of MACHINES) expect([m.badge, m.name, m.fortune, m.desc].every(Boolean)).toBe(true);
    for (const s of SLOTS) expect([s.no, s.icon, s.name, s.desc].every(Boolean)).toBe(true);
    for (const p of PREMIUM_CARDS) expect([p.tag, p.title, p.desc, p.perk].every(Boolean)).toBe(true);
  });

  it("프리미엄 리본은 판매 실적을 단정하는 문구(1위 등)를 쓰지 않는다", () => {
    for (const p of PREMIUM_CARDS) expect(p.ribbon ?? "").not.toMatch(/1위|압도적/);
  });

  it("풀이 예시는 실존 인물처럼 보이는 정보(이름·나이·지역)를 담지 않는다", () => {
    const text = JSON.stringify(SAMPLE_CAPSULES);
    expect(text).not.toMatch(/\*\*|님 \(|세,|적중률/);
    expect(SAMPLE_CAPSULES).toHaveLength(3);
  });
});

describe("이미지 주소", () => {
  it("이미지는 https 주소이거나 public 의 /images/ 경로다", () => {
    for (const url of [HOBO_IMAGE, MACHINE_IMAGE, PREMIUM_MACHINE_IMAGE]) {
      expect(/^(https:\/\/|\/images\/)/.test(url)).toBe(true);
    }
  });
});

describe("문구 가이드 (BRIEF.md: 뽑기 언어, 겁주거나 신비롭게 포장하지 않기)", () => {
  const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const text = ["Sections.tsx", "Modals.tsx", "Landing.tsx", "IntakeModal.tsx", "MenuButton.tsx", "data.ts"]
    .map((f) => readFileSync(path.join(dir, f), "utf8").replace(/\/\*[\s\S]*?\*\/|\/\/.*$|\{\/\*[\s\S]*?\*\/\}/gm, ""))
    .join("\n");

  it.each(["성적 판타지", "속마음", "적중률", "복채", "처방전", "부적", "비책", "꽃도사", "2025"])(
    "'%s' 표현이 없다",
    (word) => {
      expect(text).not.toContain(word);
    },
  );

  it('무료 안내는 항상 "매일 첫 1회 무료"로 쓴다', () => {
    expect(text).not.toMatch(/(?<!매일 )첫 ?1회 ?무료/);
  });
});
