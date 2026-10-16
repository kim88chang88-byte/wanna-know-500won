/** 글자 폭을 재는 함수(보통 ctx.measureText)를 받아서 줄바꿈합니다. 한글은 글자 단위로도 끊을 수 있게 만들었어요. */
export type Measure = (text: string) => number;

export function wrapText(measure: Measure, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/(?<=\s)/)) {
      // 단어 통째로 들어가면 그대로, 아니면 글자 단위로 쪼개서 채웁니다.
      if (measure((line + word).trimEnd()) <= maxWidth) {
        line += word;
        continue;
      }
      if (line) {
        lines.push(line.trimEnd());
        line = "";
      }
      for (const ch of Array.from(word)) {
        if (line && measure((line + ch).trimEnd()) > maxWidth) {
          lines.push(line.trimEnd());
          line = "";
        }
        line += ch;
      }
    }
    lines.push(line.trimEnd());
  }
  return lines;
}

export interface FitResult {
  lines: string[];
  fontSize: number;
  /** 줄 수 제한 때문에 끝을 잘랐는지 */
  truncated: boolean;
}

/**
 * 글자를 maxLines 줄 안에 넣으려고 큰 글자부터 줄여 봅니다.
 * 가장 작은 글자로도 넘치면 마지막 줄 끝을 "…" 로 줄여요.
 * measureAt(size) 는 해당 글자 크기에서의 폭 측정 함수를 돌려줍니다.
 */
export function fitText(
  measureAt: (fontSize: number) => Measure,
  text: string,
  maxWidth: number,
  maxLines: number,
  maxSize: number,
  minSize: number,
  step = 0.5,
): FitResult {
  for (let size = maxSize; size >= minSize - 1e-9; size -= step) {
    const lines = wrapText(measureAt(size), text, maxWidth);
    if (lines.length <= maxLines) return { lines, fontSize: size, truncated: false };
  }
  const measure = measureAt(minSize);
  const lines = wrapText(measure, text, maxWidth).slice(0, maxLines);
  let last = lines[maxLines - 1] ?? "";
  while (last.length > 0 && measure(last + "…") > maxWidth) last = last.slice(0, -1);
  lines[maxLines - 1] = last.trimEnd() + "…";
  return { lines, fontSize: minSize, truncated: true };
}
