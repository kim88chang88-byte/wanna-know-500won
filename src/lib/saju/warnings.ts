import type { CivilDate } from "./types";

/*
 * 과거 한국의 표준시/서머타임은 지금과 달랐습니다. 아래 기간에 태어난 경우 시계 시각이 현재 기준과
 * 달라 시주(경우에 따라 일주·월주)가 어긋날 수 있어 안내 문구만 붙입니다. (자동 보정은 하지 않음)
 * 기간 경계는 대략적인 값이므로 경계일 전후는 "해당될 수 있음" 정도로만 안내합니다.
 */

function toNumber(d: CivilDate): number {
  return d.year * 10000 + d.month * 100 + d.day;
}

function within(d: CivilDate, from: number, to: number): boolean {
  const n = toNumber(d);
  return n >= from && n <= to;
}

export function koreaTimeWarnings(date: CivilDate): string[] {
  const warnings: string[] = [];

  if (within(date, 19540321, 19610809)) {
    warnings.push(
      "1954~1961년 사이에는 한국 표준시가 지금보다 30분 늦었어요(동경 127.5도 기준). 이 기간에 태어났다면 시주가 달라질 수 있어요.",
    );
  }
  if (within(date, 19870510, 19871011) || within(date, 19880508, 19881009)) {
    warnings.push(
      "1987·1988년 여름에는 서머타임(일광절약시간)이 적용됐어요. 출생 시각이 서머타임 시각이라면 1시간을 빼서 입력해야 정확해요.",
    );
  }

  return warnings;
}
