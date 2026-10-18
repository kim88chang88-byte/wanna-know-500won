import { NextResponse } from "next/server";
import { parseUnlinkParams, verifyKakaoAdminAuth } from "@/lib/auth/kakaoUnlink";
import { createDb, loadDbConfig } from "@/lib/db/supabase";

export const runtime = "nodejs";

/**
 * 카카오 연결 끊기 웹훅. (카카오 개발자 콘솔 > 앱 > 웹훅 > 연결 해제 웹훅 에 이 주소를 등록해요)
 * 이용자가 카카오에서 서비스 연결을 끊거나 계정을 지우면, 그 회원의 저장 정보(회원·뽑기·기억한 생년월일시·고민/후기의 본인 연결)를 지워요.
 * 카카오는 GET(쿼리) 또는 POST(폼)로 보내고, 3초 안에 200 을 돌려주길 바라요.
 */
async function handle(request: Request, params: URLSearchParams) {
  // 카카오가 보낸 것인지 확인해요. (키가 없거나 틀리면 아무것도 하지 않아요)
  if (!process.env.KAKAO_ADMIN_KEY) return NextResponse.json({ error: "not configured" }, { status: 503 });
  if (!verifyKakaoAdminAuth(request.headers.get("authorization"), process.env.KAKAO_ADMIN_KEY)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const event = parseUnlinkParams(params);
  // 카카오 안내: 정보가 없거나 처리할 게 없어도 200 으로 답해요.
  if (!event) return NextResponse.json({ ok: true, ignored: true });

  const dbConfig = loadDbConfig(process.env);
  if (dbConfig) {
    try {
      await createDb(dbConfig).deleteUser(event.userId);
    } catch (err) {
      // 지우지 못했어요. 회원번호는 로그에 남기지 않아요. (Vercel 로그에서 이 줄을 보면 직접 지워야 해요)
      console.error("kakao unlink deleteUser failed:", event.referrerType, err instanceof Error ? err.message : "unknown");
      return NextResponse.json({ error: "delete failed" }, { status: 500 });
    }
  }
  console.log("kakao unlink handled:", event.referrerType);
  return NextResponse.json({ ok: true });
}

export async function GET(request: Request) {
  return handle(request, new URL(request.url).searchParams);
}

export async function POST(request: Request) {
  let params = new URLSearchParams(new URL(request.url).search);
  try {
    // 카카오는 폼(x-www-form-urlencoded)으로 보내요. 길이를 제한해서 읽어요.
    const text = (await request.text()).slice(0, 4096);
    const body = new URLSearchParams(text);
    for (const [k, v] of body) params.set(k, v);
  } catch {
    params = new URLSearchParams(new URL(request.url).search);
  }
  return handle(request, params);
}
