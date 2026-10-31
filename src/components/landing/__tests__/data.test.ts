import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { MACHINES, PREMIUM_CARDS, SAMPLE_CAPSULES } from "../data";
import { IMAGES } from "../images";

const allKeys = [...MACHINES.map((m) => m.key), ...PREMIUM_CARDS.map((p) => p.key)];

describe("랜딩 카드 데이터", () => {
  it('"6대" 문구와 개수가 맞는다 (자판기 6, 프리미엄 종합 사주 1)', () => {
    expect(MACHINES).toHaveLength(6);
    expect(PREMIUM_CARDS).toHaveLength(1);
  });

  it("모든 카드의 key 가 서로 다르다", () => {
    expect(new Set(allKeys).size).toBe(allKeys.length);
  });

  it("'HOT' 스티커는 성공운·재물운·연애·결혼운·둘의 궁합, 'NEW' 스티커는 2027 신년운 카드에만 붙는다", () => {
    expect(MACHINES.filter((m) => m.sticker === "HOT").map((m) => m.fortune)).toEqual(["성공운", "재물운", "연애·결혼운", "둘의 궁합"]);
    expect(MACHINES.filter((m) => m.sticker === "NEW").map((m) => m.fortune)).toEqual(["2027 신년운"]);
    expect(MACHINES.filter((m) => m.sticker).length).toBe(5);
  });

  it("BEST 는 연애운 자판기 하나뿐", () => {
    expect(MACHINES.filter((m) => m.best).map((m) => m.fortune)).toEqual(["연애·결혼운"]);
  });

  it("자판기의 운 종류가 서버가 알아보는 여섯 가지와 같다", () => {
    expect(MACHINES.map((m) => m.fortune)).toEqual(["2027 신년운", "성공운", "재물운", "연애·결혼운", "둘의 궁합", "건강운"]);
  });

  it("둘의 궁합은 1,000원 카드이고 상대방 정보를 받는 풀이로 열린다", () => {
    const c = MACHINES.find((m) => m.fortune === "둘의 궁합");
    expect(c?.price).toBe("1,000원");
    expect(c?.premium).toBe(true);
    expect(c?.fortune.includes("궁합")).toBe(true);
  });

  it("비어 있는 문구가 없다", () => {
    for (const m of MACHINES) {
      expect([m.badge, m.name, m.fortune, m.desc, m.tag, m.emoji].every(Boolean)).toBe(true);
    }
    for (const p of PREMIUM_CARDS) {
      expect([p.tag, p.title, p.desc, p.emoji].every(Boolean)).toBe(true);
    }
  });

  it("프리미엄 리본은 판매 실적을 단정하는 문구(1위 등)를 쓰지 않는다", () => {
    for (const p of PREMIUM_CARDS) expect(p.ribbon ?? "").not.toMatch(/1위|압도적/);
  });

  it("가격 비교(정가·할인율)나 지어낸 순위 표시가 없다", () => {
    const text = JSON.stringify([MACHINES, PREMIUM_CARDS]);
    expect(text).not.toMatch(/OFF|정가|TOP ?\d|%/);
  });

  it("풀이 예시는 실존 인물처럼 보이는 정보(이름·나이·지역)를 담지 않는다", () => {
    const text = JSON.stringify(SAMPLE_CAPSULES);
    expect(text).not.toMatch(/\*\*|님 \(|세,|적중률/);
    expect(SAMPLE_CAPSULES).toHaveLength(3);
  });
});

describe("이미지 주소", () => {
  it("모든 카드의 이미지 키가 imageManifest 에 있다", () => {
    for (const c of [...MACHINES, ...PREMIUM_CARDS]) expect(Boolean(IMAGES[c.image])).toBe(true);
    expect(Boolean(IMAGES.logo)).toBe(true);
    expect(Boolean(IMAGES.hero)).toBe(true);
  });

  it("이미지는 https 주소이거나 public 의 /images/ 경로다", () => {
    for (const url of Object.values(IMAGES)) {
      expect(/^(https:\/\/|\/images\/)/.test(url)).toBe(true);
    }
  });
});

describe("문구 가이드 (BRIEF.md: 뽑기 언어, 겁주거나 신비롭게 포장하지 않기)", () => {
  const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const text = ["Sections.tsx", "Modals.tsx", "Landing.tsx", "IntakeModal.tsx", "MenuButton.tsx", "data.ts"]
    .map((f) => readFileSync(path.join(dir, f), "utf8").replace(/\/\*[\s\S]*?\*\/|\/\/.*$|\{\/\*[\s\S]*?\*\/\}/gm, ""))
    .join("\n");

  it.each(["성적 판타지", "속마음", "적중률", "복채", "처방전", "부적", "비책", "꽃도사", "꽃거지", "2025", "2026"])(
    "'%s' 표현이 없다",
    (word) => {
      expect(text).not.toContain(word);
    },
  );

  it("지어낸 후기·통계 표현이 없다", () => {
    expect(text).not.toMatch(/누적 복채|만족도|실시간 연동|친구 추천|평점/);
  });

  it('무료 안내는 항상 "매일 첫 1회 무료"로 쓴다', () => {
    expect(text).not.toMatch(/(?<!매일 )첫 ?1회 ?무료/);
  });

  it("일반 자판기는 동물 그림(성공운 용, 재물운 토끼, 연애운 남자 팬더, 결혼운 여자 팬더, 건강운 여우, 학업운 수달)을 쓰고, 프리미엄은 일반과 구분되는 전용 배경 일러스트(premium-main.webp)을 쓴다", () => {
    const animal: Record<string, string> = { 성공운: "dragon", 재물운: "rabbit-rich", "연애·결혼운": "panda-couple", "둘의 궁합": "panda-wedding", 건강운: "fox-run", "2027 신년운": "otter-newyear" };
    for (const m of MACHINES) expect(IMAGES[m.image]).toBe(`/images/animal-${animal[m.fortune]}.webp`);
    for (const c of PREMIUM_CARDS) expect(IMAGES[c.image]).toBe("/images/premium-main.webp");
  });

  it("프리미엄은 '프리미엄 종합 사주' 하나만 있다", () => {
    expect(PREMIUM_CARDS.map((c) => c.key)).toEqual(["premium-all"]);
    expect(PREMIUM_CARDS[0].title).toBe("프리미엄 종합 사주");
    expect(PREMIUM_CARDS[0].fortune).toBe("프리미엄 종합 사주");
  });
});
