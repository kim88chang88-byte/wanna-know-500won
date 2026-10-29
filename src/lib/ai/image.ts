/*
 * Gemini 이미지 생성 (표본용). "사주로 그려 보는 상상 속 인연" 이미지 한 장을 만들고, 쓴 토큰으로 비용을 어림해요.
 * 실제 사람이 아닌 가상의 인물 사진풍 이미지예요.
 */

/** 모델 이름은 바뀔 수 있어서, 환경변수(GEMINI_IMAGE_MODEL)가 있으면 그것부터, 없으면 아래 순서로 시도해요. */
export const IMAGE_MODELS = ["gemini-3.1-flash-image", "gemini-3.1-flash-image-preview", "gemini-2.5-flash-image"];
/** 이미지 출력 토큰 100만 개당 달러(공개된 어림값). 정확한 단가는 Google AI Studio 요금표를 확인하세요. */
export const IMAGE_OUT_USD_PER_M = 60;
/** 입력(글) 토큰 100만 개당 달러(어림). */
export const TEXT_IN_USD_PER_M = 0.5;
export const DEFAULT_USD_KRW = 1400;

export type Element5 = "wood" | "fire" | "earth" | "metal" | "water";

/** 오행별 인상(얼굴 분위기)과 옷 색 */
const LOOK: Record<Element5, { mood: string; hanbok: string; suit: string }> = {
  wood: { mood: "fresh youthful aura, gentle straight eyebrows, warm kind eyes", hanbok: "soft jade-green and ivory hanbok", suit: "dark forest-green-gray suit with a deep green striped tie" },
  fire: { mood: "bright lively smile, expressive sparkling eyes, charismatic warmth", hanbok: "vivid crimson red hanbok with white trim", suit: "charcoal suit with a deep burgundy tie" },
  earth: { mood: "calm steady gaze, soft rounded face, reliable gentle expression", hanbok: "warm ochre-yellow and cream hanbok", suit: "warm camel-beige suit with a brown tie" },
  metal: { mood: "clean refined features, composed elegant expression, neat polished look", hanbok: "pearl white and silver-gray hanbok", suit: "light gray suit with a silver-blue tie" },
  water: { mood: "deep calm eyes, soft mysterious mood, quiet intelligent charm", hanbok: "deep navy and soft sky-blue hanbok", suit: "dark navy-gray suit with a navy striped tie" },
};

export function isElement5(v: string | null | undefined): v is Element5 {
  return v === "wood" || v === "fire" || v === "earth" || v === "metal" || v === "water";
}

export function spousePrompt(partner: "male" | "female", element: Element5): string {
  const look = LOOK[element];
  const base =
    partner === "female"
      ? `A photorealistic portrait photo of a beautiful young Korean woman in her late 20s, black long hair tied back with a few loose strands, a warm natural smile, wearing a ${look.hanbok} with delicate hair ornaments, outdoors in soft golden-hour sunlight with creamy bokeh background, shot on an 85mm lens, shallow depth of field.`
      : `A photorealistic close-up portrait photo of a handsome young Korean man in his late 20s, black side-swept hair, clean fair skin, calm slightly shy expression, wearing a ${look.suit} with a white shirt, soft indoor window light, shot on a 50mm lens, shallow depth of field.`;
  return [
    base,
    `Mood: ${look.mood}.`,
    "Natural skin texture, realistic eyes, 3:4 vertical framing.",
    "An entirely fictional person who does not resemble any real person or celebrity. No text, no letters, no logo, no watermark, no captions.",
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
