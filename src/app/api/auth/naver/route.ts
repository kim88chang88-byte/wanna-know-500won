import { NextResponse } from "next/server";
import { loadNaverAuthConfig } from "@/lib/auth/config";
import { buildNaverAuthorizeUrl } from "@/lib/auth/naver";
import { newState, STATE_COOKIE, STATE_MAX_AGE_SEC } from "@/lib/auth/session";

export const runtime = "nodejs";

/** 네이버 로그인 시작: state 를 쿠키에 심고 네이버 로그인 화면으로 보내요. */
export async function GET(request: Request) {
  const config = loadNaverAuthConfig(process.env, request.url);
  if (!config) return NextResponse.redirect(new URL("/?login=unavailable", request.url));

  const state = newState();
  const res = NextResponse.redirect(buildNaverAuthorizeUrl(config.naver, state));
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth/naver",
    maxAge: STATE_MAX_AGE_SEC,
  });
  return res;
}
