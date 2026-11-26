import { describe, it, expect } from "vitest";
import { cleanSticker, STICKER_IDS } from "../stickers";
import { CHAT_SCHEMA } from "../chat";
import { existsSync } from "node:fs";
import { join } from "node:path";

describe("도리 스티커", () => {
  it("아는 이름만 통과하고 none·모르는 값은 null", () => {
    expect(cleanSticker("pat")).toBe("pat");
    expect(cleanSticker("none")).toBeNull();
    expect(cleanSticker("zzz")).toBeNull();
    expect(cleanSticker(3)).toBeNull();
  });
  it("모든 스티커에 그림 파일이 있고 스키마에 들어가 있어요", () => {
    for (const id of STICKER_IDS) expect(existsSync(join(process.cwd(), "public/images/stickers", `${id}.webp`))).toBe(true);
    expect(CHAT_SCHEMA.properties.sticker.enum).toContain("nod");
    expect(CHAT_SCHEMA.required).toContain("sticker");
  });
});
