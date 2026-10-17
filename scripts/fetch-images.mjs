// Stitch 가 호스팅한 랜딩 이미지를 public/images/ 로 내려받아 imageManifest.json 을 로컬 경로로 바꿉니다.
// - 이미 "/images/..." 로 바뀐 항목은 건너뜁니다. (여러 번 실행해도 안전)
// - 네트워크가 안 되면 경고만 남기고 정상 종료해서 dev/build 를 막지 않습니다.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(root, "src/components/landing/imageManifest.json");
const outDir = path.join(root, "public/images");

const kinds = [
  [[0xff, 0xd8, 0xff], "jpg"],
  [[0x89, 0x50, 0x4e, 0x47], "png"],
  [[0x47, 0x49, 0x46, 0x38], "gif"],
];
function detectExt(buf) {
  // AVIF: 4~12번째 바이트가 "ftypavif" / "ftypavis"
  if (buf.subarray(4, 8).toString() === "ftyp" && /^avi[fs]$/.test(buf.subarray(8, 12).toString())) return "avif";
  for (const [sig, ext] of kinds) if (sig.every((b, i) => buf[i] === b)) return ext;
  if (buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP") return "webp";
  return null;
}

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
await mkdir(outDir, { recursive: true });
let changed = false;

for (const [name, value] of Object.entries(manifest)) {
  if (!/^https?:\/\//.test(value)) continue;
  try {
    // 흔한 이미지 형식(png/jpeg/webp)으로 달라고 요청해요. 서버가 특수 형식으로 보내는 걸 줄여줘요.
    const res = await fetch(value, {
      headers: {
        Accept: "image/png,image/jpeg,image/webp,image/*;q=0.8",
        "User-Agent": "Mozilla/5.0 (compatible; wanna-know-500won fetch-images)",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = detectExt(buf);
    if (!ext) {
      const type = res.headers.get("content-type") ?? "알 수 없음";
      const head = buf.subarray(0, 24).toString("hex");
      throw new Error(`이미지 형식을 알 수 없어요 (content-type: ${type}, 크기: ${buf.length}바이트, 앞부분: ${head})`);
    }
    await writeFile(path.join(outDir, `${name}.${ext}`), buf);
    manifest[name] = `/images/${name}.${ext}`;
    changed = true;
    console.log(`저장: public/images/${name}.${ext} (${buf.length} bytes)`);
  } catch (err) {
    console.warn(`[fetch-images] ${name} 건너뜀 (${err.message}) — 원격 주소를 계속 사용합니다.`);
  }
}
if (changed) await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
