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

/* 상대 인물 외모 규칙(2026-11-03 개정): 더 어리고, 헤어·얼굴·복장이 다양하고, 더 매력적으로 (docs/PARTNER_IMAGE.md) */

/** 그림 속 연령 표현: 표의 연령대보다 한 단계씩 어려요(모두 성인). */
/** 같은 오행이어도 변형(0~2)마다 포인트 색을 조금씩 달리해요. 0번이 기본 색이에요. */
const ACCENTS: Record<Element5, string[]> = {
  wood: ["soft green", "fresh mint and cream", "olive green and warm beige"],
  fire: ["warm coral red", "soft peach-pink and cream", "deep burgundy and blush"],
  earth: ["warm ochre-yellow and beige", "camel brown and ivory", "soft mustard and warm gray"],
  metal: ["white and silver-gray", "pearl white and light charcoal", "ivory and cool steel-gray"],
  water: ["navy and soft sky-blue", "teal and ice blue", "deep indigo and pale lavender-blue"],
};
/** 변형(0~2)마다 복장·헤어·얼굴이 서로 다른 짝으로 엮이게 하는 비껴 가기 값이에요. 0번은 처음 규칙과 같아요. */
export const PARTNER_VARIANTS = 3;
const OFF_OUTFIT = [0, 2, 4];
const OFF_HAIR = [0, 3, 1];
const OFF_FACE = [0, 4, 1];

const AGE_LOOK: Record<PartnerAge, string> = { "mid 20s": "early 20s", "late 20s": "mid 20s", "mid 30s": "late 20s" };

const HAIR: Record<"male" | "female", string[]> = {
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

const FACE: Record<"male" | "female", string[]> = {
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

const OUTFITS: Record<"male" | "female", Outfit[]> = {
  female: [
    { wear: "a flowing {c} midi dress with delicate straps and a light cardigan", scene: "a sunny cafe terrace with soft daylight and creamy bokeh" },
    { wear: "a modern {c} tweed jacket set with a pearl accessory", scene: "a bright airy gallery lobby by a large window" },
    { wear: "a fitted white tee, high-waist jeans and a {c} trench coat", scene: "a green park in soft afternoon sunlight with creamy bokeh" },
    { wear: "a graceful modern hanbok in {c} tones with delicate hair ornaments", scene: "a traditional palace garden in soft golden-hour sunlight with creamy bokeh" },
    { wear: "a cozy oversized {c} knit with a pleated skirt and a small scarf", scene: "a quiet tree-lined street in warm autumn light" },
    { wear: "a soft {c} ribbon blouse with a flared long skirt and a small shoulder bag", scene: "a riverside walking path on a fresh morning" },
  ],
  male: [
    { wear: "a sleek {c} suit with an open-collar white shirt, no tie", scene: "soft indoor window light in a modern lounge" },
    { wear: "a {c} cardigan over a white tee with straight slacks", scene: "a bright modern cafe with soft window light" },
    { wear: "a white tee, light denim and a {c} bomber jacket", scene: "a sunny street with creamy bokeh" },
    { wear: "a crisp white oxford shirt with a {c} knit vest and slim slacks", scene: "a riverside park on a fresh morning" },
    { wear: "a {c} turtleneck knit with a long wool coat", scene: "a warm bookstore with soft light" },
    { wear: "a {c} denim shirt layered over a white tee with beige chinos", scene: "a quiet tree-lined street in warm autumn light" },
  ],
};

/* 변형 1·2번에서 더 다양하게 쓰는 추가 목록(0번 기본 모습은 위 6가지 그대로예요) */
const HAIR_X: Record<"male" | "female", string[]> = {
  female: [
    "a short soft cut with airy side bangs",
    "a half-up half-down style with a small ribbon",
    "a loose side braid with soft wisps",
    "long layered hair with face-framing curtain bangs",
    "a neat low ponytail with see-through bangs",
    "soft shoulder-length waves with a side part",
  ],
  male: [
    "a natural short perm with a side part",
    "a clean soft slick-back with light texture",
    "a fluffy comma-style cut with bangs",
    "short wavy hair with a fresh tidy sideburn",
    "a neat crop with softly faded sides",
    "medium-length wavy hair with a natural flow",
  ],
};
const FACE_X: Record<"male" | "female", string[]> = {
  female: [
    "gentle fox-like eyes and a soft knowing smile",
    "round bright eyes and a cheerful laugh",
    "calm deep-set eyes and a quiet elegant smile",
    "sparkling eyes, a tiny beauty mark and a warm smile",
    "soft natural features with a healthy glow and a sweet smile",
    "clear defined eyes and a bright confident grin",
  ],
  male: [
    "warm smiling eyes that crinkle and an easy laugh",
    "sleek sharp eyes with a faint playful smirk",
    "round gentle eyes and a soft shy smile",
    "strong brows, calm eyes and a reassuring smile",
    "a bright wide smile with a fresh clean look",
    "thoughtful eyes and a gentle half-smile",
  ],
};
const OUTFITS_X: Record<"male" | "female", Outfit[]> = {
  female: [
    { wear: "a soft {c} knit cardigan over a white camisole and a pleated midi skirt", scene: "a sunlit bookstore aisle with warm light" },
    { wear: "a trendy {c} blazer dress with a slim belt", scene: "a city rooftop at golden hour with creamy bokeh" },
    { wear: "a cropped {c} knit polo with high-waist wide pants", scene: "a sunny flower market with soft bokeh" },
    { wear: "a romantic {c} floral-print blouse with a long skirt", scene: "a spring cherry-blossom lane in soft light" },
    { wear: "a chic {c} wool coat over a turtleneck and jeans", scene: "a quiet street lined with warm cafe lights at dusk" },
    { wear: "a minimal {c} satin shirt with tailored trousers and delicate earrings", scene: "a modern gallery with soft window light" },
  ],
  male: [
    { wear: "a {c} linen shirt with rolled sleeves and light chinos", scene: "a seaside promenade in soft sunset light" },
    { wear: "a {c} blazer over a white tee with slim trousers", scene: "a city street at dusk with creamy bokeh" },
    { wear: "a {c} zip knit cardigan over a collared shirt", scene: "a cozy library with warm lamps" },
    { wear: "a {c} bomber jacket with a white shirt and slacks", scene: "a campus path with golden ginkgo leaves in autumn light" },
    { wear: "a {c} trench coat over a knit and slacks", scene: "a cafe window on a soft rainy afternoon" },
    { wear: "a relaxed {c} henley shirt with an open overshirt", scene: "a sunlit alley with traditional tiled roofs" },
  ],
};
const POSES: Record<"male" | "female", string[]> = {
  female: [
    "looking at the camera with a soft smile, one hand gently holding her bag strap",
    "laughing naturally while looking slightly away from the camera",
    "tucking her hair behind her ear with a shy glance",
    "walking toward the camera with a relaxed step",
    "holding a takeaway coffee cup close to her chest, looking at the camera",
    "glancing back over her shoulder with a smile",
    "standing with her hands loosely behind her back and her head tilted",
    "seated and relaxed with a gentle smile, hands resting out of frame",
  ],
  male: [
    "looking at the camera with a calm smile, hands in his pockets",
    "laughing naturally while looking slightly away from the camera",
    "adjusting his sleeve with a confident glance",
    "walking toward the camera with a relaxed step",
    "holding a takeaway coffee cup, looking at the camera",
    "glancing back over his shoulder with a smile",
    "leaning lightly against a wall with his arms loosely crossed",
    "seated and relaxed with a gentle smile, hands resting out of frame",
  ],
};

/** 변형 0번은 기본 6가지 안에서, 1·2번은 추가 목록 6가지 안에서 골라요. 같은 값이면 같은 결과예요. */
function pickIdx(i: number, v: number, off: number[], salt: number): { extra: boolean; idx: number } {
  if (v === 0) return { extra: false, idx: (i + off[0] + salt) % 6 };
  return { extra: true, idx: (i * (v + 1) + off[v] + salt) % 6 };
}

/** 복장·헤어·표정·포인트 색은 seed(0~5)와 변형(0~2)으로 골라요. 같은 값이면 같은 그림 설명이 나와요. */
export function spousePrompt(partner: "male" | "female", element: Element5, age: PartnerAge = "mid 20s", seed = 0, variant = 0): string {
  const look = LOOK[element];
  const n = 6;
  const i = ((Math.floor(seed) % n) + n) % n;
  const v = ((Math.floor(variant) % PARTNER_VARIANTS) + PARTNER_VARIANTS) % PARTNER_VARIANTS;
  const po = pickIdx(i, v, OFF_OUTFIT, 0);
  const o = (po.extra ? OUTFITS_X : OUTFITS)[partner][po.idx];
  const color = ACCENTS[element][v];
  const wear = o.wear.replace("{c}", color);
  const ph = pickIdx(i, v, OFF_HAIR, 0);
  const hair = (ph.extra ? HAIR_X : HAIR)[partner][ph.idx];
  const pf = pickIdx(i, v, OFF_FACE, 2);
  const face = (pf.extra ? FACE_X : FACE)[partner][pf.idx];
  const pose = POSES[partner][(i + 3 * v + (partner === "male" ? 2 : 0)) % POSES[partner].length];
  // 남성은 가끔 얇은 안경을 써요(같은 값이면 같게). 여성은 절대 쓰지 않아요.
  const maleGlasses = (i + v) % 3 === 1;
  const a = AGE_LOOK[age];
  const person =
    partner === "female"
      ? `a strikingly attractive, photogenic Korean woman in her ${a}, ${hair}, ${face}, a youthful fresh-faced look, a bare face with no eyeglasses and no eyewear of any kind, eyes clearly visible`
      : `a strikingly handsome, photogenic Korean man in his ${a}, ${hair}, ${face}, ${maleGlasses ? "wearing stylish thin-frame glasses, " : ""}a youthful fresh-faced look`;
  return [
    `A photorealistic fashion-editorial portrait photo of ${person}, wearing ${wear}, ${pose}, in ${o.scene}.`,
    `Mood: ${look.mood}. Flattering soft cinematic lighting, trendy styling, an effortlessly attractive and charming presence.`,
    "Natural skin texture, realistic eyes, shallow depth of field, 3:4 vertical framing. The person is clearly an adult.",
    "An entirely fictional person who does not resemble any real person or celebrity. No text, no letters, no logo, no watermark, no captions.",
  ].join(" ");
}
