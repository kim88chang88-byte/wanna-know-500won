import { describe, expect, it } from "vitest";
import { createDb } from "../db/supabase";
import { cleanInviteName, cleanInviteToken, createMessage, inviteUrl, isInviteRelation, parseInviteBirth, RELATION_LABEL } from "../invite";
import { isTrackEvent } from "../visitTrack";

const TOKEN = "A".repeat(32);
const GOOD = { calendar: "solar", solarDate: "1995-03-07", lunarYear: "", lunarMonth: "", lunarDay: "", isLeapMonth: false, timeKnown: true, time: "14:30", birthPlace: "", lateZi: "sameDay", gender: "female" };

describe("궁합 초대 링크 규칙", () => {
  it("토큰은 영문·숫자·-_ 32~64자만 받아요", () => {
    expect(cleanInviteToken(TOKEN)).toBe(TOKEN);
    expect(cleanInviteToken("a-b_".repeat(10))).not.toBeNull();
    expect(cleanInviteToken("A".repeat(31))).toBeNull();
    expect(cleanInviteToken("A".repeat(65))).toBeNull();
    expect(cleanInviteToken(`${"A".repeat(31)}/`)).toBeNull();
    expect(cleanInviteToken(123)).toBeNull();
  });

  it("관계는 정해진 다섯 가지만 받아요", () => {
    for (const k of Object.keys(RELATION_LABEL)) expect(isInviteRelation(k)).toBe(true);
    expect(isInviteRelation("enemy")).toBe(false);
    expect(isInviteRelation(undefined)).toBe(false);
  });

  it("호칭은 제어문자·꺾쇠를 지우고 20자로 줄이고, 비면 null", () => {
    expect(cleanInviteName("  서윤  ")).toBe("서윤");
    expect(cleanInviteName("a<b>c\u0000d")).toBe("abcd");
    expect(cleanInviteName("가".repeat(30))).toHaveLength(20);
    expect(cleanInviteName("   ")).toBeNull();
    expect(cleanInviteName(5)).toBeNull();
  });

  it("상대가 보낸 값은 올바른 생년월일시·성별만 받고, 모르는 칸은 버려요", () => {
    const ok = parseInviteBirth({ ...GOOD, evil: "x" });
    expect(ok).not.toBeNull();
    expect(ok).not.toHaveProperty("evil");
    expect(ok?.solarDate).toBe("1995-03-07");
    expect(ok?.gender).toBe("female");
    expect(parseInviteBirth({ ...GOOD, solarDate: "1995-02-30" })).toBeNull();
    expect(parseInviteBirth({ ...GOOD, gender: "x" })).toBeNull();
    expect(parseInviteBirth({ ...GOOD, time: "25:99" })).toBeNull();
    expect(parseInviteBirth({ ...GOOD, timeKnown: false, time: "" })).not.toBeNull();
    expect(parseInviteBirth(null)).toBeNull();
    expect(parseInviteBirth([GOOD])).toBeNull();
    expect(parseInviteBirth("1995-03-07")).toBeNull();
  });

  it("목록에 없는 출생지는 버리고, 너무 긴 글자는 잘라요", () => {
    expect(parseInviteBirth({ ...GOOD, birthPlace: "<script>" })?.birthPlace).toBe("");
    expect(parseInviteBirth({ ...GOOD, solarDate: `1995-03-07${"0".repeat(50)}` })?.solarDate).toBe("1995-03-07");
  });

  it("초대 주소는 토큰을 붙이고 추천 코드는 있을 때만 붙여요", () => {
    expect(inviteUrl("https://www.doyusaju.com/", TOKEN)).toBe(`https://www.doyusaju.com/invite/${TOKEN}`);
    expect(inviteUrl("https://www.doyusaju.com", TOKEN, "AB12CD34")).toBe(`https://www.doyusaju.com/invite/${TOKEN}?ref=AB12CD34`);
  });

  it("만들기 실패 문구가 한도마다 달라요", () => {
    expect(createMessage("limit_day")).toContain("5개");
    expect(createMessage("limit_pending")).toContain("10개");
    expect(createMessage("failed")).toContain("잠시");
  });

  it("추적 이벤트 이름 4개가 등록돼 있어요", () => {
    for (const e of ["invite_create", "invite_open", "invite_fill", "invite_view"]) expect(isTrackEvent(e)).toBe(true);
  });
});

const cfg = { url: "https://x.supabase.co", serviceKey: "SERVICE" };
function recorder(body: unknown) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const f = async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    return new Response(JSON.stringify(body), { status: 200 });
  };
  return { calls, f };
}

describe("궁합 초대 DB 호출", () => {
  it("inviteCreate: 함수 이름과 인자를 맞춰 보내고 결과 문자열을 돌려줘요", async () => {
    const r = recorder("ok");
    expect(await createDb(cfg, r.f).inviteCreate("123", TOKEN, "별이", "lover")).toBe("ok");
    expect(r.calls[0].url).toBe("https://x.supabase.co/rest/v1/rpc/compat_invite_create");
    expect(JSON.parse(String(r.calls[0].init?.body))).toEqual({ p_user: "123", p_token: TOKEN, p_nick: "별이", p_relation: "lover" });
  });

  it("invitePeek: 상태와 호칭·관계만 읽고, 응답이 이상하면 not_found", async () => {
    const r = recorder([{ out_status: "pending", out_nick: "별이", out_relation: "friend" }]);
    expect(await createDb(cfg, r.f).invitePeek(TOKEN)).toEqual({ status: "pending", nick: "별이", relation: "friend" });
    const bad = recorder(null);
    expect((await createDb(cfg, bad.f).invitePeek(TOKEN)).status).toBe("not_found");
  });

  it("inviteMine: 입력값 없이 현황만 돌려줘요", async () => {
    const r = recorder([{ out_token: TOKEN, out_relation: "some", out_status: "filled", out_name: "하늘", out_created: "2026-11-16T00:00:00Z", out_expires: "2026-11-23T00:00:00Z" }, { nope: 1 }]);
    const items = await createDb(cfg, r.f).inviteMine("123");
    expect(items).toEqual([{ token: TOKEN, relation: "some", status: "filled", name: "하늘", createdAt: "2026-11-16T00:00:00Z", expiresAt: "2026-11-23T00:00:00Z" }]);
  });

  it("inviteTake: 결과와 입력값을 읽어요", async () => {
    const r = recorder([{ out_result: "ok", out_birth: GOOD, out_name: "하늘", out_relation: "some" }]);
    const t = await createDb(cfg, r.f).inviteTake("123", TOKEN);
    expect(t).toEqual({ result: "ok", birth: GOOD, name: "하늘", relation: "some" });
    expect(JSON.parse(String(r.calls[0].init?.body))).toEqual({ p_user: "123", p_token: TOKEN });
  });

  it("inviteFill: 결과 문자열을 그대로 돌려줘요", async () => {
    const r = recorder("already");
    expect(await createDb(cfg, r.f).inviteFill(TOKEN, GOOD, null)).toBe("already");
  });
});
