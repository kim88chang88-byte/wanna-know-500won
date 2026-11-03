import type { Element5, PartnerAge } from "@/lib/ai/image";

/**
 * 운명의 상대 이미지를 서버(Supabase Storage)에 저장해 두고 꺼내 쓰기 위한 도구예요.
 * 조합은 상대 성별 2 × 연령대 3 × 오행 5 × 복장 6 = 180가지, 조합마다 1장이에요. (docs/PARTNER_IMAGE.md)
 */
export const PARTNER_BUCKET = "partner-images";
export const PARTNER_AGES: PartnerAge[] = ["mid 20s", "late 20s", "mid 30s"];
export const PARTNER_ELEMENTS: Element5[] = ["wood", "fire", "earth", "metal", "water"];
export const PARTNER_SEEDS = [0, 1, 2, 3, 4, 5];
export const MAX_STORED_BYTES = 600_000;

export interface StoreConfig {
  url: string;
  serviceKey: string;
}
type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/** 파일 이름: 상대성별/연령대/오행/복장번호.webp */
export function partnerImageKey(partner: "male" | "female", age: PartnerAge, element: Element5, seed: number): string {
  const s = ((Math.floor(seed) % 6) + 6) % 6;
  return `${partner}/${age.replace(" ", "-")}/${element}/${s}.webp`;
}

export function allPartnerKeys(): string[] {
  const keys: string[] = [];
  for (const p of ["female", "male"] as const) for (const a of PARTNER_AGES) for (const e of PARTNER_ELEMENTS) for (const s of PARTNER_SEEDS) keys.push(partnerImageKey(p, a, e, s));
  return keys;
}

/** 관리자가 보낸 키가 우리가 만든 180가지 중 하나인지 확인해요. */
export function isPartnerKey(key: string): boolean {
  return allPartnerKeys().includes(key);
}

export function partnerPublicUrl(baseUrl: string, key: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/storage/v1/object/public/${PARTNER_BUCKET}/${key}`;
}

/** 저장된 이미지가 있는지 확인해요. 네트워크가 막히면 없는 것으로 봐요. */
export async function partnerImageExists(baseUrl: string, key: string, fetchImpl: FetchLike = fetch): Promise<boolean> {
  try {
    const res = await fetchImpl(partnerPublicUrl(baseUrl, key), { method: "HEAD", signal: AbortSignal.timeout(4000) });
    return res.ok;
  } catch {
    return false;
  }
}

const auth = (c: StoreConfig) => ({ apikey: c.serviceKey, Authorization: `Bearer ${c.serviceKey}` });

/** 저장 공간(공개 버킷)이 없으면 만들어요. */
export async function ensureBucket(c: StoreConfig, fetchImpl: FetchLike = fetch): Promise<boolean> {
  const res = await fetchImpl(`${c.url}/storage/v1/bucket`, {
    method: "POST",
    headers: { ...auth(c), "Content-Type": "application/json" },
    body: JSON.stringify({ id: PARTNER_BUCKET, name: PARTNER_BUCKET, public: true, file_size_limit: MAX_STORED_BYTES, allowed_mime_types: ["image/webp"] }),
  });
  return res.ok || res.status === 409 || res.status === 400; // 이미 있으면 괜찮아요
}

/** webp 이미지를 저장(덮어쓰기)해요. 버킷이 없으면 만들고 한 번 더 해요. */
export async function savePartnerImage(c: StoreConfig, key: string, bytes: Uint8Array, fetchImpl: FetchLike = fetch): Promise<{ ok: boolean; status: number }> {
  const put = () =>
    fetchImpl(`${c.url.replace(/\/+$/, "")}/storage/v1/object/${PARTNER_BUCKET}/${key}`, {
      method: "POST",
      headers: { ...auth(c), "Content-Type": "image/webp", "x-upsert": "true", "Cache-Control": "max-age=86400" },
      body: bytes as unknown as BodyInit,
    });
  let res = await put();
  if (!res.ok && (res.status === 404 || res.status === 400)) {
    await ensureBucket(c, fetchImpl);
    res = await put();
  }
  return { ok: res.ok, status: res.status };
}
