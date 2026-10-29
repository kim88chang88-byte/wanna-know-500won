/*
 * Gemini 이미지 생성 (표본용). "사주로 그려 보는 상상 속 인연" 일러스트 한 장을 만들고, 쓴 토큰으로 비용을 어림해요.
 * 실제 사람 사진이 아니라 가상의 웹툰풍 일러스트예요.
 */

/** 모델 이름은 바뀔 수 있어서, 환경변수(GEMINI_IMAGE_MODEL)가 있으면 그것부터, 없으면 아래 순서로 시도해요. */
export const IMAGE_MODELS = ["gemini-3.1-flash-image", "gemini-3.1-flash-image-preview", "gemini-2.5-flash-image"];
/** 이미지 출력 토큰 100만 개당 달러(공개된 어림값). 정확한 단가는 Google AI Studio 요금표를 확인하세요. */
export const IMAGE_OUT_USD_PER_M = 60;
/** 입력(글) 토큰 100만 개당 달러(어림). */
export const TEXT_IN_USD_PER_M = 0.5;
export const DEFAULT_USD_KRW = 1400;

export type Element5 = "wood" | "fire" | "earth" | "metal" | "water";

const LOOK: Record<Element5, string> = {
  wood: "tall and slender, gently straight eyebrows, warm kind eyes, fresh youthful aura, soft green accents in clothing",
  fire: "bright expressive eyes, lively warm smile, charismatic presence, warm orange and soft red tones",
  earth: "calm steady expression, soft rounded face, reliable gentle gaze, warm earthy yellow and brown tones",
  metal: "clean sharp features, neat refined look, composed cool expression, white and silver tones",
  water: "deep calm eyes, soft mysterious mood, smooth dark hair, navy and soft blue tones",
};

export function isElement5(v: string | null | undefined): v is Element5 {
  return v === "wood" || v === "fire" || v === "earth" || v === "metal" || v === "water";
}

export function spousePrompt(partner: "male" | "female", element: Element5): string {
  const who = partner === "male" ? "a handsome Korean man" : "a beautiful Korean woman";
  return [
    `A soft Korean webtoon-style illustration portrait of ${who}, an entirely fictional adult in their early 30s.`,
    `Appearance and mood: ${LOOK[element]}.`,
    "Head-and-shoulders composition, gentle friendly expression, delicate watercolor texture, clean plain pastel background.",
    "No text, no letters, no watermark, not a photograph, not a real person.",
  ].join(" ");
}

export interface ImageUsage {
  promptTokens: number;
  imageTokens: number;
  thoughtTokens: number;
  totalTokens: number;
}

export type ImageResult =
  | { ok: true; model: string; mime: string; base64: string; usage: ImageUsage }
  | { ok: false; error: string };

interface GenResponse {
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    thoughtsTokenCount?: number;
    totalTokenCount?: number;
    candidatesTokensDetails?: Array<{ modality?: string; tokenCount?: number }>;
  };
  promptFeedback?: { blockReason?: string };
  candidates?: Array<{ finishReason?: string; content?: { parts?: Array<{ text?: string; inlineData?: { mimeType?: string; data?: string } }> } }>;
}

export function usageOf(d: GenResponse): ImageUsage {
  const u = d.usageMetadata ?? {};
  const img = u.candidatesTokensDetails?.find((x) => x.modality === "IMAGE")?.tokenCount;
  return {
    promptTokens: u.promptTokenCount ?? 0,
    imageTokens: img ?? u.candidatesTokenCount ?? 0,
    thoughtTokens: u.thoughtsTokenCount ?? 0,
    totalTokens: u.totalTokenCount ?? 0,
  };
}

/** 어림 비용(달러): 이미지 출력 토큰 + 입력 토큰 */
export function estimateCostUsd(u: ImageUsage): number {
  return (u.imageTokens * IMAGE_OUT_USD_PER_M + u.promptTokens * TEXT_IN_USD_PER_M) / 1_000_000;
}

export async function generateImage(prompt: string, apiKey: string, opts: { model?: string; fetchImpl?: typeof fetch; timeoutMs?: number } = {}): Promise<ImageResult> {
  const f = opts.fetchImpl ?? fetch;
  const models = opts.model ? [opts.model, ...IMAGE_MODELS.filter((m) => m !== opts.model)] : IMAGE_MODELS;
  let lastErr = "알 수 없음";
  for (const model of models) {
    for (const modalities of [["IMAGE"], ["TEXT", "IMAGE"]]) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 50_000);
      try {
        const res = await f(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
          method: "POST",
          headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { responseModalities: modalities, imageConfig: { aspectRatio: "3:4" } },
          }),
          signal: ctrl.signal,
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
          lastErr = `${model} HTTP ${res.status}: ${(body?.error?.message ?? "").slice(0, 200)}`;
          if (res.status === 404) break; // 모델 이름이 없으면 다음 모델로
          if (res.status === 400) continue; // 형식 문제면 다른 방식으로
          return { ok: false, error: lastErr };
        }
        const data = (await res.json()) as GenResponse;
        if (data.promptFeedback?.blockReason) return { ok: false, error: `요청이 안전 필터에 걸렸어요(${data.promptFeedback.blockReason})` };
        const part = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
        if (!part?.inlineData?.data) {
          lastErr = `${model}: 이미지가 응답에 없어요(${data.candidates?.[0]?.finishReason ?? "?"})`;
          continue;
        }
        return { ok: true, model, mime: part.inlineData.mimeType ?? "image/png", base64: part.inlineData.data, usage: usageOf(data) };
      } catch (err) {
        lastErr = `${model}: ${err instanceof Error && err.name === "AbortError" ? "시간 초과" : "네트워크 오류"}`;
      } finally {
        clearTimeout(timer);
      }
    }
  }
  return { ok: false, error: lastErr };
}
