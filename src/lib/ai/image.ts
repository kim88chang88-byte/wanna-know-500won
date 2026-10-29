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

/** 이미지 화면에 꼭 붙이는 안내 문구 */
export const AI_IMAGE_NOTICE = "AI가 만든 가상의 인물, 참고용 상상도";

/** 오행별 인상(얼굴 분위기)과 포인트 색 */
const LOOK: Record<Element5, { mood: string; color: string }> = {
  wood: { mood: "fresh youthful aura, gentle straight eyebrows, warm kind eyes", color: "soft green" },
  fire: { mood: "bright lively smile, expressive sparkling eyes, charismatic warmth", color: "warm coral red" },
  earth: { mood: "calm steady gaze, soft rounded face, reliable gentle expression", color: "warm ochre-yellow and beige" },
  metal: { mood: "clean refined features, composed elegant expression, neat polished look", color: "white and silver-gray" },
  water: { mood: "deep calm eyes, soft mysterious mood, quiet intelligent charm", color: "navy and soft sky-blue" },
};

interface Outfit {
  /** 입은 옷(색은 {c} 자리에 오행 색이 들어가요) */
  wear: string;
  /** 장소·빛 */
  scene: string;
}

/** 복장은 자유롭게 어울리는 것으로. 같은 사람이면 같은 복장이 나오도록 seed 로 골라요. */
const OUTFITS: Record<"male" | "female", Outfit[]> = {
  female: [
    { wear: "an elegant {c} one-piece dress", scene: "a sunny cafe terrace with soft daylight and creamy bokeh" },
    { wear: "a polished office look: a {c} blouse with a tailored jacket and slacks", scene: "a bright modern office by a large window" },
    { wear: "a plain white T-shirt, blue jeans and a light {c} cardigan", scene: "a green park in soft afternoon sunlight with creamy bokeh" },
    { wear: "a graceful modern hanbok in {c} tones with delicate hair ornaments", scene: "a traditional palace garden in soft golden-hour sunlight with creamy bokeh" },
    { wear: "a cozy {c} knit sweater with a denim jacket", scene: "a quiet tree-lined street in warm autumn light" },
    { wear: "a stylish {c} tracksuit set", scene: "a riverside walking path on a fresh morning" },
  ],
  male: [
    { wear: "a tailored suit in {c} tones with a white shirt and a tie", scene: "soft indoor window light" },
    { wear: "business casual: an open-collar shirt with a {c} knit and chinos", scene: "a bright modern cafe with soft window light" },
    { wear: "a plain white T-shirt and blue jeans with a {c} jacket", scene: "a sunny street with creamy bokeh" },
    { wear: "a clean {c} athletic zip-up jacket and sportswear", scene: "a riverside park on a fresh morning" },
    { wear: "a {c} casual knit sweater over a collared shirt", scene: "a warm bookstore with soft light" },
    { wear: "a casual {c} shirt jacket with a white tee", scene: "a quiet tree-lined street in warm autumn light" },
  ],
};

export function isElement5(v: string | null | undefined): v is Element5 {
  return v === "wood" || v === "fire" || v === "earth" || v === "metal" || v === "water";
}

/** 결과 이미지 속 인물의 연령대(영어 표현). 규칙은 docs/PARTNER_IMAGE.md 에 있어요. */
export type PartnerAge = "late 20s" | "mid 30s" | "early 40s";

/**
 * 이용자의 성별·만 나이로 결과 이미지 속 인물의 연령대를 정해요. (docs/PARTNER_IMAGE.md)
 * 미성년자(만 19세 미만)에게는 이미지를 만들지 않아요(null). 인물 이미지는 항상 성인이에요.
 */
export function partnerAgeFor(userGender: "male" | "female", userAge: number): PartnerAge | null {
  if (!Number.isFinite(userAge) || userAge < 20) return null;
  if (userGender === "male") {
    if (userAge < 50) return "late 20s";
    if (userAge < 60) return "mid 30s";
    return "early 40s";
  }
  if (userAge < 30) return "late 20s";
  if (userAge < 40) return "mid 30s";
  return "early 40s";
}

/** 생년월일(양력)과 기준일로 만 나이를 구해요. */
export function ageOn(birth: { year: number; month: number; day: number }, now: Date): number {
  let age = now.getFullYear() - birth.year;
  if (now.getMonth() + 1 < birth.month || (now.getMonth() + 1 === birth.month && now.getDate() < birth.day)) age--;
  return age;
}

export function spousePrompt(partner: "male" | "female", element: Element5, age: PartnerAge = "late 20s", seed = 0): string {
  const look = LOOK[element];
  const list = OUTFITS[partner];
  const o = list[((Math.floor(seed) % list.length) + list.length) % list.length];
  const wear = o.wear.replace("{c}", look.color);
  const person =
    partner === "female"
      ? `a beautiful Korean woman in her ${age}, natural hair, a warm natural smile`
      : `a handsome Korean man in his ${age}, neat black hair, a calm friendly expression`;
  return [
    `A photorealistic portrait photo of ${person}, wearing ${wear}, in ${o.scene}.`,
    `Mood: ${look.mood}.`,
    "Natural skin texture, realistic eyes, shallow depth of field, 3:4 vertical framing. The person is clearly an adult.",
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
