import { CARD_H, CARD_W, type PhotoCardData } from "./photoData";
import { fitText } from "./text";
import type { TopicKey } from "@/lib/premium/types";

/*
 * 프리미엄 포토카드: 미드나잇 배경 + 샴페인 골드 이중 프레임 + 메달리온 + 사주 네 기둥 플레이트.
 * 좌표는 360×640 기준(호출하는 쪽에서 scale 적용). 무작위는 고정 시드라서 같은 입력이면 같은 그림이에요.
 * 이모지는 쓰지 않아요.
 */

const SERIF = `"Noto Serif KR", "Apple SD Gothic Neo", "Malgun Gothic", serif`;
const SANS = `"Plus Jakarta Sans", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`;

const GOLD_LIGHT = "#F7E6B5";
const GOLD = "#E2BF78";
const GOLD_DEEP = "#B98A3E";
const IVORY = "#FBF4E2";
const IVORY_DIM = "rgba(251,244,226,0.66)";

const GLYPH: Record<TopicKey, { glyph: string; en: string }> = {
  love: { glyph: "戀", en: "LOVE" },
  marriage: { glyph: "緣", en: "DESTINY" },
  money: { glyph: "財", en: "WEALTH" },
  success: { glyph: "成", en: "SUCCESS" },
  health: { glyph: "健", en: "VITALITY" },
  study: { glyph: "學", en: "WISDOM" },
  general: { glyph: "運", en: "FORTUNE" },
};

function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function setFont(ctx: CanvasRenderingContext2D, weight: number | string, size: number, family: string, style = "") {
  ctx.font = `${style} ${weight} ${size}px ${family}`.trim();
}

function spaced(ctx: CanvasRenderingContext2D, px: number) {
  (ctx as unknown as { letterSpacing?: string }).letterSpacing = `${px}px`;
}

function goldGrad(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, GOLD_LIGHT);
  g.addColorStop(0.5, GOLD);
  g.addColorStop(1, GOLD_DEEP);
  return g;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function diamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r, cy);
  ctx.lineTo(cx, cy + r);
  ctx.lineTo(cx - r, cy);
  ctx.closePath();
  ctx.fill();
}

function sparkle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = GOLD_LIGHT;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.quadraticCurveTo(cx, cy, cx + r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy + r);
  ctx.quadraticCurveTo(cx, cy, cx - r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy - r);
  ctx.fill();
  ctx.restore();
}

/** 가운데 다이아몬드가 있는 가는 구분선 */
function divider(ctx: CanvasRenderingContext2D, cx: number, y: number, half: number) {
  ctx.save();
  const g = ctx.createLinearGradient(cx - half, y, cx + half, y);
  g.addColorStop(0, "rgba(226,191,120,0)");
  g.addColorStop(0.5, GOLD);
  g.addColorStop(1, "rgba(226,191,120,0)");
  ctx.strokeStyle = g;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(cx - half, y);
  ctx.lineTo(cx - 7, y);
  ctx.moveTo(cx + 7, y);
  ctx.lineTo(cx + half, y);
  ctx.stroke();
  ctx.fillStyle = GOLD;
  diamond(ctx, cx, y, 2.6);
  ctx.restore();
}

/** 모서리 장식(아르데코풍 ㄱ자 + 다이아몬드) */
function corner(ctx: CanvasRenderingContext2D, x: number, y: number, sx: number, sy: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sx, sy);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, 26);
  ctx.lineTo(0, 0);
  ctx.lineTo(26, 0);
  ctx.stroke();
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(6, 18);
  ctx.lineTo(6, 6);
  ctx.lineTo(18, 6);
  ctx.stroke();
  ctx.fillStyle = GOLD_LIGHT;
  diamond(ctx, 0, 0, 3.2);
  ctx.restore();
}

function fitLines(ctx: CanvasRenderingContext2D, text: string, family: string, weight: number, maxW: number, maxLines: number, maxSize: number, minSize: number, style = "") {
  return fitText(
    (size) => (t) => {
      setFont(ctx, weight, size, family, style);
      return ctx.measureText(t).width;
    },
    text,
    maxW,
    maxLines,
    maxSize,
    minSize,
  );
}

export function drawPremiumCard(ctx: CanvasRenderingContext2D, d: PhotoCardData): void {
  const W = CARD_W;
  const H = CARD_H;
  const cx = W / 2;
  const g = GLYPH[d.topic];
  const luxe = d.luxe;
  ctx.save();
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "center";

  /* ---------- 미드나잇 배경 ---------- */
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#1D1830");
  bg.addColorStop(0.5, "#15111F");
  bg.addColorStop(1, "#0C0A14");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(cx, 150, 8, cx, 150, 230);
  glow.addColorStop(0, "rgba(226,191,120,0.30)");
  glow.addColorStop(0.5, "rgba(226,191,120,0.07)");
  glow.addColorStop(1, "rgba(226,191,120,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  const glow2 = ctx.createRadialGradient(cx, H + 40, 10, cx, H + 40, 260);
  glow2.addColorStop(0, "rgba(150,110,200,0.28)");
  glow2.addColorStop(1, "rgba(150,110,200,0)");
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, W, H);

  // 금가루
  const rnd = rng(31);
  for (let i = 0; i < 70; i++) {
    ctx.fillStyle = `rgba(247,230,181,${0.12 + rnd() * 0.4})`;
    const r = 0.4 + rnd() * 0.9;
    ctx.beginPath();
    ctx.arc(rnd() * W, rnd() * H, r, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 9; i++) sparkle(ctx, 24 + rnd() * (W - 48), 24 + rnd() * (H - 48), 2 + rnd() * 3.2, 0.5 + rnd() * 0.5);

  /* ---------- 이중 골드 프레임 ---------- */
  ctx.strokeStyle = goldGrad(ctx, 0, 0, W, H);
  ctx.lineWidth = 1.4;
  roundRect(ctx, 13, 13, W - 26, H - 26, 6);
  ctx.stroke();
  ctx.lineWidth = 0.6;
  ctx.globalAlpha = 0.7;
  roundRect(ctx, 19, 19, W - 38, H - 38, 3);
  ctx.stroke();
  ctx.globalAlpha = 1;
  corner(ctx, 19, 19, 1, 1);
  corner(ctx, W - 19, 19, -1, 1);
  corner(ctx, 19, H - 19, 1, -1);
  corner(ctx, W - 19, H - 19, -1, -1);

  /* ---------- 머리글 ---------- */
  ctx.fillStyle = goldGrad(ctx, cx - 70, 0, cx + 70, 0);
  setFont(ctx, 700, 9, SANS);
  spaced(ctx, 3.4);
  ctx.fillText("DORI  PREMIUM  REPORT", cx, 47);
  spaced(ctx, 0);

  /* ---------- 메달리온 ---------- */
  const my = 134;
  ctx.save();
  // 바깥 눈금
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    const long = i % 6 === 0;
    const r1 = 66;
    const r2 = long ? 59 : 62;
    ctx.strokeStyle = long ? GOLD_LIGHT : "rgba(226,191,120,0.55)";
    ctx.lineWidth = long ? 1.1 : 0.6;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r1, my + Math.sin(a) * r1);
    ctx.lineTo(cx + Math.cos(a) * r2, my + Math.sin(a) * r2);
    ctx.stroke();
  }
  ctx.strokeStyle = goldGrad(ctx, cx - 56, my - 56, cx + 56, my + 56);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(cx, my, 53, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.arc(cx, my, 48, 0, Math.PI * 2);
  ctx.stroke();
  const inner = ctx.createRadialGradient(cx, my - 10, 4, cx, my, 48);
  inner.addColorStop(0, "rgba(226,191,120,0.20)");
  inner.addColorStop(1, "rgba(226,191,120,0.02)");
  ctx.fillStyle = inner;
  ctx.beginPath();
  ctx.arc(cx, my, 47.5, 0, Math.PI * 2);
  ctx.fill();
  // 한자
  ctx.shadowColor = "rgba(226,191,120,0.55)";
  ctx.shadowBlur = 14;
  ctx.fillStyle = goldGrad(ctx, cx, my - 36, cx, my + 36);
  setFont(ctx, 900, 62, SERIF);
  ctx.fillText(g.glyph, cx, my + 22);
  ctx.restore();
  // 메달리온 좌우 별
  ctx.fillStyle = GOLD;
  diamond(ctx, cx - 92, my, 3);
  diamond(ctx, cx + 92, my, 3);
  sparkle(ctx, cx - 78, my - 44, 4.4, 0.95);
  sparkle(ctx, cx + 80, my + 42, 3.6, 0.85);

  /* ---------- 주제 + 제목 ---------- */
  ctx.fillStyle = goldGrad(ctx, cx - 60, 0, cx + 60, 0);
  setFont(ctx, 800, 11, SERIF);
  spaced(ctx, 2.6);
  ctx.fillText(`${g.en}  ·  ${d.topicLabel}`, cx, 232);
  spaced(ctx, 0);

  ctx.fillStyle = IVORY;
  const head = fitLines(ctx, d.headline, SERIF, 800, W - 92, 3, 17, 12.5);
  setFont(ctx, 800, head.fontSize, SERIF);
  let y = 258;
  for (const line of head.lines) {
    ctx.fillText(line, cx, y);
    y += head.fontSize * 1.42;
  }
  y = Math.max(y, 322) + 4;
  divider(ctx, cx, y, 84);

  /* ---------- 사주 네 기둥 플레이트 ---------- */
  const plateY = y + 16;
  const plateW = 252;
  const colW = plateW / 4;
  const plateX = cx - plateW / 2;
  const plateH = 92;
  const labels = ["年", "月", "日", "時"];
  const pillars = luxe?.pillars ?? [null, null, null, null];
  ctx.save();
  // 일주 하이라이트
  ctx.fillStyle = goldGrad(ctx, plateX + colW * 2, plateY, plateX + colW * 3, plateY + plateH);
  roundRect(ctx, plateX + colW * 2 + 3, plateY, colW - 6, plateH, 7);
  ctx.fill();
  ctx.strokeStyle = "rgba(226,191,120,0.45)";
  ctx.lineWidth = 0.7;
  roundRect(ctx, plateX, plateY, plateW, plateH, 8);
  ctx.stroke();
  for (let i = 0; i < 4; i++) {
    const isDay = i === 2;
    const colCx = plateX + colW * i + colW / 2;
    ctx.fillStyle = isDay ? "#2A2038" : GOLD;
    setFont(ctx, 700, 9, SERIF);
    ctx.fillText(labels[i], colCx, plateY + 15);
    const p = pillars[i];
    if (p) {
      const [stem, branch] = Array.from(p);
      ctx.fillStyle = isDay ? "#1B1424" : IVORY;
      setFont(ctx, 900, 27, SERIF);
      ctx.fillText(stem, colCx, plateY + 46);
      ctx.fillText(branch, colCx, plateY + 79);
    } else {
      ctx.fillStyle = IVORY_DIM;
      setFont(ctx, 500, 10, SANS);
      ctx.fillText("미상", colCx, plateY + 52);
    }
    if (i > 0 && i !== 2 && i !== 3) {
      ctx.strokeStyle = "rgba(226,191,120,0.25)";
      ctx.beginPath();
      ctx.moveTo(plateX + colW * i, plateY + 8);
      ctx.lineTo(plateX + colW * i, plateY + plateH - 8);
      ctx.stroke();
    }
  }
  ctx.restore();

  ctx.fillStyle = IVORY_DIM;
  setFont(ctx, 600, 10, SERIF);
  spaced(ctx, 0.6);
  ctx.fillText(`${luxe?.dayLabel ?? ""}${luxe?.structure ? `  ·  ${luxe.structure}` : ""}`, cx, plateY + plateH + 19);
  spaced(ctx, 0);

  /* ---------- 한마디 ---------- */
  let qy = plateY + plateH + 46;
  ctx.fillStyle = GOLD_LIGHT;
  const quote = fitLines(ctx, `“${d.quote}”`, SERIF, 500, W - 90, 2, 12, 9.5, "italic");
  setFont(ctx, 500, quote.fontSize, SERIF, "italic");
  for (const line of quote.lines) {
    ctx.fillText(line, cx, qy);
    qy += quote.fontSize * 1.5;
  }

  /* ---------- 해시태그 칩 ---------- */
  setFont(ctx, 700, 9, SANS);
  const tags = d.tags.slice(0, 3);
  const widths = tags.map((t) => ctx.measureText(t).width + 16);
  const total = widths.reduce((a, b) => a + b, 0) + (tags.length - 1) * 6;
  let chipX = cx - total / 2;
  const chipY = Math.max(qy - 4, 520);
  ctx.textAlign = "left";
  tags.forEach((t, i) => {
    ctx.strokeStyle = "rgba(226,191,120,0.7)";
    ctx.lineWidth = 0.8;
    roundRect(ctx, chipX, chipY, widths[i], 18, 9);
    ctx.stroke();
    ctx.fillStyle = GOLD_LIGHT;
    ctx.fillText(t, chipX + 8, chipY + 12.4);
    chipX += widths[i] + 6;
  });
  ctx.textAlign = "center";

  /* ---------- 행운 + 브랜드 ---------- */
  const ly = chipY + 38;
  ctx.save();
  ctx.fillStyle = d.lucky.hex;
  ctx.strokeStyle = GOLD_LIGHT;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(cx - 74, ly - 3.5, 6.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  ctx.textAlign = "left";
  ctx.fillStyle = IVORY;
  setFont(ctx, 600, 10, SERIF);
  ctx.fillText(`행운 컬러 ${d.lucky.color}  ·  방향 ${d.lucky.direction}`, cx - 62, ly);
  ctx.textAlign = "center";

  ctx.fillStyle = goldGrad(ctx, cx - 50, 0, cx + 50, 0);
  setFont(ctx, 800, 11.5, SERIF);
  spaced(ctx, 2);
  ctx.fillText("도리 운세 사주", cx, H - 36);
  spaced(ctx, 0);
  ctx.fillStyle = IVORY_DIM;
  setFont(ctx, 500, 8, SANS);
  ctx.fillText(`${d.siteLabel}  ·  ${d.dateLabel}`, cx, H - 25);

  ctx.restore();
}
