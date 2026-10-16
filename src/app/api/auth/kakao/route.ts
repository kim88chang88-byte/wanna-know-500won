import { NextResponse } from "next/server";
import { loadAuthConfig } from "@/lib/auth/config";
import { buildAuthorizeUrl } from "@/lib/auth/kakao";
import { newState, STATE_COOKIE, STATE_MAX_AGE_SEC } from "@/lib/auth/session";

export const runtime = "nodejs";

/** 카카오 로그인 시작: state 를 쿠키에 심고 카카오 로그인 화면으로 보내요. */
export async function GET(request: Request) {
  const config = loadAuthConfig(process.env, request.url);
  if (!config) return NextResponse.redirect(new URL("/?login=unavailable", request.url));

  const state = newState();
  const res = NextResponse.redirect(buildAuthorizeUrl(config.kakao, state));
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth/kakao",
    maxAge: STATE_MAX_AGE_SEC,
  });
  return res;
}
