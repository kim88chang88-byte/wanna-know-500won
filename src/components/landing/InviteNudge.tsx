"use client";

import { useEffect, useState } from "react";
import { REF_REWARD, withRef } from "@/lib/referral";
import { siteOrigin } from "@/lib/siteOrigin";
import { track } from "@/lib/track";

/**
 * 결과 맨 아래의 친구 초대 안내. 마이페이지까지 가지 않아도 바로 초대 링크를 보낼 수 있어요.
 * 내 초대 코드를 못 받으면(로그인 전 등) 아무것도 보여주지 않아요.
 */
export default function InviteNudge() {
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/referral", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { code?: unknown } | null) => {
        if (alive && j && typeof j.code === "string") setCode(j.code);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!code) return null;
  const link = withRef(siteOrigin(), code);

  async function share() {
    const text = `도유사주에서 내 사주를 무료로 봐! 내 초대 코드로 가입하고 첫 풀이를 마치면 우리 둘 다 조약돌 ${REF_REWARD}개를 받아 🎁 (코드 ${code})`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "도유사주", text, url: link });
        track("ref_share");
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${link}`);
      track("ref_share");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // 공유 창을 닫았거나 막힌 경우예요
    }
  }

  return (
    <div data-testid="invite-nudge" className="mx-auto mt-5 max-w-xs rounded-2xl border border-amber-200 bg-amber-50 p-3 text-left">
      <p className="text-xs font-bold text-amber-900">🎁 친구랑 같이 받자</p>
      <p className="mt-1 text-[11px] leading-relaxed text-amber-800">
        친구가 내 링크로 가입하고 첫 풀이를 마치면 <b>두 사람 모두 조약돌 {REF_REWARD}개</b>! 궁합을 한 번 볼 수 있어. (초대 보상은 한 달에 3번까지)
      </p>
      <button type="button" onClick={share} className="mt-2 w-full rounded-full bg-amber-400 px-3 py-2 text-xs font-bold text-amber-950 hover:brightness-105 active:scale-95">
        {copied ? "복사했어" : "초대 링크 보내기"}
      </button>
    </div>
  );
}
