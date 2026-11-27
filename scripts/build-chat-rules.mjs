// 도유상담실 기준 문서(docs/상담실-기준/prompt/*.md)를 프롬프트 원본으로 묶어서 src/lib/ai/chatRules.generated.ts 로 만들어요.
// 사용: node scripts/build-chat-rules.mjs          (생성)
//       node scripts/build-chat-rules.mjs --check  (최신인지 검사만)
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "docs", "상담실-기준", "prompt");
const out = join(root, "src", "lib", "ai", "chatRules.generated.ts");

export function buildChatRulesSource() {
  const files = readdirSync(dir).filter((f) => f.endsWith(".md")).sort();
  const text = files.map((f) => readFileSync(join(dir, f), "utf8").replace(/\r\n/g, "\n").replace(/\n+$/, "")).join("\n");
  return `/* 자동 생성 파일 — 직접 고치지 마세요. 원본: docs/상담실-기준/prompt/*.md (node scripts/build-chat-rules.mjs) */\nexport const CHAT_RULES = ${JSON.stringify(text)};\nexport const CHAT_RULE_FILES = ${JSON.stringify(files)};\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const next = buildChatRulesSource();
  if (process.argv.includes("--check")) {
    const cur = existsSync(out) ? readFileSync(out, "utf8") : "";
    if (cur !== next) {
      console.error("chatRules.generated.ts 가 최신이 아니에요. node scripts/build-chat-rules.mjs 를 실행해 주세요.");
      process.exit(1);
    }
    console.log("chatRules.generated.ts 최신");
  } else {
    writeFileSync(out, next);
    console.log("생성:", out);
  }
}
