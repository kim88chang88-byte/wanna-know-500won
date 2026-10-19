import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { MACHINES, PREMIUM_CARDS, SAMPLE_CAPSULES } from "../data";
import { IMAGES } from "../images";

const allKeys = [...MACHINES.map((m) => m.key), ...PREMIUM_CARDS.map((p) => p.key)];

describe("랜딩 카드 데이터", () => {
  it('"6대" 문구와 개수가 맞는다 (자판기 6, 프리미엄 3)', () => {
    expect(MACHINES).toHaveLength(6);
    expect(PREMIUM_CARDS).toHaveLength(3);
  });

  it("모든 뽑기 버튼의 key 가 서로 다르다 (회전 애니메이션이 한 버튼에만 걸리도록)", () => {
    expect(new Set(allKeys).size).toBe(allKeys.length);
  });

  it("BEST 는 연애운 자판기 하나뿐", () => {
    expect(MACHINES.filter((m) => m.best).map((m) => m.fortune)).toEqual(["연애운"]);
  });

  it("자판기의 운 종류가 서버가 알아보는 여섯 가지와 같다", () => {
    expect(MACHINES.map((m) => m.fortune)).toEqual(["성공운", "재물운", "연애운", "결혼운", "건강운", "학업운"]);
  });

  it("비어 있는 문구가 없다", () => {
    for (const m of MACHINES) {
      expect([m.badge, m.name, m.fortune, m.desc, m.leverLabel, m.tag, m.emoji].every(Boolean)).toBe(true);
    }
    for (const p of PREMIUM_CARDS) {
      expect([p.tag, p.title, p.desc, p.leverLabel, p.emoji].every(Boolean)).toBe(true);
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

  it("일반 자판기는 동물 그림(성공운 용, 재물운 토끼, 연애운 남자 팬더, 결혼운 여자 팬더, 건강운 여우, 학업운 수달)을 쓰고, 프리미엄은 일반과 구분되는 전용 그림(premium-*.webp)을 쓴다", () => {
    const animal: Record<string, string> = { 성공운: "dragon", 재물운: "rabbit", 연애운: "panda-m", 결혼운: "panda-f", 건강운: "fox", 학업운: "otter" };
    for (const m of MACHINES) expect(IMAGES[m.image]).toBe(`/images/animal-${animal[m.fortune]}.webp`);
    const premiumAnimal: Record<string, string> = { "premium-compat": "otter", "premium-dohwa": "rabbit", "premium-fortune": "dragon" };
    for (const c of PREMIUM_CARDS) expect(IMAGES[c.image]).toBe(`/images/premium-${premiumAnimal[c.key]}.webp`);
  });

  it("프리미엄은 궁합이 맨 앞이고 '도리 강추' 스티커는 궁합에만 붙는다", () => {
    expect(PREMIUM_CARDS[0].key).toBe("premium-compat");
    expect(PREMIUM_CARDS.filter((c) => c.ribbon).map((c) => c.key)).toEqual(["premium-compat"]);
    expect(PREMIUM_CARDS[0].ribbon).toBe("도리 강추");
  });
});
