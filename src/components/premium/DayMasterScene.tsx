import { dayMasterOf } from "@/lib/premium/dayMaster";

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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/images/daymaster/${IMG[stem]}.webp`} width={960} height={717} alt={`나의 대장 글자 ${stem}${d.el}, ${d.ko}. ${d.nature} 같은 사람`} className="block h-auto w-full rounded-[22px]" />
      <p className="mt-2 text-center text-[13px] text-[#e8dfca]/60">여덟 글자 중 대장 글자 · 일간(日干) {d.ko}({stem}{d.el})</p>
      <p className="mt-2 text-center text-[15px] leading-relaxed text-[#efe7d3]">{secondSentence(d.say)}</p>
      <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
        {d.tags.map((t) => (
          <span key={t} className="rounded-full border border-[#e6c887]/35 px-3 py-0.5 text-[13px] text-[#f0d9a0]">{t}</span>
        ))}
      </div>
    </div>
  );
}
