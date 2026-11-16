import InviteFill from "@/components/landing/InviteFill";
import { cleanInviteToken } from "@/lib/invite";
import { SERVICE_NAME } from "@/lib/siteInfo";

// 링크 주소 자체가 열쇠라서 검색에 잡히지 않게 하고, 다른 사이트로 주소가 새지 않게 해요.
export const metadata = {
  title: `궁합 물어보기 · ${SERVICE_NAME}`,
  description: "생년월일만 넣으면 둘의 궁합을 볼 수 있어",
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const token = cleanInviteToken((await params).token);
  return token ? <InviteFill token={token} /> : <InviteFill token={"x".repeat(32)} />;
}
