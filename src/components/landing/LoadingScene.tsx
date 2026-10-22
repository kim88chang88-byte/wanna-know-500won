import SafeImage from "./SafeImage";

/*
 * 풀이를 만드는 동안 보여주는 작은 장면. 진행 단계(0~3, 끝나면 4)마다 장면이 바뀌어요.
 * 캐릭터는 고른 운의 동물 그림을 쓰고, 소품(글자 타일·저울·연도 띠·두루마리)은 CSS 로 움직여요.
 */
export const SCENE_STAGES = 4;

const EIGHT = ["甲", "子", "乙", "丑", "丙", "寅", "丁", "卯"];
const ELEMENT_STYLE: Record<string, string> = {
  木: "bg-emerald-100 text-emerald-700 border-emerald-300",
  火: "bg-rose-100 text-rose-700 border-rose-300",
  土: "bg-amber-100 text-amber-700 border-amber-300",
  金: "bg-slate-100 text-slate-600 border-slate-300",
  水: "bg-sky-100 text-sky-700 border-sky-300",
};

function Chip({ ch, className = "" }: { ch: string; className?: string }) {
  return (
    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border text-sm font-bold shadow-sm ${ELEMENT_STYLE[ch] ?? "bg-white text-gray-700 border-gray-200"} ${className}`}>
      {ch}
    </span>
  );
}

export default function LoadingScene({ stage, animal, year }: { stage: number; animal: string; year: number }) {
  const hero = (cls = "ls-bob") => (
    <div className={`relative z-10 w-24 h-24 ${cls}`}>
      <SafeImage src={animal} alt="" className="w-full h-full object-contain drop-shadow-md" fallback="🦦" fallbackClass="text-6xl" />
    </div>
  );

  let body: React.ReactNode;
  if (stage >= 4) {
    // 끝: 폴짝 뛰며 축하
    body = (
      <div className="relative flex items-end justify-center h-full">
        <span className="absolute left-6 top-4 text-xl ls-bob">🎉</span>
        <span className="absolute right-6 top-6 text-xl ls-bob" style={{ animationDelay: ".4s" }}>
          ✨
        </span>
        {hero("ls-jump")}
      </div>
    );
  } else if (stage === 0) {
    // 사주 여덟 글자를 세워요: 글자 타일이 하나씩 떠올라요
    body = (
      <div className="relative flex items-end justify-center h-full">
        <div className="absolute top-1 left-1/2 -translate-x-1/2 flex gap-1">
          {EIGHT.map((c, i) => (
            <span
              key={i}
              className="ls-pop w-6 h-8 rounded-md bg-white border border-brand-200 text-brand-700 text-sm font-bold flex items-center justify-center shadow-sm"
              style={{ animationDelay: `${i * 0.22}s` }}
            >
              {c}
            </span>
          ))}
        </div>
        {hero()}
      </div>
    );
  } else if (stage === 1) {
    // 오행의 균형: 저울을 양손에 들고 균형을 맞춰요
    body = (
      <div className="relative flex items-end justify-center h-full">
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-44 h-10 ls-tilt">
          <div className="absolute top-3 left-0 right-0 h-1 rounded-full bg-amber-700/70" />
          <div className="absolute -top-0.5 left-0 ls-untilt">
            <Chip ch="木" />
          </div>
          <div className="absolute -top-0.5 right-0 ls-untilt">
            <Chip ch="金" />
          </div>
        </div>
        <div className="absolute top-12 left-4 text-xs flex flex-col gap-1">
          <Chip ch="火" className="ls-bob" />
        </div>
        <div className="absolute top-12 right-4 text-xs flex flex-col gap-1">
          <Chip ch="水" className="ls-bob" />
        </div>
        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-amber-800/80" />
        {hero()}
      </div>
    );
  } else if (stage === 2) {
    // 올해와 대운의 흐름: 연도 띠가 흘러가요
    const years = Array.from({ length: 11 }, (_, i) => year - 5 + i);
    const row = [...years, ...years];
    body = (
      <div className="relative flex items-end justify-center h-full overflow-hidden">
        <div className="absolute top-3 left-0 w-max flex ls-flow">
          {row.map((y, i) => (
            <span
              key={i}
              className={`w-11 shrink-0 text-center text-xs font-bold rounded-full mx-0.5 py-1 border ${y === year ? "bg-brand-500 text-white border-brand-500" : "bg-brand-50 text-brand-700 border-brand-100"}`}
            >
              {y}
            </span>
          ))}
        </div>
        {hero()}
      </div>
    );
  } else {
    // 풀이 정리: 두루마리에 글을 써요
    body = (
      <div className="relative flex items-end justify-center h-full">
        <span className="absolute left-8 top-6 text-3xl">📜</span>
        <span className="absolute left-12 top-5 text-2xl ls-write">✍️</span>
        <span className="absolute right-8 top-4 text-lg ls-bob">✨</span>
        <span className="absolute right-12 top-14 text-sm ls-bob" style={{ animationDelay: ".6s" }}>
          ✦
        </span>
        {hero()}
      </div>
    );
  }

  return (
    <div aria-hidden="true" className="relative mx-auto w-64 h-32">
      <div key={stage} className="absolute inset-0 ls-fade">
        {body}
      </div>
    </div>
  );
}
