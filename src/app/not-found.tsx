import Link from "next/link";
import { LOGO_IMAGE } from "@/components/landing/images";

/** 없는 주소로 들어왔을 때 보여 주는 도리 화면 */
export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#FFF8FC] px-4 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={LOGO_IMAGE} alt="도유사주 로고" className="h-24 w-24 object-contain" />
      <p className="text-xs tracking-[0.12em] text-gray-500">404</p>
      <h1 className="font-cute text-2xl text-gray-900">앗, 길을 잃었어</h1>
      <p className="text-sm text-gray-600">찾는 페이지가 없어. 도리가 처음으로 데려다줄게.</p>
      <Link href="/" className="mt-2 rounded-full bg-brand-500 px-6 py-2.5 text-sm font-bold text-white">처음으로 가기</Link>
    </main>
  );
}
