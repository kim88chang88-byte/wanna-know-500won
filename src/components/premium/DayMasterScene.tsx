import { dayMasterOf } from "@/lib/premium/dayMaster";

/** 그림 속 한 줄 이름(그림과 같은 말). "너의 기본 날씨 지도는 ○○야." 문장에 써요. */
const CAPTION: Record<string, string> = { 甲: "곧게 위로 뻗는 큰 나무", 乙: "바람에 휘어도 꺾이지 않는 풀꽃", 丙: "세상을 환하게 비추는 해", 丁: "어둠 속을 은은하게 밝히는 촛불", 戊: "묵직하게 자리를 지키는 큰 산", 己: "씨앗을 키워 내는 논밭", 庚: "단단한 바위", 辛: "갈고닦을수록 빛나는 보석", 壬: "넓게 흘러가는 강", 癸: "조용히 스며드는 이슬비" };

/** 끝 글자 받침 여부로 "이야/야"를 골라요 */
const iya = (w: string) => {
  const c = w.charCodeAt(w.length - 1) - 0xac00;
  return c >= 0 && c % 28 !== 0 ? "이야" : "야";
};

const IMG: Record<string, string> = { 甲: "gap", 乙: "eul", 丙: "byeong", 丁: "jeong", 戊: "mu", 己: "gi", 庚: "gyeong", 辛: "sin", 壬: "im", 癸: "gye" };

/** 이미지 안에 이미 들어 있는 첫 문장("~같은 사람이야.")을 빼고, 이어지는 설명만 남겨요. */
const secondSentence = (say: string) => {
  const i = say.indexOf(". ");
  return i >= 0 ? say.slice(i + 2) : say;
};

/** 프리미엄 첫 장: 내 대장 글자(일간)를 일러스트 위에 크게 보여 줘요. 글자·한줄 이름·日干 도장은 이미지에 들어 있어요. */
export default function DayMasterScene({ stem }: { stem: string | null | undefined; name?: string | null }) {
  const d = dayMasterOf(stem);
  if (!d || !stem || !IMG[stem]) return null;
  return (
    <div data-testid="day-master-scene" className="mb-6">
      <div data-testid="weather-map-title" className="mb-3 flex items-center justify-center gap-3">
        <span aria-hidden="true" className="h-px w-10 bg-gradient-to-r from-transparent to-[#e6c887]/70" />
        <h3 className="cover-title text-[22px] leading-tight">나의 날씨 지도</h3>
        <span aria-hidden="true" className="h-px w-10 bg-gradient-to-l from-transparent to-[#e6c887]/70" />
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/images/daymaster/${IMG[stem]}.webp`} width={960} height={717} alt={`나의 대장 글자 ${stem}${d.el}, ${d.ko}. ${d.nature} 같은 사람`} className="block h-auto w-full rounded-[22px]" />
      <p className="mt-2 text-center text-[13px] text-[#e8dfca]/60">여덟 글자 중 대장 글자 · 일간(日干) {d.ko}({stem}{d.el})</p>
      <p className="mt-2 text-center text-[15px] leading-relaxed text-[#efe7d3]">너의 기본 날씨 지도는 {CAPTION[stem]}{iya(CAPTION[stem])}. {secondSentence(d.say)}</p>
      <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
        {d.tags.map((t) => (
          <span key={t} className="rounded-full border border-[#e6c887]/35 px-3 py-0.5 text-[13px] text-[#f0d9a0]">{t}</span>
        ))}
      </div>
    </div>
  );
}
