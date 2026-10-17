import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// 테스트에서도 코드와 똑같이 "@/..." 로 src 안을 가리킬 수 있게 해요. (tsconfig 의 paths 와 같은 규칙)
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: { include: ["src/**/*.test.ts"] },
});
