"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PremiumReportView } from "@/lib/premium/types";
import { drawPhotoCard } from "@/lib/card/drawPhotoCard";
import { buildPhotoCardData, CARD_H, CARD_SCALE, CARD_W, photoFileName, shareCaption } from "@/lib/card/photoData";

interface Props {
  /** 프리미엄 결과 화면용 미드나잇+골드 톤 */
  luxe?: boolean;
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
export default function PhotoCard({ report, aiQuote, luxe = false }: Props) {
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
    <section data-testid="photo-card" aria-label="공유하기" className={`mt-6 rounded-2xl border px-4 py-4 ${luxe ? "border-[#e6c887]/25 bg-white/[0.03]" : "border-brand-100 bg-white"}`}>
      {/* 보이지 않는 캔버스: "이미지로 저장/공유"를 누를 때 쓸 인스타 스토리용 그림을 미리 그려 둬요. */}
      <canvas ref={canvasRef} width={CARD_W * CARD_SCALE} height={CARD_H * CARD_SCALE} aria-hidden="true" className="hidden" />
      <p className={`text-sm font-bold ${luxe ? "text-[#fbf3de]" : "text-gray-900"}`}>📸 이 풀이를 간직하거나 나눠 보세요</p>
      <p className={`mt-0.5 text-xs ${luxe ? "text-[#e8dfca]/70" : "text-gray-500"}`}>인스타 스토리용 이미지로 저장하거나 친구에게 보낼 수 있어요.</p>
      <button
        type="button"
        onClick={handleShare}
        disabled={busy}
        data-testid="share-button"
        className={`mt-3 w-full py-3 rounded-full font-cute font-normal text-sm shadow-md hover:opacity-95 disabled:opacity-50 active:scale-95 transition-transform ${luxe ? "bg-gradient-to-r from-[#f0d9a0] to-[#d3ac62] text-[#1b1824]" : "bg-gradient-to-r from-fuchsia-400 via-violet-500 to-brand-500 text-white"}`}
      >
        인스타·SNS에 공유하기
      </button>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={busy}
          data-testid="save-button"
          className={`py-2.5 rounded-full border font-cute font-normal text-sm disabled:opacity-50 ${luxe ? "border-[#e6c887]/40 text-[#e6c887] hover:bg-[#e6c887]/10" : "border-brand-200 text-brand-700 hover:bg-brand-50"}`}
        >
          이미지로 저장
        </button>
        <button
          type="button"
          onClick={handleCopy}
          data-testid="copy-button"
          className={`py-2.5 rounded-full border font-cute font-normal text-sm ${luxe ? "border-[#e6c887]/40 text-[#e6c887] hover:bg-[#e6c887]/10" : "border-brand-200 text-brand-700 hover:bg-brand-50"}`}
        >
          해시태그 복사
        </button>
      </div>
      {message && (
        <p role="status" data-testid="share-message" className={`mt-2 text-center text-[11px] font-bold ${luxe ? "text-[#f6dfa8]" : "text-brand-600"}`}>
          {message}
        </p>
      )}
    </section>
  );
}

/** 풀이 맨 위에 보이는 한 줄 결론. 카드 틀 없이 글자 그대로 크게 보여줘요. (예전 포토카드에 들어가던 글을 그대로 살렸어요) */
export function ResultHero({ report, aiQuote, luxe = false }: Props) {
  const data = useMemo(() => buildPhotoCardData(report, { date: new Date(), siteLabel: "", aiQuote }), [report, aiQuote]);
  if (luxe) {
    return (
      <div data-testid="result-hero" className="px-1 pt-2 pb-3 text-center">
        <p className="text-[10px] font-bold tracking-[0.32em] text-[#e6c887]">DORI PREMIUM · {data.topicLabel}</p>
        <div aria-hidden="true" className="mx-auto mt-3 flex items-center justify-center gap-2 text-[#e6c887]">
          <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#e6c887]/70" />
          <span className="text-[10px]">◆</span>
          <span className="h-px w-12 bg-gradient-to-l from-transparent to-[#e6c887]/70" />
        </div>
        <h4 data-testid="result-hero-headline" className="mt-4 font-serifKr text-[22px] sm:text-[25px] font-bold leading-snug text-[#fbf3de] break-keep">
          {data.headline}
        </h4>
        <p data-testid="result-hero-quote" className="mt-3 font-serifKr italic text-[14.5px] leading-relaxed text-[#f3e7c9] break-keep">
          &ldquo;{data.quote}&rdquo;
        </p>
        {data.tags.length > 0 && (
          <p className="mt-4 flex flex-wrap justify-center gap-1.5">
            {data.tags.map((t) => (
              <span key={t} className="rounded-full border border-[#e6c887]/40 px-2.5 py-0.5 text-[11px] font-bold text-[#e6c887]">
                {t}
              </span>
            ))}
          </p>
        )}
        <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#e6c887]/25 bg-white/[0.04] px-3.5 py-1.5 text-xs text-[#e8dfca]/80">
          <span aria-hidden="true" className="h-3 w-3 rounded-full border border-white/30" style={{ backgroundColor: data.lucky.hex }} />
          행운 컬러 <b className="font-bold text-[#fbf3de]">{data.lucky.color}</b>
          <span aria-hidden="true" className="text-[#e6c887]/40">|</span>
          행운 방향 <b className="font-bold text-[#fbf3de]">{data.lucky.direction}</b>
        </p>
      </div>
    );
  }
  return (
    <div data-testid="result-hero" className="px-1 pt-1 pb-2 text-center">
      <p className="text-xs font-bold tracking-wide text-brand-500">{data.tier === "premium" ? "✨ 프리미엄 · " : ""}{data.topicLabel}</p>
      <h4 data-testid="result-hero-headline" className="mt-2 font-cute text-[23px] sm:text-[26px] font-normal leading-snug text-brand-700 break-keep">
        {data.headline}
      </h4>
      <p data-testid="result-hero-quote" className="mt-3 text-[15px] leading-relaxed text-gray-700 break-keep">
        &ldquo;{data.quote}&rdquo;
      </p>
      {data.tags.length > 0 && (
        <p className="mt-3 flex flex-wrap justify-center gap-1.5">
          {data.tags.map((t) => (
            <span key={t} className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-bold text-brand-600">
              {t}
            </span>
          ))}
        </p>
      )}
      <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-gray-50 px-3.5 py-1.5 text-xs text-gray-600">
        <span aria-hidden="true" className="h-3 w-3 rounded-full border border-black/10" style={{ backgroundColor: data.lucky.hex }} />
        행운 컬러 <b className="font-bold text-gray-800">{data.lucky.color}</b>
        <span aria-hidden="true" className="text-gray-300">|</span>
        행운 방향 <b className="font-bold text-gray-800">{data.lucky.direction}</b>
      </p>
    </div>
  );
}
