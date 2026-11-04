"use strict";
/* ================= 기본 설정·데이터 ================= */
const CFG = Object.assign({SYNC_URL:"", LEARNER_ID:"learner", APP_NAME:"금융시장 분석가 공부방"}, window.ACADEMY_CONFIG || {});
const D = window.ACADEMY_DATA;
const VIEW_MODE = /(^|#|&)view\b/.test(location.hash);
const DOMAINS = {R:"독해력",V:"어휘·시사 상식",E:"경제·금융 이해력",N:"뉴스 분석력",C:"기업분석·투자 아이디어",M:"주식·비트코인 시장 분석력",W:"논리적 글쓰기·시황 작성"};
const DOM_ORDER = ["R","V","E","N","C","M","W"];
const LEVEL_NAMES = ["기초 진단 단계","문장 이해 단계","정보 이해 단계","관계 연결 단계","기초 분석 단계","독립적 분석 단계","종합 분석 단계"];
const LEVEL_CAN = {
  R:["짧은 문장을 읽고 뜻을 확인하는 단계예요","짧은 문장의 뜻을 정확히 읽고 핵심 낱말을 찾을 수 있어요","짧은 기사에서 중심 내용과 원인을 구분할 수 있어요","여러 문단의 원인과 결과를 이어서 이해할 수 있어요","글의 근거와 빠진 부분, 숨은 전제를 찾을 수 있어요","긴 분석글을 비교하며 근거가 탄탄한 주장을 가려낼 수 있어요","복잡한 분석글의 단서와 한계까지 판단할 수 있어요"],
  V:["경제 낱말을 얼마나 아는지 확인하는 단계예요","뉴스에 자주 나오는 기초 낱말의 뜻을 알아요","기사 속 낱말을 문맥에 맞게 해석할 수 있어요","시사 배경(기관·무역·제도)을 개념과 연결할 수 있어요","낯선 용어도 앞뒤 문맥으로 뜻을 추론할 수 있어요","역사·국제정세 배경을 시장 해석에 쓸 수 있어요","전문 용어와 배경지식을 정확하고 자연스럽게 활용할 수 있어요"],
  E:["경제 개념을 얼마나 아는지 확인하는 단계예요","금리·물가·환율 같은 기초 개념을 설명할 수 있어요","개념 하나의 변화가 무엇을 바꾸는지 말할 수 있어요","금리·환율·물가·실적이 어떻게 연결되는지 설명할 수 있어요","여러 거시 변수의 영향을 따져 장단점을 판단할 수 있어요","여러 지표를 비교해 경제 흐름을 독립적으로 해석할 수 있어요","거시·정책·시장 기대를 종합하고 반론까지 검토할 수 있어요"],
  N:["뉴스를 얼마나 읽어 내는지 확인하는 단계예요","짧은 뉴스에서 무슨 일이 있었는지 말할 수 있어요","뉴스의 사실과 의견, 원인을 구분할 수 있어요","뉴스가 누구에게 어떤 영향을 주는지 연결할 수 있어요","중요한 뉴스와 자극적인 뉴스, 이미 알려진 것과 새 변화를 구별할 수 있어요","여러 뉴스를 연결해 시장 영향을 근거 있게 판단할 수 있어요","뉴스의 기대 대비 의미와 반론까지 종합해 해석할 수 있어요"],
  C:["기업을 얼마나 이해하는지 확인하는 단계예요","회사가 무엇을 팔아 돈을 버는지 말할 수 있어요","매출·이익 같은 실적 숫자를 읽고 비교할 수 있어요","실적 숫자와 사업 구조, 바깥 요인을 연결할 수 있어요","재무제표와 주석에서 장점과 위험 신호를 찾을 수 있어요","근거를 갖춘 기업분석 글과 투자 아이디어를 쓸 수 있어요","시장 기대와 실제 성과의 차이를 찾고 반론까지 검토할 수 있어요"],
  M:["시장을 얼마나 이해하는지 확인하는 단계예요","지수·주가·비트코인 가격표를 읽을 수 있어요","시장 움직임과 수급·금리·환율 자료를 구분해 읽을 수 있어요","미국·한국·비트코인 시장의 연결을 설명할 수 있어요","가능한 설명과 자료로 확인된 원인을 구별할 수 있어요","여러 자료로 시장 상황을 독립적으로 판단할 수 있어요","거시·수급·파생·심리를 종합하고 반론까지 검토할 수 있어요"],
  W:["글로 설명하는 힘을 확인하는 단계예요","정확한 한 문장으로 개념을 설명할 수 있어요","사실과 의견을 나눠 짧은 글을 쓸 수 있어요","원인과 결과가 이어지는 문단을 쓸 수 있어요","근거를 갖춘 분석 문단을 쓸 수 있어요","자료를 연결한 시황과 기업 코멘트를 독립적으로 쓸 수 있어요","반론과 한계를 포함한 전문 분석글을 쓸 수 있어요"]
};
const PERIODS = [
  {k:"p1",n:1,name:"독해력과 어휘력",dom:"R",mins:[["어휘 복습·오늘의 낱말",10],["지문 읽기",15],["이해 문제",12],["자기 말로 요약",10],["마무리",3]]},
  {k:"p2",n:2,name:"경제·금융·시사 상식",dom:"E",mins:[["복습 카드",10],["새 개념 배우기",20],["확인·응용 문제",12],["자기 말로 설명",8]]},
  {k:"p3",n:3,name:"뉴스 독해와 분석",dom:"N",mins:[["기사 읽기와 출처 확인",8],["단계별 질문",25],["판단 문제",7],["뉴스 기록 카드",10]]},
  {k:"p4",n:4,name:"기업분석과 투자 아이디어",dom:"C",mins:[["사례·발췌 읽기",12],["분석 문제",18],["내 기업에 적용",20]]},
  {k:"p5",n:5,name:"주식·비트코인 시장 분석",dom:"M",mins:[["시장 자료 읽기",10],["분석 문제",15],["사실·가능한 설명·확인된 원인",12],["나의 시장 메모",13]]},
  {k:"p6",n:6,name:"시황과 분석 글쓰기",dom:"W",mins:[["오늘 배운 것 다시 보기",5],["글쓰기",25],["스스로 점검",5],["모범 글 비교와 고쳐 쓰기",15]]}
];
const WRITE_TYPES = {concept:"경제 개념 설명글",news:"뉴스 분석글",company:"기업분석글",stock:"주식시장 시황",crypto:"비트코인 시장 시황",macro:"종합 시장 분석글"};
const SELF_CHECK6 = ["내가 말하려는 핵심 주장이 명확한가?","사실과 의견을 구별했는가?","주장에 근거가 있는가?","다른 정보를 무리하게 연결하지 않았는가?","같은 내용을 불필요하게 반복하지 않았는가?","처음 읽는 사람도 이해할 수 있는가?"];
const CRITERIA8 = ["표현의 정확성","정보의 이해 정도","원인과 결과의 연결","근거의 적절성","개념의 활용","불필요한 반복이 없음","사실과 해석의 구별","논리적 일관성"];
const CONCEPT_BY_ID = {}; (D.conceptList || []).forEach(r => { CONCEPT_BY_ID[r[0]] = {id:r[0], name:r[1], day:r[2], dom:r[3]}; });
const CUR_DAYS = {}; (D.curriculum.days || []).forEach(x => { CUR_DAYS[x.day] = x; });
const CHECKPOINTS = D.curriculum.checkpointDays || [7,14,30,60,90];

/* ================= 유틸 ================= */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function today(){ const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function isoOf(t){ const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function addDays(iso, n){ const d = new Date(iso + "T00:00:00"); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function diffDays(a, b){ return Math.round((new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 864e5); }
const fmtDate = iso => { if(!iso) return ""; const [y, m, d] = iso.split("-"); return `${+m}월 ${+d}일`; };
const hhmm = t => { const d = new Date(t); return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; };
const mins = s => Math.round((s || 0) / 60);
const fmtDur = s => { const m = Math.floor((s || 0) / 60); return m >= 60 ? `${Math.floor(m / 60)}시간 ${m % 60}분` : `${m}분`; };
const pct = (a, b) => b ? Math.round(a / b * 100) : null;
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
function shuffle(a, seed){ const r = a.slice(); let s = seed || 1; for(let i = r.length - 1; i > 0; i--){ s = (s * 9301 + 49297) % 233280; const j = Math.floor(s / 233280 * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; }
function sentences(t){ return String(t || "").split(/(?<=[.!?。])\s+|\n+/).map(x => x.trim()).filter(Boolean); }
function countSent(t){ return sentences(t).length; }
function hasBatchim(s){ for(let i = s.length - 1; i >= 0; i--){ const c = s.charCodeAt(i); if(c >= 0xAC00 && c <= 0xD7A3) return (c - 0xAC00) % 28 !== 0; } return true; }

/* ================= 저장소(IndexedDB → localStorage → 메모리) ================= */
const Store = {mode:"memory", db:null, mem:{}};
function idbOpen(){ return new Promise((res, rej) => { try{ const r = indexedDB.open("fa-academy", 1); r.onupgradeneeded = () => r.result.createObjectStore("kv"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }catch(e){ rej(e); } }); }
async function storeInit(){
  try{ Store.db = await idbOpen(); await storePut("_t", 1); Store.mode = "idb"; return; }catch(e){ Store.db = null; }
  try{ localStorage.setItem("fa-t", "1"); localStorage.removeItem("fa-t"); Store.mode = "local"; }catch(e){ Store.mode = "memory"; }
}
function storeGet(k){
  if(Store.mode === "idb") return new Promise(res => { try{ const tx = Store.db.transaction("kv", "readonly").objectStore("kv").get(k); tx.onsuccess = () => res(tx.result ?? null); tx.onerror = () => res(null); }catch(e){ res(null); } });
  if(Store.mode === "local"){ try{ const v = localStorage.getItem("fa-" + k); return Promise.resolve(v ? JSON.parse(v) : null); }catch(e){ return Promise.resolve(null); } }
  return Promise.resolve(Store.mem[k] ?? null);
}
function storePut(k, v){
  if(Store.mode === "idb") return new Promise((res, rej) => { try{ const tx = Store.db.transaction("kv", "readwrite"); tx.objectStore("kv").put(v, k); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); }catch(e){ rej(e); } });
  if(Store.mode === "local"){ try{ localStorage.setItem("fa-" + k, JSON.stringify(v)); return Promise.resolve(); }catch(e){ return Promise.reject(e); } }
  Store.mem[k] = v; return Promise.resolve();
}

/* ================= 상태 ================= */
function newState(){
  return {v:1, created:Date.now(), updated:0, profile:null, day:1, dayLog:{}, attempts:[], answers:{}, srs:{}, concepts:{}, assessments:[], levels:null,
    portfolio:[], news:[], marketLog:[], companies:{}, activeCompany:null, achievements:{}, comebacks:[], wrong:{}, seenAssess:{},
    settings:{tts:true, font:18}, lastBackup:0, pos:null, notes:[]};
}
let S = newState();
let saveT = null, syncT = null;
const SaveInfo = {last:0, err:null};
function touch(){ S.updated = Date.now(); Sync.dirty = true; clearTimeout(saveT); saveT = setTimeout(saveNow, 700); if(Sync.enabled && Sync.authed){ clearTimeout(syncT); syncT = setTimeout(() => syncPush(), 25000); } paintSave(); }
async function saveNow(){ clearTimeout(saveT); if(VIEW_MODE) return; try{ await storePut("state", S); SaveInfo.last = Date.now(); SaveInfo.err = null; }catch(e){ SaveInfo.err = String(e && e.name || e); } paintSave(); }

/* ================= 서버 동기화(관리자와 함께 보기) ================= */
const Sync = {enabled:!!CFG.SYNC_URL, authed:false, last:0, err:null, busy:false, remoteUpdated:0, dirty:false};
async function getPin(){ return await storeGet("pin"); }
async function syncPull(){
  if(!Sync.enabled) return null;
  try{
    const r = await fetch(`${CFG.SYNC_URL}?id=${encodeURIComponent(CFG.LEARNER_ID)}&t=${Date.now()}`, {method:"GET"});
    const j = await r.json();
    if(!j.ok) throw new Error(j.error || "read");
    Sync.err = null;
    if(j.data && j.data.state){ Sync.remoteUpdated = j.data.updated || 0; return j.data; }
    return {state:null};
  }catch(e){ Sync.err = "서버에 연결하지 못했어요"; return null; }
}
async function syncAuth(pin){
  if(!Sync.enabled) return {ok:false, error:"off"};
  try{
    const r = await fetch(CFG.SYNC_URL, {method:"POST", headers:{"Content-Type":"text/plain;charset=utf-8"}, body:JSON.stringify({id:CFG.LEARNER_ID, pin, action:"auth"})});
    return await r.json();
  }catch(e){ return {ok:false, error:"net"}; }
}
async function syncPush(force){
  if(!Sync.enabled || !Sync.authed || VIEW_MODE) return false;
  if(Sync.busy) return false;
  if(!force && !Sync.dirty) return true;
  const pin = await getPin(); if(!pin) return false;
  Sync.busy = true; paintSave();
  const remote = await syncPull();
  if(remote && remote.state && (remote.updated || 0) > (S.updated || 0)){
    S = Object.assign(newState(), remote.state); Sync.dirty = false; Sync.busy = false; await saveNow();
    toast("다른 기기에서 저장한 더 최근 기록을 불러왔어요"); if(typeof render === "function" && !UI.run) render(); paintSave();
    return false;
  }
  Sync.dirty = false;
  try{
    const r = await fetch(CFG.SYNC_URL, {method:"POST", headers:{"Content-Type":"text/plain;charset=utf-8"}, body:JSON.stringify({id:CFG.LEARNER_ID, pin, updated:S.updated, state:S})});
    const j = await r.json();
    if(!j.ok){ Sync.dirty = true; Sync.err = j.error === "pin" ? "비밀번호가 서버와 달라요" : "서버 저장 실패"; if(j.error === "pin") Sync.authed = false; }
    else { Sync.last = Date.now(); Sync.err = null; Sync.remoteUpdated = S.updated; }
  }catch(e){ Sync.dirty = true; Sync.err = "서버에 연결하지 못했어요"; }
  Sync.busy = false; paintSave();
  return !Sync.err;
}
function syncBeacon(){
  if(!Sync.enabled || !Sync.authed || VIEW_MODE || !navigator.sendBeacon || !Sync.dirty) return;
  const pin = Store._pinCache; if(!pin) return;
  try{ navigator.sendBeacon(CFG.SYNC_URL, new Blob([JSON.stringify({id:CFG.LEARNER_ID, pin, updated:S.updated, state:S})], {type:"text/plain;charset=utf-8"})); }catch(e){}
}
function saveStatus(){
  if(VIEW_MODE) return {cls:Sync.err ? "none" : "ok", txt:Sync.err ? Sync.err : (Sync.remoteUpdated ? `동생 기록 ${hhmm(Sync.remoteUpdated)} 기준` : "기록 불러오는 중")};
  if(Sync.enabled && Sync.authed && !Sync.err) return {cls:"ok", txt:Sync.busy ? "서버에 저장 중…" : (Sync.last ? `서버 저장 ${hhmm(Sync.last)}` : "서버 연결됨")};
  if(Sync.enabled && Sync.err) return {cls:"local", txt:Store.mode === "memory" ? "저장 안 됨 · 백업 필요" : "이 기기에만 저장됨 (서버 연결 안 됨)"};
  if(Store.mode === "memory") return {cls:"none", txt:"자동 저장 안 됨 · 백업 필요"};
  return {cls:"local", txt:SaveInfo.err ? "저장 실패 · 백업하세요" : "이 기기에 저장됨"};
}
function paintSave(){ const el = $("#savePill"); if(!el) return; const s = saveStatus(); el.className = "pill " + s.cls; el.innerHTML = `<span class="dot" aria-hidden="true"></span>${esc(s.txt)}`; }

/* ================= 문항·기록 ================= */
function dayContent(n){ return D.days[n] || null; }
function curDay(n){ return CUR_DAYS[n] || null; }
function phaseOf(n){ return n <= 30 ? 1 : n <= 60 ? 2 : 3; }
function dayLog(n){ return S.dayLog[n] || (S.dayLog[n] = {started:today(), periods:{}, done:false}); }
function periodLog(n, k){ const dl = dayLog(n); return dl.periods[k] || (dl.periods[k] = {st:"todo", active:0, open:0, idle:0, step:0}); }
function recordAttempt(key, dom, lv, ok, src){
  S.attempts.push({k:key, d:dom, l:lv || 1, o:ok ? 1 : 0, t:Date.now(), day:S.day, s:src || ""});
  const w = S.wrong[key];
  if(!ok) S.wrong[key] = {t:Date.now(), day:S.day, dom};
  else if(w){ S.comebacks.push({k:key, wrongAt:w.t, rightAt:Date.now(), dom}); delete S.wrong[key]; }
  touch();
}
function lastAttempt(key){ for(let i = S.attempts.length - 1; i >= 0; i--) if(S.attempts[i].k === key) return S.attempts[i]; return null; }
function itemByKey(key){
  let m;
  if((m = key.match(/^d(\d+)\.([vrnckm])(\d+)$/))){
    const dc = dayContent(+m[1]); if(!dc) return null; const i = +m[3];
    const map = {v:() => dc.vocab[i] && dc.vocab[i].q, r:() => dc.reading.qs[i], n:() => dc.news.qs[i], c:() => dc.company.qs[i], m:() => dc.market.qs[i], k:() => dc.market.classify[i] && {stem:dc.market.classify[i].s, explain:dc.market.classify[i].why}};
    const q = map[m[2]](); return q ? Object.assign({where:`${m[1]}일차 ${({v:"어휘",r:"독해",n:"뉴스",c:"기업",m:"시장",k:"시장 분류"})[m[2]]}`}, q) : null;
  }
  if((m = key.match(/^c\.([a-z_0-9]+)\.(\d+)$/))){ const c = D.concepts[m[1]]; const q = c && c.quiz[+m[2]]; return q ? Object.assign({where:`개념: ${c.name}`}, q) : null; }
  if((m = key.match(/^a\.(.+)$/))){ const it = ASSESS_BY_ID[m[1]]; return it ? Object.assign({where:`평가 문항 (${DOMAINS[it.d]} 레벨 ${it.lv})`}, it) : null; }
  if((m = key.match(/^d(\d+)\.key$/))){ const dc = dayContent(+m[1]); return dc ? {where:`${m[1]}일차 독해`, stem:"글에서 가장 중요한 문장 찾기", explain:dc.reading.key} : null; }
  if((m = key.match(/^x\.(.+)$/))) return {where:"보충·도전", stem:m[1]};
  return null;
}
const ASSESS_BY_ID = {}; Object.values(D.assess || {}).forEach(arr => (arr || []).forEach(it => { ASSESS_BY_ID[it.id] = it; }));

/* ================= 간격 반복 복습 ================= */
const INTERVALS = [1, 2, 4, 7, 15, 30];
function srsAdd(key){ if(!S.srs[key]) S.srs[key] = {box:0, due:addDays(today(), 1), n:0, last:"", item:-1}; }
function srsResult(key, ok){ const c = S.srs[key]; if(!c) return; c.box = ok ? Math.min(c.box + 1, INTERVALS.length - 1) : 0; c.due = addDays(today(), INTERVALS[c.box]); c.n++; c.last = today(); touch(); }
function srsDue(prefix, limit){
  const t = today();
  return Object.entries(S.srs).filter(([k, c]) => k.startsWith(prefix) && c.due <= t && c.last !== t).sort((a, b) => a[1].box - b[1].box || a[1].due.localeCompare(b[1].due)).slice(0, limit || 999).map(([k]) => k);
}
function srsItem(cardKey){
  let m;
  if((m = cardKey.match(/^cc\.(.+)$/))){
    const c = D.concepts[m[1]]; if(!c) return null;
    const card = S.srs[cardKey]; const n = c.quiz.length;
    let idx = (card.item + 1) % n; if(c.quiz[idx].t === "free") idx = (idx + 1) % n;
    card.item = idx;
    return {key:`c.${c.id}.${idx}`, q:c.quiz[idx], dom:(CONCEPT_BY_ID[c.id] || {}).dom || "E", label:`개념 복습: ${c.name}`, concept:c.id};
  }
  if((m = cardKey.match(/^vv\.(\d+)\.(\d+)$/))){
    const dc = dayContent(+m[1]); const v = dc && dc.vocab[+m[2]]; if(!v) return null;
    return {key:`d${m[1]}.v${m[2]}`, q:v.q, dom:"V", label:`낱말 복습: ${v.w}`, vocab:v};
  }
  return null;
}

/* ================= 개념 습득 판정 ================= */
function updateConceptMastery(id){
  const c = S.concepts[id] || (S.concepts[id] = {learned:null, mastered:false});
  if(c.mastered) return false;
  const con = D.concepts[id]; if(!con) return false;
  const atts = S.attempts.filter(a => a.k.startsWith(`c.${id}.`));
  const okA = atts.filter(a => a.o);
  const items = new Set(okA.map(a => a.k));
  const dates = new Set(okA.map(a => new Date(a.t).toDateString()));
  const transferOk = okA.some(a => { const i = +a.k.split(".").pop(); return con.quiz[i] && con.quiz[i].transfer; });
  const iso = t => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
  const later = c.learnedDate ? okA.filter(a => iso(a.t) > c.learnedDate) : [];
  if(items.size >= 2 && dates.size >= 2 && later.length >= 1 && (transferOk || later.length >= 2)){
    c.mastered = true; c.masteredAt = Date.now();
    c.firstWrong = atts.length ? !atts[0].o : false;
    c.evidence = okA.slice(-3).map(a => ({k:a.k, t:a.t}));
    touch(); return true;
  }
  return false;
}

/* ================= 레벨 평가 엔진 ================= */
function assessPool(dom, lv){ return (D.assess[dom] || []).filter(it => it.lv === lv); }
function newAssessment(cp){
  const prev = S.levels || {};
  const doms = {};
  DOM_ORDER.forEach(d => { const start = cp === 0 ? 1 : Math.max(1, Math.min(6, prev[d] ?? 1)); doms[d] = {start, L:start, res:{}, passed:[], failed:[], down:false, done:false, level:null, items:[], reused:0}; });
  return {id:uid(), cp, day:S.day, date:today(), started:Date.now(), doms, order:DOM_ORDER.slice(), di:0, cur:null, phase:"obj", writing:{}, rewrite:{}, rubric:{}, done:false};
}
function assessNext(A){
  while(A.di < A.order.length){
    const d = A.order[A.di], st = A.doms[d];
    if(st.done){ A.di++; continue; }
    const used = new Set(st.items.map(x => x.id));
    const pool = assessPool(d, st.L).filter(it => !used.has(it.id));
    let fresh = pool.filter(it => !S.seenAssess[it.id]);
    let reused = false;
    if(!fresh.length){ fresh = pool.sort((a, b) => (S.seenAssess[a.id] || 0) - (S.seenAssess[b.id] || 0)); reused = true; }
    if(!fresh.length){ assessFinishDom(st); continue; }
    const it = fresh[Math.floor(Math.random() * Math.min(fresh.length, 3))];
    A.cur = {d, id:it.id, reused};
    return it;
  }
  A.cur = null; return null;
}
function assessAnswer(A, ok){
  const {d, id, reused} = A.cur; const st = A.doms[d];
  st.items.push({id, lv:st.L, ok:ok ? 1 : 0, reused:reused ? 1 : 0});
  if(reused) st.reused++;
  S.seenAssess[id] = (S.seenAssess[id] || 0) + 1;
  recordAttempt("a." + id, d, st.L, ok, `평가${A.cp}`);
  const r = st.res[st.L] || (st.res[st.L] = []); r.push(ok ? 1 : 0);
  const good = r.filter(x => x).length, bad = r.length - good;
  if(good >= 2){ st.passed.push(st.L); if(st.L >= 6 || st.down) assessFinishDom(st); else st.L++; }
  else if(bad >= 2){
    st.failed.push(st.L);
    if(!st.passed.length && st.L === st.start && st.start > 1 && !st.down){ st.down = true; st.L = st.start - 1; }
    else assessFinishDom(st);
  }
  A.cur = null;
}
function assessFinishDom(st){
  st.done = true;
  if(st.passed.length) st.level = Math.max(...st.passed);
  else if(st.down) st.level = Math.max(0, st.L - 1);
  else st.level = Math.max(0, st.start - 1);
}
function overallLevel(lv){
  if(!lv) return null;
  for(let L = 6; L >= 1; L--){
    const atL = DOM_ORDER.filter(d => (lv[d] ?? 0) >= L).length;
    const minOk = DOM_ORDER.every(d => (lv[d] ?? 0) >= L - 1);
    if(atL >= 5 && minOk) return L;
  }
  return 0;
}
function finalizeAssessment(A){
  const levels = {}; DOM_ORDER.forEach(d => { levels[d] = A.doms[d].level ?? 0; });
  A.levels = levels; A.overall = overallLevel(levels); A.done = true; A.finished = Date.now();
  S.assessments.push(A); S.levels = levels;
  if(A.cp === 0) S.baselineId = A.id;
  touch();
}
function baseline(){ return S.assessments.find(a => a.id === S.baselineId) || S.assessments[0] || null; }
function latestAssessment(){ return S.assessments[S.assessments.length - 1] || null; }
function placementDay(ov){ return ov <= 1 ? 1 : ov === 2 ? 11 : ov === 3 ? 31 : 46; }

/* ================= 성장 계산 ================= */
function attemptsIn(fromISO, toISO, dom){ return S.attempts.filter(a => { const d = isoOf(a.t); return d >= fromISO && d <= toISO && (!dom || a.d === dom) && !a.k.startsWith("a."); }); }
function accuracy(arr){ return arr.length ? Math.round(arr.filter(a => a.o).length / arr.length * 100) : null; }
function domainStats(fromISO, toISO){ const o = {}; DOM_ORDER.forEach(d => { const a = attemptsIn(fromISO, toISO, d); o[d] = {n:a.length, ok:a.filter(x => x.o).length, acc:accuracy(a)}; }); return o; }
function canDoList(){
  const list = [];
  Object.entries(S.concepts).filter(([, c]) => c.mastered).sort((a, b) => b[1].masteredAt - a[1].masteredAt).forEach(([id, c]) => {
    const con = D.concepts[id]; if(!con) return;
    const cd = String(con.canDo || "").replace(/\.$/, "");
    const nm = con.name.replace(/\(.*?\)/g, "").trim();
    list.push({t:c.masteredAt, kind:"concept", id, text:c.firstWrong ? `처음 풀었을 때는 ‘${nm}’ 문제를 틀렸지만, 지금은 이렇게 할 수 있어요: ${cd}` : c.placed ? `‘${nm}’: 진단 뒤 복습 문제로 확인했어요. ${cd}` : `‘${nm}’${hasBatchim(nm) ? "을" : "를"} 새로 익혔어요: ${cd}`, evidence:c.evidence || [], verified:"문제 풀이로 확인(배운 날과 다른 날 다시 정답)"});
  });
  const b = baseline(), l = latestAssessment();
  if(b && l && l.id !== b.id) DOM_ORDER.forEach(d => { const a = b.levels[d] ?? 0, z = l.levels[d] ?? 0; if(z > a) list.push({t:l.finished, kind:"level", d, text:`${DOMAINS[d]}: 첫 진단 레벨 ${a} → 지금 레벨 ${z}. ${LEVEL_CAN[d][z]}.`, evidence:(l.doms[d].items || []).map(x => ({k:"a." + x.id, ok:x.ok})), verified:`${l.cp}일 평가의 새 문항으로 확인`}); });
  return list.sort((a, b) => b.t - a.t);
}
const ACHIEVE = [
  {id:"first_news", name:"첫 경제기사 핵심 내용 설명", how:"뉴스 교시의 사실·의미·원인 질문에 모두 답함", check:() => S.news.some(n => n.fields && n.fields.fact && n.fields.meaning && n.fields.why), verify:"자가 점검"},
  {id:"rev_profit", name:"매출과 이익의 차이 설명 성공", how:"‘매출’과 ‘영업이익’ 개념을 서로 다른 날 문제로 확인", check:() => S.concepts.revenue?.mastered && S.concepts.op_profit?.mastered, verify:"문제 풀이"},
  {id:"rate_fx", name:"금리와 환율의 기본 관계 이해", how:"‘기준금리’와 ‘환율’ 개념을 문제로 확인", check:() => S.concepts.base_rate?.mastered && S.concepts.exchange_rate?.mastered, verify:"문제 풀이"},
  {id:"fx_flow", name:"금리·환율·외국인 수급 연결 이해", how:"‘환율과 외국인 수급’ 개념까지 문제로 확인", check:() => S.concepts.fx_flow?.mastered && S.concepts.base_rate?.mastered, verify:"문제 풀이"},
  {id:"first_company", name:"첫 기업분석 글 완성", how:"기업분석 워크북에서 한 기업의 종합 평가(학습 9)까지 답함", check:() => Object.values(S.companies).some(c => c.answers && Object.keys(c.answers).filter(k => k.startsWith("L9")).length >= 2), verify:"과제 수행"},
  {id:"first_link", name:"첫 뉴스 연결 분석", how:"뉴스 기록 두 개를 이유와 함께 연결함", check:() => S.news.some(n => n.links && n.links.length), verify:"과제 수행"},
  {id:"first_market", name:"첫 시황 문단 완성", how:"주식 또는 비트코인 시황을 4문장 이상 쓰고 스스로 점검 4개 이상 통과", check:() => S.portfolio.some(p => (p.type === "stock" || p.type === "crypto") && countSent(p.text) >= 4 && (p.self || []).filter(Boolean).length >= 4), verify:"자가 점검"},
  {id:"first_synth", name:"첫 독립 종합 시장 분석글 완성", how:"틀 없이 3문단 이상의 종합 분석글을 쓰고 스스로 점검 5개 이상 통과", check:() => S.portfolio.some(p => p.type === "macro" && p.text.split(/\n\s*\n/).filter(x => x.trim()).length >= 3 && (p.self || []).filter(Boolean).length >= 5 && !p.framed), verify:"자가 점검"},
  {id:"comeback10", name:"틀렸던 문제 10개 다시 맞힘", how:"한 번 틀린 문제를 다른 날 다시 풀어 맞힘", check:() => S.comebacks.length >= 10, verify:"문제 풀이"}
];
function checkAchievements(){
  const got = [];
  ACHIEVE.forEach(a => { if(!S.achievements[a.id] && a.check()){ S.achievements[a.id] = {at:Date.now(), day:S.day}; got.push(a); } });
  if(got.length) touch();
  return got;
}

/* ================= 하루 진행 ================= */
function dayKind(n){ const c = curDay(n); if(c) return c.kind; return "advanced"; }
function periodDone(n, k){ const p = (S.dayLog[n] || {periods:{}}).periods[k]; return p && (p.st === "done" || p.st === "skip"); }
function dayIsDone(n){ return PERIODS.every(p => periodDone(n, p.k)); }
function maybeAdvanceDay(){
  const dl = S.dayLog[S.day];
  if(dl && dl.done && dl.doneDate && dl.doneDate < today()){ S.day++; touch(); return "advanced"; }
  if(dl && !dl.done && dl.lastDate && dl.lastDate < today() && PERIODS.some(p => periodDone(S.day, p.k))) return "ask";
  return null;
}

/* ================= 학습 타이머 ================= */
const Timer = {on:false, day:null, k:null, lastAct:Date.now(), idle:false, pending:0, iv:null};
const IDLE_MS = 180000;
["pointerdown","keydown","input","wheel","touchstart","scroll"].forEach(ev => window.addEventListener(ev, () => { if(!Timer.idle) Timer.lastAct = Date.now(); }, {passive:true, capture:true}));
function timerStart(day, k){
  Timer.on = true; Timer.day = day; Timer.k = k; Timer.lastAct = Date.now(); Timer.idle = false; Timer.pending = 0;
  clearInterval(Timer.iv); Timer.iv = setInterval(timerTick, 1000);
}
function timerStop(){ Timer.on = false; clearInterval(Timer.iv); }
function timerTick(){
  if(!Timer.on) return;
  const pl = periodLog(Timer.day, Timer.k);
  if(document.visibilityState !== "visible") return;
  pl.open++;
  if(Timer.idle){ Timer.pending = Math.min(Timer.pending + 1, 600); }
  else if(Date.now() - Timer.lastAct < IDLE_MS) pl.active++;
  else { Timer.idle = true; Timer.pending = Math.round(IDLE_MS / 1000); pl.active = Math.max(0, pl.active - Timer.pending); showIdle(); }
  if(pl.open % 15 === 0) touch();
  const el = $("#ptimer"); if(el) el.textContent = `집중 ${fmtDur(pl.active)} · 화면 ${fmtDur(pl.open)}`;
}
function idleResolve(studying){
  const pl = periodLog(Timer.day, Timer.k);
  if(studying) pl.active += Timer.pending; else pl.idle = (pl.idle || 0) + Timer.pending;
  Timer.pending = 0; Timer.idle = false; Timer.lastAct = Date.now(); touch();
}
