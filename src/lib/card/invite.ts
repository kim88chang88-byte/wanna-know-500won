import QRCode from "./qr";
import type { PhotoCardData } from "./photoData";

const SERIF = `"Noto Serif KR", "Apple SD Gothic Neo", "Malgun Gothic", serif`;
const SANS = `"Plus Jakarta Sans", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`;

/** 친구에게 건네는 한 줄. 신년운은 "한 해"로, 나머지는 운 이름을 그대로 써요. */
export function inviteLine(d: Pick<PhotoCardData, "topic" | "topicLabel">): string {
  if (d.topic === "study") return "너의 2027년은 어떤 해일까?";
  return "너의 운세는 어떨까?";
}

/** 주소를 담은 QR 모듈 표. 주소가 너무 길거나 만들 수 없으면 null이에요. */
export function qrModules(url: string): boolean[][] | null {
  if (!url) return null;
  try {
    const q = new QRCode(-1, 0); // 0 = 오류 정정 M
    q.addData(url);
    q.make();
    const n = q.getModuleCount();
    return Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => Boolean(q.isDark(r, c))));
  } catch {
    return null;
  }
}

/** 흰 바탕 위에 QR을 그려요. size 는 QR 자체의 한 변(여백 별도). */
export function drawQr(ctx: CanvasRenderingContext2D, mods: boolean[][], x: number, y: number, size: number, pad: number, radius: number): void {
  const total = size + pad * 2;
  ctx.save();
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + total, y, x + total, y + total, radius);
  ctx.arcTo(x + total, y + total, x, y + total, radius);
  ctx.arcTo(x, y + total, x, y, radius);
  ctx.arcTo(x, y, x + total, y, radius);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#1F2A4D";
  const n = mods.length;
  const m = size / n;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (mods[r][c]) ctx.fillRect(x + pad + c * m, y + pad + r * m, m + 0.35, m + 0.35);
    }
  }
  ctx.restore();
}

/** 밝은 카드 하단: QR 상자 + 초대 문구. 위쪽 y 를 받아 약 50 높이를 써요. */
export function drawInviteRow(ctx: CanvasRenderingContext2D, d: PhotoCardData, cx: number, y: number, colors: { ink: string; muted: string; accent: string }): boolean {
  const mods = qrModules(d.shareUrl);
  if (!mods) return false;
  const size = 42;
  const pad = 4;
  const total = size + pad * 2;
  const left = cx - 104;
  ctx.save();
  ctx.shadowColor = "rgba(70,80,150,0.22)";
  ctx.shadowBlur = 8;
  drawQr(ctx, mods, left, y, size, pad, 8);
  ctx.restore();
  const tx = left + total + 12;
  ctx.textAlign = "left";
  ctx.fillStyle = colors.ink;
  ctx.font = `800 11.5px ${SERIF}`;
  ctx.fillText(inviteLine(d), tx, y + 17);
  ctx.fillStyle = colors.accent;
  ctx.font = `700 9px ${SANS}`;
  ctx.fillText("QR을 찍으면 무료로 볼 수 있어요", tx, y + 31);
  ctx.fillStyle = colors.muted;
  ctx.font = `500 8.5px ${SANS}`;
  ctx.fillText(`도리 운세 사주 · ${d.siteLabel}`, tx, y + 44);
  ctx.textAlign = "center";
  return true;
}
