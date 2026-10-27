import { CARD_H, CARD_W, type PhotoCardData } from "./photoData";
import { drawPremiumCard } from "./drawPremiumCard";
import { fitText } from "./text";
import type { TopicKey } from "@/lib/premium/types";

/*
 * 인스타 스토리용 포토카드(폴라로이드 + 파스텔 오로라 + 반짝이)를 캔버스에 그려요.
 * 좌표는 360×640 기준이고, 호출하는 쪽에서 ctx.scale(CARD_SCALE) 을 먼저 해 주세요.
 * 무작위 값은 쓰지 않아서(고정된 의사난수) 같은 입력이면 항상 같은 그림이 나와요.
 */

const SERIF = `"Noto Serif KR", "Apple SD Gothic Neo", "Malgun Gothic", serif`;
const SANS = `"Plus Jakarta Sans", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`;

const INK = "#1F2A4D";
const MUTED = "#6B7AA8";

/** 주제별 사진 영역 색 [위, 아래, 포인트] 와 배경 큰 글자(한자) */
const THEME: Record<TopicKey, { a: string; b: string; accent: string; glyph: string }> = {
  love: { a: "#FFD6E5", b: "#D9CCFF", accent: "#FF8FB5", glyph: "戀" },
  marriage: { a: "#FFE3CF", b: "#FFD3E1", accent: "#FF9F8A", glyph: "緣" },
  money: { a: "#FFF0B8", b: "#FFD9C2", accent: "#F5B63C", glyph: "財" },
  success: { a: "#C9EBFF", b: "#C8F2EA", accent: "#4DB6E8", glyph: "成" },
  health: { a: "#CFF5DF", b: "#CDE7FF", accent: "#52C79A", glyph: "健" },
  study: { a: "#DCD3FF", b: "#CBDDFF", accent: "#8B7BFF", glyph: "新" },
  general: { a: "#CFE6FF", b: "#E4D8FF", accent: "#6C8FD6", glyph: "運" },
};

function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
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

/** 네 갈래 반짝이 ✦ */
function sparkle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.quadraticCurveTo(cx, cy, cx + r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy + r);
  ctx.quadraticCurveTo(cx, cy, cx - r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy - r);
  ctx.fill();
  ctx.restore();
}

/** 물방울 (비누방울 느낌: 은은한 테두리 + 하이라이트) */
function bubble(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.1, cx, cy, r);
  g.addColorStop(0, "rgba(255,255,255,0.9)");
  g.addColorStop(0.6, "rgba(255,255,255,0.18)");
  g.addColorStop(1, "rgba(255,255,255,0.5)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.restore();
}

function orb(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

function setFont(ctx: CanvasRenderingContext2D, weight: number | string, size: number, family: string, style = "") {
  ctx.font = `${style} ${weight} ${size}px ${family}`.trim();
}

function spaced(ctx: CanvasRenderingContext2D, px: number) {
  // 일부 브라우저에서는 letterSpacing 을 지원하지 않아요. 없으면 그냥 넘어가요.
  (ctx as unknown as { letterSpacing?: string }).letterSpacing = `${px}px`;
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

/** art: 사진 칸에 넣을 동물 그림(선택). 없으면 큰 한자 워터마크만 보여요. */
export function drawPhotoCard(ctx: CanvasRenderingContext2D, d: PhotoCardData, art?: CanvasImageSource | null, artSize?: { w: number; h: number } | null): void {
  if (d.tier === "premium" && d.luxe) return drawPremiumCard(ctx, d);
  const W = CARD_W;
  const H = CARD_H;
  const th = THEME[d.topic];
  ctx.save();
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  /* ---------- 파스텔 오로라 배경 ---------- */
  const bg = ctx.createLinearGradient(0, 0, W * 0.4, H);
  bg.addColorStop(0, "#EDE8FF");
  bg.addColorStop(0.5, "#DCEBFF");
  bg.addColorStop(1, "#FFE7EF");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  orb(ctx, 40, 90, 170, "rgba(190,170,255,0.55)");
  orb(ctx, 330, 250, 170, "rgba(150,210,255,0.55)");
  orb(ctx, 90, 520, 190, "rgba(255,190,215,0.55)");
  orb(ctx, 320, 600, 140, "rgba(255,230,190,0.5)");

  // 반짝이 가루
  const rnd = rng(11);
  for (let i = 0; i < 26; i++) sparkle(ctx, rnd() * W, rnd() * H, 1.6 + rnd() * 3, "#FFFFFF", 0.5 + rnd() * 0.5);
  // 필름 그레인 (아주 옅게)
  for (let i = 0; i < 700; i++) {
    ctx.fillStyle = rnd() > 0.5 ? "rgba(255,255,255,0.35)" : "rgba(120,110,170,0.10)";
    ctx.fillRect(rnd() * W, rnd() * H, 0.8, 0.8);
  }

  /* ---------- 머리글 ---------- */
  ctx.fillStyle = MUTED;
  setFont(ctx, 700, 9.5, SANS);
  spaced(ctx, 2.2);
  ctx.fillText("DORI  ·  CAPSULE", 28, 40);
  ctx.textAlign = "right";
  ctx.fillText(d.dateLabel, W - 28, 40);
  ctx.textAlign = "left";
  spaced(ctx, 0);

  /* ---------- 폴라로이드 (살짝 기울임) ---------- */
  const cx = W / 2;
  const cardW = 292;
  const cardH = 436;
  const cardX = -cardW / 2;
  const cardY = -cardH / 2;
  ctx.save();
  ctx.translate(cx, 98 + cardH / 2);
  ctx.rotate((-2.2 * Math.PI) / 180);

  ctx.save();
  ctx.shadowColor = "rgba(70, 80, 150, 0.28)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 14;
  ctx.fillStyle = "#FFFFFF";
  roundRect(ctx, cardX, cardY, cardW, cardH, 16);
  ctx.fill();
  ctx.restore();

  // 사진 영역
  const pad = 12;
  const phX = cardX + pad;
  const phY = cardY + pad;
  const phW = cardW - pad * 2;
  const phH = 268;
  ctx.save();
  roundRect(ctx, phX, phY, phW, phH, 10);
  ctx.clip();
  const pg = ctx.createLinearGradient(phX, phY, phX + phW * 0.6, phY + phH);
  pg.addColorStop(0, th.a);
  pg.addColorStop(1, th.b);
  ctx.fillStyle = pg;
  ctx.fillRect(phX, phY, phW, phH);
  orb(ctx, phX + phW * 0.2, phY + phH * 0.25, 110, "rgba(255,255,255,0.75)");
  orb(ctx, phX + phW * 0.85, phY + phH * 0.8, 120, "rgba(255,255,255,0.45)");
  // 큰 한자 워터마크
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  setFont(ctx, 900, 170, SERIF);
  ctx.textAlign = "center";
  ctx.fillText(th.glyph, phX + phW / 2, phY + phH / 2 + 58);
  ctx.textAlign = "left";
  if (art && artSize && artSize.w > 0 && artSize.h > 0) {
    const scale = Math.min((phW * 0.92) / artSize.w, (phH * 0.9) / artSize.h);
    const aw = artSize.w * scale;
    const ah = artSize.h * scale;
    ctx.drawImage(art, phX + (phW - aw) / 2, phY + phH - ah - 4, aw, ah);
  }
  // 물방울 + 반짝이
  const r2 = rng(23);
  for (let i = 0; i < 9; i++) bubble(ctx, phX + 12 + r2() * (phW - 24), phY + 14 + r2() * (phH - 28), 4 + r2() * 11, 0.55 + r2() * 0.4);
  for (let i = 0; i < 7; i++) sparkle(ctx, phX + 10 + r2() * (phW - 20), phY + 10 + r2() * (phH - 20), 3 + r2() * 4.5, "#FFFFFF", 0.9);
  ctx.restore();

  // 사진 위 라벨 (알약)
  ctx.save();
  setFont(ctx, 800, 12, SERIF);
  const labelText = d.topicLabel;
  const lw = ctx.measureText(labelText).width + 30;
  ctx.fillStyle = "rgba(255,255,255,0.88)";
  roundRect(ctx, phX + 12, phY + 12, lw, 24, 12);
  ctx.fill();
  sparkle(ctx, phX + 24, phY + 24, 4, th.accent, 1);
  ctx.fillStyle = INK;
  ctx.fillText(labelText, phX + 33, phY + 28.5);
  ctx.restore();

  // 사진 아래 하얀 여백: 제목 / 한마디 / 태그
  const tx = cardX + 20;
  const tw = cardW - 40;
  let y = phY + phH + 26;

  ctx.fillStyle = INK;
  const head = fitLines(ctx, d.headline, SERIF, 800, tw, 2, 15.5, 11.5);
  setFont(ctx, 800, head.fontSize, SERIF);
  for (const line of head.lines) {
    ctx.fillText(line, tx, y);
    y += head.fontSize * 1.38;
  }
  y += 3;

  ctx.fillStyle = MUTED;
  const quote = fitLines(ctx, `“${d.quote}”`, SERIF, 500, tw, 2, 11.5, 9, "italic");
  setFont(ctx, 500, quote.fontSize, SERIF, "italic");
  for (const line of quote.lines) {
    ctx.fillText(line, tx, y);
    y += quote.fontSize * 1.45;
  }

  // 해시태그 칩
  const chipY = cardY + cardH - 38;
  let chipX = tx;
  setFont(ctx, 700, 9.5, SANS);
  for (const tag of d.tags.slice(0, 3)) {
    const w = ctx.measureText(tag).width + 16;
    if (chipX + w > tx + tw) break;
    ctx.fillStyle = "#F1EEFF";
    roundRect(ctx, chipX, chipY, w, 20, 10);
    ctx.fill();
    ctx.fillStyle = "#5B55B8";
    ctx.fillText(tag, chipX + 8, chipY + 13.8);
    chipX += w + 6;
  }

  // 마스킹 테이프
  ctx.save();
  ctx.translate(0, cardY + 2);
  ctx.rotate((3.5 * Math.PI) / 180);
  ctx.fillStyle = "rgba(255, 205, 222, 0.82)";
  ctx.fillRect(-36, -11, 72, 22);
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.fillRect(-36, -11, 72, 5);
  ctx.restore();

  ctx.restore(); // 폴라로이드 끝

  /* ---------- 행운 컬러 ---------- */
  const ly = 98 + cardH + 40;
  ctx.save();
  ctx.fillStyle = d.lucky.hex;
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 2.5;
  ctx.shadowColor = "rgba(70,80,150,0.25)";
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(cx - 70, ly - 4, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = INK;
  setFont(ctx, 700, 11, SERIF);
  ctx.fillText(`행운 컬러 ${d.lucky.color}`, cx - 54, ly - 5);
  ctx.fillStyle = MUTED;
  setFont(ctx, 500, 9.5, SANS);
  ctx.fillText(`행운 방향 ${d.lucky.direction}`, cx - 54, ly + 9);

  /* ---------- 브랜드 ---------- */
  ctx.textAlign = "center";
  ctx.fillStyle = INK;
  setFont(ctx, 800, 12, SERIF);
  ctx.fillText("도리 운세 사주", cx, H - 28);
  ctx.fillStyle = MUTED;
  setFont(ctx, 500, 8.5, SANS);
  ctx.fillText(d.siteLabel, cx, H - 14);
  bubble(ctx, cx - 62, H - 32, 4.5, 0.9);
  bubble(ctx, cx + 62, H - 32, 3.5, 0.9);
  ctx.textAlign = "left";

  ctx.restore();
}
