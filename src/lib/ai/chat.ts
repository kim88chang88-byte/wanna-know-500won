import { PALETTE, SPOTS } from "@/lib/visualPalette";
import { STICKERS, STICKER_IDS, cleanSticker, type StickerId } from "./stickers";
import { SCENTS } from "@/lib/scents";
import { HEALTH_Q, healthFacts } from "@/lib/ai/healthFacts";
import { PROPS, PROP_TAGS, placeInQuestion, propCatalog, propFitsPlace } from "@/lib/props";
import { SONGS, songCatalog, stripUnknownSongs } from "@/lib/songs";
import { TRAVEL, travelCatalog, travelFacts, regionsIn } from "@/lib/travel";
import { analyzeChart } from "@/lib/saju/analysis";
import type { SajuChart } from "@/lib/saju/types";
import type { ChatKind, ChatMsg } from "@/lib/chatContext";
import { HISTORY_MAX, MSG_MAX, SUMMARY_MAX } from "@/lib/chatContext";
import { callName, fixPossessive, givenName, scrubExampleName } from "./nameRepair";
import { callJson } from "./callJson";
import type { CoreFacts } from "./coreFacts";
import type { ChatMemo } from "./chatMemo";
import type { DailyFacts } from "./dailyFacts";
import { modelFor } from "./llm";
import { containsForbidden, isGeneric } from "./reading";
import { tidyMarkup } from "@/lib/chatMarkup";
import { LOVE_Q, loveFacts } from "./loveFacts";
import { actionIdeas, LACK_LABEL, type LackEl } from "./actionIdeas";
import { CHAT_RULES } from "./chatRules.generated";
import { renderChatRules } from "./chatRules";
import { MONEY_Q, moneyFacts } from "./moneyFacts";
import { CAREER_Q, MONEY_WORDS, careerFacts } from "./careerFacts";
import { recommendFacts, recommendVisual } from "./menuHobby";
import { artFor } from "@/lib/foodArt";

/*
 * 도유 상담방: 방금 본 풀이를 이어서 물어보는 대화. 사실은 계산된 사주 정보에서만 가져와요.
 * 안전: 금지어 검사, 마음이 많이 힘든 말은 AI 를 부르지 않고 정해 둔 답으로 안내해요.
 */

export const CHAT_MIN = 40;
export const CHAT_MAX = 2800;

/* 프롬프트 본문은 docs/상담실-기준/prompt/*.md 에 있어요(수정은 거기서). 빌드 때 chatRules.generated.ts 로 묶여요. */
export const CHAT_SYSTEM_PROMPT = renderChatRules(CHAT_RULES, {
  PALETTE: Object.keys(PALETTE).join(", "),
  SCENTS: Object.keys(SCENTS).join(", "),
  SPOTS: Object.keys(SPOTS).join(", "),
  STICKERS: STICKERS.map((x) => `${x.id}(${x.hint})`).join(", "),
  PROPS: propCatalog(),
  SONGS: songCatalog(),
  TRAVEL: travelCatalog(),
});

export const CHAT_SCHEMA = {
  type: "object",
  properties: {
    answer: { type: "string", description: `도리의 채팅 답. 질문 종류에 맞게: 인사는 1~2문장, 마음이 힘든 말은 160~400자, 고민 상담 질문은 5단계(공감 → 사주로 본 지금 상황 → 고민에 적용 → 해답·솔루션 → 되묻기)로 첫 질문 1800~2500자·이어지는 질문 1200~1900자, 그 밖의 일반 첫 질문은 880~1800자, 그 밖의 이어지는 질문은 600~1200자(최대 ${CHAT_MAX}자), 빈 줄로 문단 나누기` },
    followups: { type: "array", items: { type: "string" }, description: "방금 답에서 이어지는 사용자의 다음 질문 3개 (각 20자 안팎). 칩은 사용자가 도리에게 묻는 말이어야 해(말투: ~알려줘, ~어때?, ~좋을까?, ~뭐야?). 도리가 사용자에게 되묻는 말(~가고 싶어?, 어떤 요일에 갈래?, 네가 ~했어?)은 절대 안 돼. 고민 상담 답이면 답 끝에서 짚은 더 알아볼 사항(시기·상대·선택지·다음 단계)으로 이어지게" },
    choices: { type: "array", items: { type: "string" }, description: "도리의 되묻는 질문에 눌러서 답할 선택지 2개(각 12자 이내). 없으면 빈 배열" },
    risk: { type: "boolean", description: "사용자가 죽고 싶다·사라지고 싶다·자고 일어나지 않았으면·모든 게 다 끝났으면·다 내려놓고 싶다·내가 없어야 남들이 편하다·살 의미가 없다 같은 말을 직접 하거나 돌려 말해서 자해·자살 위험이 조금이라도 보이면 true (이때 answer 는 따뜻한 한 줄만, 서버가 안내 글로 바꿔요). 평범한 피곤·스트레스·고민이면 false" },
    unable: { type: "boolean", description: "이 질문이 도리가 정확하게 답할 수 없는 정보(가게 이름, 실시간 정보, 확인할 수 없는 사실)를 묻는 것이라, 구체적으로 도움이 되는 답을 하나도 못 줬으면 true. 조금이라도 구체적으로 도왔으면 false" },
    sticker: { type: "string", enum: ["none", ...STICKER_IDS], description: "답 끝에 붙이는 도리 스티커 이름. 어울릴 때만 하나 고르고 보통은 none(전체 답의 3분의 1 이하)." },
    visual: {
      type: "object",
      description: "답에 붙이는 큰 그림 카드. 필요 없으면 kind 를 none 으로 하고 나머지는 비워요.",
      properties: {
        kind: { type: "string", enum: ["none", "note", "checklist", "timeline", "lucky", "palette", "spots", "scent", "songs", "travel", "course"] },
        title: { type: "string", description: "카드 제목(12자 이내). none 이면 빈 글자" },
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              icon: { type: "string", description: "이모지 1개 (timeline 만, 나머지는 빈 글자)" },
              label: { type: "string", description: "20자 이내" },
              sub: { type: "string", description: "20자 이내 (timeline·lucky 만, 나머지는 빈 글자)" },
              best: { type: "boolean", description: "timeline 에서 가장 추천하는 한 곳만 true" },
            },
            required: ["icon", "label", "sub", "best"],
            additionalProperties: false,
          },
        },
      },
      required: ["kind", "title", "items"],
      additionalProperties: false,
    },
  },
  required: ["answer", "followups", "choices", "unable", "risk", "visual", "sticker"],
  additionalProperties: false,
} as const;

export function parseChatAnswer(value: unknown): string | null {
  const a = (value as { answer?: unknown } | null)?.answer;
  if (typeof a !== "string") return null;
  const t = a.trim();
  if (t.length < CHAT_MIN || t.length > CHAT_MAX) return null;
  if (isGeneric(t) || containsForbidden(t)) return null;
  return t;
}

export type VisualKind = "note" | "checklist" | "timeline" | "lucky" | "palette" | "spots" | "scent" | "songs" | "travel" | "course" | "food" | "hobby";

export interface VisualItem {
  icon: string;
  label: string;
  sub: string;
  best: boolean;
}

/** 답 아래에 크게 보여 주는 그림 카드 (화면이 직접 그려요. 이미지를 만들지 않아요) */
export interface ChatVisual {
  kind: VisualKind;
  title: string;
  items: VisualItem[];
}

export interface ChatReply {
  answer: string;
  followups: string[];
  /** 도리가 되물은 질문에 눌러서 답하는 선택지 (없으면 빈 목록) */
  choices: string[];
  visual: ChatVisual | null;
  /** 답 끝에 붙는 도리 스티커 (없으면 생략) */
  sticker?: StickerId;
  /** 도리가 "정확하게 답할 수 없는 질문"이라고 스스로 표시했는지 (true 면 사과 답이고 질문은 돌려줘요) */
  unable?: boolean;
  /** 도리가 "자해·자살 위험이 보인다"고 스스로 표시했는지 (true 면 서버가 정해 둔 안내로 바꾸고 질문은 돌려줘요) */
  risk?: boolean;
}

const COUNT: Record<VisualKind, [number, number]> = { note: [2, 4], checklist: [2, 5], timeline: [3, 4], lucky: [1, 2], palette: [2, 3], spots: [1, 3], scent: [2, 3], songs: [2, 3], travel: [2, 3], course: [6, 9], food: [1, 3], hobby: [1, 3] };
const NEEDS_ICON: VisualKind[] = ["timeline", "course"];
const HAS_SUB: VisualKind[] = ["timeline", "lucky", "palette", "spots", "scent", "songs", "travel", "course"];

/** 그림 카드 검사: 종류·개수·길이·금지어를 통과하지 못하면 카드만 빼고 답은 그대로 보내요. */
/** 소품 카드: 질문에 장소가 나오면 그 장소에 둘 수 없는 소품을 빼고, 같은 오행·같은 역할은 하나만 남겨요(많아야 2개). */
export function narrowLucky(v: ChatVisual, question: string): ChatVisual | null {
  const place = placeInQuestion(question);
  let items = v.items;
  if (place) {
    const fit = items.filter((it) => propFitsPlace(it.label, place));
    items = fit;
  }
  const seenEl = new Set<string>();
  const seenRole = new Set<string>();
  const out: VisualItem[] = [];
  for (const it of items) {
    const el = PROPS[it.label]?.el ?? "";
    const role = PROP_TAGS[it.label]?.role ?? "";
    if ((el && seenEl.has(el)) || (role && seenRole.has(role))) continue;
    if (el) seenEl.add(el);
    if (role) seenRole.add(role);
    out.push(it);
  }
  return out.length ? { ...v, items: out.slice(0, 2) } : null;
}

export function cleanVisual(raw: unknown): ChatVisual | null {
  const v = raw as { kind?: unknown; title?: unknown; items?: unknown } | null;
  if (!v || typeof v.kind !== "string" || !(v.kind in COUNT) || !Array.isArray(v.items)) return null;
  const kind = v.kind as VisualKind;
  const clip = (x: unknown, max: number) => (typeof x === "string" ? x.trim().replace(/\*/g, "").replace(/\s+/g, " ") : "").slice(0, max);
  const title = clip(v.title, kind === "course" ? 24 : 14);
  const items: VisualItem[] = [];
  for (const it of v.items as unknown[]) {
    const o = it as { icon?: unknown; label?: unknown; sub?: unknown; best?: unknown } | null;
    const label = clip(o?.label, kind === "songs" ? 60 : 24);
    if (!label) continue;
    const icon = NEEDS_ICON.includes(kind) ? clip(o?.icon, 4) : "";
    const sub = HAS_SUB.includes(kind) ? clip(o?.sub, kind === "travel" ? 40 : kind === "lucky" ? 70 : 24) : "";
    if (kind === "palette" && !PALETTE[label]) continue;
    if (kind === "spots" && !SPOTS[label]) continue;
    if (kind === "scent" && !SCENTS[label]) continue;
    if (kind === "lucky" && !PROPS[label]) continue;
    if (kind === "songs" && !SONGS[label]) continue;
    if ((kind === "food" || kind === "hobby") && !artFor(kind, label)) continue;
    if (kind === "travel" && !TRAVEL[label]) continue;
    if (kind === "course" && !/^[123]$/.test(icon)) continue;
    if (items.some((x) => x.label === label)) continue;
    items.push({ icon, label, sub, best: kind === "timeline" && o?.best === true });
  }
  if (kind === "course" && regionsIn(title).length === 0) return null;
  const [min, max] = COUNT[kind];
  if (items.length < min) return null;
  const kept = items.slice(0, max);
  if (NEEDS_ICON.includes(kind) && kept.some((i) => !i.icon)) return null;
  if (kind === "timeline" && kept.filter((i) => i.best).length > 1) {
    let seen = false;
    for (const i of kept) {
      if (i.best && seen) i.best = false;
      if (i.best) seen = true;
    }
  }
  const all = [title, ...kept.flatMap((i) => [i.label, i.sub])].join(" ");
  if (containsForbidden(all)) return null;
  return { kind, title, items: kept };
}

/** 후속 질문 칩: 길이·금지어·중복을 거르고 3개까지. 하나도 못 쓰면 빈 목록(화면은 기본 칩을 보여 줘요). */
/** 도리가 사용자에게 묻는 말투의 칩("가장 걸리는 부분은 뭐야?", "~했던 적이 있어?")은 걸러요. 칩은 사용자가 도리에게 묻는 말이에요. */
const DORI_ASKS = /(마음이\s?쓰이는|다시\s?만나고\s?싶어|주로\s?해\?|어떤\s?생각을|요즘\s?일상|어떻게\s?지내|뭐였지|뭐였어|있었어|느껴졌던|걸리는\s?(부분|점)|네가|너는|너가|어땠어|해\s?봤어|힘들었던\s?점|고\s?싶(어|니|은지)\s?\??$|어떤\s?(요일|시간|날)에\s?(가|할|하|먹|볼)|언제\s?(가|할|해)고?\s?싶|다음에는\s?어떤)/;

export function cleanFollowups(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const v of raw) {
    if (typeof v !== "string") continue;
    const t = v.trim().replace(/\s+/g, " ");
    if (t.length < 4 || t.length > 40 || containsForbidden(t) || out.includes(t) || DORI_ASKS.test(t)) continue;
    out.push(t);
    if (out.length === 3) break;
  }
  return out;
}

/** 선택지 칩: 딱 2개, 짧은 글, 금지어 없음. 조건에 안 맞으면 빈 목록. */
export function cleanChoices(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const v of raw) {
    if (typeof v !== "string") continue;
    const t = v.trim().replace(/\s+/g, " ");
    if (t.length < 2 || t.length > 16 || containsForbidden(t) || out.includes(t)) continue;
    out.push(t);
  }
  return out.length === 2 ? out : [];
}

// "아파트"·"소화기"·"시리즈" 같은 말에 반응하지 않게 뒤따르는 글자를 가려요.
const SYMPTOM = /저림|저려|붓기|부어|붓는|통증|아파(?!트)|아픈|아프|쑤시|결리|어지러|두통|두근|소화(?!기)|불면|못\s?자|피로(?!연)|시리(?!즈)/;
const PRO_NOTE = "몸이 계속 불편하면 전문가와 꼭 이야기해 봐.";

/** 답이 받은 뒤의 정리: 이름 호칭 반복 줄이기, 몸 증상 질문에 전문가 안내 한 줄 보장. */
/** 입력 항목 이름이나 지시문이 답에 그대로 새어 나오면 쉬운 말로 바꾸거나 지워요. */
export function stripInternalTerms(text: string): string {
  return text
    .replace(/연애\s?재료(를|에서|에|가|는)?\s*(보면|따르면|보니|살펴보면)[,，]?\s*/g, "사주를 보면 ")
    .replace(/연애\s?재료(를|에서|에|가|는)?\s*/g, "")
    .replace(/(입력|도리\s?메모)(에|에서)\s?(따르면|적힌|나온)[^,，.\n]{0,8}[,，]?\s*/g, "")
    .replace(/메모에\s?(적은|적힌)\s?것처럼[,，]?\s*/g, "")
    .replace(/원국(이|은|과)?/g, (_m, j: string | undefined) => `타고난 사주${j ? ({ 이: "가", 은: "는", 과: "와" } as Record<string, string>)[j] : ""}`)
    .replace(/(올해|내년)\s?세운의\s?(비견|겁재|식신|상관|정재|편재|정관|편관|정인|편인)\s?기운/g, "$1 들어오는 기운")
    .replace(/['"‘“]?해라[,，]?\s?(하지\s?)?마라['"’”]?\s?(단정\s?하기보다는|단정\s?하기보다|단정\s?대신|대신|말고)[,，]?\s*/g, "");
}

/** 자주 나오는 반말 오타를 바로잡아요: 고맙어 → 고마워 */
/** 오행을 화면(알약)과 같은 말로 통일: 금 기운 → 쇠 기운 처럼 한 글자 오행은 풀어 써요. */
const EL_WORD: Record<string, string> = { 목: "나무", 화: "불", 토: "땅", 금: "쇠", 수: "물" };
export function unifyElementWords(t: string): string {
  return t.replace(/(^|[^가-힣])(목|화|토|금|수)(\s?기운)/g, (_m, pre: string, el: string, tail: string) => `${pre}${EL_WORD[el]}${tail}`);
}

export function fixTypos(t: string): string {
  return unifyElementWords(t)
    .replace(/어린이원/g, "어린이집")
    .replace(/(것|거)임([.!?]|\s|$)/g, "거야$2")
    .replace(/([가-힣])(고|며)(쇠|물|불|땅|나무) 기운/g, "$1$2 $3 기운")
    .replace(/(\S*[될할질올갈]) 확률이 (?:매우 |아주 |꽤 )?높(아서|아|은데)/g, (_m, a: string, e: string) => `${a} 수 있${e === "아서" ? "어서" : e === "아" ? "어" : "는데"}`)
    .replace(/고맙어/g, "고마워")
    .replace(/뭐\s야\?/g, "뭐야?")
    .replace(/지주가\s?없/g, "지장이 없")
    .replace(/아니서\s/g, "아니면 ")
    .replace(/(^|[\s"'“‘(])너가(?=\s)/g, "$1네가")
    .replace(/한템포/g, "한 템포")
    .replace(/거란다/g, "거야")
    .replace(/이란다/g, "이야")
    .replace(/그렇단다/g, "그래")
    .replace(/형살/g, "서로 얽히는 기운")
    .replace(/충살/g, "서로 부딪히는 기운");
}

/**
 * 강조 문장(**…**) 맨 앞의 이름 호칭은 바로 앞 답(최근 2개)에서 이미 강조 속 이름을 불렀다면 뗀다.
 * 정말 중요한 순간에만 이름이 나오게 해서, 자주 불러 닳는 걸 막아요.
 */
export function limitNameInHighlight(answer: string, name: string, prevDori: string[]): string {
  const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const forms = [`${name}님`, callName(name)].map(esc).join("|");
  const inMark = new RegExp(`\\*\\*\\s*(?:${forms})[,，]?\\s*`);
  if (!inMark.test(answer)) return answer;
  if (!prevDori.some((t) => inMark.test(t))) return answer;
  return answer.replace(new RegExp(`(\\*\\*)\\s*(?:${forms})[,，]?\\s*(?=[^*]{6,}\\*\\*)`), "$1");
}

/** 적어 보라는 제안, 연애 질문의 알림 끄기 제안은 문장째 지워요(말투 규칙을 어긴 답을 코드로 한 번 더 막아요). */
/** "적어 두지 말고"처럼 금지 규칙 자체를 사용자에게 말하는 문장 */
const NO_WRITE_MENTION = /(적어|메모해?|기록해?)\s?(두|놓|보)?지\s?(말|마)/;
const WRITE_SUGGEST = /적어\s?(봐|보|내려|두|볼|보는|보자|줘|놓)|적기|적어\s?보|기록해|메모해|노트에/;
const ALARM_OFF = /알림(을|도)?\s?(잠시\s?)?(꺼|끄|내려\s?(두|놓)|치워|멈춰)|알림을?\s?(모두\s?)?(무음|차단)/;
/** 아무 질문에나 붙는 차 한 잔 제안(사용자가 차를 직접 물을 때만 예외) */
const TEA_TIP = /따뜻한\s?차|차\s?한\s?잔|티\s?한\s?잔|따뜻한\s?음료/;
/** 잠 못 자는 사람에게 밤에 밖으로 나가라는 제안은 맥락에 안 맞아요 */
const NIGHT_OUT = /(밤|잠들기\s?전|자기\s?전|침대).{0,30}(골목|밖으로|나가|산책|한\s?바퀴|걸어\s?다녀|걸어\s?보)|(골목|산책|한\s?바퀴).{0,20}(밤|잠들기\s?전|자기\s?전)/;
/** 수명·건강 걱정 질문에 엉뚱한 새 장소 가 보기 제안 */
const NEW_PLACE = /(평소|안\s?가\s?던|처음\s?가|낯선).{0,20}(가게|식당|골목|동네|카페)/;
/** 식상한 일반 팁: 서랍·파일 정리, 타이머 맞추고 집중, 책상 치우기 같은 말은 어느 질문에서도 문장째 지워요. */
const BORING_TIP = /서랍|파일\s?한\s?칸|타이머|한\s?가지에만\s?집중|책상\s?(위|정리|을\s?치)|물건\s?(세|두|몇)\s?개|침구/;
export function dropBannedSuggestions(answer: string, lastUser: string, love: boolean): string {
  const userAsksWriting = /적어|적을|적기|적고|기록|메모|노트|일기/.test(lastUser);
  const userAsksTea = /차\s?(추천|마시|종류)|어떤\s?차|무슨\s?차|좋은\s?차|차가\s?있/.test(lastUser);
  const sleepCtx = /잠|불면|뒤척|자다가/.test(lastUser);
  const lifeCtx = /오래\s?살|수명|언제\s?죽|얼마나\s?살/.test(lastUser);
  const bad = (sent: string) =>
    BORING_TIP.test(sent) ||
    NO_WRITE_MENTION.test(sent) ||
    (!userAsksWriting && WRITE_SUGGEST.test(sent)) ||
    ALARM_OFF.test(sent) ||
    (!userAsksTea && TEA_TIP.test(sent)) ||
    (sleepCtx && NIGHT_OUT.test(sent)) ||
    (lifeCtx && NEW_PLACE.test(sent));
  const paras = answer.split("\n\n").map((para) => para.split(/(?<=[.!?。])\s+/).filter((sent) => !bad(sent)).join(" ")).filter((para) => para.trim().length > 0);
  const out = paras.join("\n\n").trim();
  return out.length >= CHAT_MIN ? out : answer;
}

/** "~해 보는 건 어때?" 로 끝나는 답이 한 대화에서 세 번째부터는 "~해 봐." 로 바꿔요. */
export function softenAskEnding(answer: string, prevDori: string[]): string {
  if (prevDori.filter((t) => /건\s?어때\?/.test(t)).length < 2) return answer;
  return answer
    .replace(/\s?보는\s?건\s?어때\?\s*$/, " 봐.")
    .replace(/([가-힣])하는\s?건\s?어때\?\s*$/, "$1해 봐.");
}

/** 같은 답 안에서 뜻이 거의 같은 문장이 두 번 나오면 뒤의 것을 지워요. (글자 두 개씩 묶어 얼마나 겹치는지 봐요) */
export function dedupeSentences(answer: string): string {
  const grams = (t: string): Set<string> => {
    const c = t.replace(/[^가-힣A-Za-z0-9]/g, "");
    const g = new Set<string>();
    for (let i = 0; i < c.length - 1; i++) g.add(c.slice(i, i + 2));
    return g;
  };
  const sim = (a: Set<string>, b: Set<string>): number => {
    if (a.size === 0 || b.size === 0) return 0;
    let n = 0;
    for (const x of a) if (b.has(x)) n++;
    return n / Math.min(a.size, b.size);
  };
  const seen: Array<Set<string>> = [];
  const paras = answer.split("\n\n").map((para) =>
    para
      .split(/(?<=[.!?。])\s+/)
      .filter((sent) => {
        const g = grams(sent);
        if (g.size < 10) return true; // 짧은 문장("그래.")은 건드리지 않아요
        if (seen.some((x) => sim(g, x) >= 0.62)) return false;
        seen.push(g);
        return true;
      })
      .join(" "),
  ).filter((para) => para.trim().length > 0);
  const out = paras.join("\n\n").trim();
  return out.length >= CHAT_MIN ? out : answer;
}

/** 우울·무기력이 이어진다는 말에는 혼자 안고 있지 말라는 가벼운 상담 권유 한 줄을 붙여요. (위기 안내와는 별개예요) */
const PERSIST_DOWN = /(우울|무기력|가라앉|의욕\s?이?\s?없|아무것도\s?하기\s?싫)/;
const PERSIST_WORD = /(계속|자주|많(아|이)|매일|오래|이유\s?없이|한\s?달|몇\s?주)/;
const DOWN_NOTE = "이런 마음이 오래 이어진다면 혼자 안고 있지 말고, 가까운 사람이나 마음을 돌보는 전문 상담에 한 번 이야기해 봐도 좋아.";
export function needsDownNote(history: ChatMsg[]): boolean {
  const users = history.filter((m) => m.role === "user").slice(-3).map((m) => m.text).join(" ");
  const last = [...history].reverse().find((m) => m.role === "user")?.text ?? "";
  if (!PERSIST_DOWN.test(users)) return false;
  return PERSIST_WORD.test(last) || PERSIST_WORD.test(users);
}

/** 칩이 매번 "내년에는 ~ 기운"으로 몰리지 않게: 앞서 물어본 것과 겹치는 칩, 두 번째 "내년" 칩, 차 칩을 걸러요(남는 게 하나도 없으면 처음 그대로). */
export function varyFollowups(chips: string[], history: ChatMsg[], lastUser: string): string[] {
  const grams = (t: string): Set<string> => {
    const c = t.replace(/[^가-힣A-Za-z0-9]/g, "");
    const g = new Set<string>();
    for (let i = 0; i < c.length - 1; i++) g.add(c.slice(i, i + 2));
    return g;
  };
  const asked = history.filter((m) => m.role === "user").map((m) => grams(m.text));
  const askTea = /차\s?(추천|마시|종류)|어떤\s?차|무슨\s?차|좋은\s?차|차가\s?있/.test(lastUser);
  let nextYear = 0;
  const out = chips.filter((c) => {
    const g = grams(c);
    if (asked.some((a) => a.size > 0 && g.size > 0 && [...g].filter((x) => a.has(x)).length / Math.min(a.size, g.size) >= 0.6)) return false;
    if (!askTea && /(좋은|도움이\s?되는|마시기\s?좋은)\s?차|차가\s?있/.test(c)) return false;
    if (/내년/.test(c) && ++nextYear > 1) return false;
    return true;
  });
  return out.length > 0 ? out : chips;
}

export function polishChatAnswer(answer: string, history: ChatMsg[], name?: string | null): string {
  let a = answer.trim();
  const n = name?.trim();
  const lastUser = [...history].reverse().find((m) => m.role === "user")?.text ?? "";
  const prevDori = history.filter((m) => m.role === "dori").slice(-2);
  if (n && prevDori.length > 0) {
    const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const forms = [`${n}님`, callName(n)];
    // 답 맨 앞에 이모지가 있어도(🌿 같은) 그 뒤의 호명을 지워요. 이름은 첫 답에서만 불러요.
    const lead = new RegExp(`^((?:[^\\s\\p{L}\\p{N}]+\\s*)?)(?:${forms.map(esc).join("|")})[,，]?\\s*`, "u");
    if (lead.test(a)) {
      const rest = a.replace(lead, "$1").trim();
      if (rest.replace(/^[^\s\p{L}\p{N}]+\s*/u, "").length >= CHAT_MIN) a = rest;
    }
  }
  if (n && prevDori.length > 0) a = limitNameInHighlight(a, n, prevDori.map((m) => m.text));
  // 성까지 붙은 호명("장은혁아")은 다정하게 이름만("은혁아")으로. 성+이름(한글 3~4자)일 때만 바꿔요.
  if (name && /^[가-힣]{3,4}$/.test(name.trim())) {
    const full = name.trim();
    a = a.split(full).join(givenName(full));
  }
  a = dropBannedSuggestions(a, lastUser, LOVE_Q.test(`${lastUser} ${history.slice(-4).map((m) => m.text).join(" ")}`));
  a = softenAskEnding(a, history.filter((m) => m.role === "dori").map((m) => m.text));
  a = dedupeSentences(a);
  if (SYMPTOM.test(lastUser) && !a.includes("전문가") && !/병원|약사|의사|진료|이비인후과|내과|한의원/.test(a) && a.length + PRO_NOTE.length + 2 <= CHAT_MAX) {
    a = `${a}\n\n${PRO_NOTE}`;
  }
  if (needsDownNote(history) && !/상담|전문가|병원/.test(a) && a.length + DOWN_NOTE.length + 2 <= CHAT_MAX) {
    a = `${a}\n\n${DOWN_NOTE}`;
  }
  return tidyMarkup(scrubExampleName(stripInternalTerms(fixTypos(fixPossessive(a, n))), n, ...history.filter((m) => m.role === "user").map((m) => m.text)));
}

const CAREER_OFFTOPIC_CHIP = /세운|십성|지출|소비|차\s?(마시|한\s?잔)|따뜻한\s?차|연말|날씨|맛집|음식|산책|기분\s?전환|음악/;

export function parseChatReply(value: unknown): ChatReply | null {
  const answer = parseChatAnswer(value);
  if (answer === null) return null;
  const o = value as { followups?: unknown; choices?: unknown; visual?: unknown; unable?: unknown; risk?: unknown; sticker?: unknown } | null;
  const choices = cleanChoices(o?.choices);
  const sticker = cleanSticker(o?.sticker);
  // 되묻는 답(선택지 2개)에서는 후속 질문 칩을 함께 보여 주지 않아요.
  return { answer, followups: choices.length ? [] : cleanFollowups(o?.followups), choices, visual: cleanVisual(o?.visual), unable: o?.unable === true, risk: o?.risk === true, ...(sticker ? { sticker } : {}) };
}

/** 마음이 많이 힘들다는 말이 보이면 AI 를 부르지 않고 정해 둔 답으로 안내해요. */
const CRISIS = /자살|죽고\s?싶|죽을래|죽어\s?버|(?<!투)자해|목숨(을\s?)?(끊|버리|던져|던질|포기|내놓)|사라지고\s?싶|없어지고\s?싶|살기\s?싫|살고\s?싶지|그만\s?살고|(힘들|지쳐|버티기|못\s?버티).{0,12}(다|모두|전부)\s?끝(내|낼)|(삶|인생|모든\s?걸|모든\s?것).{0,6}끝(내|낼)(?!주)|(나는|내가|난|그냥|차라리)\s?(사라졌으면|없어졌으면|죽었으면)|차라리\s?죽|내가\s?(없어지면|사라지면|죽으면|없으면|없는\s?게).{0,12}(편(하|해)|낫|나을|좋|행복|걱정\s?(없|안))|(사는|살)\s?(게\s?|것이?\s?)?(의미|이유|목적)(가|를|도|는)?\s?[가-힣\s]{0,6}(없|모르|몰라|잃)|(사는|(내가|나는|난|제가|이제)\s?살)\s?(게\s?|것이?\s?)?가치(가|를|도|는)?\s?[가-힣\s]{0,6}(없|모르|몰라|잃)|눈\s?(을\s?)?감(으면|고).{0,10}(안\s?떠|못\s?떠|뜨지\s?않)|(안|못)\s?떠졌으면|떠지지\s?(않았으면|말았으면)|깨어나지\s?(않았으면|말았으면)|(다시|영원히)\s?(안|못)\s?깨|태어나지\s?말(걸|았어야)|(더는|더\s?이상)\s?못\s?(버티|살)|모든\s?(게|것이?|걸|거)\s?(다\s?|그냥\s?)?(끝났으면|끝나버렸으면|끝나면\s?좋겠|멈췄으면)|사는\s?가치|(내가|나는|난|제가)\s?살\s?가치|왜\s?(사|살)(는|아야|까)|(나|내)\s?같은\s?(인간|놈|사람|건|게).{0,12}(왜\s?(사|살)|살\s?(가치|이유|자격)|있어\s?봐야|쓸모)|내가\s?없어도\s?(이\s?)?(세상|다들|모두|사람들)|(쓸모|가치)\s?없는\s?(인간|사람|존재)/;

export function isCrisis(text: string): boolean {
  return CRISIS.test(text);
}

export const CRISIS_ANSWER =
  "지금 마음이 많이 무거운 것 같아서 도리가 걱정돼. 사주 이야기는 잠깐 내려놓고, 혼자 버티지 말고 가까운 사람이나 전문 상담에 꼭 이야기해 줘.\n\n한국에서는 24시간 받는 자살예방 상담전화 109, 위기 상황이면 112·119에 바로 연락할 수 있어. 도리는 여기서 네 편으로 기다릴게 ❄️";

const RISK_SYSTEM = `너는 안전 분류기야. 사용자의 마지막 말에 자해·자살 위험이 직접 또는 돌려서라도 보이는지만 판단해.
위험(true): 죽고 싶다, 사라지고 싶다, 자고 일어나지 않았으면, 눈을 뜨지 못했으면, 모든 게 끝났으면, 내가 없어야 남들이 편하다, 내가 없어도 세상은 잘 돌아간다, 살 의미·가치가 없다, 나 같은 인간은 왜 사나, 나만 없으면 다 괜찮을 텐데, 이대로 영원히 잠들었으면, 나는 인간 쓰레기다처럼 자기를 심하게 깎아내리는 말, 내가 쓸모없다고 느껴 사라지고 싶다는 뜻의 말.
위험 아님(false): 피곤·스트레스, 회사·일·공부를 그만두고 싶다, 시험·회의·일이 끝나길 바란다, 다 때려치우고 싶다(일·관계), 평범한 고민이나 사주 질문.
애매하면 true 로 해. JSON 으로만 답해.`;

const RISK_SCHEMA = {
  type: "object",
  properties: { risk: { type: "boolean", description: "자해·자살 위험이 조금이라도 보이면 true" } },
  required: ["risk"],
  additionalProperties: false,
} as const;

export function parseRisk(value: unknown): { risk: boolean } | null {
  const r = (value as { risk?: unknown } | null)?.risk;
  return typeof r === "boolean" ? { risk: r } : null;
}

/** 짧은 분류 전용 호출: 긴 상담 프롬프트에 섞인 표시보다 훨씬 믿을 만해요. 실패하면 던져요(부르는 쪽에서 평소대로 이어가요). */
export async function checkRisk(history: ChatMsg[], opts: { apiKey?: string; model?: string; fetchImpl?: typeof fetch } = {}): Promise<boolean> {
  const recent = history.slice(-4).map((m) => `${m.role === "user" ? "사용자" : "도리"}: ${m.text.slice(0, 200)}`).join("\n");
  const r = await callJson<{ risk: boolean }>({
    system: RISK_SYSTEM,
    user: `대화 기록:\n${recent}\n\n마지막 사용자 말의 위험 여부를 판단해.`,
    schema: RISK_SCHEMA,
    maxTokens: 40,
    attempts: 1,
    timeoutMs: 6_000,
    model: opts.model ?? modelFor("chat"),
    apiKey: opts.apiKey,
    fetchImpl: opts.fetchImpl,
    parse: parseRisk,
  });
  return r.risk;
}

/* ---------- 질문의 주인공이 다른 사람인지 알아채기 ---------- */

/** 다른 사람이 나올 법한 낱말이 있을 때만 분류 호출을 해요(없으면 AI 호출 없음). */
export const SUBJECT_GATE = /(친구|친한|형님?|누나|오빠|언니|동생|엄마|어머니|아빠|아버지|부모|아들|딸|자녀|아이|조카|손주|손자|손녀|남편|아내|와이프|배우자|시어머니|시아버지|장모|장인|삼촌|이모|고모|할머니|할아버지|선배|후배|동료|상사|팀장|사장|직원|지인|이웃|제자|학생|그\s?(사람|친구|아이|애|분)|걔|그분)/;

const SUBJECT_SYSTEM = `너는 질문 분류기야. 사용자의 마지막 말이 사용자 본인이 아니라 "다른 사람 한 명" 자체의 운명·성향·진로·미래·시기·건강운 등을 사주로 풀어 달라는 질문인지 판단해.
other=true: 친한 형님 아들의 수능 후 진로, 엄마의 올해 운, 친구가 이직하면 잘될지, 조카의 성향처럼 그 사람 자체를 풀이해 달라는 말.
other=false: 그 사람이 사용자 고민의 배경으로만 나오는 말(남친이 나한테 차가워졌어, 상사 때문에 힘들어, 친구가 내 전남친과 사귀어서 어떻게 해야 해, 부모님 때문에 지친 내 마음), 사용자 본인 이야기, 궁합 질문, 일반 질문.
other 가 true 면 who 에 그 사람을 부르는 말을 12자 안으로(예: 형님 아들, 어머니, 친구), 아니면 빈 글자. 대화 기록에서 이미 그 사람 이야기를 이어 가는 중이어도 마지막 말 기준으로 판단해. JSON 으로만 답해.`;

const SUBJECT_SCHEMA = {
  type: "object",
  properties: {
    other: { type: "boolean", description: "다른 사람 자체를 풀이해 달라는 질문이면 true" },
    who: { type: "string", description: "other 가 true 일 때 그 사람 호칭(12자 이내), 아니면 빈 글자" },
  },
  required: ["other", "who"],
  additionalProperties: false,
} as const;

export function parseSubject(value: unknown): { other: boolean; who: string } | null {
  const v = value as { other?: unknown; who?: unknown } | null;
  if (typeof v?.other !== "boolean") return null;
  const who = typeof v.who === "string" ? v.who.replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, 12) : "";
  return { other: v.other, who };
}

/** 질문의 주인공이 다른 사람인지 짧게 분류해요. 실패하면 던져요(부르는 쪽은 평소대로 이어가요). */
export async function classifySubject(history: ChatMsg[], opts: { apiKey?: string; model?: string; fetchImpl?: typeof fetch } = {}): Promise<{ other: boolean; who: string }> {
  const recent = history.slice(-4).map((m) => `${m.role === "user" ? "사용자" : "도리"}: ${m.text.slice(0, 200)}`).join("\n");
  return callJson<{ other: boolean; who: string }>({
    system: SUBJECT_SYSTEM,
    user: `대화 기록:\n${recent}\n\n마지막 사용자 말의 주인공이 다른 사람인지 판단해.`,
    schema: SUBJECT_SCHEMA,
    maxTokens: 60,
    attempts: 1,
    timeoutMs: 6_000,
    model: opts.model ?? modelFor("chat"),
    apiKey: opts.apiKey,
    fetchImpl: opts.fetchImpl,
    parse: parseSubject,
  });
}

/** 서버에서 대화 기록을 다시 정리해요 (길이·개수 제한, 마지막은 반드시 사용자의 말). */
export function cleanHistory(raw: unknown): ChatMsg[] | null {
  if (!Array.isArray(raw) || raw.length > 80) return null;
  const list: ChatMsg[] = [];
  for (const m of raw) {
    if (typeof m !== "object" || m === null) return null;
    const { role, text } = m as { role?: unknown; text?: unknown };
    if ((role !== "user" && role !== "dori") || typeof text !== "string") return null;
    const t = text.trim().slice(0, role === "dori" ? CHAT_MAX : MSG_MAX);
    if (t) list.push({ role, text: t });
  }
  if (list.length === 0 || list[list.length - 1].role !== "user") return null;
  return list.slice(-HISTORY_MAX * 2);
}

export interface ChatFactsInput {
  kind: ChatKind;
  name?: string | null;
  partnerName?: string | null;
  summary: string;
  chart: SajuChart;
  core: CoreFacts | null;
  /** 사용자가 고른 "다른 사람" 풀이: chart·core 는 그 사람의 것이고, asker 는 질문한 사용자 본인의 사주 */
  about?: { name: string; asker: SajuChart | null; askerGender?: string | null; askerBirthText?: string | null } | null;
  /** chart 주인의 성별("남성"/"여성"). 호칭(엄마·아빠 등)을 지레짐작하지 않게 사실로 알려 줘요 */
  gender?: string | null;
  /** chart 주인이 입력한 생년월일시 글(예: "1990년 3월 17일(양력), 태어난 시간 모름"). 본인이 "내 정보 맞혀봐" 하면 이걸로 답해요 */
  birthText?: string | null;
  /** 질문에 앞으로의 시점(내년 2월 등)이 있을 때, 그 시점 기준 사주 흐름 */
  future?: Record<string, unknown> | null;
  daily?: DailyFacts | null;
  partnerChart?: SajuChart | null;
  /** 화면에 카드로 먼저 보이는 "도리 메모" (첫 질문에만) */
  memo?: ChatMemo | null;
}

function chartFacts(chart: SajuChart) {
  const f = analyzeChart(chart);
  return {
    일간: `${f.dayMaster.hanja}(${f.dayMaster.hangul}) · ${f.dayMaster.elementKo} · ${f.dayMaster.yinYang === "yang" ? "양" : "음"}`,
    네기둥: f.pillars.map((p) => `${p.label} ${p.text}`),
    오행분포: { 목: f.elementCounts.wood, 화: f.elementCounts.fire, 토: f.elementCounts.earth, 금: f.elementCounts.metal, 수: f.elementCounts.water },
    태어난시간: f.hourKnown ? "알고 있음" : "모름 (시주 없이 6글자로 본 결과)",
  };
}

/** 최근 기록 밖으로 밀려난 사용자의 예전 질문을 한 줄로 이어 붙여요(AI 를 따로 부르지 않아요). */
export function earlierQuestions(history: ChatMsg[]): string {
  const old = history.slice(0, Math.max(0, history.length - HISTORY_MAX));
  return old
    .filter((m) => m.role === "user")
    .map((m) => m.text.replace(/\s+/g, " ").slice(0, 40))
    .slice(-6)
    .join(" / ");
}


const EL_PILL: Record<string, string> = { wood: "나무", fire: "불", earth: "땅", metal: "쇠", water: "물" };
const EL_WORDS = ["나무", "불", "땅", "쇠", "물"] as const;
const EL_ALIAS: Record<string, (typeof EL_WORDS)[number]> = { 목: "나무", 화: "불", 토: "땅", 금: "쇠", 수: "물", 나무: "나무", 불: "불", 땅: "땅", 쇠: "쇠", 물: "물" };

/** 사주에서 가장 적은 오행. 행동 제안을 "부족한 기운 채우기"와 이어 주려고 써요. (같으면 물·불·나무·땅·쇠 순) */
export function weakestElement(chart: SajuChart): LackEl | null {
  const f = analyzeChart(chart);
  const order: LackEl[] = ["water", "fire", "wood", "earth", "metal"];
  let best: LackEl | null = null;
  for (const e of order) {
    const n = f.elementCounts[e] ?? 0;
    if (best === null || n < (f.elementCounts[best] ?? 0)) best = e;
  }
  return best;
}

/** 오행 개수에서 부족한 기운·많은 기운. 추천을 "그래서 이런 곳·이런 일"로 이어 주는 근거예요. */
export function elementBalance(chart: SajuChart): { 부족한기운: string; 많은기운: string } {
  const f = analyzeChart(chart);
  const lack = weakestElement(chart);
  const top = Object.entries(f.elementCounts).sort((a, b) => b[1] - a[1])[0];
  const nm = (e: string | null | undefined) => (e ? `${EL_PILL[e] ?? e} 기운 ${f.elementCounts[e as LackEl] ?? 0}개` : "없음");
  return { 부족한기운: nm(lack), 많은기운: top ? nm(top[0]) : "없음" };
}

/** 이 대화에서 사주 근거로 쓸 기운: 일간 기운과 가장 많은 오행. 답마다 다른 오행을 중심처럼 말하지 않게 고정해요. */
export function coreElements(chart: SajuChart): string[] {
  const f = analyzeChart(chart);
  const out: string[] = [];
  const dm = EL_PILL[f.dayMaster.element] ?? null;
  if (dm) out.push(dm);
  const top = Object.entries(f.elementCounts).sort((a, b) => b[1] - a[1])[0];
  if (top && top[1] > 0) {
    const w = EL_PILL[top[0]];
    if (w && !out.includes(w)) out.push(w);
  }
  return out;
}

/** 직전 도리 답들에서 이미 풀어 쓴 사주 기운 근거 (예: "땅 기운"). 같은 근거를 또 풀지 않게 알려 줘요. */
export function usedBasis(history: ChatMsg[]): string[] {
  const count: Record<string, number> = {};
  for (const m of history) {
    if (m.role !== "dori") continue;
    const seen = new Set<string>();
    const re = /(?:\[\[(나무|불|땅|쇠|물)\]\]|(나무|불|땅|쇠|물|목|화|토|금|수))\s*(?:\(\w+\)\s*)?기운/g;
    for (const mm of m.text.matchAll(re)) {
      const w = EL_ALIAS[mm[1] ?? mm[2] ?? ""];
      if (w) seen.add(w);
    }
    for (const w of seen) count[w] = (count[w] ?? 0) + 1;
  }
  return Object.entries(count).filter(([, n]) => n >= 1).map(([w, n]) => `${w} 기운(${n}번)`);
}

const ACTION_KINDS: Array<[string, RegExp]> = [
  ["메모·노트에 적기", /메모|노트|적어|일기|글로/],
  ["걷기·산책", /산책|걸어|걷기|걸으/],
  ["음악 듣기", /음악|노래|플레이리스트/],
  ["차·음료 마시기", /차 한 잔|따뜻한 차|커피|음료|한 잔/],
  ["호흡·스트레칭", /호흡|숨을|스트레칭|기지개/],
  ["혼자만의 시간·쉬기", /혼자만의|혼자 있는|푹 쉬|쉬어/],
  ["톡·연락 보내기", /톡|연락|문자|전화/],
  ["서랍·소품·집 가꾸기", /서랍|파일 한 칸|소품|샤워|식물|조명|루틴|한 끼|환기|침구/],
  ["책 읽기", /책 \d|읽다 만|페이지|독서/],
  ["앨범·사진 정리", /앨범|사진/],
  ["마감 정하기", /마감/],
  ["하나 내려놓기·거절", /하나(만)?\s?(를|은|는)?\s?(내려놓|덜어|거절|미뤄|미루)|일정\s?(을|하나)?\s?(내려놓|비워)/],
  ["새로운 곳 가 보기", /평소(에)?\s?안\s?가\s?던|안\s?가\s?던\s?(곳|길|가게|식당|골목)|동네\s?(골목|한\s?바퀴)|낯선\s?(곳|길|동네)/],
  ["이번 주말 제안", /이번\s?주말/],
];

/** 도리가 이미 권한 행동 종류와 횟수. 같은 제안이 이어지지 않게 프롬프트에 알려 줘요. */
export function usedActions(history: ChatMsg[]): string[] {
  const count: Record<string, number> = {};
  for (const m of history) {
    if (m.role !== "dori") continue;
    for (const [name, re] of ACTION_KINDS) if (re.test(m.text)) count[name] = (count[name] ?? 0) + 1;
  }
  return Object.entries(count).map(([k, n]) => `${k}(${n}번)`);
}

/** 지금 시점(한국 시간): 요일·시간대·계절. 맞지 않는 장면(주말 낮의 "퇴근길")을 막아 줘요. */
const TIME_MENTION = /(월|화|수|목|금|토|일)요일|주말|평일|(아침|점심|저녁|새벽|밤)(에|인데|이라|이니|이야)|(늦가을|연말)/;

/** 도리가 이미 요일·시간대를 말했는지: 같은 말을 되풀이하지 않게 프롬프트에 알려 줘요. */
export function timeAlreadySaid(history: ChatMsg[]): boolean {
  return history.some((m) => m.role === "dori" && TIME_MENTION.test(m.text));
}

export function nowContext(now: Date): string {
  const k = new Date(now.getTime() + 9 * 3600_000);
  const day = ["일", "월", "화", "수", "목", "금", "토"][k.getUTCDay()];
  const h = k.getUTCHours();
  const band = h < 5 ? "새벽" : h < 11 ? "아침" : h < 14 ? "점심 무렵" : h < 18 ? "오후" : h < 22 ? "저녁" : "밤";
  const m = k.getUTCMonth() + 1;
  const season = m === 12 || m <= 2 ? "겨울" : m <= 5 ? "봄" : m <= 8 ? "여름" : m === 11 ? "늦가을(연말이 다가오는 때)" : "가을";
  const weekend = day === "토" || day === "일" ? "주말" : "평일";
  return `${m}월 ${k.getUTCDate()}일 ${day}요일(${weekend}) ${band}, ${season}`;
}

const ASK_PATTERN: Record<Exclude<VisualKind, never>, RegExp> = {
  lucky: /소품|물건|아이템|행운템|부적|챙기|들고 다니|지니고|가지고 다니|곁에 두|선물/,
  palette: /색|컬러|옷|입으면|입을/,
  scent: /향|냄새|디퓨저|캔들|인센스/,
  songs: /노래|곡|음악|플레이리스트|플리/,
  travel: /여행|여행지|떠나|떠날|놀러|휴가|나들이|어디로 가|가볼 만/,
  course: /코스|일정|계획|짜 줘|짜줘|1박|2박|3박|\d일/,
  spots: /어디에|자리|배치|놓|두면|두는/,
  timeline: /언제|몇 시|시간대|시간이 좋|타이밍|시기|몇시/,
  food: /^$/,
  hobby: /^$/,
  note: /적어|메모|노트|일기|쓸 말|문장|법|팁|어떻게|추천/,
  checklist: /할 일|해 볼|해볼|체크|실천|습관|루틴|계획|방법|법|팁|어떻게|뭐 하|무엇을 하|추천/,
};

/** 카드는 사용자가 그 종류를 물었을 때만 붙여요. 묻지 않았는데 붙은 카드는 뺍니다(답 글은 그대로). */
export function visualAllowed(kind: VisualKind, question: string): boolean {
  const re = ASK_PATTERN[kind];
  return re ? re.test(question) : false;
}

/** 직전 도리 답들의 마지막 문장. 같은 끝맺음("~건 어때?")이 반복되지 않게 프롬프트에 알려 줘요. */
export function recentEndings(history: ChatMsg[]): string {
  return history
    .filter((m) => m.role === "dori")
    .slice(-3)
    .map((m) => {
      const parts = m.text.replace(/\s+/g, " ").trim().split(/(?<=[.?!…])\s+/);
      return (parts[parts.length - 1] ?? "").slice(-40);
    })
    .filter(Boolean)
    .join(" / ");
}

export function buildChatPrompt(i: ChatFactsInput, history: ChatMsg[], now: Date = new Date()): string {
  const askedNow = [...history].reverse().find((m) => m.role === "user")?.text ?? "";
  const rec = recommendFacts(askedNow, history, i.chart, i.daily, now);
  const where = i.kind === "daily" ? "오늘의 도리 한마디 카드에서 들어왔어요" : i.kind === "compat" ? "궁합 결과서를 읽고 들어왔어요" : "사주 풀이 결과서를 읽고 들어왔어요";
  const facts = {
    들어온곳: where,
    이름: i.about ? { 나: i.name?.trim() || "(없음)", 주인공: i.about.name } : { 나: i.name?.trim() || "(없음)", ...(i.kind === "compat" ? { 상대: i.partnerName?.trim() || "상대" } : {}) },
    ...(i.about ? { "주인공(사용자가 아닌 다른 사람)": { ...chartFacts(i.chart), ...(i.gender ? { 성별: i.gender } : {}), ...(i.birthText ? { 입력한생년월일: i.birthText } : {}) }, ...(i.about.asker ? { "질문한 사람(사용자)": { ...chartFacts(i.about.asker), ...(i.about.askerGender ? { 성별: i.about.askerGender } : {}), ...(i.about.askerBirthText ? { 입력한생년월일: i.about.askerBirthText } : {}) } } : {}) } : { 나: { ...chartFacts(i.chart), ...(i.gender ? { 성별: i.gender } : {}), ...(i.birthText ? { 입력한생년월일: i.birthText } : {}) } }),
    "이 대화에서 쓸 사주 기운": coreElements(i.chart).map((w) => `${w} 기운`),
    기운균형: elementBalance(i.chart),
    ...(i.core ? { 사주핵심: i.core } : {}),
    ...(i.future ? { 미래시점사주: i.future } : {}),
    ...(LOVE_Q.test(`${askedNow} ${history.slice(-4).map((m) => m.text).join(" ")}`) ? { 연애재료: loveFacts(i.chart, now) } : {}),
    ...(!LOVE_Q.test(`${askedNow}`) && CAREER_Q.test(`${askedNow} ${history.slice(-2).map((m) => m.text).join(" ")}`) ? { 일재료: careerFacts(i.chart, now) } : {}),
    ...(!LOVE_Q.test(`${askedNow}`) && (!CAREER_Q.test(`${askedNow} ${history.slice(-2).map((m) => m.text).join(" ")}`) || MONEY_WORDS.test(askedNow)) && MONEY_Q.test(`${askedNow} ${history.slice(-4).map((m) => m.text).join(" ")}`) ? { 재물재료: moneyFacts(i.chart, now) } : {}),
    ...(HEALTH_Q.test(askedNow) && !LOVE_Q.test(askedNow) ? { 건강재료: healthFacts(i.chart, now) } : {}),
    ...(rec ? { 추천재료: rec } : {}),
    ...(i.kind === "compat" && i.partnerChart ? { 상대: chartFacts(i.partnerChart) } : {}),
    ...(i.daily ? { 오늘의흐름: i.daily } : {}),
    ...(i.memo ? { 도리메모: { 제목: i.memo.title, 항목: Object.fromEntries(i.memo.rows), [i.memo.scoreLabel]: `${i.memo.score} (${i.memo.tone})`, 한줄결론: i.memo.line } } : {}),
  };
  const log = history
    .slice(-HISTORY_MAX)
    .map((m) => `${m.role === "user" ? "사용자" : "도리"}: ${m.text}`)
    .join("\n");
  const earlier = earlierQuestions(history);
  const endings = recentEndings(history);
  const used = usedBasis(history);
  const acts = usedActions(history);
  const dayOfYear = Math.floor((now.getTime() - Date.UTC(now.getUTCFullYear(), 0, 0)) / 86400000);
  // 연애·관계 질문에는 집·몸 돌봄 행동이 엉뚱해서 부족한 기운 행동을 빼요. (인연·개운을 직접 물을 때만 예외)
  const loveCtx = LOVE_Q.test(`${askedNow} ${history.slice(-4).map((m) => m.text).join(" ")}`) && !/인연|개운/.test(askedNow);
  const lack = loveCtx ? null : weakestElement(i.chart);
  const ideas = actionIdeas(askedNow, history.length, dayOfYear, ACTION_KINDS.filter(([name]) => acts.some((x) => x.startsWith(name))).map(([, re]) => re), lack ?? undefined);
  const lastQ = [...history].reverse().find((m) => m.role === "user")?.text ?? "";
  let regs = regionsIn(lastQ);
  if (regs.length === 0 && /코스|일정|짜\s?줘/.test(lastQ)) regs = regionsIn(history.slice(-4).map((m) => m.text).join(" ")).slice(0, 2);
  const travelBlock = regs.length ? `여행 코스 재료(이 안의 명소·활동만 써):\n${regs.slice(0, 3).map(travelFacts).join("\n")}\n\n` : "";
  return `계산된 사주 정보:\n${JSON.stringify(facts, null, 2)}\n\n방금 본 풀이(요약):\n${i.summary.slice(0, SUMMARY_MAX) || "(없음)"}\n\n${earlier ? `앞서 물어본 것(오래된 대화 요약): ${earlier}\n\n` : ""}${endings ? `직전 도리 답의 끝맺음(같은 표현·문형으로 끝내지 마): ${endings}\n\n` : ""}${`지금 시점(한국 시간): ${nowContext(now)}. 직업·학교 여부는 사용자가 말하기 전까지 모름.${timeAlreadySaid(history) ? " 이미 시점을 말함: 요일·시간대·계절을 이번 답에서 다시 말하지 마." : ""}\n\n`}${travelBlock}${acts.length ? `이미 권한 행동(같은 종류를 또 권하지 마): ${acts.join(", ")}\n\n` : ""}${ideas.length ? `이번 답의 작은 행동 후보${lack ? `(앞의 두 가지는 내 사주에 가장 적은 ${LACK_LABEL[lack]} 기운을 채우는 행동이야)` : ""}(이 질문과 바로 이어지는 하나만 골라 구체적으로 써. 어울리는 게 없으면 후보를 쓰지 말고 질문에 맞는 행동을 직접 만들어. ${lack ? `${LACK_LABEL[lack]} 기운 행동을 고르면 왜 그 행동인지 한 문장으로 사주 근거와 이어 줘. ` : ""}나열 금지): ${ideas.join(" / ")}\n\n` : ""}${used.length ? `이미 말한 사주 근거(더 맞으면 다시 써도 되지만 앞 문장을 반복하지 말고 이번 질문에 맞게 새로 해석해): ${used.join(", ")}\n\n` : ""}대화 기록(마지막 줄이 새 질문):\n${log}\n\n마지막 사용자 질문에 answer 와 followups 로 답해 줘.`;
}

const REST_SENTENCE = /(창문|산책|알림을?\s?(잠시\s?)?(끄|꺼)|세수|숨을\s?(길게|깊게)|머리를\s?식)/;

/** 궁합 질문에는 코드가 안내 한 줄을 보장하고, 상관없는 쉬는 제안 문장은 지워요. */
export function addCompatNote(answer: string, question: string, kind: string): string {
  if (!/궁합/.test(question) || kind === "compat") return answer;
  const parts = answer.split(/(?<=[.!?])\s+/).filter((x) => !REST_SENTENCE.test(x));
  let out = (parts.length > 0 ? parts.join(" ") : answer).replace(/ ?\n\n\n+/g, "\n\n").trimEnd();
  if (!/궁합 보기/.test(out)) out += "\n\n궁합 보기에서 상대 생년월일(양력/음력)과 태어난 시간(알면)을 넣으면 정확하게 볼 수 있어.";
  return out;
}

const TRAVEL_Q = /여행|코스|놀러|드라이브|당일치기|\d박\s?\d일|가고\s?싶|가볼|데이트\s?(장소|코스)|어디\s?가/;
const ORIGIN_SAID = /출발|에서\s?(가|떠나|출발)|서울|경기|인천|수원|성남|부산|대구|광주|대전|울산|세종|청주|전주|창원/;

/** 여행 답에는 코드가 확인 문구와 출발지 가정을 빠뜨리지 않게 붙여요(AI 가 놓쳐도 지켜져요). */
export function addTravelNotes(answer: string, question: string, history: ChatMsg[]): string {
  if (!TRAVEL_Q.test(question) || regionsIn(question).length === 0) return answer;
  let out = answer.trimEnd();
  const userSaid = [question, ...history.filter((m) => m.role === "user").map((m) => m.text)].join(" ");
  const hasTime = /자차|KTX|ktx|기차|버스|지하철|비행기|운전|걸려|걸리/.test(out);
  const notes: string[] = [];
  if (hasTime && !/수도권|출발지|[가-힣]{2,4}\s?기준/.test(out) && !ORIGIN_SAID.test(userSaid)) notes.push("이동 시간은 수도권에서 출발한다고 보고 말한 거야.");
  if (!/확인해/.test(out)) notes.push("영업시간·요금·날씨·예약은 출발 전에 확인해 봐.");
  if (notes.length) out += `\n\n${notes.join(" ")}`;
  return out;
}

export async function chatDori(
  i: ChatFactsInput,
  history: ChatMsg[],
  opts: { apiKey?: string; model?: string; now?: Date; fetchImpl?: typeof fetch; onUsage?: (u: { input: number; output: number }) => void } = {},
): Promise<ChatReply> {
  const baseUser = buildChatPrompt(i, history, opts.now);
  const ask = (user: string) =>
    callJson<ChatReply>({
      system: CHAT_SYSTEM_PROMPT,
      user,
      schema: CHAT_SCHEMA,
      maxTokens: 6000,
      model: opts.model ?? modelFor("chat"),
      apiKey: opts.apiKey,
      fetchImpl: opts.fetchImpl,
      timeoutMs: 55_000,
      onUsage: opts.onUsage,
      parse: parseChatReply,
    });
  let r = await ask(baseUser);
  const q = [...history].reverse().find((m) => m.role === "user")?.text ?? "";
  // 분량 보강: 모델이 길이 지침을 무시하고 짧게 쓴 평범한 답은 한 번만 더 길게 써 달라고 해요 (되묻기·위로·거절·위기 표시는 짧아도 돼요).
  const firstAskNow = !history.some((m) => m.role === "dori" && m.text.length > 60);
  const minLen = firstAskNow ? 300 : 200;
  if (!r.unable && !r.risk && r.choices.length === 0 && !r.answer.trimStart().startsWith("🤍") && q.trim().length >= 8 && r.answer.length < minLen) {
    try {
      const more = await ask(
        `${baseUser}\n\n[분량 보강 요청] 방금 네가 쓴 답이 너무 짧아(${r.answer.length}자). 위 규칙의 분량(${firstAskNow ? "880~1800자, 6~9문단" : "600~1200자, 4~6문단"})에 맞게 처음부터 다시 써. 같은 말을 되풀이하지 말고, 사주 근거를 한 가지 더 풀어 쓰고 이 사람의 상황·왜 그런 마음이 드는지·조심할 점을 구체적으로 넣어. 결론은 첫 문단에 그대로 두고 마지막은 작은 행동 한 가지로 끝내. 방금 답(참고용): ${r.answer}`,
      );
      if (!more.unable && !more.risk && more.answer.length > r.answer.length) r = more;
    } catch {
      /* 보강이 실패하면 처음 답을 그대로 써요 */
    }
  }
  // 메뉴·취미 추천은 답에 나온 후보로 코드가 그림 카드를 만들어요. 그 밖에는 질문이 허락한 카드만 붙여요.
  const rec = recommendFacts(q, history, i.chart, i.daily, opts.now ?? new Date());
  const recVisual = rec ? recommendVisual(rec, r.answer) : null;
  const visual0 = recVisual ?? (r.visual && visualAllowed(r.visual.kind, q) ? r.visual : null);
  const visual = visual0?.kind === "lucky" ? narrowLucky(visual0, q) : visual0;
  // 일·성공 이야기 중에는 지출·차 마시기·연말 같은 주제 밖 칩을 거르고 어긋난 칩만 남겨요.
  let answerText = r.answer;
  let choices = r.choices;
  if (/어느\s?정도\s?(준비|공부)/.test(answerText) && /[?？]\s*$/.test(answerText.trim()) && choices.length === 0 && answerText.length < 200) choices = ["열심히 했어", "솔직히 설렁했어"];
  if (/앞두/.test(answerText)) answerText = answerText.replace(/(준비|공부)(를)?\s?하고\s?갔어\?/g, "$1했어?");
  const careerCtx = CAREER_Q.test(`${q} ${history.slice(-2).map((m) => m.text).join(" ")}`);
  const followups0 = careerCtx && !MONEY_WORDS.test(q) ? r.followups.filter((c) => !CAREER_OFFTOPIC_CHIP.test(c)) : r.followups;
  const followups = varyFollowups(followups0, history, q);
  return { ...r, followups: choices.length ? [] : followups, choices, visual, answer: addCompatNote(addTravelNotes(polishChatAnswer(stripUnknownSongs(answerText), history, i.name), q, history), q, i.kind) };
}
