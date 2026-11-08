import { NextResponse } from "next/server";
import { emailLoginConfigured } from "@/lib/auth/emailLogin";

export const runtime = "nodejs";

/** 이메일 로그인을 쓸 수 있는지(메일 발송 설정이 끝났는지) 알려줘요. 화면이 버튼을 보일지 정해요. */
export async function GET() {
  return NextResponse.json({ enabled: emailLoginConfigured(process.env) }, { headers: { "Cache-Control": "no-store" } });
}
