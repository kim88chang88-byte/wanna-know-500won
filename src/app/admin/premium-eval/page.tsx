import type { Metadata } from "next";
import PremiumEvalApp from "@/components/admin/PremiumEvalApp";

export const metadata: Metadata = { title: "프리미엄 점검 · 도유사주", robots: { index: false, follow: false } };

export default function PremiumEvalPage() {
  return <PremiumEvalApp />;
}
