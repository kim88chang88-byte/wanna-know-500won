import Link from "next/link";
import CloseLink from "./CloseLink";
import PremiumReportApp from "@/components/premium/PremiumReportApp";
import { SERVICE_NAME } from "@/lib/siteInfo";

export const metadata = {
  title: `프리미엄 종합 사주 미리보기 · ${SERVICE_NAME}`,
  description: "생년월일시를 넣으면 20쪽 프리미엄 종합 사주 중 앞 4쪽을 미리 볼 수 있어요",
};

export default function PremiumPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1d1a28] via-[#171520] to-[#0f0d16] text-[#f5efe0]">
      <header className="sticky top-0 z-40 border-b border-[#e6c887]/20 bg-[#14121c]/90 backdrop-blur">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <Link href="/" className="font-serifKr font-black text-lg text-[#e6c887]">
            🌙 {SERVICE_NAME}
          </Link>
          <CloseLink />
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="text-center">
          <p className="text-[10px] font-bold tracking-[0.32em] text-[#e6c887]">DORI PREMIUM REPORT</p>
          <div aria-hidden="true" className="mx-auto mt-3 flex items-center justify-center gap-2 text-[#e6c887]">
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#e6c887]/70" />
            <span className="text-[10px]">◆</span>
            <span className="h-px w-12 bg-gradient-to-l from-transparent to-[#e6c887]/70" />
          </div>
          <h1 className="mt-4 font-serifKr font-bold text-2xl sm:text-3xl text-[#fbf3de]">프리미엄 종합 사주 미리보기</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#e8dfca]/80">생년월일시를 입력하면 20쪽 사주서 중 앞 4쪽(사주 원국, 나의 성향 등)을 미리 볼 수 있어요. 5쪽부터는 가려져 있어요.</p>
        </div>
        <PremiumReportApp />
        <p className="text-xs text-[#e8dfca]/50 text-center">참고용 풀이이며, 중요한 결정은 스스로 판단해 주세요.</p>
      </main>
    </div>
  );
}
