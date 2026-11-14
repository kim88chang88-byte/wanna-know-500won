import type { Metadata } from "next";
import ChatEvalApp from "@/components/admin/ChatEvalApp";

export const metadata: Metadata = { title: "상담실 점검 · 도유사주", robots: { index: false, follow: false } };

export default function ChatEvalPage() {
  return <ChatEvalApp />;
}
