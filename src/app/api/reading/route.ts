import { NextResponse } from "next/server";
import { interpretSaju } from "@/lib/ai/interpret";
import { calculateSaju } from "@/lib/saju/calculate";
import { SajuInputError } from "@/lib/saju/errors";
import type { BirthInput, SajuChart } from "@/lib/saju/types";

export async function POST(request: Request) {
  let input: BirthInput;
  try {
    input = (await request.json()) as BirthInput;
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  if (typeof input !== "object" || input === null) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  // TODO: 결제 확인(500원)을 통과한 요청만 풀이하도록 연결

  let chart: SajuChart;
  try {
    chart = calculateSaju(input);
  } catch (err) {
    if (err instanceof SajuInputError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("calculateSaju failed", err);
    return NextResponse.json({ error: "사주 계산 중 오류가 발생했어요." }, { status: 500 });
  }

  // AI 풀이는 아직 구현 전이라, 준비되기 전까지는 명식만 돌려줍니다.
  let reading: string | null = null;
  try {
    reading = await interpretSaju(chart);
  } catch (err) {
    if (!(err instanceof Error && err.message.startsWith("NOT_IMPLEMENTED"))) {
      console.error("interpretSaju failed", err);
      return NextResponse.json({ error: "풀이 중 오류가 발생했어요." }, { status: 500 });
    }
  }

  return NextResponse.json({ chart, reading });
}
