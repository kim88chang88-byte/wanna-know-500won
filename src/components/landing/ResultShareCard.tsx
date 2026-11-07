"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PremiumReportView, TopicKey } from "@/lib/premium/types";
import { drawPhotoCard } from "@/lib/card/drawPhotoCard";
import { buildPhotoCardData, CARD_H, CARD_SCALE, CARD_W, photoAltText, photoFileName, shareCaption } from "@/lib/card/photoData";
import { IMAGES } from "./images";
import { getBrowserStorage } from "@/lib/drawCounter";
import { readMyCode, withRef } from "@/lib/referral";

/** 공유 주소: 로그인한 회원이면 내 추천 코드가 붙어, 친구가 로그인할 때 자동으로 적용돼요. */
function shareOrigin(): string {
  if (typeof window === "undefined") return "";
  return withRef(window.location.origin, readMyCode(getBrowserStorage()));
}

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
  const [state, setState] = useState<"idle" | "busy" | "done" | "cancel" | "error">("idle");
  const [ready, setReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState<"idle" | "ok" | "fail">("idle");
  const [link, setLink] = useState("");
  useEffect(() => {
    setLink(shareOrigin());
  }, []);
  const data = useMemo(
    () => buildPhotoCardData(report, { date: new Date(), siteLabel: typeof window === "undefined" ? "" : window.location.host, shareUrl: shareOrigin(), aiQuote }),
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
      await navigator.clipboard.writeText(shareCaption(data, shareOrigin()));
      return true;
    } catch {
      return false;
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
          await nav.share({ files: [file], text: shareCaption(data, shareOrigin()) });
          setState("done");
          return;
        } catch (e) {
          if (e instanceof DOMException && e.name === "AbortError") {
            setState("cancel");
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
      {/* 공유 창에서 앱에 따라 글(링크)이 빠질 수 있어서, 링크를 눈에 보이게 두고 따로 복사할 수 있게 해요 */}
      <div data-testid="share-link-row" className="mx-auto mt-2.5 flex max-w-[19rem] items-center gap-1.5 rounded-full border border-brand-100 bg-white px-3 py-1.5 text-left">
        <span aria-hidden="true">🔗</span>
        <span className="min-w-0 flex-1 truncate text-[11px] text-gray-600" title={link}>{link.replace(/^https?:\/\//, "")}</span>
        <button
          type="button"
          onClick={async () => {
            const ok = await copyCaption();
            setLinkCopied(ok ? "ok" : "fail");
            window.setTimeout(() => setLinkCopied("idle"), 2200);
          }}
          className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-brand-700 active:scale-95"
        >
          {linkCopied === "ok" ? "✓ 복사했어요" : linkCopied === "fail" ? "복사 실패" : "링크 복사"}
        </button>
      </div>
      <p role="status" className="mt-1.5 text-[11px] leading-relaxed text-gray-500">
        {state === "done"
          ? copied ? "카드를 만들었어요. 링크도 복사했으니 올릴 때 붙여넣기만 하세요 ❄️" : "카드를 만들었어요. 보내는 앱에서 링크가 안 보이면 위 '링크 복사'를 눌러 붙여넣어 주세요 ❄️"
          : state === "cancel"
            ? copied ? "카드는 저장하지 않았어요. 링크만 복사했어요 — 친구에게 붙여넣어 보내 주세요 ❄️" : "카드는 저장하지 않았어요."
            : state === "error"
              ? "지금은 카드를 만들 수 없어요. 잠시 뒤에 다시 눌러 주세요."
              : (
                <>
                  인스타 스토리 크기로 저장돼요 · 이 기기에서만 만들어요
                  <br />
                  링크는 저장할 때 함께 복사되고, 위에서 따로 복사할 수도 있어요
                </>
              )}
      </p>
    </div>
  );
}
