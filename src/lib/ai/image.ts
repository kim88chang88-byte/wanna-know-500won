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
export type PartnerAge = "mid 20s" | "late 20s" | "mid 30s";

/**
 * 이용자의 성별·만 나이로 결과 이미지 속 인물의 연령대를 정해요. (docs/PARTNER_IMAGE.md)
 * 미성년자(만 19세 미만)에게는 이미지를 만들지 않아요(null). 인물 이미지는 항상 성인이에요.
 */
export function partnerAgeFor(userGender: "male" | "female", userAge: number): PartnerAge | null {
  if (!Number.isFinite(userAge) || userAge < 20) return null;
  if (userGender === "male") {
    if (userAge < 50) return "mid 20s";
    if (userAge < 60) return "late 20s";
    return "mid 30s";
  }
  if (userAge < 30) return "mid 20s";
  if (userAge < 40) return "late 20s";
  return "mid 30s";
}

/** 생년월일(양력)과 기준일로 만 나이를 구해요. */
export function ageOn(birth: { year: number; month: number; day: number }, now: Date): number {
  let age = now.getFullYear() - birth.year;
  if (now.getMonth() + 1 < birth.month || (now.getMonth() + 1 === birth.month && now.getDate() < birth.day)) age--;
  return age;
}

export function spousePrompt(partner: "male" | "female", element: Element5, age: PartnerAge = "mid 20s", seed = 0): string {
  const look = LOOK[element];
  const list = OUTFITS[partner];
  const o = list[((Math.floor(seed) % list.length) + list.length) % list.length];
  const wear = o.wear.replace("{c}", look.color);
  // 여성 인물은 어떤 경우에도 안경을 쓰지 않아요. 남성은 분위기에 따라 가끔(seed 로 정해서 같은 사람은 같게) 얇은 안경을 써요.
  const maleGlasses = Math.abs(Math.floor(seed)) % 3 === 1;
  const person =
    partner === "female"
      ? `a beautiful Korean woman in her ${age}, natural hair, a warm natural smile, a bare face with no eyeglasses and no eyewear of any kind, eyes clearly visible`
      : `a handsome Korean man in his ${age}, neat black hair, ${maleGlasses ? "wearing stylish thin-frame glasses, " : ""}a calm friendly expression`;
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

/* ───────── 새 안(미리보기용): 5살 더 어리게 · 다양한 헤어/복장 · 더 매력적으로 ───────── */

/** 새 안의 연령 표현: 기존보다 한 단계씩 어려요(모두 성인). */
const AGE_V2: Record<PartnerAge, string> = { "mid 20s": "early 20s", "late 20s": "mid 20s", "mid 30s": "late 20s" };

const HAIR_V2: Record<"male" | "female", string[]> = {
  female: [
    "long soft wavy hair with side-swept bangs",
    "a chic shoulder-length bob with airy bangs",
    "a high ponytail with loose face-framing strands",
    "long straight silky hair parted in the middle",
    "a loose low bun with soft wisps",
    "medium-length layered hair with gentle C-curl ends",
  ],
  male: [
    "a soft two-block cut with natural see-through bangs",
    "a neat side-parted style with light volume",
    "short textured hair swept up with a clean forehead",
    "a soft dandy cut with a natural wave",
    "medium-length hair with a relaxed center part",
    "a clean short crop with a fresh youthful look",
  ],
};

const FACE_V2: Record<"male" | "female", string[]> = {
  female: [
    "bright almond eyes and a sweet dimpled smile",
    "refined cat-like eyes and a confident soft smile",
    "big clear eyes and a playful grin",
    "gentle double-lidded eyes and a graceful calm smile",
    "luminous clear skin, rosy cheeks and a shy smile",
    "sharp elegant features and a relaxed charming smile",
  ],
  male: [
    "bright eyes and a boyish warm smile",
    "sharp refined jawline and a gentle smile",
    "soft puppy-like eyes and a dimpled grin",
    "defined brows, deep eyes and a calm confident look",
    "clear skin, a fresh smile and a kind gaze",
    "strong clean features and a relaxed charming smile",
  ],
};

const OUTFITS_V2: Record<"male" | "female", Outfit[]> = {
  female: [
    { wear: "a flowing {c} midi dress with delicate straps and a light cardigan", scene: "a sunny cafe terrace with soft daylight and creamy bokeh" },
    { wear: "a modern {c} tweed jacket set with a pearl accessory", scene: "a bright airy gallery lobby by a large window" },
    { wear: "a fitted white tee, high-waist jeans and a {c} trench coat", scene: "a green park in soft afternoon sunlight with creamy bokeh" },
    { wear: "a graceful modern hanbok in {c} tones with delicate hair ornaments", scene: "a traditional palace garden in soft golden-hour sunlight with creamy bokeh" },
    { wear: "a cozy oversized {c} knit with a pleated skirt and a small scarf", scene: "a quiet tree-lined street in warm autumn light" },
    { wear: "a sporty chic {c} windbreaker with a white top and tennis skirt", scene: "a riverside walking path on a fresh morning" },
  ],
  male: [
    { wear: "a sleek {c} suit with an open-collar white shirt, no tie", scene: "soft indoor window light in a modern lounge" },
    { wear: "a {c} cardigan over a white tee with straight slacks", scene: "a bright modern cafe with soft window light" },
    { wear: "a white tee, light denim and a {c} bomber jacket", scene: "a sunny street with creamy bokeh" },
    { wear: "a clean {c} track jacket with a white tee and joggers", scene: "a riverside park on a fresh morning" },
    { wear: "a {c} turtleneck knit with a long wool coat", scene: "a warm bookstore with soft light" },
    { wear: "a {c} denim shirt layered over a white tee with beige chinos", scene: "a quiet tree-lined street in warm autumn light" },
  ],
};

/** 새 안 프롬프트(미리보기용). 확정되면 spousePrompt 를 이 내용으로 바꿔요. */
export function spousePromptV2(partner: "male" | "female", element: Element5, age: PartnerAge = "mid 20s", seed = 0): string {
  const look = LOOK[element];
  const n = 6;
  const i = ((Math.floor(seed) % n) + n) % n;
  const o = OUTFITS_V2[partner][i];
  const wear = o.wear.replace("{c}", look.color);
  const hair = HAIR_V2[partner][i];
  const face = FACE_V2[partner][(i + 2) % n];
  const maleGlasses = i % 3 === 1;
  const a = AGE_V2[age];
  const person =
    partner === "female"
      ? `a strikingly attractive, photogenic Korean woman in her ${a}, ${hair}, ${face}, a youthful fresh-faced look, a bare face with no eyeglasses and no eyewear of any kind, eyes clearly visible`
      : `a strikingly handsome, photogenic Korean man in his ${a}, ${hair}, ${face}, ${maleGlasses ? "wearing stylish thin-frame glasses, " : ""}a youthful fresh-faced look`;
  return [
    `A photorealistic fashion-editorial portrait photo of ${person}, wearing ${wear}, in ${o.scene}.`,
    `Mood: ${look.mood}. Flattering soft cinematic lighting, trendy styling, an effortlessly attractive and charming presence.`,
    "Natural skin texture, realistic eyes, shallow depth of field, 3:4 vertical framing. The person is clearly an adult.",
    "An entirely fictional person who does not resemble any real person or celebrity. No text, no letters, no logo, no watermark, no captions.",
  ].join(" ");
}
