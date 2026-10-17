import { NextResponse } from "next/server";
import { loadGoogleAuthConfig } from "@/lib/auth/config";
import { buildGoogleAuthorizeUrl } from "@/lib/auth/google";
import { newState, STATE_COOKIE, STATE_MAX_AGE_SEC } from "@/lib/auth/session";

export const runtime = "nodejs";

/** 구글 로그인 시작: state 를 쿠키에 심고 구글 로그인 화면으로 보내요. */
export async function GET(request: Request) {
  const config = loadGoogleAuthConfig(process.env, request.url);
  if (!config) return NextResponse.redirect(new URL("/?login=unavailable", request.url));

  const state = newState();
  const res = NextResponse.redirect(buildGoogleAuthorizeUrl(config.google, state));
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth/google",
    maxAge: STATE_MAX_AGE_SEC,
  });
  return res;
}
