"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PremiumReportView } from "@/lib/premium/types";
import { drawPhotoCard } from "@/lib/card/drawPhotoCard";
import { buildPhotoCardData, CARD_H, CARD_SCALE, CARD_W, photoAltText, photoFileName, shareCaption } from "@/lib/card/photoData";

interface Props {
  report: PremiumReportView;
  /** AI 풀이가 있으면 도리의 한마디를 카드에 넣어요 */
  aiQuote?: string | null;
}

const FONT_LOAD_TIMEOUT_MS = 1500;

/** 웹폰트가 준비된 뒤에 그려야 글꼴이 맞아요. 못 받으면 기본 글꼴로 그냥 진행합니다. */
async function waitForFonts(): Promise<void> {
  try {
    if (!document.fonts) return;
    const load = Promise.all([
      document.fonts.load('900 24px "Noto Serif KR"'),
      document.fonts.load('800 24px "Noto Serif KR"'),
      document.fonts.load('500 12px "Noto Serif KR"'),
      document.fonts.load('700 10px "Plus Jakarta Sans"'),
    ]);
    await Promise.race([load, new Promise((r) => setTimeout(r, FONT_LOAD_TIMEOUT_MS))]);
  } catch {
    /* 글꼴을 못 받아도 카드는 그려요 */
  }
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

/** 인스타 스토리용 포토카드 + 공유/저장/문구 복사 */
export default function PhotoCard({ report, aiQuote }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // 같은 뽑기 결과로는 날짜가 다시 계산되지 않게 한 번만 정해요.
  const [createdAt] = useState(() => new Date());
  const [site, setSite] = useState({ host: "", url: "" });
  useEffect(() => setSite({ host: window.location.host, url: window.location.origin }), []);
  const data = useMemo(() => buildPhotoCardData(report, { date: createdAt, siteLabel: site.host, aiQuote }), [report, createdAt, site.host, aiQuote]);

  useEffect(() => {
    let cancelled = false;
    void waitForFonts().then(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (cancelled || !canvas || !ctx) return;
      ctx.setTransform(CARD_SCALE, 0, 0, CARD_SCALE, 0, 0);
      ctx.clearRect(0, 0, CARD_W, CARD_H);
      drawPhotoCard(ctx, data);
      canvas.dataset.ready = "true";
    });
    return () => {
      cancelled = true;
    };
  }, [data]);

  async function makeFile(): Promise<File | null> {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const blob = await toBlob(canvas);
    return blob ? new File([blob], photoFileName(data.topic, createdAt), { type: "image/png" }) : null;
  }

  function download(file: File) {
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // 다운로드가 시작될 시간을 준 뒤 주소를 정리해요.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }

  async function copyCaption(): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(shareCaption(data, site.url));
      return true;
    } catch {
      return false;
    }
  }

  async function handleSave() {
    setBusy(true);
    try {
      const file = await makeFile();
      if (!file) throw new Error("no file");
      download(file);
      setMessage("이미지로 저장했어요. 인스타 스토리에서 방금 저장한 사진을 골라 올려보세요 🫧");
    } catch {
      setMessage("이미지를 만들지 못했어요. 잠시 뒤에 다시 해볼래요?");
    } finally {
      setBusy(false);
    }
  }

  async function handleShare() {
    setBusy(true);
    try {
      const file = await makeFile();
      if (!file) throw new Error("no file");
      const text = shareCaption(data, site.url);
      if (typeof navigator.share === "function" && navigator.canShare?.({ files: [file] })) {
        // 모바일에서는 공유 창에서 인스타그램(스토리/피드)·카카오톡 등을 고를 수 있어요.
        await navigator.share({ files: [file], title: "도리 운세 사주", text });
        setMessage(null);
      } else {
        // 공유 창을 쓸 수 없는 브라우저(주로 PC)에서는 저장 + 문구 복사로 대신해요.
        download(file);
        const copied = await copyCaption();
        setMessage(copied ? "이미지를 저장하고 해시태그 문구를 복사했어요. 인스타에 올릴 때 붙여넣기 해 주세요 🫧" : "이미지로 저장했어요. 인스타에 올려보세요 🫧");
      }
    } catch (err) {
      // 공유 창을 직접 닫은 경우(AbortError)는 안내하지 않아요.
      if (!(err instanceof DOMException && err.name === "AbortError")) setMessage("공유하지 못했어요. 이미지로 저장해 보세요.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCopy() {
    setMessage((await copyCaption()) ? "해시태그 문구를 복사했어요 ✦" : "복사하지 못했어요. 직접 입력해 주세요.");
  }

  return (
    <div data-testid="photo-card">
      <canvas
        ref={canvasRef}
        width={CARD_W * CARD_SCALE}
        height={CARD_H * CARD_SCALE}
        role="img"
        aria-label={photoAltText(data)}
        className="mx-auto block w-full max-w-[300px] aspect-[9/16] rounded-2xl shadow-lg"
      />
      <button
        type="button"
        onClick={handleShare}
        disabled={busy}
        data-testid="share-button"
        className="mt-3 w-full py-3 rounded-full bg-gradient-to-r from-fuchsia-400 via-violet-500 to-brand-500 text-white font-cute font-normal text-sm shadow-md hover:opacity-95 disabled:opacity-50 active:scale-95 transition-transform"
      >
        인스타·SNS에 공유하기
      </button>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={busy}
          data-testid="save-button"
          className="py-2.5 rounded-full border border-brand-200 text-brand-700 font-cute font-normal text-sm hover:bg-brand-50 disabled:opacity-50"
        >
          이미지로 저장
        </button>
        <button
          type="button"
          onClick={handleCopy}
          data-testid="copy-button"
          className="py-2.5 rounded-full border border-brand-200 text-brand-700 font-cute font-normal text-sm hover:bg-brand-50"
        >
          해시태그 복사
        </button>
      </div>
      {message && (
        <p role="status" data-testid="share-message" className="mt-2 text-center text-[11px] font-bold text-brand-600">
          {message}
        </p>
      )}
    </div>
  );
}
