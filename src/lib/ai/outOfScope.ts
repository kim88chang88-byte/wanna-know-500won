import { regionsIn } from "@/lib/travel";
import { josa } from "@/lib/premium/josa";

/*
 * 도리가 정확하게 답할 수 없는 질문(가게 이름, 실시간 정보, 투자 종목)은 AI 를 부르지 않고
 * 정해 둔 사과 글로 바로 답해요. 이 질문은 횟수에서 빼지 않아요.
 */

export interface UnableReply {
  answer: string;
  links: Array<{ label: string; url: string }>;
}

const PLACE_KIND = /카페|커피숍|식당|맛집|밥집|술집|빵집|베이커리|숙소|호텔|펜션|게스트하우스|에어비앤비|미용실|네일샵|약국|헬스장|서점|영화관|레스토랑|이자카야|브런치|바\s?추천|디저트/;
const PLACE_ASK = /추천|알려\s?줘|알려줄|어디|가볼|괜찮은|찾아|소개|있을까|있어\?|없을까|있나/;
const LIVE = /영업\s?시간|운영\s?시간|몇\s?시까지\s?(해|열|영업)|지금\s?(열었|영업)|예약\s?(가능|돼|될까)|입장료|티켓\s?(가격|값)|(오늘|내일|모레|주말|이번\s?주)\s?.{0,4}날씨|날씨\s?(어때|알려|어떨|좋을까)|비\s?올까|환율|주가|시세/;
const INVEST = /(주식|코인|비트코인|이더리움|종목|펀드|etf|선물|옵션).{0,10}(추천|사도|살까|팔까|팔아|매수|매도|오를|올라|떨어)/i;
const NOW_PERSON = /(걔|그\s?사람|그\s?애|그\s?남자|그\s?여자|상대|전남친|전여친|남친|여친).{0,10}(지금|방금)\s?(뭐\s?해|뭐\s?하고|어디\s?(있|가)|누구랑)/;
const SKIP_ADJ = new Set(["가능한", "불가능한"]);
const SKIP_REGION = new Set(["혼자", "오늘", "내일", "주말", "요즘", "근처", "여기", "거기", "다른", "조용", "가까"]);

const FOOT = "\n\n이 질문은 횟수에서 빼지 않았어 🌙";

export const mapSearchUrl = (q: string): string => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

function regionOf(text: string): string {
  const r = regionsIn(text)[0];
  if (r) return r;
  const m = /([가-힣]{2,6})\s?(?:에서|근처|쪽|에)\s/.exec(text + " ");
  return m && !SKIP_REGION.has(m[1]) ? m[1] : "";
}

/** 답할 수 없는 유형이면 사과 글과 대안 링크를, 아니면 null */
export function unableReply(text: string): UnableReply | null {
  const t = text.trim();
  if (INVEST.test(t)) {
    return {
      answer: `미안, 투자 종목이나 사고파는 시점은 도리가 알려 줄 수가 없어. 틀리면 네 돈이 걸린 일이라 아는 척하지 않을게.\n\n대신 네 사주에서 돈이 들어오고 나가는 흐름과, 마음이 급해질 때 어떻게 하면 좋을지는 같이 볼 수 있어.${FOOT}`,
      links: [],
    };
  }
  if (NOW_PERSON.test(t) || /지금\s?뭐\s?하고\s?있는지/.test(t)) {
    return {
      answer: `미안, 그 사람이 지금 뭘 하는지, 어디에 있는지는 도리가 알 수가 없어. 모르는 걸 아는 척하고 싶지 않아.\n\n대신 그 사람 생각이 자꾸 날 때 마음을 어떻게 다루면 좋을지, 먼저 연락해도 되는 때는 언제인지는 같이 볼 수 있어.${FOOT}`,
      links: [],
    };
  }
  const kind = PLACE_KIND.exec(t)?.[0];
  if (kind && PLACE_ASK.test(t)) {
    const adjRaw = new RegExp(`([가-힣]{2,4}(?:한|운))\\s?${kind}`).exec(t)?.[1] ?? "";
    const adj = SKIP_ADJ.has(adjRaw) ? "" : adjRaw;
    const q = [regionOf(t), adj, kind].filter(Boolean).join(" ");
    return {
      answer: `미안, 가게 이름은 문을 닫았거나 바뀌었을 수 있어서 정확하게 알려 줄 수가 없어. 모르는 걸 아는 척하는 것보다 솔직한 게 낫다고 생각했어.\n\n대신 지도에서 ${`'${q}'${josa(q, "으로/로").slice(q.length)}`} 찾아보고, 후기와 영업시간을 꼭 확인해 봐. 어떤 분위기를 고르면 좋을지는 도리가 같이 정해 줄 수 있어.${FOOT}`,
      links: [{ label: `지도에서 '${q}' 찾기`, url: mapSearchUrl(q) }],
    };
  }
  if (LIVE.test(t)) {
    return {
      answer: `미안, 영업시간이나 날씨, 요금 같은 실시간 정보는 도리가 정확하게 알 수가 없어. 틀리게 알려 주면 헛걸음하게 될까 봐 말을 아낄게.\n\n해당 장소의 공식 안내나 지도 앱에서 확인해 줘. 그 시간을 어떻게 보내면 좋을지는 같이 이야기할 수 있어.${FOOT}`,
      links: [],
    };
  }
  return null;
}

/** AI 가 스스로 "못 답했다"고 표시했을 때: 사과가 앞에 오게 다듬어요 */
export function apologyFirst(answer: string): string {
  return /미안/.test(answer.slice(0, 40)) ? answer : `미안, 이건 정확하게 알려 줄 수가 없어.\n\n${answer}`;
}

export const REFUND_NOTICE = "이 질문은 횟수에서 빼지 않았어 🌙";
/** 한 사람이 하루에 이 방식으로 돌려받을 수 있는 질문 수 (일부러 반복하는 것을 막아요) */
export const REFUND_DAY_CAP = 5;
