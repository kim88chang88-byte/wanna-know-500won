import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// 콘텐츠 보안 정책(CSP): 다른 곳의 스크립트·프레임이 끼어드는 걸 막는 마지막 방어선이에요.
// Next.js 는 화면을 붙일 때 인라인 스크립트를 쓰므로 script-src 에 'unsafe-inline' 이 필요해요. (개발 모드는 eval 도 필요)
// 외부에서 받는 건 구글 폰트(글꼴·아이콘)뿐이에요. 사진은 https 주소와 data/blob(결과 카드 저장)을 허용해요.
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  `connect-src 'self' data: blob: https://vitals.vercel-insights.com${isDev ? " ws: wss:" : ""}`,
  "media-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // 기본 보안 헤더. (카카오 로그인은 주소 이동 방식이라 영향이 없어요)
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
