import { describe, expect, it } from "vitest";
import { canonicalOrigin } from "../siteOrigin";

describe("canonicalOrigin", () => {
  const cur = "https://wanna-know-500won.vercel.app";

  it("설정된 https 대표 주소가 있으면 그 주소를 써요 (경로·끝 슬래시는 버려요)", () => {
    expect(canonicalOrigin("https://www.doyusaju.com", cur)).toBe("https://www.doyusaju.com");
    expect(canonicalOrigin(" https://www.doyusaju.com/ ", cur)).toBe("https://www.doyusaju.com");
    expect(canonicalOrigin("https://www.doyusaju.com/some/path?x=1", cur)).toBe("https://www.doyusaju.com");
  });

  it("설정이 없거나 비어 있으면 지금 접속한 주소를 써요", () => {
    expect(canonicalOrigin(undefined, cur)).toBe(cur);
    expect(canonicalOrigin(null, cur)).toBe(cur);
    expect(canonicalOrigin("", cur)).toBe(cur);
    expect(canonicalOrigin("   ", cur)).toBe(cur);
  });

  it("http·잘못된 값·계정 정보가 든 주소는 믿지 않고 지금 주소를 써요", () => {
    expect(canonicalOrigin("http://www.doyusaju.com", cur)).toBe(cur);
    expect(canonicalOrigin("doyusaju.com", cur)).toBe(cur);
    expect(canonicalOrigin("https://user:pw@www.doyusaju.com", cur)).toBe(cur);
    expect(canonicalOrigin("javascript:alert(1)", cur)).toBe(cur);
  });
});
