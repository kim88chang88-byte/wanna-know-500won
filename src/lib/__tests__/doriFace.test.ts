import { describe, expect, it } from "vitest";
import { doriFace } from "../doriFace";
import { MACHINES } from "@/components/landing/data";
import { IMAGES } from "@/components/landing/images";

describe("doriFace", () => {
  it("질문지 말풍선 동물이 자판기 카드 동물과 같다", () => {
    for (const m of MACHINES) expect(doriFace(m.fortune), m.fortune).toBe(IMAGES[m.image]);
  });
  it("연애·결혼운은 판다 커플, 궁합은 판다 웨딩, 그 밖은 수달", () => {
    expect(doriFace("연애·결혼운")).toBe("/images/animal-panda-couple.webp");
    expect(doriFace("둘의 궁합")).toBe("/images/animal-panda-wedding.webp");
    expect(doriFace("프리미엄 종합 사주")).toBe("/images/animal-otter.webp");
  });
});
