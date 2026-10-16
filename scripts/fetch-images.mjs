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
    const res = await fetch(value);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = detectExt(buf);
    if (!ext) throw new Error("이미지 형식을 알 수 없어요");
    await writeFile(path.join(outDir, `${name}.${ext}`), buf);
    manifest[name] = `/images/${name}.${ext}`;
    changed = true;
    console.log(`저장: public/images/${name}.${ext} (${buf.length} bytes)`);
  } catch (err) {
    console.warn(`[fetch-images] ${name} 건너뜀 (${err.message}) — 원격 주소를 계속 사용합니다.`);
  }
}
if (changed) await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
