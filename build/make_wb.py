import re
src = open('/home/claude/bizreport/index.html', encoding='utf-8').read()
js = src.split('<script>\n"use strict";\n',1)[1].split('</script>')[0]
lines = js.split('\n')
# cut start section
start_idx = next(i for i,l in enumerate(lines) if l.startswith('/* ============ 시작 ============ */'))
lines = lines[:start_idx]
js = '\n'.join(lines)
# storage section -> stubs
a = js.index('/* ============ 저장 ============ */'); b = js.index('/* ============ 화면 공통 ============ */')
stub = '''/* ============ 저장(통합 앱 위임) ============ */
function testLocal(){} function loadLocal(){} function saveLocal(){ window.__touch && window.__touch(); }
function touch(c){ if(c){ c.updated = Date.now(); } window.__touch && window.__touch(); }
let touchTimer = null;
function touchSoon(c){ clearTimeout(touchTimer); touchTimer = setTimeout(() => touch(c), 600); }
async function initCloud(){} function queueCloud(){} async function writeCloud(){}
function statusInfo(){ return {cls:"local", txt:""}; }
function paintStatus(){}
'''
js = js[:a] + stub + js[b:]
js = re.sub(r'const Cloud = \{state:"checking".*?\n', 'const Cloud = {state:"off", pendingSet:new Set(), writeErr:null, lastOk:null};\n', js)
# state object: companies live in the main app state
js = js.replace('const S = {data:{app:"bizreport-learning", v:1, companies:{}}, view:"home",',
 'const S = {get data(){ const st = window.__getState(); st.companies = st.companies || {}; return {app:"bizreport-learning", v:1, companies:st.companies}; }, set data(v){ if(v && v.companies) window.__getState().companies = v.companies; }, view:"home",')
js = js.replace('$("#top")', '$("#wbTop")').replace('$("#app")', '$("#wbApp")')
js = js.replace('<button id="savePill" class="pill" data-act="saveinfo"></button>', '')
js = js.replace('<button class="brand" data-act="home">사업보고서 읽기 교실</button>', '<button class="brand" data-act="home">기업분석 워크북</button>')
# modals & toast -> main app
a = js.index('/* ============ 모달·토스트 ============ */'); b = js.index('/* ============ 용어 사전 ============ */')
js = js[:a] + '''/* ============ 모달·토스트(통합 앱 위임) ============ */
function showModal(o){ window.__ui.showModal(o); }
function closeModal(){ window.__ui.closeModal(); }
function toast(m){ window.__ui.toast(m); }
''' + js[b:]
# backup tab -> pointer to global settings
js = re.sub(r'function backupTab\(c\)\{.*?\n\}\n', '''function backupTab(c){
  return `<section class="card"><h3>저장과 백업</h3><p class="small">기업분석 기록은 공부방 전체 기록과 함께 저장·백업돼요. 백업은 ‘설정’ 화면에서 한 번에 할 수 있어요.</p></section>
  <section class="card"><h3>이 기업 기록 지우기</h3><p class="small">${esc(c.name)} ${esc(c.year)} 기록의 모든 답이 지워져요. 되돌릴 수 없어요.</p><div><button class="btn danger small" data-act="delCo">이 기업 기록 지우기</button></div></section>`;
}
''', js, flags=re.S)
# event listeners -> scoped
js = js.replace('document.addEventListener(', 'WB_ON(')
js = js.replace('window.addEventListener("pagehide", () => { saveLocal(); });', '')
js = js.replace('$("#importFile")', 'document.getElementById("importFile")')
out = '''/* ===== 기업분석 워크북 (이전 ‘사업보고서 읽기 교실’ 통합) ===== */
const WB = (function(){
"use strict";
const _h = [];
function WB_ON(ev, fn){ _h.push([ev, fn]); }
''' + js + '''
function mount(root){
  root.innerHTML = '<div id="wbTop" class="wb-top"></div><div id="wbApp" class="wb-app"></div>';
  _h.forEach(([ev, fn]) => root.addEventListener(ev, fn));
  if(!S.cid || !S.data.companies[S.cid]){ const f = Object.values(S.data.companies).sort((a, b) => (b.updated || 0) - (a.updated || 0))[0]; S.cid = f ? f.id : null; if(!f) S.view = "home"; }
  render();
  initAI();
}
function openLesson(cid, lid){ S.cid = cid; S.lid = lid; S.view = "guide"; S.gs = 0; S.qi = 0; S.checked = false; }
function openHome(){ S.view = "home"; }
function openRecord(cid){ S.cid = cid; S.view = "record"; S.tab = "report"; }
function context(){
  const c = cur(); if(!c) return {key:"wb.home", text:"[기업분석 워크북] 아직 기업을 고르지 않음"};
  const L = S.lid ? getL(S.lid) : null;
  const q = L && S.view === "q" ? (qsFor(c, L)[S.qi] || null) : null;
  const a = q ? (c.answers[q.id] || {}) : null;
  let t = `[기업분석 워크북] 기업: ${c.name} (${c.year}년 ${c.rtype}) / 화면: ${S.view}${L ? ` / 학습 ${L.no}. ${L.title}` : ""}`;
  if(L) t += `\n[학습 목표] ${L.goal}\n[펼칠 곳] ${L.where.join(" / ")}`;
  if(q) t += `\n[질문] ${q.p}\n[쉬운 해설] ${q.easy}\n[찾을 위치] ${q.where}\n[학습자 답] ${a && a.status === "answered" ? plainAns(q, a, c) : "(아직 없음)"}`;
  const src = L ? ((c.lessons[L.id] || {}).src || "") : "";
  if(src) t += `\n[학습자가 붙여넣은 원문] ${src.slice(0, 3000)}`;
  return {key:`wb.${c.id}.${S.lid || "home"}.${q ? q.id : S.view}`, text:t};
}
function lessonState(c, lid){ const L = getL(lid); return L ? lessonStat(c, L) : null; }
return {mount, context, openLesson, openHome, openRecord, buildReport, progress, lessonState, getL, GLOSS, INDUSTRIES, LESSONS, MODES};
})();
'''
open('/home/claude/academy/src/workbook.js','w',encoding='utf-8').write(out)
print(len(out))
