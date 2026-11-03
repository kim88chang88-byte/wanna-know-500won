import { isAdmin } from "@/lib/admin/auth";
import { readCookie, SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { DEFAULT_USD_KRW, estimateCostUsd, generateImage, isElement5, spousePrompt, AI_IMAGE_NOTICE, type PartnerAge } from "@/lib/ai/image";
import { MAX_STORED_BYTES, PARTNER_AGES, PARTNER_VARIANTS, allPartnerKeys, isPartnerKey, partnerImageExists, partnerPublicUrl, savePartnerImage } from "@/lib/ai/partnerStore";
import { loadDbConfig } from "@/lib/db/supabase";
import { createRateLimiter } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 60;

const limiter = createRateLimiter(12, 60_000);
const AGE_LABEL: Record<PartnerAge, string> = { "mid 20s": "20대 중반", "late 20s": "20대 후반", "mid 30s": "30대 중반" };
const NOTICE = AI_IMAGE_NOTICE.replace(/[&<>"']/g, "");

function session(request: Request) {
  const s = verifySessionToken(readCookie(request.headers.get("cookie"), SESSION_COOKIE), process.env.AUTH_SECRET);
  return s && isAdmin(s.sub, process.env) ? s : null;
}

/**
 * 관리자 갤러리: 상대 성별·연령대·오행별 복장 6장을 만들어 보고, 마음에 드는 것을 서버(Supabase Storage)에 저장해요.
 * 저장된 이미지는 프리미엄 결과서가 Gemini 를 부르지 않고 그대로 가져다 써요. (조합 180가지 × 1장)
 */
function pageHtml(base: string | null): string {
  const ages = PARTNER_AGES.map((a) => `<option value="${a}">${AGE_LABEL[a]}</option>`).join("");
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>운명의 상대 갤러리</title>
<style>body{font-family:system-ui,sans-serif;max-width:900px;margin:20px auto;padding:0 14px;color:#222}
.bar{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0;align-items:center}button,select{font-size:14px;padding:6px 10px;border-radius:8px;border:1px solid #bbb;background:#fff}
button.go{background:#4338ca;color:#fff;border-color:#4338ca}button.ok{background:#059669;color:#fff;border-color:#059669}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}
.card{border:1px solid #ddd;border-radius:12px;padding:8px;text-align:center}.card img{width:100%;border-radius:8px}.ph{aspect-ratio:3/4;display:flex;align-items:center;justify-content:center;background:#f3f3f3;border-radius:8px;color:#888;font-size:13px}
.tag{font-size:12px;color:#059669;font-weight:700}small{color:#666}#log{font-size:12px;color:#444;white-space:pre-wrap}</style></head><body>
<h2>운명의 상대 이미지 갤러리 (관리자)</h2>
<p><small>조합마다 변형 3장씩 서버에 저장해요(총 540장). 같은 조건이어도 사람(생년월일시)마다 다른 변형이 나와요. 저장된 이미지는 결과서에서 AI 호출 없이 그대로 쓰여요. 이미지 1장 생성은 약 100원이에요.</small></p>
${base ? "" : '<p style="color:#b91c1c">SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 없어서 저장은 못 해요.</p>'}
<div class="bar">
<select id="user"><option value="male">이용자 남성 → 상대 여성</option><option value="female">이용자 여성 → 상대 남성</option></select>
<select id="age">${ages}</select>
<select id="var"><option value="0">변형 1 (기본)</option><option value="1">변형 2</option><option value="2">변형 3</option></select>
<select id="el"><option value="wood">나무</option><option value="fire">불</option><option value="earth">땅</option><option value="metal">쇠</option><option value="water">물</option></select>
<button class="go" id="fill">이 조합 비어 있는 칸 만들어 저장</button></div>
<div class="bar"><button id="status">저장 현황 (540장 중)</button><button class="go" id="fillAll">전체 비어 있는 칸 자동 생성·저장 (540장)</button><button id="stop">멈추기</button><span id="sum"></span></div>
<div id="log"></div>
<div class="grid" id="grid"></div>
<p style="text-align:center;font-size:13px;color:#444">${NOTICE}</p>
<script>
const BASE=${JSON.stringify(base)};const $=i=>document.getElementById(i);let total=0,stopFlag=false;
const AGES=${JSON.stringify(PARTNER_AGES)},ELS=['wood','fire','earth','metal','water'];
const partnerOf=u=>u==='female'?'male':'female';
const keyOf=(u,a,e,v,x)=>{x=x==null?Number($('var').value):x;return partnerOf(u)+'/'+a.replace(' ','-')+'/'+e+'/'+v+(x?'-'+x:'')+'.webp'};
const urlOf=k=>BASE?BASE+'/storage/v1/object/public/partner-images/'+k+'?t='+Date.now():null;
const cache={};
const cur=(v,x)=>({u:$('user').value,a:$('age').value,e:$('el').value,v,x:x==null?Number($('var').value):x});
function render(){const g=$('grid');g.innerHTML='';for(let v=0;v<6;v++){const c=document.createElement('div');c.className='card';c.dataset.v=v;
 c.innerHTML='<b>복장 '+(v+1)+'</b> <span class="tag"></span><div class="box" style="margin-top:6px"><div class="ph">확인 중…</div></div><div style="margin-top:6px"><button class="mk">만들기</button> <button class="sv ok" style="display:none">서버에 저장</button></div>';
 g.appendChild(c);const s=cur(v),k=keyOf(s.u,s.a,s.e,v);
 c.querySelector('.mk').onclick=()=>gen(v,c);c.querySelector('.sv').onclick=()=>save(v,c);
 if(cache[k]){setImg(c,cache[k].src);if(cache[k].saved)mark(c,true);else c.querySelector('.sv').style.display=''}
 else if(BASE){const u=urlOf(k);const im=new Image();im.onload=()=>{cache[k]={src:u,saved:true};setImg(c,u);mark(c,true)};im.onerror=()=>{c.querySelector('.box').innerHTML='<div class="ph">비어 있음</div>'};im.src=u}
 else c.querySelector('.box').innerHTML='<div class="ph">비어 있음</div>'}}
function setImg(c,src){c.querySelector('.box').innerHTML='<img src="'+src+'">'}
function mark(c,saved){c.querySelector('.tag').textContent=saved?'✔ 저장됨':'';c.querySelector('.sv').style.display=saved?'none':'';c.querySelector('.mk').textContent=saved?'다시 만들기':'만들기'}
async function gen(v,c){const s=cur(v),k=keyOf(s.u,s.a,s.e,v),b=c.querySelector('.mk');b.disabled=true;b.textContent='만드는 중…';
 try{const q=new URLSearchParams({gen:'1',user:s.u,age:s.a,el:s.e,v:String(v),var:String(s.x)});const r=await fetch('?'+q);const j=await r.json();
  if(!j.ok){b.textContent='실패: '+j.error;b.disabled=false;return false}
  const src='data:'+j.mime+';base64,'+j.base64;cache[k]={src,saved:false};total+=j.krw;$('sum').textContent=' 이번 방문 누적 약 '+total.toLocaleString()+'원';
  setImg(c,src);c.querySelector('.tag').textContent='(아직 저장 안 됨)';c.querySelector('.sv').style.display='';b.textContent='다시 만들기';b.disabled=false;return true}
 catch(e){b.textContent='오류';b.disabled=false;return false}}
// 그림을 가로 768px 이하의 webp 로 줄여서 올려요(장당 약 60~100KB)
async function toWebp(src){const im=new Image();im.src=src;await im.decode();const w=Math.min(768,im.naturalWidth),h=Math.round(im.naturalHeight*w/im.naturalWidth);
 const cv=document.createElement('canvas');cv.width=w;cv.height=h;cv.getContext('2d').drawImage(im,0,0,w,h);
 return await new Promise(r=>cv.toBlob(r,'image/webp',0.85))}
async function save(v,c){const s=cur(v),k=keyOf(s.u,s.a,s.e,v),e=cache[k];if(!e||e.saved)return false;const b=c.querySelector('.sv');b.disabled=true;b.textContent='저장 중…';
 try{const blob=await toWebp(e.src);const r=await fetch('?save='+encodeURIComponent(k),{method:'POST',headers:{'Content-Type':'image/webp'},body:blob});const j=await r.json();
  if(!j.ok){b.textContent='저장 실패: '+(j.error||r.status);b.disabled=false;return false}
  cache[k]={src:e.src,saved:true};mark(c,true);b.disabled=false;b.textContent='서버에 저장';return true}
 catch(err){b.textContent='저장 오류';b.disabled=false;return false}}
async function fillRange(items){stopFlag=false;let done=0;for(const it of items){if(stopFlag){$('log').textContent+='\\n멈췄어요.';return}
  const k=keyOf(it.u,it.a,it.e,it.v,it.x);$('log').textContent='진행: '+(++done)+'/'+items.length+' · '+k;
  if(it.u===$('user').value&&it.a===$('age').value&&it.e===$('el').value&&it.x===Number($('var').value)){const c=document.querySelector('.card[data-v="'+it.v+'"]');if(await gen(it.v,c))await save(it.v,c)}
  else{ // 화면에 없는 조합은 화면 없이 처리
   try{const q=new URLSearchParams({gen:'1',user:it.u,age:it.a,el:it.e,v:String(it.v),var:String(it.x)});const r=await fetch('?'+q);const j=await r.json();if(!j.ok){$('log').textContent+='\\n실패 '+k+': '+j.error;continue}
    total+=j.krw;$('sum').textContent=' 이번 방문 누적 약 '+total.toLocaleString()+'원';const blob=await toWebp('data:'+j.mime+';base64,'+j.base64);
    const r2=await fetch('?save='+encodeURIComponent(k),{method:'POST',headers:{'Content-Type':'image/webp'},body:blob});const j2=await r2.json();if(!j2.ok)$('log').textContent+='\\n저장 실패 '+k}catch(e){$('log').textContent+='\\n오류 '+k}}}
  $('log').textContent+='\\n끝났어요.';render()}
async function missingKeys(){const r=await fetch('?status=1');return await r.json()}
$('status').onclick=async()=>{$('log').textContent='확인 중…';const j=await missingKeys();$('log').textContent='저장됨 '+j.saved.length+' / 540장 (비어 있음 '+j.missing.length+'장)'};
$('fill').onclick=async()=>{const items=[];for(let v=0;v<6;v++){const s=cur(v),k=keyOf(s.u,s.a,s.e,v);if(!(cache[k]&&cache[k].saved))items.push(s)}await fillRange(items)};
$('fillAll').onclick=async()=>{if(!confirm('비어 있는 칸을 모두 만들어 저장할까요? 장당 약 100원이 들어요.'))return;const j=await missingKeys();const items=j.missing.map(k=>{const p=k.split('/');const f=p[3].split('.')[0].split('-');return {u:p[0]==='female'?'male':'female',a:p[1].replace('-',' '),e:p[2],v:Number(f[0]),x:Number(f[1]||0)}});await fillRange(items)};
$('stop').onclick=()=>{stopFlag=true};
['user','age','el','var'].forEach(i=>$(i).onchange=render);render();
</script></body></html>`;
}

export async function GET(request: Request) {
  const s = session(request);
  if (!s) return new Response("관리자 로그인이 필요해요.", { status: 403, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  const sp = new URL(request.url).searchParams;
  const json = (o: object, status = 200) => Response.json(o, { status, headers: { "Cache-Control": "no-store" } });
  const cfg = loadDbConfig(process.env);

  if (sp.get("status") === "1") {
    if (!cfg) return json({ saved: [], missing: allPartnerKeys() });
    const keys = allPartnerKeys();
    const has = await Promise.all(keys.map((k) => partnerImageExists(cfg.url, k)));
    return json({ saved: keys.filter((_, i) => has[i]), missing: keys.filter((_, i) => !has[i]) });
  }
  if (sp.get("gen") !== "1") return new Response(pageHtml(cfg ? cfg.url.replace(/\/+$/, "") : null), { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });

  const rl = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "admin";
  if (!limiter.check(rl).ok) return json({ ok: false, error: "요청이 너무 빨라요" }, 429);
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return json({ ok: false, error: "GEMINI_API_KEY 없음" }, 503);

  const partner = sp.get("user") === "female" ? "male" : "female";
  const age = PARTNER_AGES.find((a) => a === sp.get("age")) ?? "mid 20s";
  const elRaw = sp.get("el");
  const el = isElement5(elRaw) ? elRaw : "water";
  const v = Math.min(5, Math.max(0, Math.floor(Number(sp.get("v")) || 0)));
  const variant = Math.min(PARTNER_VARIANTS - 1, Math.max(0, Math.floor(Number(sp.get("var")) || 0)));
  const r = await generateImage(spousePrompt(partner, el, age, v, variant), apiKey, { model: process.env.GEMINI_IMAGE_MODEL?.trim() || undefined });
  if (!r.ok) return json({ ok: false, error: r.error.slice(0, 80) }, 502);
  const krw = Math.round(estimateCostUsd(r.usage) * (Number(process.env.USD_KRW) || DEFAULT_USD_KRW));
  return json({ ok: true, mime: r.mime, base64: r.base64, krw });
}

/** 올라온 webp 한 장을 서버에 저장해요. (?save=키) */
export async function POST(request: Request) {
  if (!session(request)) return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  const key = new URL(request.url).searchParams.get("save") ?? "";
  if (!isPartnerKey(key)) return Response.json({ ok: false, error: "잘못된 이름" }, { status: 400 });
  const cfg = loadDbConfig(process.env);
  if (!cfg) return Response.json({ ok: false, error: "Supabase 설정이 없어요" }, { status: 503 });
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.length === 0 || bytes.length > MAX_STORED_BYTES) return Response.json({ ok: false, error: "이미지 크기가 맞지 않아요" }, { status: 400 });
  // webp 파일 머리(RIFF....WEBP)인지 확인해요.
  const head = String.fromCharCode(...bytes.slice(0, 4)) + String.fromCharCode(...bytes.slice(8, 12));
  if (head !== "RIFFWEBP") return Response.json({ ok: false, error: "webp 가 아니에요" }, { status: 400 });
  const r = await savePartnerImage(cfg, key, bytes);
  return Response.json({ ok: r.ok, error: r.ok ? undefined : `저장 실패(${r.status})`, url: r.ok ? partnerPublicUrl(cfg.url, key) : undefined }, { status: r.ok ? 200 : 502 });
}
