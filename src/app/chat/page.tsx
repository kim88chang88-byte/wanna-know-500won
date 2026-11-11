import ChatHome from "@/components/chat/ChatHome";
import { SERVICE_NAME } from "@/lib/siteInfo";

export const metadata = {
  title: `도유 상담실 · ${SERVICE_NAME}`,
  description: "방금 본 풀이를 도리에게 이어서 물어봐",
  robots: { index: false, follow: false },
};

export default function ChatPage() {
  return <ChatHome />;
}
