"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PublicReading } from "@/lib/ai/reading";
import { buildCardData, cardAltText, cardFileName, CARD_H, CARD_SCALE, CARD_W } from "@/lib/card/data";
import { drawResultCard } from "@/lib/card/drawCard";

interface Props {
  reading: PublicReading;
  /** 어떤 캡슐에서 나왔는지 (예: "연애운") */
  topicLabel: string;
}

const FONT_LOAD_TIMEOUT_MS = 1500;

/** 웹폰트가 준비된 뒤에 그려야 글꼴이 맞아요. 못 받으면 기본 글꼴로 그냥 진행합니다. */
async function waitForFonts(): Promise<void> {
  try {
    if (!document.fonts) return;
    const load = Promise.all([
      document.fonts.load('900 24px "Noto Serif KR"'),
      document.fonts.load('500 12px "Noto Serif KR"'),
      document.fonts.load('500 10px "Plus Jakarta Sans"'),
    ]);
    await Promise.race([load, new Promise((r) => setTimeout(r, FONT_LOAD_TIMEOUT_MS))]);
  } catch {
    /* 글꼴을 못 받아도 카드는 그려요 */
  }
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

/** 인스타 스토리용 결과지 카드 + 저장/공유 버튼 */
export default function ResultCard({ reading, topicLabel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // 같은 뽑기 결과로는 날짜가 다시 계산되지 않게 한 번만 정해요.
  const [createdAt] = useState(() => new Date());
  const data = useMemo(() => buildCardData(reading, topicLabel, createdAt), [reading, topicLabel, createdAt]);

  useEffect(() => {
    let cancelled = false;
    void waitForFonts().then(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (cancelled || !canvas || !ctx) return;
      ctx.setTransform(CARD_SCALE, 0, 0, CARD_SCALE, 0, 0);
      drawResultCard(ctx, data);
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
    return blob ? new File([blob], cardFileName(createdAt), { type: "image/png" }) : null;
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

  async function handleSave() {
    setBusy(true);
    try {
      const file = await makeFile();
      if (!file) throw new Error("no file");
      download(file);
      setMessage("이미지로 저장했어요. 인스타 스토리에 올려보세요 🫧");
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
      const payload = { files: [file], title: "도리 운세 사주", text: `오늘의 키워드는 "${reading.keyword}"` };
      if (typeof navigator.share === "function" && navigator.canShare?.({ files: [file] })) {
        await navigator.share(payload);
        setMessage(null);
      } else {
        // 공유 창을 쓸 수 없는 브라우저에서는 저장으로 대신해요.
        download(file);
        setMessage("이 브라우저에서는 공유 창을 열 수 없어서 이미지로 저장했어요.");
      }
    } catch (err) {
      // 공유 창을 직접 닫은 경우(AbortError)는 안내하지 않아요.
      if (!(err instanceof DOMException && err.name === "AbortError")) setMessage("공유하지 못했어요. 이미지로 저장해 보세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div data-testid="result-card">
      <canvas
        ref={canvasRef}
        width={CARD_W * CARD_SCALE}
        height={CARD_H * CARD_SCALE}
        role="img"
        aria-label={cardAltText(data)}
        className="mx-auto block w-full max-w-[300px] aspect-[9/16] rounded-2xl shadow-lg"
      />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={busy}
          className="py-2.5 rounded-full border border-brand-200 text-brand-700 font-serifKr font-bold text-sm hover:bg-brand-50 disabled:opacity-50"
        >
          이미지로 저장
        </button>
        <button
          type="button"
          onClick={handleShare}
          disabled={busy}
          className="py-2.5 rounded-full bg-brand-600 text-white font-serifKr font-bold text-sm hover:bg-brand-700 disabled:opacity-50"
        >
          공유하기
        </button>
      </div>
      {message && (
        <p role="status" className="mt-2 text-center text-[11px] font-bold text-brand-600">
          {message}
        </p>
      )}
    </div>
  );
}
