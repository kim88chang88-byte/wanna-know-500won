import { isAdmin } from "@/lib/admin/auth";
import { readCookie, SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { DEFAULT_USD_KRW, estimateCostUsd, generateImage, isElement5, spousePrompt, spousePromptV2, AI_IMAGE_NOTICE, type PartnerAge } from "@/lib/ai/image";
import { createRateLimiter } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 60;

const limiter = createRateLimiter(12, 60_000);
const AGES: PartnerAge[] = ["mid 20s", "late 20s", "mid 30s"];
const AGE_LABEL: Record<PartnerAge, string> = { "mid 20s": "20대 중반", "late 20s": "20대 후반", "mid 30s": "30대 중반" };
const NOTICE = AI_IMAGE_NOTICE.replace(/[&<>"']/g, "");

function session(request: Request) {
  const s = verifySessionToken(readCookie(request.headers.get("cookie"), SESSION_COOKIE), process.env.AUTH_SECRET);
  return s && isAdmin(s.sub, process.env) ? s : null;
}

const PAGE = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>운명의 상대 갤러리</title>
<style>body{font-family:system-ui,sans-serif;max-width:900px;margin:20px auto;padding:0 14px;color:#222}
.bar{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}button,select{font-size:14px;padding:6px 10px;border-radius:8px;border:1px solid #bbb;background:#fff}
button.go{background:#4338ca;color:#fff;border-color:#4338ca}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:12px}
.card{border:1px solid #ddd;border-radius:12px;padding:8px;text-align:center}.card img{width:100%;border-radius:8px}.ph{aspect-ratio:3/4;display:flex;align-items:center;justify-content:center;background:#f3f3f3;border-radius:8px;color:#888;font-size:13px}
small{color:#666}</style></head><body>
<h2>운명의 상대 이미지 갤러리 (관리자)</h2>
<p><small>누른 칸만 이미지를 만들어요 (1장당 약 100원 안팎). 이용자 성별·나이대·오행을 고르면 복장 6가지가 나와요.</small></p>
<div class="bar">
<select id="user"><option value="male">이용자 남성 → 상대 여성</option><option value="female">이용자 여성 → 상대 남성</option></select>
<select id="age">${AGES.map((a) => `<option value="${a}">${AGE_LABEL[a]}</option>`).join("")}</select>
<select id="el"><option value="wood">나무</option><option value="fire">불</option><option value="earth">땅</option><option value="metal">쇠</option><option value="water">물</option></select>
<button class="go" id="all">새 안 6장 모두 만들기</button><span id="sum"></span></div>
<div class="grid" id="grid"></div>
<p style="text-align:center;font-size:13px;color:#444">${NOTICE}</p>
<script>
const $=i=>document.getElementById(i);let total=0,sum=$('sum');
const cache={};
function key(v,s){return [$('user').value,$('age').value,$('el').value,v,s].join('|')}
function render(){const g=$('grid');g.innerHTML='';for(let v=0;v<6;v++){const c=document.createElement('div');c.className='card';c.innerHTML='<b>복장 '+(v+1)+'</b><div style="display:flex;gap:6px;margin-top:6px"></div>';const row=c.lastChild;
 for(const [s,t] of [['old','현재'],['new','새 안']]){const h=document.createElement('div');h.style.flex='1';h.dataset.s=s;h.innerHTML='<div class="ph">'+t+'</div><button style="margin-top:6px">'+t+' 만들기</button>';h.querySelector('button').onclick=()=>gen(v,s,h);row.appendChild(h);if(cache[key(v,s)])show(h,cache[key(v,s)])}
 g.appendChild(c)}}
function show(h,src){const p=h.querySelector('.ph');if(p)p.outerHTML='<img src="'+src+'">';else h.querySelector('img').src=src;h.querySelector('button').textContent='다시 만들기'}
async function gen(v,s,h){const b=h.querySelector('button');b.disabled=true;b.textContent='만드는 중…';
 try{const q=new URLSearchParams({gen:'1',s,user:$('user').value,age:$('age').value,el:$('el').value,v:String(v)});
 const r=await fetch('?'+q);const j=await r.json();if(!j.ok){b.textContent='실패: '+j.error;b.disabled=false;return}
 const src='data:'+j.mime+';base64,'+j.base64;cache[key(v,s)]=src;total+=j.krw;sum.textContent=' 이번 방문 누적 약 '+total.toLocaleString()+'원';show(h,src)}catch(e){b.textContent='오류'}b.disabled=false}
['user','age','el'].forEach(i=>$(i).onchange=render);
$('all').onclick=async()=>{const cs=[...document.querySelectorAll('.card')];for(let v=0;v<6;v++){if(!cache[key(v,'new')])await gen(v,'new',cs[v].querySelector('[data-s=new]'))}};
render();
</script></body></html>`;

export async function GET(request: Request) {
  const s = session(request);
  if (!s) return new Response("관리자 로그인이 필요해요.", { status: 403, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  const sp = new URL(request.url).searchParams;
  if (sp.get("gen") !== "1") return new Response(PAGE, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });

  const json = (o: object, status = 200) => Response.json(o, { status, headers: { "Cache-Control": "no-store" } });
  const rl = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "admin";
  if (!limiter.check(rl).ok) return json({ ok: false, error: "요청이 너무 빨라요" }, 429);
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return json({ ok: false, error: "GEMINI_API_KEY 없음" }, 503);

  const partner = sp.get("user") === "female" ? "male" : "female";
  const age = AGES.find((a) => a === sp.get("age")) ?? "mid 20s";
  const elRaw = sp.get("el");
  const el = isElement5(elRaw) ? elRaw : "water";
  const v = Math.min(5, Math.max(0, Math.floor(Number(sp.get("v")) || 0)));
  const r = await generateImage((sp.get("s") === "new" ? spousePromptV2 : spousePrompt)(partner, el, age, v), apiKey, { model: process.env.GEMINI_IMAGE_MODEL?.trim() || undefined });
  if (!r.ok) return json({ ok: false, error: r.error.slice(0, 80) }, 502);
  const krw = Math.round(estimateCostUsd(r.usage) * (Number(process.env.USD_KRW) || DEFAULT_USD_KRW));
  return json({ ok: true, mime: r.mime, base64: r.base64, krw });
}
