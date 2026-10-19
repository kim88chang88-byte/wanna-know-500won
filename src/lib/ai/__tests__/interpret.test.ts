import { describe, expect, it } from "vitest";
import type { SajuChart } from "@/lib/saju/types";
import { analyzeChart } from "@/lib/saju/analysis";
import { interpretSaju, ReadingFailedError, ReadingUnavailableError } from "../interpret";
import { buildUserMessage } from "../prompt";

const chart: SajuChart = {
  year: { stem: "庚", branch: "午" },
  month: { stem: "辛", branch: "巳" },
  day: { stem: "甲", branch: "子" },
  hour: { stem: "戊", branch: "辰" },
  solarDate: { year: 1990, month: 5, day: 17 },
  uncertainPillars: [],
  warnings: [],
};

const goodJson = {
  keyword: "설렘 충전",
  total: { score: 4, summary: "마음이 한결 가벼워지는 하루야." },
  love: { score: 5, comment: "먼저 연락이 올지도 몰라." },
  money: { score: 3, comment: "작은 지출만 챙기면 든든해." },
  mind: { score: 4, comment: "오늘은 쉬어가도 괜찮아." },
  kkotgeoji: "오늘 이 마음, 맞지? 천천히 가도 괜찮아 🌸",
};

type Call = { url: string; init: any };
/** 순서대로 응답을 돌려주는 가짜 fetch */
function fakeFetch(responses: Array<() => Response | Promise<Response>>) {
  const calls: Call[] = [];
  const impl = (async (url: any, init: any) => {
    calls.push({ url: String(url), init });
    const next = responses[Math.min(calls.length - 1, responses.length - 1)];
    return next();
  }) as unknown as typeof fetch;
  return { impl, calls };
}
const okBody = (text: string, stop = "end_turn") =>
  new Response(JSON.stringify({ stop_reason: stop, content: [{ type: "text", text }] }), { status: 200 });

describe("analyzeChart", () => {
  it("일간과 오행 분포를 계산한다", () => {
    const f = analyzeChart(chart);
    expect(f.dayMaster.hanja).toBe("甲");
    expect(f.dayMaster.element).toBe("wood");
    // 庚金 午火 / 辛金 巳火 / 甲木 子水 / 戊土 辰土
    expect(f.elementCounts).toEqual({ wood: 1, fire: 2, earth: 2, metal: 2, water: 1 });
    expect(f.pillars.map((p) => p.text)).toEqual(["庚午(경오)", "辛巳(신사)", "甲子(갑자)", "戊辰(무진)"]);
  });

  it("시간을 모르면 6글자만 센다", () => {
    const f = analyzeChart({ ...chart, hour: null });
    expect(Object.values(f.elementCounts).reduce((a, b) => a + b, 0)).toBe(6);
    expect(f.hourKnown).toBe(false);
  });
});

describe("buildUserMessage", () => {
  it("요즘 고민이 있으면 프롬프트에 데이터로 들어가고, 없으면 빠져요", () => {
    const withC = buildUserMessage(chart, "general", "female", { tags: ["job"], text: "이직할까" });
    expect(withC).toContain("요즘고민");
    expect(withC).toContain("이직·퇴사 타이밍");
    expect(withC).toContain("이직할까");
    expect(buildUserMessage(chart, "general", "female", null)).not.toContain("요즘고민");
  });

  it("계산 결과와 주제를 담고, 출생 날짜는 담지 않는다", () => {
    const msg = buildUserMessage(chart, "love", "female");
    expect(msg).toContain("연애운");
    expect(msg).toContain("甲(갑)");
    expect(msg).toContain("여성");
    expect(msg).not.toContain("1990");
  });
});

describe("interpretSaju", () => {
  it("키가 없으면 ReadingUnavailableError", async () => {
    const saved = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    let err: unknown;
    try {
      await interpretSaju(chart, { topic: "general", gender: "male" });
    } catch (e) {
      err = e;
    }
    if (saved !== undefined) process.env.ANTHROPIC_API_KEY = saved;
    expect(err instanceof ReadingUnavailableError).toBe(true);
  });

  it("정상 응답을 파싱하고, 요청에 모델·스키마·키 헤더를 담는다", async () => {
    const { impl, calls } = fakeFetch([() => okBody(JSON.stringify(goodJson))]);
    const r = await interpretSaju(chart, { topic: "love", gender: "female", apiKey: "k-test", fetchImpl: impl });
    expect(r.keyword).toBe("설렘 충전");
    expect(calls.length).toBe(1);
    expect(calls[0].url).toBe("https://api.anthropic.com/v1/messages");
    expect(calls[0].init.headers["x-api-key"]).toBe("k-test");
    expect(calls[0].init.headers["anthropic-version"]).toBe("2023-06-01");
    const body = JSON.parse(calls[0].init.body);
    expect(body.model).toBe("claude-haiku-5-5");
    expect(body.output_config.format.type).toBe("json_schema");
    expect(body.output_config.format.schema.required.length).toBe(6);
    expect(body.max_tokens).toBe(1024);
    expect(body.system.length > 50).toBe(true);
  });

  it("extra 재료(오늘의 일진·사주 핵심)를 요청 본문에 담는다", async () => {
    const { impl, calls } = fakeFetch([() => okBody(JSON.stringify(goodJson))]);
    await interpretSaju(chart, {
      topic: "general", gender: "male", apiKey: "k", fetchImpl: impl,
      extra: { today: { year: 2000, month: 1, day: 1 }, core: { 신강신약: "신약" } },
    });
    const content = JSON.parse(calls[0].init.body).messages[0].content as string;
    expect(content).toContain("오늘의일진");
    expect(content).toContain("사주핵심");
  });

  it("모델은 옵션으로 바꿀 수 있다", async () => {
    const { impl, calls } = fakeFetch([() => okBody(JSON.stringify(goodJson))]);
    await interpretSaju(chart, { topic: "general", gender: "male", apiKey: "k", model: "claude-sonnet-5-5", fetchImpl: impl });
    expect(JSON.parse(calls[0].init.body).model).toBe("claude-sonnet-5-5");
  });

  it("형식이 어긋나면 한 번 더 시도해서 성공한다", async () => {
    const { impl, calls } = fakeFetch([() => okBody("not json"), () => okBody(JSON.stringify(goodJson))]);
    const r = await interpretSaju(chart, { topic: "general", gender: "male", apiKey: "k", fetchImpl: impl });
    expect(r.total.score).toBe(4);
    expect(calls.length).toBe(2);
  });

  it("금지 표현이 있으면 다시 시도하고, 계속이면 실패", async () => {
    const scary = { ...goodJson, kkotgeoji: "이혼수가 있어" };
    const { impl, calls } = fakeFetch([() => okBody(JSON.stringify(scary))]);
    let err: unknown;
    try {
      await interpretSaju(chart, { topic: "general", gender: "male", apiKey: "k", fetchImpl: impl });
    } catch (e) {
      err = e;
    }
    expect(err instanceof ReadingFailedError).toBe(true);
    expect(calls.length).toBe(2);
  });

  it("거절(refusal)·잘림(max_tokens)은 재시도 대상", async () => {
    const { impl, calls } = fakeFetch([() => okBody("{}", "refusal"), () => okBody("{", "max_tokens")]);
    let err: unknown;
    try {
      await interpretSaju(chart, { topic: "general", gender: "male", apiKey: "k", fetchImpl: impl });
    } catch (e) {
      err = e;
    }
    expect(err instanceof ReadingFailedError).toBe(true);
    expect(calls.length).toBe(2);
  });

  it("429/5xx 는 재시도, 401 같은 4xx 는 바로 실패", async () => {
    const a = fakeFetch([() => new Response("{}", { status: 529 }), () => okBody(JSON.stringify(goodJson))]);
    expect((await interpretSaju(chart, { topic: "general", gender: "male", apiKey: "k", fetchImpl: a.impl })).keyword).toBe("설렘 충전");
    expect(a.calls.length).toBe(2);

    const b = fakeFetch([() => new Response("{}", { status: 401 })]);
    let err: unknown;
    try {
      await interpretSaju(chart, { topic: "general", gender: "male", apiKey: "k", fetchImpl: b.impl });
    } catch (e) {
      err = e;
    }
    expect(err instanceof ReadingFailedError).toBe(true);
    expect(b.calls.length).toBe(1);
  });

  it("실패 메시지에 API 키나 응답 본문을 담지 않는다", async () => {
    const { impl } = fakeFetch([() => new Response("secret-body-k-test", { status: 401 })]);
    let msg = "";
    try {
      await interpretSaju(chart, { topic: "general", gender: "male", apiKey: "k-test", fetchImpl: impl });
    } catch (e) {
      msg = (e as Error).message;
    }
    expect(msg).toBe("HTTP 401");
  });

  it("네트워크 오류는 재시도 후 실패", async () => {
    const { impl, calls } = fakeFetch([() => { throw new TypeError("fetch failed"); }]);
    let err: unknown;
    try {
      await interpretSaju(chart, { topic: "general", gender: "male", apiKey: "k", fetchImpl: impl });
    } catch (e) {
      err = e;
    }
    expect(err instanceof ReadingFailedError).toBe(true);
    expect(calls.length).toBe(2);
  });
});

describe("모델 선택", () => {
  it("무료는 기본(Haiku), 유료 tier 는 Sonnet 을 쓴다", async () => {
    const models: string[] = [];
    const impl = (async (_u: any, init: any) => { models.push(JSON.parse(init.body).model); return okBody(JSON.stringify(goodJson)); }) as unknown as typeof fetch;
    await interpretSaju(chart, { topic: "general", gender: "female", apiKey: "k", fetchImpl: impl });
    await interpretSaju(chart, { topic: "general", gender: "female", apiKey: "k", fetchImpl: impl, tier: "paid" });
    expect(models).toEqual(["claude-haiku-5-5", "claude-sonnet-5-5"]);
  });
});
