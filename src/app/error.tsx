"use client";

import Link from "next/link";
import { useEffect } from "react";
import { LOGO_IMAGE } from "@/components/landing/images";

/** 화면을 그리다 문제가 생겼을 때 보여 주는 도리 화면 */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  // 원인을 찾을 수 있게 브라우저 콘솔에도 남겨 둬요.
  useEffect(() => {
    console.error("[화면 오류]", error);
  }, [error]);
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#FFF8FC] px-4 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={LOGO_IMAGE} alt="도유사주 로고" className="h-24 w-24 object-contain" />
      <h1 className="font-cute text-2xl text-gray-900">잠깐 문제가 생겼어</h1>
      <p className="text-sm text-gray-600">잠시 뒤에 다시 시도해 줘.</p>
      {/* 사용자가 캡처해서 알려 주면 원인을 바로 찾을 수 있게, 접어 둔 "문제 내용"을 둬요. (개인정보는 들어 있지 않아요) */}
      <details className="mt-1 max-w-sm text-[11px] text-gray-400">
        <summary className="cursor-pointer select-none">문제 내용 보기</summary>
        <p className="mt-1 break-all text-left" data-testid="error-detail">
          {error.name}: {error.message?.slice(0, 300)}
          {error.digest ? ` (digest ${error.digest})` : ""}
        </p>
      </details>
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={reset} className="rounded-full bg-brand-500 px-6 py-2.5 text-sm font-bold text-white">다시 시도</button>
        <Link href="/" className="rounded-full border border-brand-300 px-6 py-2.5 text-sm font-bold text-brand-700">처음으로</Link>
      </div>
    </main>
  );
}
