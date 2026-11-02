import { getBrowserStorage } from "@/lib/drawCounter";
import type { TrackEvent } from "@/lib/visitTrack";

export const VISITOR_KEY = "wanna500:vid:v1";
const VID_RE = /^[A-Za-z0-9-]{16,64}$/;

/** 이 브라우저의 무작위 방문자 ID(이름·연락처 아님). 없으면 만들어요. */
export function ensureVid(): string {
  const st = getBrowserStorage();
  let vid = "";
  try {
    vid = st?.getItem(VISITOR_KEY) ?? "";
  } catch {
    vid = "";
  }
  if (!VID_RE.test(vid)) {
    vid = crypto.randomUUID();
    try {
      st?.setItem(VISITOR_KEY, vid);
    } catch {
      // 저장이 막혀 있으면 이번 방문만 센 값으로 써요
    }
  }
  return vid;
}

const sent = new Set<string>();

/** 핵심 행동을 한 번 알려요. 실패해도 화면엔 아무 영향이 없어요. (같은 화면에선 같은 행동을 한 번만 보내요) */
export function track(event: TrackEvent): void {
  if (typeof window === "undefined" || sent.has(event)) return;
  sent.add(event);
  try {
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vid: ensureVid(), event }),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // 기록이 안 돼도 괜찮아요
  }
}
