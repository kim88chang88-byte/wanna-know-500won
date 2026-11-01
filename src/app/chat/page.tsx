import ChatApp from "@/components/chat/ChatApp";
import { SERVICE_NAME } from "@/lib/siteInfo";

export const metadata = {
  title: `도리 상담실 · ${SERVICE_NAME}`,
  description: "방금 본 풀이를 도리에게 이어서 물어보세요",
  robots: { index: false, follow: false },
};

export default function ChatPage() {
  return <ChatApp />;
}
