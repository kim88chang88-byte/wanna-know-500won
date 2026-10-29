import { adminIds, isAdmin } from "@/lib/admin/auth";
import { readCookie, SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { DEFAULT_USD_KRW, estimateCostUsd, generateImage, isElement5, partnerAgeFor, spousePrompt, AI_IMAGE_NOTICE } from "@/lib/ai/image";
import { createRateLimiter } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 60;

const limiter = createRateLimiter(5, 60_000);
const HEAD = { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" };

const esc = (t: string) => t.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
const page = (body: string, status = 200) =>
  new Response(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>이미지 샘플</title><style>body{font-family:system-ui,sans-serif;max-width:560px;margin:24px auto;padding:0 16px;color:#222}img{max-width:100%;border-radius:12px}table{border-collapse:collapse;width:100%}td{border-bottom:1px solid #ddd;padding:6px 4px;font-size:14px}code{font-size:12px;word-break:break-all}</style></head><body>${body}</body></html>`, { status, headers: HEAD });

/**
 * 관리자 전용 표본: 제미나이로 "사주로 그려 보는 상상 속 인연" 일러스트 한 장을 만들고 쓴 토큰과 어림 비용을 보여 줘요.
 * 예) /api/admin/image-sample?partner=female&el=water   (partner: male|female, el: wood|fire|earth|metal|water)
 * 복장은 &v=0~5 로 고르고, 없으면 무작위예요. (여성: 원피스·오피스룩·흰티 청바지·한복·니트·트레이닝복 / 남성: 정장·비즈니스 캐주얼·흰티 청바지·운동복·니트·셔츠 재킷)
 * 연령 규칙 확인: &user=male&userAge=55  → 이용자 성별·만 나이로 상대 성별(이성)과 연령대를 정해요. (docs/PARTNER_IMAGE.md)
 * 서버의 GEMINI_API_KEY 를 써요. (키는 화면·응답에 나오지 않아요)
 */
export async function GET(request: Request) {
  const session = verifySessionToken(readCookie(request.headers.get("cookie"), SESSION_COOKIE), process.env.AUTH_SECRET);
  if (!session) return page("<p>로그인이 필요해요.</p>", 401);
  if (!isAdmin(session.sub, process.env)) {
    return page(`<p>관리자 권한이 없어요.</p><p>내 고유번호: <code>${esc(session.sub)}</code> ${adminIds(process.env).length === 0 ? "(ADMIN_USER_IDS 가 비어 있어요)" : ""}</p>`, 403);
  }
  const rl = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "admin";
  if (!limiter.check(rl).ok) return page("<p>요청이 너무 빨라요. 잠시 뒤에 다시 해 주세요.</p>", 429);

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return page("<p>GEMINI_API_KEY 가 설정되어 있지 않아요.</p>", 503);

  const sp = new URL(request.url).searchParams;
  let partner: "male" | "female" = sp.get("partner") === "male" ? "male" : "female";
  let age: "late 20s" | "mid 30s" | "early 40s" = "late 20s";
  const user = sp.get("user");
  if (user === "male" || user === "female") {
    const a = partnerAgeFor(user, Number(sp.get("userAge")));
    if (!a) return page("<p>만 20세 미만(또는 나이를 알 수 없는) 이용자에게는 인물 이미지를 만들지 않아요. (docs/PARTNER_IMAGE.md)</p>", 200);
    age = a;
    partner = user === "male" ? "female" : "male";
  }
  const elRaw = sp.get("el");
  const el = isElement5(elRaw) ? elRaw : "water";
  const vRaw = Number(sp.get("v"));
  const seed = Number.isFinite(vRaw) && sp.get("v") !== null ? vRaw : Math.floor(Math.random() * 6);
  const prompt = spousePrompt(partner, el, age, seed);
  const r = await generateImage(prompt, apiKey, { model: process.env.GEMINI_IMAGE_MODEL?.trim() || undefined });
  if (!r.ok) return page(`<h2>이미지를 만들지 못했어요</h2><p>${esc(r.error)}</p><p>모델 이름이 다르다면 환경변수 GEMINI_IMAGE_MODEL 에 Google AI Studio 의 이미지 모델 이름을 넣어 주세요.</p>`, 502);

  const usd = estimateCostUsd(r.usage);
  const krw = Math.round(usd * (Number(process.env.USD_KRW) || DEFAULT_USD_KRW));
  return page(`
    <h2>상상 속 인연 이미지 (표본)</h2>
    <img alt="생성된 일러스트" src="data:${esc(r.mime)};base64,${r.base64}">
    <table>
      <tr><td>모델</td><td>${esc(r.model)}</td></tr>
      <tr><td>입력 토큰</td><td>${r.usage.promptTokens}</td></tr>
      <tr><td>이미지 출력 토큰</td><td>${r.usage.imageTokens}</td></tr>
      <tr><td>어림 비용</td><td><b>약 $${usd.toFixed(3)} (약 ${krw.toLocaleString("ko-KR")}원)</b></td></tr>
    </table>
    <p style="font-size:12px;color:#666">어림 단가: 이미지 출력 100만 토큰당 $60, 입력 $0.5 (실제 청구는 Google AI Studio 요금표 기준)</p>
    <p style="font-size:13px;color:#444;text-align:center">${esc(AI_IMAGE_NOTICE)}</p>
    <p><code>${esc(prompt)}</code></p>
    <p><a href="?partner=${partner}&el=${el}">다른 복장으로</a> · <a href="?partner=${partner === "male" ? "female" : "male"}&el=${el}">${partner === "male" ? "여성" : "남성"}으로 다시</a> · <a href="?partner=${partner}&el=fire">불</a> · <a href="?partner=${partner}&el=wood">나무</a> · <a href="?partner=${partner}&el=earth">땅</a> · <a href="?partner=${partner}&el=metal">쇠</a> · <a href="?partner=${partner}&el=water">물</a></p>
  `);
}
