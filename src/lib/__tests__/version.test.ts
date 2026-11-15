import { describe, expect, it } from "vitest";
import { deployInfo } from "../version";

describe("배포 버전 표시", () => {
  it("커밋 번호는 7자리, 설명은 첫 줄만", () => {
    const v = deployInfo({ VERCEL_GIT_COMMIT_SHA: "abcdef1234567890", VERCEL_GIT_COMMIT_MESSAGE: "첫 줄\n둘째 줄", VERCEL_ENV: "production" }, "2026-11-15T08:00:00.000Z");
    expect(v).toEqual({ sha: "abcdef1", message: "첫 줄", env: "production", builtAt: "2026-11-15T08:00:00.000Z" });
  });
  it("환경변수가 없으면 local", () => {
    expect(deployInfo({}).sha).toBe("local");
  });
});
