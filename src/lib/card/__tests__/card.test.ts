import { describe, expect, it } from "vitest";
import { buildPremiumReport } from "@/lib/premium/report";
import type { BirthInput } from "@/lib/saju/types";
import { qrModules, inviteLine } from "../invite";
import { buildPhotoCardData, clipQuote, formatDate, photoAltText, photoFileName, shareCaption } from "../photoData";
import { fitText, wrapText } from "../text";

/** 글자 하나를 폭 10 으로 치는 가짜 측정기 (공백은 4) */
const m10 = (t: string) => Array.from(t).reduce((w, ch) => w + (ch === " " ? 4 : 10), 0);

describe("wrapText", () => {
  it("짧으면 한 줄", () => {
    expect(wrapText(m10, "안녕", 100)).toEqual(["안녕"]);
  });
  it("공백에서 먼저 끊는다", () => {
    expect(wrapText(m10, "오늘 이 마음 맞지", 60)).toEqual(["오늘 이 마음", "맞지"]);
  });
  it("공백이 없으면 글자 단위로 끊는다", () => {
    expect(wrapText(m10, "가나다라마바사아", 30)).toEqual(["가나다", "라마바", "사아"]);
  });
  it("줄바꿈 문자를 지킨다", () => {
    expect(wrapText(m10, "가\n나", 100)).toEqual(["가", "나"]);
  });
  it("줄 끝 공백은 폭에 포함하지 않는다", () => {
    expect(wrapText(m10, "가나 다라", 20)).toEqual(["가나", "다라"]);
  });
});

describe("fitText", () => {
  const measureAt = (size: number) => (t: string) => m10(t) * (size / 10);
  it("들어가면 가장 큰 글자로", () => {
    const r = fitText(measureAt, "안녕하세요", 200, 2, 12, 8);
    expect(r.fontSize).toBe(12);
    expect(r.truncated).toBe(false);
  });
  it("넘치면 글자를 줄여서 줄 수를 맞춘다", () => {
    const r = fitText(measureAt, "가".repeat(30), 100, 2, 10, 5);
    expect(r.lines.length <= 2).toBe(true);
    expect(r.fontSize < 10).toBe(true);
    expect(r.truncated).toBe(false);
  });
  it("그래도 넘치면 말줄임표로 자른다", () => {
    const r = fitText(measureAt, "가".repeat(200), 100, 2, 10, 8);
    expect(r.truncated).toBe(true);
    expect(r.lines.length).toBe(2);
    expect(r.lines[1].endsWith("…")).toBe(true);
    expect(measureAt(8)(r.lines[1]) <= 100).toBe(true);
  });
});

const input: BirthInput = { year: 1990, month: 7, day: 13, hour: 8, minute: 30, calendar: "solar", isLeapMonth: false, gender: "female" };
const report = buildPremiumReport(input, new Date("2026-10-18T00:00:00+09:00"), "basic", "연애운");

describe("buildPhotoCardData", () => {
  const date = new Date(2026, 9, 18);
  const data = buildPhotoCardData(report, { date, siteLabel: "example.vercel.app" });
  it("주제별 분석에서 카드에 필요한 값만 가져온다", () => {
    expect(data.topic).toBe("love");
    expect(data.topicLabel).toBe("연애운");
    expect(data.headline).toBe(report.topic.headline);
    expect(data.quote).toBe(report.topic.quote);
    expect(data.tags).toEqual(report.topic.tags);
    expect(data.dateLabel).toBe("2026.10.18");
    expect(data.siteLabel).toBe("example.vercel.app");
  });
  it("AI 한마디가 있으면 그 문장을 쓰고, 길면 줄인다", () => {
    const ai = buildPhotoCardData(report, { date, siteLabel: "x", aiQuote: "오늘 마음, 맞지? 천천히 가도 괜찮아." });
    expect(ai.quote).toBe("오늘 마음, 맞지? 천천히 가도 괜찮아.");
    const long = buildPhotoCardData(report, { date, siteLabel: "x", aiQuote: "가".repeat(200) });
    expect(Array.from(long.quote).length).toBeLessThanOrEqual(65);
  });
  it("사주 원국 같은 자세한 풀이 문장은 카드에 넣지 않는다", () => {
    const all = JSON.stringify(data);
    expect(all.includes("庚午")).toBe(false);
  });
  it("읽기용 설명과 공유 문구에 핵심 내용이 있다", () => {
    const alt = photoAltText(data);
    for (const s of ["연애운 포토카드", data.headline, data.quote, data.lucky.color]) expect(alt.includes(s)).toBe(true);
    const cap = shareCaption(data, "https://example.vercel.app");
    for (const s of [data.headline, ...data.tags, "#도리운세사주", "https://example.vercel.app"]) expect(cap.includes(s)).toBe(true);
  });
});

describe("프리미엄 포토카드 데이터", () => {
  const full = buildPremiumReport(input, new Date("2026-10-18T00:00:00+09:00"), "full", "연애 결혼 리포트");
  const date = new Date(2026, 9, 18);
  it("일반(basic)은 basic 카드, 프리미엄(full)은 premium 카드", () => {
    expect(buildPhotoCardData(report, { date, siteLabel: "x" }).tier).toBe("basic");
    expect(buildPhotoCardData(report, { date, siteLabel: "x" }).luxe).toBeNull();
    const d = buildPhotoCardData(full, { date, siteLabel: "x" });
    expect(d.tier).toBe("premium");
    expect(d.luxe?.pillars.length).toBe(4);
    expect(d.luxe?.dayLabel.endsWith("일주")).toBe(true);
    expect(photoAltText(d).startsWith("프리미엄 ")).toBe(true);
    expect(shareCaption(d, "https://x.app").includes("#프리미엄사주")).toBe(true);
  });
  it("시간을 모르면 시주는 null", () => {
    const r = buildPremiumReport({ ...input, hour: null, minute: null }, new Date("2026-10-18T00:00:00+09:00"), "full", "");
    expect(buildPhotoCardData(r, { date, siteLabel: "x" }).luxe?.pillars[3]).toBeNull();
  });
});

describe("clipQuote", () => {
  it("이모지는 캔버스에서 깨지지 않도록 뺀다", () => {
    expect(clipQuote("오늘 마음, 맞지? 🌸")).toBe("오늘 마음, 맞지?");
  });
  it("짧으면 그대로, 공백은 정리", () => {
    expect(clipQuote("  안녕   하세요 ")).toBe("안녕 하세요");
  });
  it("문장 끝에서 자연스럽게 자른다", () => {
    const t = "오늘은 천천히 가도 괜찮아요. " + "나".repeat(80);
    expect(clipQuote(t, 30)).toBe("오늘은 천천히 가도 괜찮아요.");
  });
});

describe("파일 이름/날짜", () => {
  it("월·일을 두 자리로 맞춘다", () => {
    expect(formatDate(new Date(2026, 0, 5))).toBe("2026.01.05");
    expect(photoFileName("love", new Date(2026, 9, 18))).toBe("dori-photocard-love-20261018.png");
  });
});

describe("친구 초대(QR)", () => {
  const date = new Date(2026, 9, 18);
  it("주소로 정사각형 QR 표를 만들고, 주소가 없으면 만들지 않는다", () => {
    const m = qrModules("https://example.vercel.app");
    expect(m).not.toBeNull();
    expect(m!.length).toBeGreaterThanOrEqual(21);
    expect(m!.every((row) => row.length === m!.length)).toBe(true);
    expect(qrModules("")).toBeNull();
  });
  it("공유 문구에 친구 초대 문장과 주소가 같이 들어간다", () => {
    const d = buildPhotoCardData(report, { date, siteLabel: "x", shareUrl: "https://example.vercel.app" });
    expect(d.shareUrl).toBe("https://example.vercel.app");
    expect(shareCaption(d, "https://example.vercel.app")).toContain("너도 무료로 볼 수 있어요");
    expect(buildPhotoCardData(report, { date, siteLabel: "x" }).shareUrl).toBe("");
  });
  it("신년운은 한 해를 묻는 문구를 쓴다", () => {
    expect(inviteLine({ topic: "study", topicLabel: "2027 신년운" })).toContain("2027");
    expect(inviteLine({ topic: "love", topicLabel: "연애운" })).toContain("운세");
  });
});
