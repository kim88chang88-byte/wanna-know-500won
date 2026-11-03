"use client";

import Link from "next/link";
import { LOGO_IMAGE } from "@/components/landing/images";

/** 화면을 그리다 문제가 생겼을 때 보여 주는 도리 화면 */
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#FFF8FC] px-4 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={LOGO_IMAGE} alt="도리" className="h-24 w-24 rounded-full object-cover" />
      <h1 className="font-cute text-2xl text-gray-900">잠깐 문제가 생겼어요</h1>
      <p className="text-sm text-gray-600">잠시 뒤에 다시 시도해 주세요.</p>
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={reset} className="rounded-full bg-brand-500 px-6 py-2.5 text-sm font-bold text-white">다시 시도</button>
        <Link href="/" className="rounded-full border border-brand-300 px-6 py-2.5 text-sm font-bold text-brand-700">처음으로</Link>
      </div>
    </main>
  );
}
