"use strict";
/* ================= 교시 진행 엔진 ================= */
const UI = {view:"home", tab:null, run:null, qset:{}, A:null, compare:null, wbReturn:null, lastView:"home"};

/* ---------- 용어 연결과 읽어주기 ---------- */
let TERMS = null, TERM_DAY = -1;
function buildTerms(){
  if(TERM_DAY === S.day && TERMS) return TERMS;
  const m = new Map();
  const add = (t, info) => { t = String(t || "").trim(); if(t.length < 2 || m.has(t)) return; m.set(t, info); };
  (D.conceptList || []).forEach(([id, name, day]) => {
    if(day > S.day + 0) return;
    const base = name.replace(/\(.*?\)/g, "").trim();
    const inner = (name.match(/\((.*?)\)/) || [])[1];
    [base, ...(inner ? inner.split(/[·,]/) : [])].forEach(v => { v = v.trim(); if(v && !/^(기초|가계|기업|정부)$/.test(v)) add(v, {kind:"concept", id}); });
  });
  Object.keys(WB.GLOSS).forEach(k => add(k, {kind:"gloss", id:k}));
  for(let n = 1; n <= S.day; n++){ const dc = dayContent(n); if(dc) (dc.vocab || []).forEach((v, i) => add(v.w, {kind:"vocab", day:n, i})); }
  const byFirst = {};
  [...m.keys()].sort((a, b) => b.length - a.length).forEach(t => { (byFirst[t[0]] = byFirst[t[0]] || []).push(t); });
  TERMS = {map:m, byFirst}; TERM_DAY = S.day; return TERMS;
}
function linkText(text){
  const T = buildTerms();
  return String(text || "").split(/\n\s*\n/).map(par => {
    const used = new Set(); let out = "", i = 0;
    while(i < par.length){
      const cands = T.byFirst[par[i]] || [];
      let hit = null;
      for(const t of cands){ if(!used.has(t) && par.startsWith(t, i)){ hit = t; break; } }
      if(hit){ used.add(hit); out += `<button type="button" class="term" data-act="term" data-term="${esc(hit)}">${esc(hit)}</button>`; i += hit.length; }
      else { out += esc(par[i]); i++; }
    }
    return `<p>${out.replace(/\n/g, "<br>")}</p>`;
  }).join("");
}
function termPopup(t){
  const info = buildTerms().map.get(t);
  let body = "";
  if(info && info.kind === "concept"){
    const c = D.concepts[info.id];
    if(c) body = `<p>${esc(c.easy)}</p><div class="help-panel"><b>일상 예시</b><br>${esc(c.analogy)}</div><div id="termMore" hidden class="help-panel"><b>더 쉬운 설명</b><br>${esc(c.alt)}<br><br>${esc(c.altExample)}</div>`;
    else body = `<p>${esc(CONCEPT_BY_ID[info.id]?.name || t)}: 곧 배울 개념이에요.</p>`;
  } else if(info && info.kind === "gloss"){ const g = WB.GLOSS[info.id]; body = `<div class="help-panel"><b>일상 예시</b><br>${esc(g[0])}</div><p>${esc(g[1])}</p>`; }
  else if(info && info.kind === "vocab"){ const v = dayContent(info.day).vocab[info.i]; body = `<p><b>${esc(v.w)}</b>: ${esc(v.m)}</p><p class="muted small">예문: ${esc(v.ex)}</p>`; }
  else body = "<p>아직 사전에 없는 말이에요.</p>";
  showModal({title:t, body:body + (info && info.kind === "concept" && D.concepts[info.id] ? `<button class="btn small ghost" data-act="termMore">이해가 안 되면: 더 쉬운 설명 보기</button>` : ""), ok:"닫기"});
}
let speaking = false;
function speak(text, btn){
  if(!("speechSynthesis" in window)){ toast("이 브라우저는 읽어주기를 지원하지 않아요"); return; }
  if(speaking){ speechSynthesis.cancel(); speaking = false; if(btn) btn.textContent = "🔊 읽어주기"; return; }
  const u = new SpeechSynthesisUtterance(String(text).replace(/\s+/g, " "));
  u.lang = "ko-KR"; u.rate = 0.92;
  const v = speechSynthesis.getVoices().find(x => /ko/i.test(x.lang)); if(v) u.voice = v;
  u.onend = () => { speaking = false; if(btn) btn.textContent = "🔊 읽어주기"; };
  speaking = true; if(btn) btn.textContent = "■ 그만 읽기";
  speechSynthesis.speak(u);
}
const ttsBtn = (key) => S.settings.tts && "speechSynthesis" in window ? `<button class="btn small ghost" data-act="tts" data-k="${esc(key)}">🔊 읽어주기</button>` : "";
const TTS_TEXT = {};
function tableHTML(t){
  if(!t || !t.head) return "";
  return `<div class="tbl-wrap"><table class="dt">${t.caption ? `<caption>${esc(t.caption)}</caption>` : ""}<thead><tr>${t.head.map(h => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${t.rows.map(r => `<tr>${r.map((c, i) => i ? `<td>${esc(c)}</td>` : `<th scope="row">${esc(c)}</th>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

/* ---------- 문제 세트 ---------- */
function qsetStart(id, items, opts){
  const pl = UI.run ? periodLog(UI.run.day, UI.run.k) : {ans:{}};
  pl.ans = pl.ans || {};
  const st = {items, i:0, res:{}, opts:opts || {}};
  items.forEach((it, i) => { if(pl.ans[it.key] !== undefined && !(opts && opts.fresh)) st.res[i] = {ok:pl.ans[it.key], restored:true}; });
  while(st.res[st.i]) st.i++;
  UI.qset[id] = st;
}
function qsetHTML(id){
  const st = UI.qset[id]; if(!st) return "";
  const n = st.items.length;
  if(!n) return `<p class="muted">오늘은 풀 문제가 없어요.</p>`;
  if(st.i >= n) return qsetSummary(id);
  const it = st.items[st.i], q = it.q, r = st.res[st.i];
  const head = `<div class="row between small muted"><span>${esc(it.label || "")}</span><span>${st.i + 1} / ${n}</span></div>${q.transfer ? '<span class="tag">처음 보는 상황에 적용하기</span>' : ""}`;
  let body = "";
  if(q.passage) body += `<div class="passage small">${linkText(q.passage)}</div>`;
  body += `<h3 class="qtext">${esc(q.stem)}</h3>`;
  if(q.t === "mcq"){
    body += `<div class="opts">${q.options.map((o, i) => { let cls = "opt"; if(r && !r.restored){ if(i === q.answer) cls += " right"; else if(i === r.chosen) cls += " wrong"; } return `<button class="${cls}" data-act="qAns" data-qs="${id}" data-o="${i}" ${r ? "disabled" : ""}><span class="ol">${"①②③④⑤"[i]}</span>${esc(o)}</button>`; }).join("")}</div>`;
  } else if(q.t === "num"){
    body += `<div class="row"><label class="f" for="qnum" style="flex:1">답(숫자)<input id="qnum" inputmode="decimal" ${r ? "disabled" : ""} value="${r && r.val != null ? esc(r.val) : ""}"></label><span class="tag">${esc(q.unit || "")}</span>${r ? "" : `<button class="btn" data-act="qNum" data-qs="${id}">확인</button>`}</div>`;
  } else {
    const a = S.answers[it.key] || {};
    body += `<label class="f" for="qfree">내 답<textarea id="qfree" data-free="${esc(it.key)}" ${r ? "readonly" : ""} placeholder="짧아도 괜찮아요. 내 말로 써 보세요.">${esc(a.text || "")}</textarea></label>`;
    if(!r) body += `<div class="row"><button class="btn" data-act="qFree" data-qs="${id}">답 확인하기</button><button class="btn ghost" data-act="qFreeSkip" data-qs="${id}">모르겠어요</button></div>`;
  }
  if(r){
    if(q.t === "free"){
      const a = S.answers[it.key] || {};
      body += `<div class="check"><div class="lbl">내 답에 아래 내용이 들어 있나요? (스스로 점검)</div><ul class="checks">${(q.keyPoints || []).map((k, i) => `<li><label><input type="checkbox" data-kp="${esc(it.key)}" data-i="${i}" ${(a.kp || [])[i] ? "checked" : ""}><span>${esc(k)}</span></label></li>`).join("")}</ul>
      <details class="ev" open><summary>모범 답안과 비교</summary><p>${esc(q.model)}</p></details>${evalBox("ev." + it.key, {stem:q.stem, model:q.model, kp:q.keyPoints, text:(S.answers[it.key] || {}).text || "", label:it.label})}<p class="small muted">스스로 점검은 ‘자가 점검’, AI 첨삭은 ‘AI 평가(참고)’로 따로 기록돼요.</p></div>`;
    } else {
      body += `<div class="${r.ok ? "notebox" : "warnbox"}"><b>${r.restored ? "이미 푼 문제예요." : r.ok ? "맞았어요." : "다시 생각해 봐요."}</b> ${esc(q.explain || "")}${q.t === "num" ? ` <span class="small">(정답: ${esc(q.answer)} ${esc(q.unit || "")})</span>` : ""}</div>`;
    }
    body += `<div class="row end"><button class="btn" data-act="qNext" data-qs="${id}">${st.i + 1 < n ? "다음 문제 →" : "결과 보기 →"}</button></div>`;
  }
  return `<div class="qbox">${head}${body}</div>`;
}
function qsetSummary(id){
  const st = UI.qset[id];
  const obj = st.items.map((it, i) => ({it, r:st.res[i]})).filter(x => x.it.q.t !== "free" && x.r);
  const ok = obj.filter(x => x.r.ok).length;
  const acc = obj.length ? Math.round(ok / obj.length * 100) : null;
  st.acc = acc;
  const wrong = obj.filter(x => !x.r.ok);
  let extra = "";
  if(acc !== null && acc < 60 && st.opts.onWeak) extra = st.opts.onWeak(wrong);
  else if(acc !== null && acc >= 90 && st.opts.onStrong) extra = st.opts.onStrong();
  return `<div class="qbox"><h3>결과</h3>${acc !== null ? `<p>객관식·계산 ${obj.length}문제 중 <b>${ok}문제</b> 맞혔어요 (${acc}%).</p>` : `<p>서술형 답을 모두 기록했어요.</p>`}
  ${wrong.length ? `<details class="ev"><summary>틀린 문제 해설 다시 보기 (${wrong.length})</summary>${wrong.map(x => `<div class="ansrow"><div class="q">${esc(x.it.q.stem)}</div><div class="a small">${esc(x.it.q.explain || "")}</div></div>`).join("")}</details>` : ""}
  ${extra}<p class="small muted">틀린 문제는 며칠 뒤 복습에 다시 나와요.</p></div>`;
}
function qsetAnswer(id, payload){
  const st = UI.qset[id]; const it = st.items[st.i]; const q = it.q;
  if(st.res[st.i]) return;
  let ok = false, rec = {};
  if(q.t === "mcq"){ ok = payload.o === q.answer; rec = {ok, chosen:payload.o}; }
  else if(q.t === "num"){ const v = parseFloat(String(payload.v).replace(/[,\s%원]/g, "")); ok = !isNaN(v) && Math.abs(v - q.answer) <= (q.tol ?? 0.01); rec = {ok, val:payload.v}; }
  else { rec = {ok:null, free:true}; const a = S.answers[it.key] || (S.answers[it.key] = {}); a.text = payload.text; a.at = Date.now(); a.day = S.day; a.skip = !!payload.skip; touch(); }
  st.res[st.i] = rec;
  if(q.t !== "free"){
    const src = UI.run ? `p${UI.run.k.slice(1)}${st.opts.retry ? "-retry" : ""}` : (st.opts.src || "extra");
    if(!st.opts.retry) recordAttempt(it.key, it.dom, it.lv || q.lv || 1, ok, src);
    else S.attempts.push({k:it.key, d:it.dom, l:it.lv || 1, o:ok ? 1 : 0, t:Date.now(), day:S.day, s:"retry"});
    if(UI.run){ const pl = periodLog(UI.run.day, UI.run.k); pl.ans = pl.ans || {}; pl.ans[it.key] = ok; }
    if(it.srs) srsResult(it.srs, ok);
    if(it.concept) updateConceptMastery(it.concept);
  } else if(UI.run){ const pl = periodLog(UI.run.day, UI.run.k); pl.ans = pl.ans || {}; pl.ans[it.key] = null; }
  if(it.onResult) it.onResult(ok, rec);
  touch();
}

/* ---------- 교시 구성 ---------- */
function Q(key, q, dom, extra){ return Object.assign({key, q, dom, lv:q.lv}, extra || {}); }
function dayQuestionItems(n, part){
  const dc = dayContent(n); if(!dc) return [];
  if(part === "vocab") return dc.vocab.map((v, i) => Q(`d${n}.v${i}`, v.q, "V", {label:`낱말: ${v.w}`, srsAdd:`vv.${n}.${i}`}));
  if(part === "reading") return dc.reading.qs.map((q, i) => Q(`d${n}.r${i}`, q, q.skill === "vocab" ? "V" : "R", {label:"독해 문제"}));
  if(part === "news") return dc.news.qs.map((q, i) => Q(`d${n}.n${i}`, q, "N", {label:"뉴스 판단"}));
  if(part === "company") return dc.company.qs.map((q, i) => Q(`d${n}.c${i}`, q, "C", {label:"기업 분석"}));
  if(part === "market") return dc.market.qs.map((q, i) => Q(`d${n}.m${i}`, q, "M", {label:"시장 분석"}));
  return [];
}
function wrongItems(prefixRe, days, limit){
  return Object.entries(S.wrong).filter(([k, w]) => prefixRe.test(k) && (!days || S.day - (w.day || 0) <= days)).slice(0, limit || 15).map(([k, w]) => { const q = itemByKey(k); return q && q.t !== "free" && q.stem ? Q(k, q, w.dom || "R", {label:`다시 풀기 · ${q.where}`}) : null; }).filter(Boolean);
}
function buildSteps(n, k){
  const kind = dayKind(n), dc = dayContent(n), cur = curDay(n);
  const steps = [];
  const P = PERIODS.find(p => p.k === k);
  if(kind === "content" && dc){
    if(k === "p1"){
      const due = srsDue("vv.", 10);
      if(due.length) steps.push({id:"vrev", title:"낱말 복습", mins:5, qs:() => due.map(c => { const it = srsItem(c); return it && Q(it.key, it.q, "V", {label:it.label, srs:c}); }).filter(Boolean)});
      steps.push({id:"vocab", title:"오늘의 낱말", mins:8, render:stepVocab, qs:() => dayQuestionItems(n, "vocab"), after:() => dc.vocab.forEach((v, i) => srsAdd(`vv.${n}.${i}`))});
      steps.push({id:"read", title:"지문 읽기", mins:15, render:stepReading});
      steps.push({id:"rq", title:"이해 문제", mins:12, qs:() => dayQuestionItems(n, "reading"), weak:"reading", strong:"reading"});
      steps.push({id:"sum", title:"자기 말로 요약", mins:8, qs:() => [Q(`d${n}.sum`, {t:"free", stem:dc.reading.sum.prompt, keyPoints:dc.reading.sum.keyPoints, model:dc.reading.sum.model}, "R", {label:"요약"})]});
    }
    if(k === "p2"){
      const due = srsDue("cc.", 12);
      if(due.length) steps.push({id:"crev", title:"개념 복습 카드", mins:10, qs:() => due.map(c => { const it = srsItem(c); return it && Q(it.key, it.q, it.dom, {label:it.label, srs:c, concept:it.concept}); }).filter(Boolean)});
      (cur.concepts || []).forEach(cid => steps.push({id:"con-" + cid, title:"새 개념: " + (CONCEPT_BY_ID[cid] || {}).name, mins:9, render:(s) => stepConcept(cid, s), concept:cid}));
      steps.push({id:"cq", title:"확인·응용 문제", mins:12, qs:() => (cur.concepts || []).flatMap(cid => { const c = D.concepts[cid]; if(!c) return []; return c.quiz.map((q, i) => q.t === "free" ? null : Q(`c.${cid}.${i}`, q, (CONCEPT_BY_ID[cid] || {}).dom || "E", {label:`개념: ${c.name}`, concept:cid})).filter(Boolean); }), weak:"concept", strong:"concept"});
      steps.push({id:"cx", title:"자기 말로 설명", mins:8, qs:() => (cur.concepts || []).map(cid => { const c = D.concepts[cid]; return c && Q(`c.${cid}.explain`, {t:"free", stem:c.explain.prompt, keyPoints:c.explain.keyPoints, model:c.explain.model}, "W", {label:`설명하기: ${c.name}`}); }).filter(Boolean)});
    }
    if(k === "p3"){
      steps.push({id:"nread", title:"기사 읽기", mins:8, render:stepNewsRead});
      steps.push({id:"nsteps", title:"단계별 질문", mins:25, qs:() => dc.news.steps.map((s, i) => Q(`d${n}.ns${i}`, {t:"free", stem:s.q, keyPoints:[s.hint || "기사 속 근거를 들었다", "모범 답안과 핵심이 같다"].filter(Boolean), model:s.model}, "N", {label:`생각 단계 ${i + 1}/${dc.news.steps.length}: ${({fact:"무엇이 사실인가", meaning:"무슨 뜻인가", why:"왜 일어났나", link:"어떻게 연결되나", unknown:"아직 모르는 것", judge:"어떤 판단을 할 수 있나", counter:"판단이 틀릴 수 있는 이유"})[s.k] || ""}`, newsStep:s.k}))});
      steps.push({id:"nq", title:"판단 문제", mins:7, qs:() => dayQuestionItems(n, "news")});
      steps.push({id:"ncard", title:"뉴스 기록 카드", mins:10, render:stepNewsCard});
    }
    if(k === "p4"){
      steps.push({id:"cread", title:dc.company.mode === "dart" ? "사업보고서 연습 발췌 읽기" : "기업 사례 읽기", mins:12, render:stepCompanyRead});
      steps.push({id:"cqs", title:"분석 문제", mins:18, qs:() => dayQuestionItems(n, "company"), weak:"company"});
    }
    if(k === "p5"){
      steps.push({id:"mread", title:"시장 자료 읽기", mins:10, render:stepMarketRead});
      steps.push({id:"mqs", title:"분석 문제", mins:15, qs:() => dayQuestionItems(n, "market"), weak:"market"});
      steps.push({id:"mcls", title:"사실·가능한 설명·확인된 원인", mins:12, qs:() => dc.market.classify.map((c, i) => Q(`d${n}.k${i}`, {t:"mcq", stem:`이 문장은 무엇일까요? “${c.s}”`, options:["자료에 적힌 사실","가능한 설명(아직 확인 안 됨)","자료로 확인된 원인"], answer:{fact:0, possible:1, verified:2}[c.a], explain:c.why}, "M", {label:"분류하기"}))});
    }
    if(k === "p6"){
      steps.push({id:"wrev", title:"오늘 배운 것 다시 보기", mins:5, render:stepWriteReview});
      steps.push({id:"wwrite", title:"글쓰기", mins:25, render:stepWrite});
      steps.push({id:"wself", title:"스스로 점검", mins:5, render:stepWriteSelf});
      steps.push({id:"wmodel", title:"모범 글 비교와 고쳐 쓰기", mins:15, render:stepWriteModel});
    }
  } else {
    buildReviewSteps(n, k, steps, kind);
  }
  const isAssess = steps.some(s => s.id === "assess" || s.id === "wassess");
  if(!isAssess){
    const firstK = steps0FirstPeriod(n);
    if(k === firstK){ const rv = reviewStep(n); if(rv) steps.unshift(rv); }
    steps.push(...missionSteps(n, k));
  }
  steps.push({id:"end", title:"교시 마무리", mins:2, render:stepEnd});
  return steps;
}
function steps0FirstPeriod(n){ const kind = dayKind(n); const isCp = kind === "checkpoint" || (kind === "review" && CHECKPOINTS.includes(n)) || (kind === "advanced" && n % 30 === 0); return isCp ? "p3" : "p1"; }
function buildReviewSteps(n, k, steps, kind){
  const isCp = kind === "checkpoint" || (kind === "review" && CHECKPOINTS.includes(n)) || (kind === "advanced" && n % 30 === 0);
  if(k === "p1" && isCp){ steps.push({id:"assess", title:`${n}일 평가: 새 문제로 레벨 확인`, mins:45, render:stepAssess}); return; }
  if(k === "p2" && isCp){ steps.push({id:"wassess", title:"글쓰기 평가와 첫날 글 다시 쓰기", mins:45, render:stepWriteAssess}); return; }
  if(k === "p1"){
    steps.push({id:"rwrong", title:"틀린 독해·어휘 문제 다시 풀기", mins:15, qs:() => wrongItems(/^d\d+\.[rv]\d+$/, kind === "advanced" ? 60 : 8, 15)});
    const due = srsDue("vv.", 30);
    steps.push({id:"vrev", title:"낱말 복습", mins:15, qs:() => due.map(c => { const it = srsItem(c); return it && Q(it.key, it.q, "V", {label:it.label, srs:c}); }).filter(Boolean)});
    steps.push({id:"reread", title:"지난 지문 다시 읽고 다시 요약하기", mins:18, render:stepReread});
  }
  if(k === "p2"){
    const due = srsDue("cc.", 30);
    steps.push({id:"crev", title:"개념 복습 카드", mins:25, qs:() => due.map(c => { const it = srsItem(c); return it && Q(it.key, it.q, it.dom, {label:it.label, srs:c, concept:it.concept}); }).filter(Boolean)});
    steps.push({id:"cmap", title:"이번 주 개념 연결하기", mins:20, render:stepConceptMap});
  }
  if(k === "p3"){ steps.push({id:"nlink", title:"이번 주 뉴스 연결하기", mins:20, render:stepNewsLink}); }
  if(k === "p4"){ steps.push({id:"cwrong", title:"틀린 기업 문제 다시 풀기", mins:15, qs:() => wrongItems(/^(d\d+\.c\d+|c\.[a-z_0-9]+\.\d+)$/, kind === "advanced" ? 60 : 8, 12)}); }
  if(k === "p5"){ steps.push({id:"mwrong", title:"틀린 시장 문제 다시 풀기", mins:15, qs:() => wrongItems(/^d\d+\.[mk]\d+$/, kind === "advanced" ? 60 : 8, 12)}); }
  if(k === "p6"){ steps.push({id:"wweek", title:kind === "advanced" ? "자유 분석글 쓰기" : "이번 주 종합 글 쓰기", mins:25, render:stepWrite}); steps.push({id:"wself", title:"스스로 점검", mins:5, render:stepWriteSelf}); steps.push({id:"wredo", title:"지난 글 고쳐 쓰기", mins:20, render:stepRewriteOld}); }
}
function weakExtra(kind){
  return (wrong) => {
    const n = UI.run.day, dc = dayContent(n);
    if(kind === "reading" && dc) return `<div class="warnbox"><b>이해가 어려웠다면</b>: 쉬운 버전으로 다시 읽어 보세요.<div class="passage small">${linkText(dc.reading.easy)}</div><button class="btn small ghost" data-act="retryWrong">틀린 문제 다시 풀기</button></div>`;
    if(kind === "concept"){ const cs = (curDay(n).concepts || []).map(id => D.concepts[id]).filter(Boolean); return `<div class="warnbox"><b>다른 설명으로 한 번 더</b>${cs.map(c => `<p><b>${esc(c.name)}</b>: ${esc(c.alt)}<br><span class="small">${esc(c.altExample)}</span></p>`).join("")}<button class="btn small ghost" data-act="retryWrong">틀린 문제 다시 풀기</button><p class="small muted">다시 푼 결과는 ‘다시 풀기’로 따로 기록돼 실력 점수에는 넣지 않아요. 진짜 확인은 며칠 뒤 복습에서 해요.</p></div>`; }
    return `<div class="warnbox">해설을 읽고 <button class="btn small ghost" data-act="retryWrong">틀린 문제 다시 풀기</button><p class="small muted">다시 푼 결과는 실력 점수에 넣지 않아요.</p></div>`;
  };
}
function strongExtra(kind){
  return () => {
    const n = UI.run.day;
    const prompt = kind === "concept" ? "도전: 오늘 배운 개념이 앞에서 배운 개념 하나와 어떻게 연결되는지, 실제 상황 예를 들어 설명해 보세요." : kind === "reading" ? "도전: 이 글의 주장이나 설명이 틀릴 수 있는 경우를 하나 찾아 근거와 함께 써 보세요." : "도전: 오늘 자료에서 내가 아직 모르는 것 두 가지와 그것을 확인할 방법을 써 보세요.";
    return `<div class="notebox"><b>잘했어요. 한 단계 높은 과제를 해 볼까요?</b><label class="f" for="chal">${esc(prompt)}<textarea id="chal" data-free="d${n}.chal.${kind}">${esc((S.answers[`d${n}.chal.${kind}`] || {}).text || "")}</textarea></label><p class="small muted">도전 과제는 자유롭게 쓰고 자동 저장돼요.</p></div>`;
  };
}

/* ---------- 각 활동 화면 ---------- */
function stepVocab(){
  const n = UI.run.day, dc = dayContent(n);
  TTS_TEXT.vocab = dc.vocab.map(v => `${v.w}. ${v.m}. ${v.ex}`).join(" ");
  return `<p class="small muted">낱말 뜻을 먼저 읽고, 예문 속에서 어떻게 쓰이는지 보세요. 그다음 문제를 풀어요.</p>${ttsBtn("vocab")}
  <div class="vocab-grid">${dc.vocab.map(v => `<div class="vcard"><div class="vw">${esc(v.w)}</div><div>${esc(v.m)}</div><div class="small muted">예문: ${esc(v.ex)}</div></div>`).join("")}</div>`;
}
function stepReading(){
  const n = UI.run.day, dc = dayContent(n), r = dc.reading;
  const low = (S.levels && (S.levels.R ?? 0) <= 1);
  const mode = UI.run.readMode || (low ? "easy" : "full");
  const pl = periodLog(n, "p1");
  const keyRes = pl.keyPick;
  TTS_TEXT.read = mode === "easy" ? r.easy : r.text;
  const sents = sentences(r.text);
  return `<div class="row"><span class="tag">독해 레벨 R${r.level}</span><button class="btn small ${mode === "easy" ? "" : "ghost"}" data-act="readMode" data-m="easy">쉬운 버전</button><button class="btn small ${mode === "full" ? "" : "ghost"}" data-act="readMode" data-m="full">원래 글</button><button class="btn small ${mode === "split" ? "" : "ghost"}" data-act="readMode" data-m="split">문장 나눠 읽기</button>${ttsBtn("read")}</div>
  <h3>${esc(r.title)}</h3>
  ${mode === "split" ? `<ol class="split">${sents.map(s => `<li>${linkText(s)}</li>`).join("")}</ol>` : `<div class="passage">${linkText(mode === "easy" ? r.easy : r.text)}</div>`}
  ${low && mode === "easy" ? `<p class="small muted">쉬운 버전을 먼저 읽었다면 ‘원래 글’도 꼭 읽어 보세요. 문제는 원래 글 기준이에요.</p>` : ""}
  <div class="check"><div class="lbl">과제: 이 글에서 가장 중요한 문장을 하나 골라 누르세요</div>
  <div class="sent-pick">${sents.map((s, i) => `<button class="sp ${keyRes ? (s.includes(r.key.trim()) || r.key.includes(s) ? "right" : (keyRes.i === i ? "wrong" : "")) : ""}" data-act="pickKey" data-i="${i}" ${keyRes ? "disabled" : ""}>${esc(s)}</button>`).join("")}</div>
  ${keyRes ? `<div class="${keyRes.ok ? "notebox" : "warnbox"}">${keyRes.ok ? "핵심 문장을 정확히 골랐어요." : "글쓴이가 가장 말하고 싶은 문장은 초록색으로 표시된 문장이에요."} 핵심 문장은 보통 글 전체 내용을 한 번에 담고 있어요.</div>` : ""}</div>`;
}
function stepConcept(cid, s){
  const c = D.concepts[cid]; if(!c) return `<p class="warnbox">이 개념의 교재가 아직 준비되지 않았어요.</p>`;
  const st = S.concepts[cid] || (S.concepts[cid] = {learned:S.day, learnedDate:today(), mastered:false});
  if(!st.learnedDate){ st.learnedDate = today(); st.learned = S.day; }
  srsAdd("cc." + cid);
  TTS_TEXT["c" + cid] = `${c.name}. ${c.easy} ${c.analogy} ${c.real} ${c.example}`;
  const links = (c.links || []).filter(l => CONCEPT_BY_ID[l.to]);
  return `<div class="row"><span class="tag">${esc(DOMAINS[(CONCEPT_BY_ID[cid] || {}).dom] || "")}</span>${ttsBtn("c" + cid)}</div>
  <h3 class="cname">${esc(c.name)}</h3>
  <div class="ex-card"><div class="daily"><span class="k">쉽게</span><span>${esc(c.easy)}</span></div><div class="daily"><span class="k">일상 예시</span><span>${esc(c.analogy)}</span></div><div class="daily"><span class="k">실제 뜻</span><span>${linkText(c.real)}</span></div><div class="daily"><span class="k">뉴스 속</span><span>${esc(c.example)}</span></div></div>
  <div class="row"><button class="btn small ghost" data-act="altExplain" data-c="${cid}">잘 모르겠어요: 다른 설명 보기</button></div>
  <div id="alt-${cid}" class="help-panel" ${st.altSeen ? "" : "hidden"}><b>다른 각도로</b><br>${esc(c.alt)}<br><br><b>다른 예시</b><br>${esc(c.altExample)}</div>
  ${links.length ? `<div class="prev"><div class="lbl">앞에서 배운 개념과의 연결</div>${links.map(l => `<div>→ <b>${esc(CONCEPT_BY_ID[l.to].name)}</b>${CONCEPT_BY_ID[l.to].day <= S.day ? "" : " (앞으로 배울 개념)"}: ${esc(l.why)}</div>`).join("")}</div>` : ""}
  <p class="small muted">이 개념을 익히면: ${esc(c.canDo)}</p>`;
}
function stepNewsRead(){
  const n = UI.run.day, nw = dayContent(n).news;
  TTS_TEXT.news = `${nw.headline}. ${nw.body}`;
  return `<div class="newsbox"><div class="row between small"><span class="tag">${esc(nw.source)}</span><span class="muted">${esc(nw.dateLabel || "")}</span></div><h3>${esc(nw.headline)}</h3><div class="passage">${linkText(nw.body)}</div></div>${ttsBtn("news")}
  <div class="help-panel small"><b>읽기 전 습관</b>: 누가 썼는지(출처), 언제 일인지(날짜)부터 확인해요. 이 기사는 공부용으로 만든 <b>가상 기사</b>예요. 실제 뉴스는 ‘심화 → 실제 뉴스 분석’에서 같은 방법으로 공부할 수 있어요.</div>`;
}
function stepNewsCard(){
  const n = UI.run.day, nw = dayContent(n).news;
  const rec = newsRecordFor(n);
  const f = rec.fields;
  const prev = S.news.filter(x => x.id !== rec.id).slice(-12).reverse();
  const fld = (k, label, ph) => `<label class="f" for="nf-${k}">${label}<textarea id="nf-${k}" data-nf="${k}" rows="2" style="min-height:64px" placeholder="${esc(ph || "")}">${esc(f[k] || "")}</textarea></label>`;
  return `<p class="small muted">뉴스를 공부할 때마다 이 카드가 쌓여요. 짧게 써도 괜찮아요.</p>
  ${fld("words","어려웠던 낱말","")}${fld("stakeholders","주요 이해관계자(누가 영향을 받나)","")}${fld("impactShort","단기 영향","")}${fld("impactLong","중장기 영향","")}${fld("stockLink","주식시장과의 연관","")}${fld("btcLink","비트코인 시장과의 연관","")}${fld("knownNew","이미 알려진 사실과 새로 나타난 사실","")}${fld("check","추가로 확인할 것","")}
  ${prev.length ? `<fieldset><legend>연결되는 이전 뉴스가 있나요? (선택)</legend>${prev.map(p => `<label class="opt"><input type="checkbox" data-nlink="${p.id}" ${(rec.links || []).some(l => l.id === p.id) ? "checked" : ""}><span>${esc(p.headline)} <span class="small muted">(${p.day}일차${p.isReal ? ", 실제" : ""})</span></span></label>`).join("")}<label class="f" for="nf-linkWhy">연결 이유<input id="nf-linkWhy" type="text" data-nf="linkWhy" value="${esc(f.linkWhy || "")}"></label></fieldset>` : ""}
  <details class="ev"><summary>모범 기록과 비교하기</summary><dl class="model">${[["stakeholders","이해관계자"],["impactShort","단기 영향"],["impactLong","중장기 영향"],["stockLink","주식시장 연관"],["btcLink","비트코인 연관"]].map(([k, l]) => `<dt>${l}</dt><dd>${esc(nw.record[k] || "")}</dd>`).join("")}</dl></details>`;
}
function newsRecordFor(n){
  let rec = S.news.find(x => x.day === n && !x.isReal);
  if(!rec){ const nw = dayContent(n).news; rec = {id:"n" + n, day:n, date:today(), headline:nw.headline, source:nw.source, srcDate:nw.dateLabel, isReal:false, fields:{}, links:[]}; S.news.push(rec); touch(); }
  return rec;
}
function stepCompanyRead(){
  const n = UI.run.day, c = dayContent(n).company;
  TTS_TEXT.comp = `${c.title}. ${c.text}`;
  return `<div class="row"><span class="tag">${c.mode === "dart" ? "사업보고서 연습(가상 발췌)" : c.mode === "idea" ? "투자 아이디어 사례(가상)" : "기업 사례(가상)"}</span>${c.firm ? `<span class="tag">${esc(c.firm)}</span>` : ""}${ttsBtn("comp")}</div>
  <h3>${esc(c.title)}</h3><div class="passage">${linkText(c.text)}</div>${tableHTML(c.table)}
  ${c.dartLesson ? `<p class="small muted">오늘 실제 기업에서 읽을 부분: 워크북 학습 ${esc(c.dartLesson.replace("L", ""))} (${esc(WB.getL(c.dartLesson)?.title || "")})</p>` : ""}`;
}
function activeCompany(){ const cs = Object.values(S.companies || {}); if(!cs.length) return null; return cs.find(c => c.id === S.activeCompany) || cs.sort((a, b) => (b.updated || 0) - (a.updated || 0))[0]; }
function stepCompanyApply(){
  const n = UI.run.day, dc = dayContent(n), c = dc ? dc.company : null;
  const lid = c && c.dartLesson ? c.dartLesson : null;
  const co = activeCompany();
  if(!c || c.mode === "dart" || !dc){
    if(!co) return `<div class="card flat"><h3>실제 기업을 하나 골라 주세요</h3><p>오늘부터 실제 상장기업의 사업보고서를 DART에서 함께 읽어요. 처음이라면 이름을 들어 본 회사, 내가 쓰는 물건을 만드는 회사가 좋아요.</p><button class="btn" data-act="openWB" data-l="L0">기업 고르러 가기 (워크북)</button></div>`;
    const target = lid || "L1";
    const ls = WB.lessonState(co, target) || {doneN:0, qs:0};
    return `<div class="card flat"><h3>${esc(co.name)} · 워크북 학습 ${target.replace("L", "")}. ${esc(WB.getL(target)?.title || "")}</h3>
    <p>앞의 연습 발췌에서 배운 방법 그대로, 실제 ${esc(co.name)} 사업보고서의 같은 부분을 읽고 답하세요. 답은 워크북에 쌓여 기업분석 글이 돼요.</p>
    <p class="small">이 학습의 질문 처리: <b>${ls.doneN}/${ls.qs}</b></p>
    ${c && c.apply ? `<div class="help-panel small">${esc(c.apply)}</div>` : ""}
    <div class="row"><button class="btn" data-act="openWB" data-l="${target}">워크북에서 학습 ${target.replace("L", "")} 하기</button><button class="btn ghost" data-act="openWB" data-l="">다른 기업 고르기</button></div>
    <p class="small muted">DART를 열 수 없는 날은 이 단계를 건너뛰고 ‘다음’을 눌러도 돼요. 기록에 ‘미완료’로 남아요.</p></div>`;
  }
  const key = `d${n}.apply`;
  const a = S.answers[key] || {};
  const prompt = c.apply || "오늘 사례에서 배운 분석 방법을 한 문장으로 정리해 보세요. 실제 기업에 쓴다면 무엇을 먼저 확인하겠어요?";
  return `<label class="f" for="applyTxt">${esc(prompt)}<textarea id="applyTxt" data-free="${key}" placeholder="내 생각을 근거와 함께 써 보세요">${esc(a.text || "")}</textarea></label>
  ${evalBox("ev." + key, {stem:prompt, model:"(정해진 모범 답 없음: 근거와 논리, 사실과 추측의 구분으로 평가)", kp:[], text:a.text || "", label:"기업 적용"})}
  ${co ? `<p class="small muted">이 답은 ‘${esc(co.name)}’ 투자 아이디어 노트에도 함께 쌓여요.</p>` : `<p class="small muted">실제 기업을 고르면(워크북) 이 답이 그 기업의 투자 아이디어 노트에 쌓여요.</p>`}
  ${c.mode === "idea" ? `<div class="help-panel small"><b>투자 아이디어 점검</b>: 그럴듯한 추측과 근거로 확인된 사실을 구분했나요? 내 생각이 틀렸다고 볼 조건을 적었나요?</div>` : ""}`;
}
function stepMarketRead(){
  const n = UI.run.day, m = dayContent(n).market;
  TTS_TEXT.mkt = (m.notes || []).join(" ");
  return `<div class="row"><span class="tag">${esc(m.dateLabel || "가상 시장일")}</span><span class="tag">교육용 가상 자료</span>${ttsBtn("mkt")}</div><h3>${esc(m.title)}</h3>${tableHTML(m.table)}
  ${(m.notes || []).length ? `<div class="prev"><div class="lbl">자료에 적힌 사실</div>${m.notes.map(x => `<div>· ${linkText(x).replace(/^<p>|<\/p>$/g, "")}</div>`).join("")}</div>` : ""}
  <div class="help-panel small">표를 읽을 때: ① 단위와 기준(언제, 무엇 대비)을 먼저 보고 ② 가장 크게 움직인 숫자를 찾고 ③ 그 움직임의 원인 후보를 생각해요. 원인 후보는 아직 ‘확인된 원인’이 아니에요.</div>`;
}
function stepMarketMemo(){
  const n = UI.run.day;
  let rec = S.marketLog.find(x => x.day === n && !x.isReal);
  const t = rec ? rec.text : "";
  return `<label class="f" for="mmemo">오늘 자료에서 가장 중요한 움직임 하나와 그 원인 후보를 써 보세요. 원인 후보마다 ‘가능한 설명’인지 ‘자료로 확인된 원인’인지 표시해요.<textarea id="mmemo" data-mmemo="${n}" placeholder="예: 가장 큰 움직임은 … / 원인 후보: … (가능한 설명) / 확인할 것: …">${esc(t)}</textarea></label>
  <p class="small muted">이 메모는 ‘기록 → 시장’에 날짜별로 쌓여요. 실제 시장 자료는 ‘심화 → 실제 시장 기록’에서 출처와 날짜를 붙여 남길 수 있어요.</p>`;
}
function stepWriteReview(){
  const n = UI.run.day, cur = curDay(n), dc = dayContent(n);
  const mine = [[`d${n}.sum`, "독해 요약"], [`d${n}.ns0`, "뉴스: 사실"], [`d${n}.ns2`, "뉴스: 원인"], [`d${n}.apply`, "기업 적용"]].map(([k, l]) => S.answers[k] && S.answers[k].text ? `<div><span class="lbl">${l}</span><div class="small">${esc(S.answers[k].text)}</div></div>` : "").join("");
  const memo = S.marketLog.find(x => x.day === n && !x.isReal);
  return `<p>오늘 배운 개념: ${(cur.concepts || []).map(id => `<b>${esc((CONCEPT_BY_ID[id] || {}).name || id)}</b>`).join(", ") || "복습"}</p>
  <div class="prev"><div class="lbl">오늘 내가 쓴 답 (글감)</div>${mine || '<span class="small muted">아직 쓴 답이 없어요.</span>'}${memo ? `<div><span class="lbl">시장 메모</span><div class="small">${esc(memo.text)}</div></div>` : ""}</div>
  <p class="small muted">좋은 글은 정보를 늘어놓지 않고, 무슨 일이 있었는지 → 왜 그런지 → 무엇과 연결되는지를 이어서 써요.</p>`;
}
function writingTask(n){
  const dc = dayContent(n), kind = dayKind(n);
  if(dc && kind === "content") return Object.assign({key:`d${n}.write`}, dc.writing);
  const types = ["stock","crypto","company","macro","news"];
  const t = types[n % types.length];
  if(kind === "advanced") return {key:`d${n}.write`, type:t, prompt:`실제 자료로 ${WRITE_TYPES[t]}을(를) 써 보세요. 자료의 출처와 날짜를 첫 줄에 적고, 사실·해석·반론·확인할 것을 나눠 쓰세요.`, frame:[], size:"3~4문단", keyPoints:["출처와 날짜를 밝혔다","사실과 해석을 구분했다","원인과 결과를 연결했다","반론이나 한계를 적었다","다음에 확인할 것을 적었다"], model:"(실제 자료 글은 모범 글이 없어요. 스스로 점검 6문항과 예전 글 비교로 확인하세요.)"};
  const wk = Math.ceil(n / 7);
  return {key:`d${n}.write`, type:"macro", prompt:`이번 주(${wk}주차)에 배운 개념 가운데 두세 개를 골라, 그것들이 서로 어떻게 연결되는지 한 편의 글로 설명하세요. 이번 주 뉴스나 시장 자료 하나를 예로 드세요.`, frame:phaseOf(n) === 1 ? ["이번 주에 배운 ○○와 △△는 서로 연결되어 있다."] : [], size:phaseOf(n) === 1 ? "3~5문장" : phaseOf(n) === 2 ? "1~2문단" : "3문단", keyPoints:["개념의 뜻을 정확히 썼다","개념 사이의 연결(원인→결과)을 썼다","예시를 들었다","사실과 의견을 구분했다"], model:"(주간 종합 글은 정해진 모범 글이 없어요. 이번 주 개념 설명과 비교해 보세요.)"};
}
function portfolioFor(key){ return S.portfolio.find(p => p.key === key); }
function stepWrite(){
  const n = UI.run.day, w = writingTask(n);
  const p = portfolioFor(w.key);
  const showFrame = w.frame && w.frame.length && (phaseOf(n) === 1 || (S.levels && (S.levels.W ?? 0) <= 2) || UI.run.showFrame);
  const prev = S.portfolio.filter(x => x.type === w.type && x.key !== w.key).slice(-1)[0];
  return `<div class="row"><span class="tag">${esc(WRITE_TYPES[w.type] || "")}</span><span class="tag">분량: ${esc(w.size || "")}</span></div>
  <p class="lead">${esc(w.prompt)}</p>
  ${w.frame && w.frame.length ? (showFrame ? `<div class="help-panel small"><b>문장 틀</b> (그대로 써도, 바꿔 써도 돼요)<br>${w.frame.map(esc).join("<br>")}</div>` : `<button class="btn small ghost" data-act="showFrame">문장 틀 보기</button>`) : ""}
  <label class="f" for="wtext">내 글<textarea id="wtext" data-write="${esc(w.key)}" style="min-height:220px" placeholder="여기에 쓰세요. 자동 저장돼요.">${esc(p ? p.v1 : "")}</textarea></label>
  <div id="wcount" class="small muted">${countInfo(p ? p.v1 : "")}</div>
  ${prev ? `<details class="ev"><summary>같은 종류의 지난 글 보기 (${prev.day}일차)</summary><p class="small" style="white-space:pre-wrap">${esc(prev.text)}</p></details>` : ""}
  <p class="small muted">글의 길이가 늘어난 것 자체를 실력 향상으로 보지 않아요. 정확하고, 근거가 있고, 원인과 결과가 이어지는지가 중요해요.</p>`;
}
function countInfo(t){ t = t || ""; return `${t.replace(/\s/g, "").length}자 · ${countSent(t)}문장 · ${t.split(/\n\s*\n/).filter(x => x.trim()).length || 0}문단`; }
function stepWriteSelf(){
  const n = UI.run.day, w = writingTask(n), p = portfolioFor(w.key);
  if(!p || !p.v1.trim()) return `<p class="warnbox">아직 쓴 글이 없어요. 앞 단계에서 글을 먼저 써 주세요.</p>`;
  return `<p class="small muted">솔직하게 체크하세요. 체크한 결과는 ‘자가 점검’으로만 기록되고, 다음 글을 쓸 때 참고 자료가 돼요.</p>
  <ul class="checks">${SELF_CHECK6.map((t, i) => `<li><label><input type="checkbox" data-self="${esc(w.key)}" data-i="${i}" ${(p.self || [])[i] ? "checked" : ""}><span>${esc(t)}</span></label></li>`).join("")}</ul>
  <label class="f" for="wnote">다음에 고칠 점 한 줄<input id="wnote" type="text" data-wnote="${esc(w.key)}" value="${esc(p.note || "")}"></label>
  ${(() => { const last = S.portfolio.filter(x => x.key !== w.key && x.note).slice(-1)[0]; return last ? `<p class="small">지난번 내가 적은 고칠 점: <b>${esc(last.note)}</b> → 이번에 지켰나요?</p>` : ""; })()}`;
}
function stepWriteModel(){
  const n = UI.run.day, w = writingTask(n), p = portfolioFor(w.key);
  if(!p || !p.v1.trim()) return `<p class="warnbox">아직 쓴 글이 없어요.</p>`;
  return `<div class="cols"><div><div class="lbl">내 글</div><div class="echo">${esc(p.v1)}</div></div><div><div class="lbl">모범 글</div><div class="echo">${esc(w.model)}</div></div></div>
  <div><div class="lbl">모범 글의 핵심 요소가 내 글에 있나요?</div><ul class="checks">${(w.keyPoints || []).map((k, i) => `<li><label><input type="checkbox" data-wkp="${esc(w.key)}" data-i="${i}" ${(p.kp || [])[i] ? "checked" : ""}><span>${esc(k)}</span></label></li>`).join("")}</ul></div>
  ${evalBox("ev." + w.key, {stem:w.prompt, model:w.model, kp:w.keyPoints, text:p.text, label:"글쓰기"})}
  <label class="f" for="wv2">고쳐 쓰기 (선택: 모범 글을 베끼지 말고 내 글을 고쳐요)<textarea id="wv2" data-write2="${esc(w.key)}" style="min-height:160px">${esc(p.v2 || "")}</textarea></label>`;
}
function stepRewriteOld(){
  const cands = S.portfolio.filter(p => S.day - p.day <= 14 && p.day < S.day).sort((a, b) => ((a.self || []).filter(Boolean).length) - ((b.self || []).filter(Boolean).length));
  const p = cands[0];
  if(!p) return `<p class="muted">최근 2주 안에 쓴 글이 없어 고쳐 쓸 글이 없어요.</p>`;
  const key = `rw.${p.id}.${S.day}`;
  return `<p>최근 글 가운데 스스로 점검 결과가 가장 낮았던 글이에요(${p.day}일차, ${esc(WRITE_TYPES[p.type] || "")}). 지금 배운 것을 써서 다시 써 보세요.</p>
  <div class="echo">${esc(p.text)}</div>${p.note ? `<p class="small">그때 적은 고칠 점: ${esc(p.note)}</p>` : ""}
  <label class="f" for="rw">다시 쓴 글<textarea id="rw" data-rewrite="${esc(p.id)}" style="min-height:180px">${esc((S.answers[key] || {}).text || "")}</textarea></label>
  <p class="small muted">다시 쓴 글은 포트폴리오에 ‘고쳐 쓰기’로 저장되고, 원래 글과 나란히 비교할 수 있어요.</p>`;
}
function stepReread(){
  const n = S.day;
  let best = null;
  for(let d = Math.max(1, n - 7); d < n; d++){ const dc = dayContent(d); if(!dc) continue; const at = S.attempts.filter(a => a.k.startsWith(`d${d}.r`) && a.s !== "retry"); const acc = accuracy(at); if(acc !== null && (!best || acc < best.acc)) best = {d, acc}; }
  if(!best){ for(let d = n - 1; d >= 1; d--) if(dayContent(d)){ best = {d, acc:null}; break; } }
  if(!best) return `<p class="muted">다시 읽을 지문이 없어요.</p>`;
  const r = dayContent(best.d).reading;
  const prev = S.answers[`d${best.d}.sum`];
  const key = `rr.${best.d}.${n}`;
  return `<p>이번 주 지문 중 정답률이 가장 낮았던 ${best.d}일차 지문이에요${best.acc !== null ? ` (정답률 ${best.acc}%)` : ""}.</p><h3>${esc(r.title)}</h3><div class="passage">${linkText(r.text)}</div>
  ${prev && prev.text ? `<div class="prev"><div class="lbl">그때 내가 쓴 요약</div><div class="small">${esc(prev.text)}</div></div>` : ""}
  <label class="f" for="rrt">지금 다시 요약하기<textarea id="rrt" data-free="${key}">${esc((S.answers[key] || {}).text || "")}</textarea></label>
  <details class="ev"><summary>모범 요약</summary><p>${esc(r.sum.model)}</p></details>`;
}
function stepConceptMap(){
  const n = S.day;
  const learned = Object.entries(S.concepts).filter(([, c]) => c.learned && n - c.learned <= 7).map(([id]) => id);
  const key = `cm.${n}`;
  const pairs = [];
  learned.forEach(id => (D.concepts[id]?.links || []).forEach(l => { if(S.concepts[l.to]) pairs.push([id, l.to]); }));
  return `<p>이번 주에 배운 개념: ${learned.map(id => `<b>${esc((CONCEPT_BY_ID[id] || {}).name)}</b>`).join(", ") || "없음"}</p>
  ${pairs.length ? `<p class="small">연결해 볼 만한 짝: ${pairs.slice(0, 4).map(([a, b]) => `${esc(CONCEPT_BY_ID[a].name)} ↔ ${esc(CONCEPT_BY_ID[b].name)}`).join(" / ")}</p>` : ""}
  <label class="f" for="cmt">개념 두세 개를 골라 ‘A가 변하면 → B가 변하고 → C에 영향’처럼 연결해 설명하세요<textarea id="cmt" data-free="${key}">${esc((S.answers[key] || {}).text || "")}</textarea></label>
  <details class="ev"><summary>교재에 적힌 연결 이유 보기</summary>${pairs.slice(0, 6).map(([a, b]) => `<p class="small"><b>${esc(CONCEPT_BY_ID[a].name)} → ${esc(CONCEPT_BY_ID[b].name)}</b>: ${esc((D.concepts[a].links.find(l => l.to === b) || {}).why || "")}</p>`).join("") || "<p class='small'>연결 정보가 없어요.</p>"}</details>`;
}
function stepNewsLink(){
  const recent = S.news.filter(x => S.day - x.day <= 7);
  const key = `nl.${S.day}`;
  return `<p>이번 주 뉴스 기록 ${recent.length}개</p>${recent.map(x => `<div class="ansrow"><div><b>${esc(x.headline)}</b> <span class="small muted">${x.day}일차${x.isReal ? " · 실제" : " · 가상"}</span></div><div class="small">${esc(x.fields.fact || (S.answers[`d${x.day}.ns0`] || {}).text || "")}</div></div>`).join("")}
  <label class="f" for="nlt">이 뉴스들 가운데 두 개 이상을 연결해, 하나의 흐름으로 설명해 보세요. 연결이 무리하다면 왜 무리인지도 써 보세요.<textarea id="nlt" data-free="${key}">${esc((S.answers[key] || {}).text || "")}</textarea></label>`;
}
function stepRealNews(){ return `<p>오늘 읽은 실제 경제기사가 있다면 ‘심화 → 실제 뉴스 분석’에서 제목·출처·날짜·본문을 넣고 같은 7단계로 분석하세요. 없으면 이 단계는 건너뛰어도 돼요.</p><button class="btn ghost" data-act="go" data-v="extra" data-t="realnews">실제 뉴스 분석 열기</button>`; }
function stepRealMarket(){ return `<p>오늘의 실제 시장 숫자(코스피, 나스닥, 원·달러 환율, 미국 10년 국채금리, 비트코인 등)를 증권사 앱이나 신문에서 보고 ‘심화 → 실제 시장 기록’에 출처와 시각을 붙여 남기세요. 이 기록이 쌓이면 나만의 시장 일지가 돼요.</p><button class="btn ghost" data-act="go" data-v="extra" data-t="realmarket">실제 시장 기록 열기</button>`; }
function stepEnd(){
  const pl = periodLog(UI.run.day, UI.run.k);
  const keys = Object.keys(pl.ans || {});
  const obj = keys.filter(k => pl.ans[k] !== null);
  const ok = obj.filter(k => pl.ans[k]).length;
  return `<h3>이번 교시 결과</h3><p>집중 시간 <b>${fmtDur(pl.active)}</b> · 화면을 연 시간 ${fmtDur(pl.open)}${pl.idle ? ` · 쉬었다고 답한 시간 ${fmtDur(pl.idle)}` : ""}</p>
  <p>객관식·계산 ${obj.length}문제 중 ${ok}문제 정답${obj.length ? ` (${pct(ok, obj.length)}%)` : ""} · 서술형 ${keys.length - obj.length}개 작성</p>
  <fieldset><legend>이번 교시 내용을 얼마나 이해했다고 느끼나요? (스스로 평가)</legend><div class="rate">${[1,2,3,4,5].map(v => `<button class="rbtn" data-act="selfRate" data-v="${v}" aria-pressed="${pl.selfRate === v}">${v}<small>${["거의 모름","조금","절반","대부분","완벽히"][v - 1]}</small></button>`).join("")}</div></fieldset>
  <p class="small muted">스스로 평가와 실제 문제 결과를 비교해, 내가 나를 정확히 보고 있는지 하루 결과에서 알려 드려요.</p>
  ${periodDiagnosis()}`;
}
