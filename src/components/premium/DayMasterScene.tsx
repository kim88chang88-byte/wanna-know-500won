import { callName } from "@/lib/ai/nameRepair";
import { dayMasterOf } from "@/lib/premium/dayMaster";

const SPOTS: Array<[number, number, number]> = [[8, 10, 56], [78, 14, 40], [14, 62, 36], [70, 58, 52], [44, 8, 32]];

/** 프리미엄 첫 장: 내 대장 글자(일간)를 자연 풍경 위에 도장처럼 크게 보여 줘요. */
export default function DayMasterScene({ stem, name }: { stem: string | null | undefined; name?: string | null }) {
  const d = dayMasterOf(stem);
  if (!d || !stem) return null;
  const who = name ? `${callName(name)}, 너는` : "너는";
  return (
    <div data-testid="day-master-scene" className="mb-6">
      <div className="relative grid aspect-[4/3.1] place-items-center overflow-hidden rounded-[22px]" style={{ background: `radial-gradient(circle at 50% 30%, ${d.bg[0]}, ${d.bg[1]})` }}>
        {SPOTS.map(([x, y, size], i) => (
          <span key={i} aria-hidden="true" className="absolute opacity-90" style={{ left: `${x}%`, top: `${y}%`, fontSize: size }}>{d.emoji}</span>
        ))}
        <div className="relative font-serifKr font-black leading-none drop-shadow-[0_4px_18px_rgba(0,0,0,0.45)]" style={{ color: d.ink, fontSize: "clamp(90px, 34vw, 130px)" }} aria-label={`나의 대장 글자 ${stem}, ${d.ko}`}>{stem}</div>
        <span aria-hidden="true" className="absolute right-2.5 top-2.5 rotate-[4deg] rounded-lg bg-[#c0392b] px-[7px] py-1 text-center text-[12px] leading-[1.15] text-white">日<br />干</span>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-3.5 pb-3 pt-9 text-center text-[17px] text-white">
          {who} <b className="font-normal" style={{ color: d.ink }}>{d.nature}</b> 같은 사람이야
        </div>
      </div>
      <p className="mt-2 text-center text-[13px] text-[#e8dfca]/60">여덟 글자 중 대장 글자 · 일간(日干) {d.ko}({stem}{d.el})</p>
      <p className="mt-2 text-center text-[15px] leading-relaxed text-[#efe7d3]">{d.say}</p>
      <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
        {d.tags.map((t) => (
          <span key={t} className="rounded-full border border-[#e6c887]/35 px-3 py-0.5 text-[13px] text-[#f0d9a0]">{t}</span>
        ))}
      </div>
    </div>
  );
}
