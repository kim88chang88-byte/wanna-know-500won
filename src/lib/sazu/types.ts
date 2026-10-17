/** 브라우저 → /api/sazu 로 보내는 입력. (SAZU SDK 의 출생 정보 파라미터로 바뀌어요) */
export interface SazuFormInput {
  year: number;
  month: number; // 1~12
  day: number;
  /** 출생 시각을 모르면 null */
  hour: number | null;
  minute: number | null;
  isFemale: boolean;
  isLunar: boolean;
  city: string;
}

export interface PillarView {
  key: "year" | "month" | "day" | "hour";
  label: string; // 연주 / 월주 / 일주 / 시주
  /** 간지 두 글자. 시간을 모르면 null */
  full: string | null;
}

export type ElementKind = "wood" | "fire" | "earth" | "metal" | "water" | "unknown";

export interface ElementView {
  name: string;
  count: number;
  kind: ElementKind;
}

export interface StrengthView {
  grade: string;
  analysis: string;
}

/** 화면에 그릴 리포트. SDK 응답 중 필요한 것만 추려서 담아요. */
export interface ManseReportView {
  pillars: PillarView[];
  elements: ElementView[];
  strength: StrengthView | null;
}

export type SazuErrorCode = "auth" | "rate_limited" | "transient" | "bad_request" | "not_configured" | "failed";

export interface SazuErrorBody {
  error: string;
  code: SazuErrorCode;
}
