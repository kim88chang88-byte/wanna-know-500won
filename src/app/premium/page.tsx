import Link from "next/link";
import PremiumReportApp from "@/components/premium/PremiumReportApp";
import { SERVICE_NAME } from "@/lib/siteInfo";

export const metadata = {
  title: `프리미엄 리포트 · ${SERVICE_NAME}`,
  description: "생년월일시로 사주 원국, 오행, 신강·신약, 대운을 한눈에 보는 리포트",
};

export default function PremiumPage() {
  return (
    <div className="min-h-screen bg-[#F4F8FD]">
      <header className="border-b border-brand-100 bg-white/90">
        <div className="max-w-2xl mx-auto px-4 py-3.5">
          <Link href="/" className="font-serifKr font-black text-lg text-brand-600">
            🌙 {SERVICE_NAME}
          </Link>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="font-serifKr font-black text-2xl sm:text-3xl text-brand-700">프리미엄 사주 리포트 👑</h1>
          <p className="mt-2 text-sm text-slate-600">생년월일시를 입력하면 사주 원국, 오행 분포, 신강·신약, 격국·용신, 대운 흐름을 보여드려요.</p>
        </div>
        <PremiumReportApp />
        <p className="text-xs text-slate-400 text-center">참고용 풀이이며, 중요한 결정은 스스로 판단해 주세요.</p>
      </main>
    </div>
  );
}
