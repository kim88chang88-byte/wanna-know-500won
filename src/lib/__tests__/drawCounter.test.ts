import { describe, expect, it } from "vitest";
import { dayKey, monthKey, readCounts, recordDraw, STORAGE_KEY, type StorageLike } from "../drawCounter";

function memoryStorage(initial?: Record<string, string>): StorageLike & { data: Record<string, string> } {
  const data: Record<string, string> = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = v;
    },
  };
}

const throwing: StorageLike = {
  getItem: () => {
    throw new Error("blocked");
  },
  setItem: () => {
    throw new Error("blocked");
  },
};

const oct16 = new Date(2026, 9, 16, 9, 0);
const oct17 = new Date(2026, 9, 17, 9, 0);
const nov1 = new Date(2026, 10, 1, 9, 0);

describe("키 만들기", () => {
  it("현지 날짜 기준으로 만든다", () => {
    expect(dayKey(oct16)).toBe("2026-10-16");
    expect(monthKey(oct16)).toBe("2026-10");
    expect(dayKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("readCounts / recordDraw", () => {
  it("처음에는 0, 0", () => {
    expect(readCounts(memoryStorage(), oct16)).toEqual({ today: 0, month: 0 });
  });

  it("뽑을 때마다 오늘/이번달이 함께 늘어난다", () => {
    const s = memoryStorage();
    expect(recordDraw(s, oct16)).toEqual({ today: 1, month: 1 });
    expect(recordDraw(s, oct16)).toEqual({ today: 2, month: 2 });
    expect(readCounts(s, oct16)).toEqual({ today: 2, month: 2 });
  });

  it("다음 날이 되면 오늘만 0으로, 이번달은 유지", () => {
    const s = memoryStorage();
    recordDraw(s, oct16);
    recordDraw(s, oct16);
    expect(readCounts(s, oct17)).toEqual({ today: 0, month: 2 });
    expect(recordDraw(s, oct17)).toEqual({ today: 1, month: 3 });
  });

  it("다음 달이 되면 둘 다 0부터", () => {
    const s = memoryStorage();
    recordDraw(s, oct16);
    expect(readCounts(s, nov1)).toEqual({ today: 0, month: 0 });
    expect(recordDraw(s, nov1)).toEqual({ today: 1, month: 1 });
  });

  it("깨진 저장값은 없는 것으로 취급", () => {
    expect(readCounts(memoryStorage({ [STORAGE_KEY]: "{not json" }), oct16)).toEqual({ today: 0, month: 0 });
    expect(readCounts(memoryStorage({ [STORAGE_KEY]: '{"day":1}' }), oct16)).toEqual({ today: 0, month: 0 });
    expect(
      readCounts(
        memoryStorage({ [STORAGE_KEY]: '{"day":"2026-10-16","today":-3,"month":"2026-10","monthCount":1}' }),
        oct16,
      ),
    ).toEqual({ today: 0, month: 0 });
  });
});

describe("저장소를 쓸 수 없을 때", () => {
  it("null 저장소: 읽기는 0, 기록은 현재 값에서 1씩 증가", () => {
    expect(readCounts(null, oct16)).toEqual({ today: 0, month: 0 });
    expect(recordDraw(null, oct16, { today: 2, month: 5 })).toEqual({ today: 3, month: 6 });
  });

  it("예외를 던지는 저장소도 오류 없이 동작", () => {
    expect(readCounts(throwing, oct16)).toEqual({ today: 0, month: 0 });
    expect(recordDraw(throwing, oct16, { today: 0, month: 0 })).toEqual({ today: 1, month: 1 });
  });
});
