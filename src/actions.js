"use strict";
/* ================= 파일 저장·복원 ================= */
async function offerFile(filename, text){
  let dl = null;
  if(window.claude && typeof window.claude.use === "function"){ try{ dl = await window.claude.use("downloads"); }catch(e){ dl = null; } }
  if(dl){ try{ await dl.save({filename, data:text}); toast("파일을 저장했어요"); return true; }catch(e){ if(e && e.code === "declined"){ toast("저장을 취소했어요"); return false; } } }
  let tried = false;
  try{ const url = URL.createObjectURL(new Blob([text], {type:"text/plain;charset=utf-8"})); const a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000); tried = true; }catch(e){}
  if(tried && !window.claude){ toast("파일 저장을 요청했어요. 다운로드 폴더를 확인하세요"); return true; }
  showModal({title:tried ? "파일이 저장됐는지 확인해 주세요" : "이 화면에서는 파일 저장이 안 돼요", body:`<p class="small">${tried ? `다운로드 폴더에 <b>${esc(filename)}</b> 파일이 생겼는지 확인하세요. 없다면` : "대신"} 아래 내용을 전부 복사해 메모장 등에 붙여 보관하세요.</p><textarea id="fallbackTxt" readonly style="min-height:200px">${esc(text)}</textarea>`, ok:"전부 복사", cancel:"닫기", keep:true, onOk:() => copyText(text, $("#fallbackTxt"))});
  return tried;
}
async function copyText(text, ta){
  try{ await navigator.clipboard.writeText(text); toast("복사했어요"); }
  catch(e){ if(ta){ ta.focus(); ta.select(); toast("자동 복사가 막혀 있어요. 선택된 글을 길게 눌러 복사하세요."); } else showModal({title:"직접 복사해 주세요", body:`<textarea id="cpf" readonly style="min-height:120px">${esc(text)}</textarea>`, ok:"닫기"}); }
}
function exportAll(){
  const payload = JSON.stringify({app:"fa-academy", v:1, exportedAt:new Date().toISOString(), state:S});
  offerFile(`금융공부방_백업_${today()}.json`, payload).then(ok => { if(ok){ S.lastBackup = Date.now(); touch(); } });
}
function importText(text){
  let d; try{ d = JSON.parse(text); }catch(e){ showModal({title:"불러오지 못했어요", body:"<p>백업 파일 형식이 아니에요.</p>", ok:"확인"}); return; }
  if(!d || d.app !== "fa-academy" || !d.state || !d.state.v){ showModal({title:"불러오지 못했어요", body:"<p>이 공부방의 백업 파일이 아니에요.</p>", ok:"확인"}); return; }
  const st = d.state;
  showModal({title:"백업으로 되돌리기", body:`<p>${esc(st.profile ? st.profile.name : "학습자")}님의 ${st.day}일차 기록(${d.exportedAt ? fmtDate(d.exportedAt.slice(0, 10)) : ""} 백업)으로 바꿔요. 지금 이 기기의 기록은 백업 내용으로 대체돼요.${Sync.authed ? " 서버 기록도 백업 내용으로 바뀌어요." : ""}</p>`, ok:"되돌리기", cancel:"취소", onOk:() => { S = Object.assign(newState(), st); S.updated = Date.now(); saveNow(); if(Sync.authed) syncPush(true); UI.view = S.profile ? "home" : "setup"; closeModal(); render(); toast("백업을 불러왔어요"); }});
}

/* ================= 행동 ================= */
const ACT = {
  go(el){ const v = el.dataset.v; UI.view = v; UI.tab = el.dataset.t || null; if(v === "extra") prepExtra(UI.tab || "realnews"); render(); },
  rtab(el){ UI.tab = el.dataset.t; render(); },
  xtab(el){ UI.tab = el.dataset.t; prepExtra(UI.tab); render(); },
  repN(el){ UI.repN = +el.dataset.n; render(); },
  async setupStart(){
    const name = ($("#nameIn") || {}).value?.trim(); const err = $("#setupErr");
    if(!name){ err.hidden = false; err.textContent = "이름(별명)을 입력해 주세요."; return; }
    if(Sync.enabled && !UI.remoteFound){
      const pin = ($("#pinNew") || {}).value?.trim() || "";
      if(!/^\d{4,}$/.test(pin)){ err.hidden = false; err.textContent = "비밀번호는 숫자 4자리 이상이에요."; return; }
      err.hidden = false; err.textContent = "서버에 등록하는 중…";
      const r = await syncAuth(pin);
      if(r.ok){ await storePut("pin", pin); Store._pinCache = pin; Sync.authed = true; err.hidden = true; }
      else if(r.error === "pin"){ err.textContent = "서버에 이미 다른 비밀번호가 등록돼 있어요. 형에게 확인하세요."; return; }
      else { await storePut("pin", pin); Store._pinCache = pin; toast("서버에 연결하지 못해 이 기기에만 저장해요. 나중에 다시 연결돼요."); }
    }
    S.profile = {name, started:today()};
    S.pendingAssess = newAssessment(0);
    UI.view = "diag"; touch(); render();
  },
  async resumeRemote(){
    const pin = ($("#pinIn") || {}).value?.trim() || "";
    const r = await syncAuth(pin);
    if(!r.ok){ toast(r.error === "pin" ? "비밀번호가 맞지 않아요" : "서버에 연결하지 못했어요"); return; }
    await storePut("pin", pin); Store._pinCache = pin; Sync.authed = true;
    S = Object.assign(newState(), UI.remoteFound.state); UI.remoteFound = null;
    await saveNow(); UI.view = "home"; render(); toast("기록을 불러왔어요");
  },
  aAns(el){ answerAssess(+el.dataset.o); },
  aNum(){ answerAssess(null, ($("#anum") || {}).value); },
  aWriteDone(){
    const A = curAssess(); if(!A) return;
    A.phase = "result"; A.writeDone = true;
    const tasks = writingSet(A.cp === "extra" ? -1 : A.cp);
    tasks.forEach(t => { const txt = (A.writing[t.id] || "").trim(); if(txt) upsertPortfolio({key:`as.${A.id}.${t.id}`, day:S.day, type:t.kind === "market" ? "stock" : "news", title:`${A.cp === 0 ? "첫날 진단" : A.cp + "일 평가"}: ${t.title || t.prompt}`, v1:txt, source:"assess"}); });
    Object.entries(A.rewrite || {}).forEach(([id, txt]) => { if(txt.trim()) upsertPortfolio({key:`as.${A.id}.rw.${id}`, day:S.day, type:/market/.test(id) ? "stock" : "news", title:`${A.cp}일차에 첫날 과제 다시 쓰기`, v1:txt, source:"assess"}); });
    const idx = S.assessments.findIndex(x => x.id === A.id); if(idx >= 0) S.assessments[idx] = A;
    if(S.pendingAssess && S.pendingAssess.id === A.id) S.pendingAssess = A;
    touch(); render();
  },
  aRubric(el){ const A = curAssess(); if(!A) return; const t = el.dataset.t; A.rubric[t] = A.rubric[t] || []; A.rubric[t][+el.dataset.i] = +el.dataset.v; touch(); render(); },
  assessStart(){ S.pendingAssess = newAssessment(S.day); touch(); render(); },
  assessClose(){ S.pendingAssess = null; touch(); ACT.stepNext(); },
  startAt(el){
    const d = +el.dataset.d;
    S.pendingAssess = null; S.day = d;
    if(d > 1) (D.conceptList || []).forEach(([id, , day]) => { if(day < d){ S.concepts[id] = S.concepts[id] || {learned:0, placed:true, learnedDate:addDays(today(), -1), mastered:false}; srsAdd("cc." + id); S.srs["cc." + id].due = today(); } });
    UI.view = "home"; touch(); render();
  },
  startPeriod(el){ startPeriod(el.dataset.k); },
  continueDay(){ dayLog(S.day).lastDate = today(); touch(); render(); },
  skipToNext(){ dayLog(S.day).movedOn = today(); S.day++; touch(); render(); },
  stepNext(){ if(!UI.run) return; const cs = UI.run.steps[UI.run.si]; const g = cs.gate && cs.gate(); if(g){ toast(g); return; } if(UI.run.si < UI.run.steps.length - 1){ UI.run.si++; enterStep(); touch(); } render(); },
  stepPrev(){ if(!UI.run) return; if(UI.run.si === 0){ timerStop(); UI.run = null; UI.view = "home"; } else { UI.run.si--; enterStep(); } touch(); render(); },
  jumpStep(el){ if(!UI.run) return; const to = +el.dataset.i; for(let i = UI.run.si; i < to; i++){ const g = UI.run.steps[i].gate && UI.run.steps[i].gate(); if(g){ toast(g); UI.run.si = i; render(); return; } } UI.run.si = to; enterStep(); render(); },
  endPeriod(){ const bad = UI.run.steps.find(s => s.gate && s.gate()); if(bad){ toast(bad.gate()); return; } endPeriod(); },
  mLoad(el){ const key = el.dataset.key; const m = key.match(/^d(\d+)_(p\d)(_x)?$/); if(!m) return; const sp = m[3] ? Object.assign(extraSpec(+m[1], m[2]), {extra:true}) : missionSpec(+m[1], m[2]); if(S.mErr) delete S.mErr[key]; UI.keepScroll = true; loadMission(sp, !!el.dataset.force); },
  mSubmit(el){ UI.keepScroll = true; submitMission(el.dataset.key); },
  mNowDone(el){ const r = (S.missions || {})[el.dataset.key]; if(r){ r.nowDone = true; touch(); } UI.keepScroll = true; render(); },
  rvSubmit(){ UI.keepScroll = true; submitReview(UI.run ? UI.run.day : S.day); },
  qAns(el){ qsetAnswer(el.dataset.qs, {o:+el.dataset.o}); render(); },
  qNum(el){ qsetAnswer(el.dataset.qs, {v:($("#qnum") || {}).value || ""}); render(); },
  qFree(el){ const id = el.dataset.qs; const st = UI.qset[id]; const it = st.items[st.i]; const txt = ($("#qfree") || {}).value || ""; if(!txt.trim()){ toast("짧게라도 써 보거나 ‘모르겠어요’를 누르세요"); return; } qsetAnswer(id, {text:txt}); if(it.newsStep && UI.run){ newsRecordFor(UI.run.day).fields[it.newsStep] = txt; touch(); } render(); },
  qFreeSkip(el){ qsetAnswer(el.dataset.qs, {text:"(모르겠어요)", skip:true}); render(); },
  qNext(el){ const st = UI.qset[el.dataset.qs]; st.i++; while(st.i < st.items.length && st.res[st.i] && st.res[st.i].restored) st.i++; render(); },
  retryWrong(){
    const s = UI.run.steps[UI.run.si]; const st = UI.qset[s.id]; if(!st) return;
    const items = st.items.filter((it, i) => st.res[i] && st.res[i].ok === false);
    if(!items.length){ toast("다시 풀 문제가 없어요"); return; }
    const rid = s.id + "-r" + Date.now(); qsetStart(rid, items, {retry:true, fresh:true}); UI.run.retryId = rid; render();
  },
  readMode(el){ UI.run.readMode = el.dataset.m; render(); },
  pickKey(el){
    const n = UI.run.day, r = dayContent(n).reading; const s = sentences(r.text)[+el.dataset.i];
    const ok = s.includes(r.key.trim()) || r.key.includes(s);
    periodLog(n, "p1").keyPick = {i:+el.dataset.i, ok};
    recordAttempt(`d${n}.key`, "R", r.level, ok, "p1"); render();
  },
  altExplain(el){ const c = el.dataset.c; (S.concepts[c] || (S.concepts[c] = {})).altSeen = true; const b = $("#alt-" + c); if(b) b.hidden = false; touch(); },
  showFrame(){ UI.run.showFrame = true; render(); },
  selfRate(el){ periodLog(UI.run.day, UI.run.k).selfRate = +el.dataset.v; touch(); render(); },
  tts(el){ speak(TTS_TEXT[el.dataset.k] || "", el); },
  term(el){ termPopup(el.dataset.term); },
  termMore(){ const b = $("#termMore"); if(b) b.hidden = false; },
  evidence(el){ evidenceModal(el.dataset.d); },
  canEvidence(el){ const c = canDoList()[+el.dataset.i]; if(!c) return; showModal({title:"근거", body:`<p>${esc(c.text)}</p><p class="small muted">${esc(c.verified)}</p>${(c.evidence || []).map(e => { const q = itemByKey(e.k); return `<div class="ansrow"><div class="q">${e.t ? fmtDate(isoOf(e.t)) : ""} ${e.ok === 0 ? "오답" : "정답"} · ${esc(q ? q.where : e.k)}</div><div class="a small">${esc(q ? q.stem : "")}</div></div>`; }).join("")}`, ok:"닫기"}); },
  compareFirst(){
    const b = baseline(); const later = S.assessments.filter(a => a.id !== b.id && a.rewrite && Object.keys(a.rewrite).length).slice(-1)[0];
    const tasks = writingSet(0);
    const recent = S.portfolio.filter(p => ["stock","crypto","macro"].includes(p.type) && p.source !== "assess").slice(-1)[0];
    showModal({title:"첫날 글과 지금 글", body:tasks.map(t => `<h3>${esc(t.title || "")}</h3><div class="cols"><div><div class="lbl">첫날</div><div class="echo">${esc(b.writing[t.id] || "(쓰지 않음)")}</div></div><div><div class="lbl">${later ? later.cp + "일 평가 때 같은 과제" : "아직 다시 쓰지 않음"}</div><div class="echo">${esc(later ? later.rewrite[t.id] || "" : "")}</div></div></div>`).join("") + (recent ? `<h3>최근 시황 글 (${recent.day}일차)</h3><div class="echo">${esc(recent.text)}</div>` : "") + `<p class="small">비교 기준: ${CRITERIA8.join(" · ")}</p>`, ok:"닫기"});
  },
  openWB(el){ const l = el.dataset.l; const co = activeCompany(); UI.wbReturn = UI.run ? "run" : null; if(l && co) WB.openLesson(co.id, l); else WB.openHome(); UI.view = "wb"; render(); },
  wbBack(){ UI.view = UI.wbReturn === "run" && UI.run ? "run" : "home"; UI.wbReturn = null; render(); },
  openWBRecord(el){ WB.openRecord(el.dataset.id); UI.wbReturn = null; UI.view = "wb"; render(); },
  dayReport(el){ UI.reportDay = +el.dataset.d; UI.view = "dayReport"; render(); },
  saveRealNews(){ const d = UI.realNews || {}; if(!d.headline || !d.source || !d.srcDate){ toast("제목·출처·날짜를 모두 적어 주세요"); return; } const rec = {id:"rn" + uid(), day:S.day, date:today(), headline:d.headline, source:d.source, srcDate:d.srcDate, isReal:true, body:(d.body || "").slice(0, 6000), fields:{}, links:[]}; ["words","fact","meaning","why","link","unknown","judge","counter","stakeholders","impactShort","impactLong","stockLink","btcLink","knownNew","check"].forEach(k => { if(d[k]) rec.fields[k] = d[k]; }); S.news.push(rec); UI.realNews = {}; touch(); render(); toast("실제 뉴스 기록을 저장했어요"); },
  saveRealMarket(){ const d = UI.realMkt || {}; if(!d.when || !d.source || !(d.data || d.text)){ toast("기준 시각·출처·내용을 적어 주세요"); return; } S.marketLog.push({id:"rm" + uid(), day:S.day, date:today(), isReal:true, when:d.when, source:d.source, data:d.data || "", text:d.text || ""}); UI.realMkt = {}; touch(); render(); toast("시장 기록을 저장했어요"); },
  reassess(el){ const d = el.dataset.d; const A = newAssessment("extra"); A.order = [d]; UI.reA = A; render(); },
  exportAll(){ exportAll(); },
  importOpen(){ const f = $("#importFile"); f.value = ""; f.click(); },
  importPaste(){ showModal({title:"백업 내용 붙여넣기", body:`<label class="f" for="pasteBk">백업 내용 전체<textarea id="pasteBk" style="min-height:160px"></textarea></label>`, ok:"불러오기", cancel:"취소", keep:true, onOk:() => { const t = $("#pasteBk").value.trim(); if(!t){ toast("붙여넣은 내용이 없어요"); return false; } importText(t); }}); },
  weeklyDl(el){ const n = +el.dataset.n; offerFile(`${S.profile ? S.profile.name : "학습자"}_${n === 7 ? "주간" : "월간"}보고서_${today()}.md`, periodReportMd(n)); },
  font(el){ S.settings.font = +el.dataset.f; touch(); render(); },
  async syncNow(){ const ok = await syncPush(true); toast(ok ? "서버에 저장했어요" : (Sync.err || "저장하지 못했어요")); render(); },
  pinEnter(){ showModal({title:"기록 비밀번호", body:`<label class="f" for="pinRe">비밀번호<input id="pinRe" type="password" inputmode="numeric"></label>`, ok:"확인", cancel:"취소", onOk:async () => { const pin = $("#pinRe").value.trim(); const r = await syncAuth(pin); if(r.ok){ await storePut("pin", pin); Store._pinCache = pin; Sync.authed = true; Sync.err = null; syncPush(true); toast("서버와 연결했어요"); } else toast(r.error === "pin" ? "비밀번호가 맞지 않아요" : "서버에 연결하지 못했어요"); render(); }}); },
  copyView(){ copyText(location.href.split("#")[0] + "#view"); },
  wipe(){ showModal({title:"모든 기록 지우기", body:`<p>이 기기의 모든 학습 기록이 지워져요. 되돌릴 수 없어요. 먼저 백업을 권해요.${Sync.enabled ? " 서버(형 드라이브)의 기록은 지워지지 않아요." : ""}</p><label class="f" for="wipeIn">확인을 위해 <b>삭제</b>라고 입력하세요<input id="wipeIn" type="text" autocomplete="off"></label>`, ok:"영구히 지우기", cancel:"취소", danger:true, keep:true, onOk:async () => { if($("#wipeIn").value.trim() !== "삭제"){ toast("‘삭제’라고 입력해 주세요"); return false; } S = newState(); await storePut("state", S); await storePut("pin", null); Sync.authed = false; closeModal(); UI.view = "setup"; render(); toast("기록을 지웠어요"); }}); },
  async viewRefresh(){ const r = await syncPull(); if(r && r.state){ S = Object.assign(newState(), r.state); toast("최신 기록을 불러왔어요"); } render(); },
  askOpen(){ askOpen(); },
  aiEval(el){ aiEval(el.dataset.k); },
  applyGen(el){ applyGen(el.dataset.k, el.dataset.t); },
  pickCompany(){ const nm = ($("#mc-n") || {}).value?.trim(); if(!nm){ toast("기업 이름을 써 주세요"); return; } makeCompany(nm, ($("#mc-u") || {}).value?.trim(), ($("#mc-i") || {}).value); render(); toast(`${nm}을(를) 내 기업으로 정했어요`); },
  changeCompany(){ const cs = Object.values(S.companies || {}); showModal({title:"공부할 기업 바꾸기", body:`${cs.map(c => `<label class="opt"><input type="radio" name="cpick" value="${c.id}" ${S.activeCompany === c.id ? "checked" : ""}><span>${esc(c.name)}</span></label>`).join("")}<p class="small muted">새 기업은 ‘기업 워크북’에서 등록하거나, 아래에 이름을 쓰세요.</p><label class="f" for="cnew">새 기업 이름<input id="cnew"></label>`, ok:"바꾸기", cancel:"취소", onOk:() => { const nw = $("#cnew").value.trim(); if(nw) makeCompany(nw, ""); else { const r = document.querySelector("input[name=cpick]:checked"); if(r){ S.activeCompany = r.value; touch(); } } render(); }}); },
  skipReal(el){ const n = UI.run ? UI.run.day : S.day; const dl = dayLog(n); dl.realSkip = dl.realSkip || {}; dl.realSkip[el.dataset.w] = true; touch(); toast("기록해 두었어요. 다음 활동으로 넘어가세요."); },
  nextDayNow(){ const dl = dayLog(S.day); dl.advancedEarly = true; S.day++; dayLog(S.day).started = today(); UI.view = "home"; touch(); if(Sync.authed) syncPush(); render(); toast(`${S.day}일차를 시작해요`); },
  modalOk(){ const cb = modalCb; if(cb && cb.onOk){ const r = cb.onOk(); if(r === false) return; if(cb.keep) return; } closeModal(); },
  modalCancel(){ closeModal(); },
  idleYes(){ idleResolve(true); $("#idleBack")?.remove(); },
  idleNo(){ idleResolve(false); $("#idleBack")?.remove(); }
};
function curAssess(){ if(UI.reA && UI.view === "extra") return UI.reA; if(S.pendingAssess) return S.pendingAssess; return S.assessments.filter(a => a.cp === S.day).slice(-1)[0] || null; }
function answerAssess(o, numVal){
  const A = curAssess(); if(!A || !A.cur) return;
  const it = ASSESS_BY_ID[A.cur.id];
  let ok = false;
  if(numVal !== undefined && numVal !== null){ const v = parseFloat(String(numVal).replace(/[,\s%원]/g, "")); ok = !isNaN(v) && Math.abs(v - it.answer) <= (it.tol ?? 0.01); }
  else ok = o === it.answer;
  assessAnswer(A, ok);
  touch(); render();
}
function prepExtra(tab){
  if(tab === "retry") qsetStart("x-retry", Object.entries(S.wrong).slice(0, 20).map(([k, w]) => { const q = itemByKey(k); return q && q.t && q.t !== "free" && q.stem && q.options ? Q(k, q, w.dom || "R", {label:"다시 풀기 · " + q.where}) : null; }).filter(Boolean), {src:"extra"});
  if(tab === "challenge"){ const ids = Object.keys(S.concepts).filter(id => D.concepts[id]); const items = shuffle(ids, Date.now() % 9973).slice(0, 8).map(id => { const c = D.concepts[id]; const i = c.quiz.findIndex(q => q.transfer && q.t !== "free"); return i >= 0 ? Q(`c.${id}.${i}`, c.quiz[i], (CONCEPT_BY_ID[id] || {}).dom || "E", {label:"도전 · " + c.name, concept:id}) : null; }).filter(Boolean); qsetStart("x-challenge", items, {src:"extra", fresh:true}); }
}
function upsertPortfolio(o){
  let p = S.portfolio.find(x => x.key === o.key);
  if(!p){ p = {id:"w" + uid(), key:o.key, day:o.day || S.day, date:today(), type:o.type, title:o.title || "", v1:"", v2:"", text:"", self:[], kp:[], note:"", source:o.source || "p6"}; S.portfolio.push(p); }
  Object.assign(p, o); p.text = (p.v2 && p.v2.trim()) ? p.v2 : p.v1; p.updatedAt = Date.now();
  return p;
}

/* ================= 이벤트 ================= */
document.addEventListener("click", e => {
  if(e.target.closest("#wb")) return;
  const t = e.target.closest("[data-act]");
  if(!t) return;
  if(t.disabled) return;
  const fn = ACT[t.dataset.act]; if(fn){ e.preventDefault(); fn(t, e); }
});
document.addEventListener("keydown", e => { if(e.key === "Escape" && $("#modalBack")) closeModal(); });
let fieldT = null;
function onField(e){
  const el = e.target; if(el.closest("#wb")) return;
  const ds = el.dataset;
  if(ds.free !== undefined){ const a = S.answers[ds.free] || (S.answers[ds.free] = {}); a.text = el.value; a.at = Date.now(); a.day = S.day;
    if(/^d\d+\.apply$/.test(ds.free)){ const co = activeCompany(); if(co){ co.ideaNotes = co.ideaNotes || []; const n = +ds.free.slice(1, ds.free.indexOf(".")); let note = co.ideaNotes.find(x => x.day === n); if(!note){ note = {day:n, prompt:(dayContent(n) || {company:{}}).company.apply || "", text:""}; co.ideaNotes.push(note); } note.text = el.value; } }
    touch(); return; }
  if(ds.kp !== undefined){ const a = S.answers[ds.kp] || (S.answers[ds.kp] = {}); a.kp = a.kp || []; a.kp[+ds.i] = el.checked; touch(); return; }
  if(ds.nf !== undefined){ newsRecordFor(UI.run.day).fields[ds.nf] = el.value; touch(); return; }
  if(ds.nlink !== undefined){ const rec = newsRecordFor(UI.run.day); rec.links = (rec.links || []).filter(l => l.id !== ds.nlink); if(el.checked) rec.links.push({id:ds.nlink}); touch(); return; }
  if(ds.mmemo !== undefined){ const n = +ds.mmemo; let rec = S.marketLog.find(x => x.day === n && !x.isReal); if(!rec){ rec = {id:"m" + n, day:n, date:today(), isReal:false, text:""}; S.marketLog.push(rec); } rec.text = el.value; touch(); return; }
  if(ds.write !== undefined){ const w = writingTask(UI.run.day); upsertPortfolio({key:ds.write, day:UI.run.day, type:w.type, title:w.prompt, v1:el.value, framed:!!(w.frame && w.frame.length)}); const c = $("#wcount"); if(c) c.textContent = countInfo(el.value); touch(); return; }
  if(ds.write2 !== undefined){ const p = portfolioFor(ds.write2); if(p){ upsertPortfolio({key:ds.write2, v2:el.value}); touch(); } return; }
  if(ds.self !== undefined){ const p = portfolioFor(ds.self); if(p){ p.self = p.self || []; p.self[+ds.i] = el.checked; touch(); } return; }
  if(ds.wkp !== undefined){ const p = portfolioFor(ds.wkp); if(p){ p.kp = p.kp || []; p.kp[+ds.i] = el.checked; touch(); } return; }
  if(ds.wnote !== undefined){ const p = portfolioFor(ds.wnote); if(p){ p.note = el.value; touch(); } return; }
  if(ds.rewrite !== undefined){ const orig = S.portfolio.find(p => p.id === ds.rewrite); const key = `rw.${ds.rewrite}.${S.day}`; (S.answers[key] = S.answers[key] || {}).text = el.value; if(orig) upsertPortfolio({key, day:S.day, type:orig.type, title:`고쳐 쓰기: ${orig.title || ""}`, v1:el.value, rewriteOf:orig.id, source:"rewrite"}); touch(); return; }
  if(ds.aw !== undefined){ const A = curAssess(); if(A){ A.writing[ds.aw] = el.value; touch(); } return; }
  if(ds.ar !== undefined){ const A = curAssess(); if(A){ A.rewrite[ds.ar] = el.value; touch(); } return; }
  if(ds.dnote !== undefined || ds.dsrc !== undefined){ const co = activeCompany(); if(co){ co.dayNotes = co.dayNotes || {}; const n = ds.dnote || ds.dsrc; const x = co.dayNotes[n] || (co.dayNotes[n] = {}); if(ds.dnote !== undefined) x.text = el.value; else x.src = el.value; x.at = Date.now(); co.updated = Date.now(); touch(); } return; }
  if(ds.apans !== undefined){ const x = (S.applied || []).filter(a => a.key === ds.apans)[+ds.i]; if(x){ x.ans = el.value; touch(); } return; }
  if(ds.mans !== undefined){ const [key, i] = ds.mans.split("|"); const r = (S.missions || {})[key]; if(r && !r.passed){ r.ans = r.ans || {}; r.ans[i] = el.value; touch(); } return; }
  if(ds.rvans !== undefined){ const r = (S.reviewQ || []).find(x => x.id === ds.rvans); if(r){ r.ans = el.value; touch(); } return; }
  if(ds.rn !== undefined){ UI.realNews = UI.realNews || {}; UI.realNews[ds.rn] = el.value; return; }
  if(ds.rm !== undefined){ UI.realMkt = UI.realMkt || {}; UI.realMkt[ds.rm] = el.value; return; }
  if(ds.wfilter !== undefined){ UI.wfilter = el.value; render(); return; }
  if(ds.cmp !== undefined){ UI.compare = (UI.compare || []).filter(x => x !== ds.cmp); if(el.checked) UI.compare.push(ds.cmp); if(UI.compare.length > 2) UI.compare.shift(); render(); return; }
  if(ds.libq !== undefined){ UI.libQ = el.value; clearTimeout(fieldT); fieldT = setTimeout(() => { render(); const i = $("#libq"); if(i){ i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 400); return; }
  if(ds.glossq !== undefined){ UI.glossQ = el.value; clearTimeout(fieldT); fieldT = setTimeout(() => { render(); const i = $("#glq"); if(i){ i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 400); return; }
  if(ds.tts !== undefined){ S.settings.tts = el.checked; touch(); return; }
}
document.addEventListener("input", e => { if(e.target.type === "checkbox" || e.target.type === "radio" || e.target.tagName === "SELECT") return; onField(e); });
document.addEventListener("change", e => {
  if(e.target.id === "importFile"){ const f = e.target.files && e.target.files[0]; if(f){ const rd = new FileReader(); rd.onload = () => importText(String(rd.result)); rd.readAsText(f); } return; }
  if(e.target.closest("#wb")) return;
  if(e.target.type === "checkbox" || e.target.type === "radio" || e.target.tagName === "SELECT") onField(e);
});
window.addEventListener("pagehide", () => { saveNow(); syncBeacon(); });
document.addEventListener("visibilitychange", () => { if(document.visibilityState === "hidden"){ saveNow(); if(Sync.authed) syncPush(); } });

/* ================= 시작 ================= */
(async function boot(){
  await storeInit();
  if(VIEW_MODE){
    document.body.classList.add("viewmode"); UI.view = "growth"; render();
    const r = await syncPull(); if(r && r.state) S = Object.assign(newState(), r.state);
    UI.viewLoaded = true; render(); return;
  }
  const local = await storeGet("state");
  if(local && local.v) S = Object.assign(newState(), local);
  const pin = await getPin(); Store._pinCache = pin;
  if(Sync.enabled){
    const r = await syncPull();
    if(r && r.state){
      if(!S.profile) UI.remoteFound = {name:r.state.profile && r.state.profile.name, day:r.state.day, state:r.state};
      else if(pin){ const au = await syncAuth(pin); if(au.ok){ Sync.authed = true; if((r.updated || 0) > (S.updated || 0)){ S = Object.assign(newState(), r.state); toast("다른 기기의 최신 기록을 불러왔어요"); } else if((S.updated || 0) > (r.updated || 0)) syncPush(); } else Sync.err = au.error === "pin" ? "비밀번호가 서버와 달라요" : "서버에 연결하지 못했어요"; }
    } else if(r && pin && S.profile){ const au = await syncAuth(pin); if(au.ok){ Sync.authed = true; syncPush(); } }
  }
  UI.view = S.profile ? (S.pendingAssess && S.pendingAssess.cp === 0 ? "diag" : "home") : "setup";
  if(/(^|#|&)guide\b/.test(location.hash)) UI.view = "guide";
  render();
})();
