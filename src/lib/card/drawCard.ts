import { CARD_H, CARD_W, type CardData } from "./data";
import { fitText } from "./text";

/*
 * 인스타 스토리용 결과지(양피지 + 밀랍 씰 + 꽃거지 말풍선)를 캔버스에 그립니다.
 * 좌표는 360×640 기준이고, 호출하는 쪽에서 ctx.scale(CARD_SCALE) 을 먼저 해 주세요.
 * 무작위 값은 쓰지 않아서(고정된 의사난수) 같은 입력이면 항상 같은 그림이 나와요.
 */

const SERIF = `"Noto Serif KR", "Playfair Display", "Apple SD Gothic Neo", "Malgun Gothic", serif`;
const SANS = `"Plus Jakarta Sans", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`;

const C = {
  brand: "#D6204D",
  brandDark: "#9E1B3C",
  ink: "#3F3024",
  muted: "#8A7355",
  gold: "#F2A413",
  starOff: "#DCCFB4",
  paperTop: "#FCF4E0",
  paperBottom: "#F4E3BE",
};

/** 같은 입력이면 같은 결과가 나오는 간단한 의사난수 */
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

function star(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

/** 오른쪽 끝(rightX)에 맞춰 별 5개 */
function stars(ctx: CanvasRenderingContext2D, rightX: number, cy: number, score: number, r = 7) {
  const gap = r * 2.5;
  for (let i = 0; i < 5; i++) star(ctx, rightX - r - (4 - i) * gap, cy, r, i < score ? C.gold : C.starOff);
}

function flower(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.fillStyle = color;
  for (let i = 0; i < 5; i++) {
    const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * r * 0.62, cy + Math.sin(a) * r * 0.62, r * 0.48, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#FFE9A8";
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.3, 0, Math.PI * 2);
  ctx.fill();
}

function petal(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rot: number, alpha: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#F7A8BE";
  ctx.beginPath();
  ctx.ellipse(0, 0, size, size * 0.62, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function lock(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.strokeStyle = C.muted;
  ctx.fillStyle = C.muted;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.arc(x + 4, y + 3.5, 2.6, Math.PI, 0);
  ctx.stroke();
  roundRect(ctx, x, y + 3.5, 8, 6.5, 1.5);
  ctx.fill();
  ctx.restore();
}

function setFont(ctx: CanvasRenderingContext2D, weight: number | string, size: number, family: string) {
  ctx.font = `${weight} ${size}px ${family}`;
}

export function drawResultCard(ctx: CanvasRenderingContext2D, d: CardData): void {
  const W = CARD_W;
  const H = CARD_H;
  ctx.save();
  ctx.textBaseline = "alphabetic";

  /* ---------- 배경 + 벚꽃잎 ---------- */
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#FFDCE6");
  bg.addColorStop(0.55, "#FFEEF3");
  bg.addColorStop(1, "#FFF8FA");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const rnd = rng(7);
  for (let i = 0; i < 22; i++) petal(ctx, rnd() * W, rnd() * H, 4 + rnd() * 5, rnd() * Math.PI, 0.25 + rnd() * 0.35);
  ctx.globalAlpha = 1;

  /* ---------- 양피지 ---------- */
  const px = 22, py = 66, pw = W - 44, ph = 538;
  ctx.save();
  ctx.shadowColor = "rgba(120, 70, 30, 0.28)";
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 7;
  const paper = ctx.createLinearGradient(0, py, 0, py + ph);
  paper.addColorStop(0, C.paperTop);
  paper.addColorStop(1, C.paperBottom);
  ctx.fillStyle = paper;
  roundRect(ctx, px, py, pw, ph, 14);
  ctx.fill();
  ctx.restore();

  // 종이 결(얼룩)과 가장자리 그늘
  ctx.save();
  roundRect(ctx, px, py, pw, ph, 14);
  ctx.clip();
  const r2 = rng(42);
  for (let i = 0; i < 160; i++) {
    ctx.fillStyle = `rgba(140, 100, 50, ${0.03 + r2() * 0.06})`;
    ctx.beginPath();
    ctx.arc(px + r2() * pw, py + r2() * ph, 0.5 + r2() * 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  const vg = ctx.createRadialGradient(W / 2, py + ph / 2, ph * 0.28, W / 2, py + ph / 2, ph * 0.72);
  vg.addColorStop(0, "rgba(160, 110, 50, 0)");
  vg.addColorStop(1, "rgba(160, 110, 50, 0.22)");
  ctx.fillStyle = vg;
  ctx.fillRect(px, py, pw, ph);
  ctx.restore();

  ctx.strokeStyle = "rgba(190, 145, 80, 0.55)";
  ctx.lineWidth = 1;
  roundRect(ctx, px + 8, py + 8, pw - 16, ph - 16, 9);
  ctx.stroke();

  /* ---------- 머리글 ---------- */
  ctx.textAlign = "center";
  ctx.fillStyle = C.brand;
  setFont(ctx, 700, 12, SERIF);
  ctx.fillText("꽃거지의 신묘한 사주", W / 2, py + 52);
  ctx.fillStyle = C.muted;
  setFont(ctx, 500, 9.5, SANS);
  ctx.fillText(`${d.topicLabel} 캡슐  ·  ${d.dateLabel}`, W / 2, py + 68);

  /* ---------- 밀랍 씰 ---------- */
  const sx = W / 2, sy = py, sr = 25;
  ctx.save();
  ctx.shadowColor = "rgba(80, 10, 30, 0.35)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  const wax = ctx.createRadialGradient(sx - 7, sy - 8, 3, sx, sy, sr + 3);
  wax.addColorStop(0, "#E4506F");
  wax.addColorStop(1, C.brandDark);
  ctx.fillStyle = wax;
  ctx.beginPath();
  const bumps = 14;
  for (let i = 0; i <= bumps * 8; i++) {
    const a = (i / (bumps * 8)) * Math.PI * 2;
    const rad = sr + Math.sin(a * bumps) * 1.6 + Math.sin(a * 3 + 1) * 1.1;
    const x = sx + Math.cos(a) * rad;
    const y = sy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = "rgba(255, 220, 230, 0.55)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(sx, sy, sr - 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#FFE3EA";
  setFont(ctx, 700, 22, SERIF);
  ctx.textBaseline = "middle";
  ctx.fillText("花", sx, sy + 1);
  ctx.textBaseline = "alphabetic";

  /* ---------- 오늘의 키워드 ---------- */
  ctx.fillStyle = C.muted;
  setFont(ctx, 500, 10, SANS);
  ctx.fillText("오늘의 키워드", W / 2, py + 104);
  const kw = fitText((s) => (t) => (setFont(ctx, 900, s, SERIF), ctx.measureText(t).width), d.keyword, pw - 40, 1, 34, 20);
  ctx.fillStyle = C.brand;
  setFont(ctx, 900, kw.fontSize, SERIF);
  ctx.fillText(kw.lines[0], W / 2, py + 142);

  // 장식 줄
  const oy = py + 160;
  ctx.strokeStyle = "rgba(190, 145, 80, 0.7)";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(px + 40, oy);
  ctx.lineTo(W / 2 - 14, oy);
  ctx.moveTo(W / 2 + 14, oy);
  ctx.lineTo(W - px - 40, oy);
  ctx.stroke();
  flower(ctx, W / 2, oy, 6, "#F58BA6");

  /* ---------- 총운 ---------- */
  const left = px + 24;
  const right = px + pw - 24;
  let y = py + 190;
  ctx.textAlign = "left";
  ctx.fillStyle = C.ink;
  setFont(ctx, 700, 12.5, SERIF);
  ctx.fillText("총운", left, y);
  stars(ctx, right, y - 4, d.totalScore, 7.5);
  y += 20;
  const sum = fitText((s) => (t) => (setFont(ctx, 500, s, SERIF), ctx.measureText(t).width), d.totalSummary, right - left, 3, 12.5, 10.5);
  ctx.fillStyle = C.ink;
  setFont(ctx, 500, sum.fontSize, SERIF);
  sum.lines.forEach((ln, i) => ctx.fillText(ln, left, y + i * (sum.fontSize + 4.5)));
  y += 3 * (12.5 + 4.5) + 6;

  /* ---------- 연애·금전·마음운 (풀이 문장은 가림) ---------- */
  d.indicators.slice(0, 3).forEach((ind, i) => {
    const iy = y + i * 46;
    ctx.fillStyle = "rgba(255, 250, 238, 0.55)";
    roundRect(ctx, left - 8, iy - 14, right - left + 16, 40, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(190, 145, 80, 0.35)";
    ctx.lineWidth = 0.8;
    ctx.stroke();

    ctx.fillStyle = C.ink;
    setFont(ctx, 700, 11.5, SERIF);
    ctx.textAlign = "left";
    ctx.fillText(ind.label, left, iy + 1);
    stars(ctx, right, iy - 3, ind.score, 6);

    lock(ctx, left, iy + 8);
    ctx.fillStyle = "rgba(138, 115, 85, 0.22)";
    roundRect(ctx, left + 14, iy + 10, 118, 5, 2.5);
    ctx.fill();
    roundRect(ctx, left + 138, iy + 10, 62, 5, 2.5);
    ctx.fill();
  });

  /* ---------- 꽃거지 말풍선 ---------- */
  const by = y + 3 * 46 + 6;
  const bh = py + ph - 18 - by;
  const bx = left - 8;
  const bw = right - left + 16;
  ctx.save();
  ctx.shadowColor = "rgba(214, 32, 77, 0.18)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = "#FFFFFF";
  roundRect(ctx, bx, by, bw, bh, 12);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = "#F7B5C6";
  ctx.lineWidth = 1;
  roundRect(ctx, bx, by, bw, bh, 12);
  ctx.stroke();
  // 말풍선 꼬리
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.moveTo(bx + 26, by);
  ctx.lineTo(bx + 18, by - 9);
  ctx.lineTo(bx + 40, by);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#F7B5C6";
  ctx.beginPath();
  ctx.moveTo(bx + 18, by - 9);
  ctx.lineTo(bx + 26, by);
  ctx.moveTo(bx + 18, by - 9);
  ctx.lineTo(bx + 40, by);
  ctx.stroke();
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(bx + 27, by - 1.5, 12, 3);

  flower(ctx, bx + 16, by + 17, 6.5, "#F58BA6");
  ctx.fillStyle = C.brand;
  setFont(ctx, 700, 10, SERIF);
  ctx.fillText("꽃거지의 한마디", bx + 28, by + 20.5);

  const textTop = by + 36;
  const avail = by + bh - 10 - textTop;
  const kk = fitText(
    (s) => (t) => (setFont(ctx, 500, s, SERIF), ctx.measureText(t).width),
    d.kkotgeoji,
    bw - 24,
    Math.max(2, Math.floor(avail / 15)),
    12.5,
    10,
  );
  ctx.fillStyle = C.ink;
  setFont(ctx, 500, kk.fontSize, SERIF);
  const lh = kk.fontSize + 4.5;
  kk.lines.forEach((ln, i) => ctx.fillText(ln, bx + 12, textTop + 8 + i * lh));

  /* ---------- 바닥글 ---------- */
  ctx.textAlign = "center";
  ctx.fillStyle = "#C3647E";
  setFont(ctx, 600, 9.5, SANS);
  ctx.fillText("동전 하나로 뽑는 오늘의 운", W / 2, H - 22);
  ctx.fillStyle = "#D79AAB";
  setFont(ctx, 400, 8, SANS);
  ctx.fillText("재미와 위로를 위한 풀이예요", W / 2, H - 10);

  ctx.restore();
}
