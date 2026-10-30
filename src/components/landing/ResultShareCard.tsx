"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PremiumReportView, TopicKey } from "@/lib/premium/types";
import { drawPhotoCard } from "@/lib/card/drawPhotoCard";
import { buildPhotoCardData, CARD_H, CARD_SCALE, CARD_W, photoAltText, photoFileName, shareCaption } from "@/lib/card/photoData";
import { IMAGES } from "./images";

/** 같은 사이트 안의 도리 로고. 다른 사이트 그림은 저장용 캔버스를 막아서 쓰지 않아요. */
const CARD_LOGO = "/images/dori-icon.webp";

const ART: Partial<Record<TopicKey, string>> = {
  love: "machineLove",
  marriage: "machineMarriage",
  money: "machineMoney",
  success: "machineSuccess",
  health: "machineHealth",
  study: "machineStudy",
};

function loadImage(src: string | null | undefined): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function loadArt(topic: TopicKey): Promise<HTMLImageElement | null> {
  return loadImage(ART[topic] ? IMAGES[ART[topic]!] : null);
}

/** 결과를 인스타 스토리 크기(1080×1920) 카드 한 장으로 만들어 저장·공유해요. 서버로 보내지 않고 이 기기에서만 그려요. */
export default function ResultShareCard({ report, aiQuote }: { report: PremiumReportView; aiQuote?: string | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [ready, setReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const [linkMsg, setLinkMsg] = useState("");
  const data = useMemo(
    () => buildPhotoCardData(report, { date: new Date(), siteLabel: typeof window === "undefined" ? "" : window.location.host, shareUrl: typeof window === "undefined" ? "" : window.location.origin, aiQuote }),
    [report, aiQuote],
  );

  // 미리보기와 저장용 그림은 같은 함수로 그려요.
  async function render(canvas: HTMLCanvasElement) {
    const [art, logo] = await Promise.all([loadArt(data.topic), loadImage(CARD_LOGO)]);
    canvas.width = CARD_W * CARD_SCALE;
    canvas.height = CARD_H * CARD_SCALE;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no-canvas");
    try {
      await document.fonts?.ready;
    } catch {
      /* 글꼴 준비를 기다리지 못해도 기본 글꼴로 그려요 */
    }
    ctx.setTransform(CARD_SCALE, 0, 0, CARD_SCALE, 0, 0);
    drawPhotoCard(ctx, data, art, art ? { w: art.naturalWidth, h: art.naturalHeight } : null, logo);
  }

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    let alive = true;
    render(c)
      .then(() => alive && setReady(true))
      .catch(() => alive && setReady(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  /** 문구와 링크를 클립보드에 넣어요. 이미지만 올려도 붙여넣기로 링크를 같이 보낼 수 있어요. */
  async function copyCaption(): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(shareCaption(data, window.location.origin));
      return true;
    } catch {
      return false;
    }
  }

  async function shareLink() {
    const url = window.location.origin;
    const text = `${data.topicLabel} 결과가 신기해서 공유해! 너도 무료로 볼 수 있어 👉`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "도리 운세 사주", text, url });
        setLinkMsg("");
        return;
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setLinkMsg("링크를 복사했어요. 친구에게 붙여넣어 보내 주세요 🫧");
    } catch {
      setLinkMsg(url);
    }
  }

  async function save() {
    const c = canvasRef.current;
    if (!c || !ready) return;
    setState("busy");
    // 클릭 직후에 복사해야 브라우저가 허락해요. 결과는 기다리지 않아요.
    void copyCaption().then(setCopied);
    try {
      const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/png"));
      if (!blob) throw new Error("blob");
      const name = photoFileName(data.topic, new Date());
      const file = new File([blob], name, { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.canShare?.({ files: [file] })) {
        try {
          await nav.share({ files: [file], text: shareCaption(data, window.location.origin) });
          setState("done");
          return;
        } catch (e) {
          if (e instanceof DOMException && e.name === "AbortError") {
            setState("idle");
            return;
          }
          /* 공유 창이 안 열리면 저장으로 넘어가요 */
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 4000);
      setState("done");
    } catch {
      setState("error");
    }
  }

  return (
    <div data-testid="result-share-card" className="mt-5 text-center">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={photoAltText(data)}
        className={`mx-auto w-44 rounded-2xl shadow-[0_10px_30px_rgba(128,87,224,0.25)] transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-0"}`}
        style={{ aspectRatio: `${CARD_W} / ${CARD_H}`, height: "auto" }}
      />
      <button
        type="button"
        onClick={save}
        disabled={!ready || state === "busy"}
        className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-500 to-fuchsia-500 px-5 py-2 text-sm font-bold text-white shadow disabled:opacity-50 active:scale-95"
      >
        {state === "busy" ? "카드 만드는 중…" : "✨ 결과 카드 저장·공유하기"}
      </button>
      <p role="status" className="mt-1.5 text-[11px] text-gray-500">
        {state === "done" ? (copied ? "카드를 만들었어요. 링크도 복사했으니 올릴 때 붙여넣기만 하세요 🫧" : "카드를 만들었어요. 친구에게 자랑해 보세요 🫧") : state === "error" ? "지금은 카드를 만들 수 없어요. 잠시 뒤에 다시 눌러 주세요." : "인스타 스토리 크기로 저장돼요 · 이 기기에서만 만들어요"}
      </p>
      <button
        type="button"
        data-testid="share-link-button"
        onClick={shareLink}
        className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-white px-4 py-1.5 text-xs font-bold text-brand-600 active:scale-95"
      >
        🔗 친구에게 링크 보내기
      </button>
      {linkMsg && (
        <p role="status" className="mt-1.5 text-[11px] text-gray-500">
          {linkMsg}
        </p>
      )}
    </div>
  );
}
