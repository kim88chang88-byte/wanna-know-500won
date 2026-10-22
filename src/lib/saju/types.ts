export type Gender = "male" | "female";

export interface BirthInput {
  year: number;
  month: number;
  day: number;
  /** 태어난 시각을 모르면 생략(undefined/null). 한국 표준시(KST) 시계 기준 0~23 */
  hour?: number | null;
  /** hour 가 있을 때만 사용. 생략하면 0 */
  minute?: number | null;
  calendar: "solar" | "lunar";
  /** 음력 입력일 때 윤달 여부 */
  isLeapMonth?: boolean;
  gender: Gender;
  /** 출생지(경도 보정용, 선택). 시각을 알 때만 쓰고 저장하지 않아요. */
  birthPlace?: string;
  /** 23:00~23:59 출생일 때 조자시(23시부터 다음 날)로 볼지. 생략하면 야자시(당일). */
  lateZi?: "nextDay";
}

export interface CalcOptions {
  /**
   * 23:00~23:59(야자시/조자시)의 일주 처리.
   * - "sameDay"(기본): 일주는 당일 자정(00:00)에 바뀜. 시주의 천간만 다음 날 일간 기준(야자시 방식)
   * - "nextDay": 23:00부터 일주도 다음 날로 계산 (조자시 방식)
   */
  lateZiHour?: "sameDay" | "nextDay";
  /**
   * 일주·시주 계산 전에 시계 시각에 더할 분. 기본 0(보정 없음).
   * 진태양시(출생지 경도) 보정을 쓰려면 음수를 넣으세요. (예: 서울은 대략 -32)
   * 절기(연주·월주) 판정에는 영향을 주지 않습니다. 절기는 실제 순간(표준시) 기준이기 때문입니다.
   */
  timeOffsetMinutes?: number;
}

/** 천간(stem) + 지지(branch) 한 쌍. 한자 한 글자씩 (예: { stem: "甲", branch: "子" }) */
export interface Pillar {
  stem: string;
  branch: string;
}

export interface CivilDate {
  year: number;
  month: number;
  day: number;
}

export interface WallTime extends CivilDate {
  hour: number;
  minute: number;
}

/** 사주 네 기둥. 시간을 모르면 hour 는 null */
export interface SajuChart {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar | null;
  /** 입력이 음력이어도 변환된 양력 날짜 */
  solarDate: CivilDate;
  /**
   * 태어난 시각을 몰라서, 그날 절기가 바뀌는 경우 연주/월주를 확정할 수 없을 때 해당 기둥이 들어갑니다.
   * 이 경우 화면에 "시각을 알면 더 정확해요" 안내를 띄우는 용도로 쓰세요.
   */
  uncertainPillars: Array<"year" | "month">;
  /** 한국 표준시 변동 등 결과 해석에 영향을 줄 수 있는 안내 */
  warnings: string[];
}
