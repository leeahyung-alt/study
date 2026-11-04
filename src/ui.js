"use strict";
/* ================= 공통 화면 ================= */
window.__getState = () => S;
window.__touch = () => touch();
let modalCb = null;
function showModal({title, body, ok, cancel, danger, onOk, keep}){
  closeModal();
  const back = document.createElement("div");
  back.className = "modal-back"; back.id = "modalBack";
  back.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="mTitle"><h2 id="mTitle">${esc(title)}</h2><div>${body}</div><div class="row end">${cancel ? `<button class="btn ghost" data-act="modalCancel">${esc(cancel)}</button>` : ""}<button class="btn ${danger ? "danger" : ""}" data-act="modalOk">${esc(ok || "확인")}</button></div></div>`;
  document.body.appendChild(back);
  modalCb = {onOk, keep};
  const f = back.querySelector("input:not([type=checkbox]),select,textarea:not([readonly])") || back.querySelector("[data-act=modalOk]"); f && f.focus();
}
function closeModal(){ const m = $("#modalBack"); if(m) m.remove(); modalCb = null; }
let toastT = null;
function toast(msg){ let t = $("#toast"); if(!t){ t = document.createElement("div"); t.id = "toast"; t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); } t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2800); }
window.__ui = {showModal, closeModal, toast};
function showIdle(){
  if($("#idleBack")) return;
  const b = document.createElement("div"); b.className = "modal-back"; b.id = "idleBack";
  b.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><h2>잠시 멈춰 있었어요</h2><p>3분 넘게 화면에 움직임이 없어 학습 시간을 멈췄어요. 그동안 무엇을 했나요?</p><div class="row end"><button class="btn ghost" data-act="idleNo">잠시 쉬었어요 (시간에서 빼기)</button><button class="btn" data-act="idleYes">글을 읽거나 생각하고 있었어요 (시간에 넣기)</button></div><p class="small muted">집중했는지는 프로그램이 정확히 알 수 없어서 직접 물어봐요. 10분이 넘는 멈춤은 자동으로 빠져요.</p></div>`;
  document.body.appendChild(b);
}

const NAV = [["home","오늘 공부"],["records","내 기록"],["settings","설정"]];
function header(){
  if(VIEW_MODE) return `<div class="top-row"><span class="brand">${esc(CFG.APP_NAME)} · 학습 현황 보기</span><div class="row keep"><span id="savePill" class="pill"></span><button class="pill" data-act="viewRefresh">새로 고침</button></div></div><nav class="nav">${[["growth","성장"],["reports","보고서"],["records","기록"]].map(([v, t]) => `<button class="navb" data-act="go" data-v="${v}" aria-current="${UI.view === v ? "page" : "false"}">${t}</button>`).join("")}</nav>`;
  if(!S.profile) return `<div class="top-row"><span class="brand">${esc(CFG.APP_NAME)}</span><span id="savePill" class="pill"></span></div>`;
  const ov = S.levels ? overallLevel(S.levels) : null;
  return `<div class="top-row"><button class="brand" data-act="go" data-v="home">${esc(CFG.APP_NAME)}</button><div class="row keep"><span class="chip">${S.day <= 90 ? `${S.day}일차` : `심화 ${S.day - 90}일차`}${ov !== null ? ` · 종합 레벨 ${ov}` : ""}</span><button id="savePill" class="pill" data-act="go" data-v="settings"></button></div></div>
  <nav class="nav" aria-label="메뉴">${NAV.map(([v, t]) => `<button class="navb" data-act="go" data-v="${v}" aria-current="${UI.view === v ? "page" : "false"}">${t}</button>`).join("")}</nav>`;
}
function render(){
  document.documentElement.style.fontSize = (S.settings.font || 18) + "px";
  $("#top").innerHTML = header(); paintSave();
  let h = "";
  const v = UI.view;
  if(VIEW_MODE) h = viewModeRender();
  else if(v === "guide"){ h = viewGuide(); if(S.profile && !UI.guideCounted){ UI.guideCounted = true; S.guideSeen = (S.guideSeen || 0) + 1; touch(); } }
  else if(!S.profile) h = viewSetup();
  else if(v === "diag") h = viewDiag();
  else if(v === "home") h = viewHome();
  else if(v === "run") h = viewRun();
  else if(v === "break") h = viewBreak();
  else if(v === "dayReport") h = viewDayReport(UI.reportDay || S.day);
  else if(v === "growth") h = viewGrowth();
  else if(v === "records") h = viewRecords();
  else if(v === "extra") h = viewExtra();
  else if(v === "settings") h = viewSettings();
  else if(v === "reports") h = viewReports();
  else if(v === "wb") h = `<div class="row between"><button class="btn small ghost" data-act="wbBack">← ${UI.wbReturn ? "교시로 돌아가기" : "홈으로"}</button>${qaEnabled() ? `<button class="btn small" data-act="askOpen">막혔어요: 질문하기</button>` : ""}</div><div id="wb"></div>`;
  $("#app").innerHTML = h;
  if(v === "wb" && !VIEW_MODE && S.profile){ WB.mount($("#wb")); }
  if(UI.keepScroll) UI.keepScroll = false; else window.scrollTo(0, 0);
}

/* ================= 처음 설정·진단 ================= */
function viewSetup(){
  const remote = UI.remoteFound;
  return `<section class="card"><h1>${esc(CFG.APP_NAME)}</h1>
  <p class="lead">경제신문을 읽고, 기업과 시장을 분석하고, 내 생각을 근거 있는 글로 쓰는 사람이 되기 위한 90일 공부방이에요.</p><p><button class="btn small ghost" data-act="go" data-v="guide">사용 설명서 먼저 보기</button></p>
  <ul class="clean small"><li>하루 5시간: 50분 공부 + 10분 휴식으로 여섯 교시를 진행해요.</li><li>처음엔 아주 쉬운 글부터 시작해요. 모르는 낱말은 누르면 설명이 나와요.</li><li>레벨은 공부한 시간이 아니라 <b>평가에서 새 문제를 풀어 낸 결과</b>로만 올라가요.</li></ul></section>
  ${remote ? `<section class="card"><h2>저장된 기록이 있어요</h2><p>서버에 ${esc(remote.name || "학습자")}님의 기록이 있어요(${remote.day}일차). 다른 기기에서 이어 하려면 처음에 정한 비밀번호를 입력하세요.</p><label class="f" for="pinIn">비밀번호<input id="pinIn" type="password" inputmode="numeric" autocomplete="off"></label><div class="row"><button class="btn" data-act="resumeRemote">기록 불러와서 이어 하기</button></div></section>` : ""}
  <section class="card"><h2>${remote ? "새로 시작하기" : "시작하기"}</h2>
  <label class="f" for="nameIn">이름(별명)<input id="nameIn" type="text" autocomplete="off" placeholder="예: 민수"></label>
  ${Sync.enabled && !remote ? `<label class="f" for="pinNew">기록 비밀번호 (숫자 4자리 이상)<span class="sub">다른 기기에서 이어 하거나 기록을 지킬 때 써요. 잊지 않게 적어 두세요.</span><input id="pinNew" type="password" inputmode="numeric" autocomplete="new-password"></label>` : ""}
  ${remote ? `<p class="warnbox small">새로 시작하면 서버의 기존 기록을 덮어쓰지 않도록, 이 기기에서만 저장돼요. 기존 기록을 이어 하려면 위에서 비밀번호를 입력하세요.</p>` : ""}
  <p id="setupErr" class="no-t" hidden></p>
  <div class="row"><button class="btn" data-act="setupStart">첫날 진단 시작하기</button><button class="btn ghost" data-act="go" data-v="settings" hidden>설정</button></div>
  <p class="small muted">첫날 진단은 40~60분쯤 걸려요. 경제 낱말, 짧은 글 읽기, 숫자와 비율, 짧은 기사 설명, 짧은 시황 쓰기를 해요. 모르는 문제가 많아도 괜찮아요. 출발점을 재는 거예요.</p></section>
  <section class="card flat"><p class="small">백업 파일이 있다면: <button class="btn small ghost" data-act="importOpen">백업 파일로 복원</button> <button class="btn small ghost" data-act="importPaste">백업 내용 붙여넣기</button></p></section>`;
}
function viewDiag(){
  const A = S.pendingAssess;
  if(!A) return `<section class="card"><p>진단을 준비하는 중이에요.</p></section>`;
  return `<section class="card"><div class="crumb">첫날 진단</div>${assessBody(A, true)}</section>`;
}
function assessBody(A, isDiag){
  if(A.phase === "obj"){
    const it = A.cur ? ASSESS_BY_ID[A.cur.id] : assessNext(A);
    if(!it){ finalizeAssessment(A); A.phase = "write"; S.pendingAssess = A; touch(); return assessBody(A, isDiag); }
    const doneDoms = DOM_ORDER.filter(d => A.doms[d].done).length;
    const st = A.doms[A.cur.d];
    return `<div class="row between small muted"><span>영역 ${doneDoms + 1}/7: <b>${esc(DOMAINS[A.cur.d])}</b></span><span>문항 수준 ${st.L}</span></div>
    <div class="bar"><span style="width:${Math.round(doneDoms / 7 * 100)}%"></span></div>
    <p class="small muted">맞히면 더 어려운 문제가, 틀리면 그 영역이 끝나요. 모르면 ‘모르겠어요’를 누르세요(틀린 것으로 기록).</p>
    <div class="qbox">${it.passage ? `<div class="passage small">${esc(it.passage).replace(/\n/g, "<br>")}</div>` : ""}<h3 class="qtext">${esc(it.stem)}</h3>
    ${it.t === "num" ? `<div class="row"><label class="f" for="anum" style="flex:1">답(숫자)<input id="anum" inputmode="decimal"></label><span class="tag">${esc(it.unit || "")}</span><button class="btn" data-act="aNum">확인</button></div>` : `<div class="opts">${it.options.map((o, i) => `<button class="opt" data-act="aAns" data-o="${i}"><span class="ol">${"①②③④⑤"[i]}</span>${esc(o)}</button>`).join("")}</div>`}
    <div class="row end"><button class="btn ghost small" data-act="aAns" data-o="-1">모르겠어요</button></div></div>
    ${A.cur.reused ? `<p class="small muted">이 수준의 새 문항이 바닥나 예전에 본 문항이 나왔어요. 결과의 신뢰도가 조금 낮아요.</p>` : ""}`;
  }
  if(A.phase === "write") return assessWriting(A, isDiag);
  return assessResult(A, isDiag);
}
function writingSet(cp){ const w = (D.assess.writing || []).find(x => x.cp === cp); return w ? w.tasks : []; }
function assessWriting(A, isDiag){
  const tasks = writingSet(A.cp === "extra" ? -1 : A.cp);
  const base = baseline();
  const rewrite = !isDiag && base ? writingSet(0) : [];
  if(!tasks.length && !rewrite.length){ A.phase = "result"; return assessResult(A, isDiag); }
  return `<h2>글로 설명하기</h2><p class="small muted">서술형은 프로그램이 점수를 매기지 않아요. 써 둔 글은 나중에 같은 수준의 과제와 나란히 비교해 성장을 확인하는 기준이 돼요.</p>
  ${tasks.map(t => `<div class="qbox"><h3>${esc(t.title || "")}</h3><div class="passage small">${esc(t.material).replace(/\n/g, "<br>")}</div><label class="f" for="aw-${t.id}">${esc(t.prompt)}<textarea id="aw-${t.id}" data-aw="${esc(t.id)}">${esc(A.writing[t.id] || "")}</textarea></label></div>`).join("")}
  ${rewrite.length ? `<h2>첫날 과제 다시 쓰기</h2><p class="small muted">첫날과 똑같은 자료와 질문이에요. 다 쓰면 첫날 글과 나란히 보여 드려요.</p>${rewrite.map(t => `<div class="qbox"><h3>${esc(t.title || "")}</h3><div class="passage small">${esc(t.material).replace(/\n/g, "<br>")}</div><label class="f" for="ar-${t.id}">${esc(t.prompt)}<textarea id="ar-${t.id}" data-ar="${esc(t.id)}">${esc(A.rewrite[t.id] || "")}</textarea></label></div>`).join("")}` : ""}
  <div class="row end"><button class="btn" data-act="aWriteDone">다 썼어요 → 결과 보기</button></div>`;
}
function assessResult(A, isDiag){
  const prev = S.assessments.filter(x => x.id !== A.id && x.done).slice(-1)[0];
  const base = baseline();
  const rows = DOM_ORDER.map(d => { const lv = A.levels[d], p = prev ? prev.levels[d] : null; const items = A.doms[d].items; return `<tr><th scope="row">${esc(DOMAINS[d])}</th><td>${p !== null && p !== undefined ? p : "-"}</td><td><b>${lv}</b>${p !== null && p !== undefined && lv > p ? ' <span class="ok-t">▲</span>' : p !== null && p !== undefined && lv < p ? ' <span class="no-t">▼</span>' : ""}</td><td class="small">${items.filter(x => x.ok).length}/${items.length}${A.doms[d].reused ? " (재사용 문항 포함)" : ""}</td></tr>`; }).join("");
  const rw = !isDiag && base ? writingSet(0) : [];
  const cmp = rw.map(t => `<div class="cols"><div><div class="lbl">첫날(${fmtDate(base.date)})</div><div class="echo">${esc(base.writing[t.id] || "(쓰지 않음)")}</div></div><div><div class="lbl">오늘(${fmtDate(A.date)})</div><div class="echo">${esc(A.rewrite[t.id] || "(쓰지 않음)")}</div></div></div>
  <div class="small"><div class="lbl">8가지 기준으로 두 글을 비교해 보세요 (스스로 평가)</div>${CRITERIA8.map((c, i) => `<div class="crit"><span>${esc(c)}</span><span class="rate small">${["첫날이 나음","비슷함","오늘이 나음"].map((l, j) => `<button class="rbtn" data-act="aRubric" data-t="${t.id}" data-i="${i}" data-v="${j}" aria-pressed="${((A.rubric[t.id] || [])[i]) === j}">${l}</button>`).join("")}</span></div>`).join("")}</div>`).join("<hr>");
  const ov = A.overall;
  return `<h2>${isDiag ? "첫날 진단 결과" : `${A.cp}일 평가 결과`}</h2>
  <p>종합 레벨 <b>${ov}</b> (${LEVEL_NAMES[ov]})</p>
  <div class="tbl-wrap"><table class="dt"><thead><tr><th>영역</th><th>이전</th><th>이번</th><th>정답/문항</th></tr></thead><tbody>${rows}</tbody></table></div>
  <p class="small muted">레벨은 처음 보는 문제를 맞혀야 오르고, 같은 수준에서 두 문제를 틀리면 멈춰요. 글쓰기 영역 레벨은 객관식 문항으로만 정했고, 아래 글 비교는 스스로 평가예요.</p>
  ${cmp ? `<h3>첫날 글과 오늘 글</h3>${cmp}` : ""}
  ${isDiag ? placementBox(ov) : `<div class="row end"><button class="btn" data-act="assessClose">평가 마치기</button></div>`}`;
}
function placementBox(ov){
  const rec = placementDay(ov);
  return `<div class="notebox"><b>출발점 안내</b><br>${ov <= 1 ? "1일차부터 차근차근 시작하는 것이 가장 좋아요." : `진단 결과로 보면 ${rec}일차부터 시작해도 돼요. 다만 앞부분 개념은 복습 카드로 빠르게 확인하게 돼요.`}</div>
  <div class="row">${rec > 1 ? `<button class="btn" data-act="startAt" data-d="${rec}">${rec}일차부터 시작</button><button class="btn ghost" data-act="startAt" data-d="1">1일차부터 시작</button>` : `<button class="btn" data-act="startAt" data-d="1">1일차 공부 시작</button>`}</div>`;
}
function stepAssess(){
  let A = S.pendingAssess;
  if(A && A.cp !== S.day){ A = null; }
  const done = S.assessments.find(x => x.cp === S.day && x.day === S.day);
  if(done && (!A || A.id === done.id) && done.phase !== "obj") return `<p class="notebox">${S.day}일 평가의 객관식 부분을 마쳤어요. 결과는 ‘성장’ 화면에서 볼 수 있어요.</p>`;
  if(!A) return `<p>${S.day}일 평가예요. 그동안 배운 것을 <b>처음 보는 문제</b>에 적용할 수 있는지 확인해요. 영역마다 지금 레벨부터 시작해서, 맞히면 다음 레벨 문제가 나와요.</p><p class="small muted">약 30~45분. 중간에 나가도 이어서 할 수 있어요.</p><button class="btn" data-act="assessStart">평가 시작</button>`;
  if(A.phase !== "obj") return `<p class="notebox">객관식 평가를 마쳤어요. 다음 교시에서 글쓰기 평가를 해요.</p>`;
  return assessBody(A, false);
}
function stepWriteAssess(){
  const A = S.assessments.filter(x => x.cp === S.day).slice(-1)[0] || (S.pendingAssess && S.pendingAssess.cp === S.day ? S.pendingAssess : null);
  if(!A) return `<p class="warnbox">먼저 1교시 평가를 마쳐 주세요.</p>`;
  if(A.phase === "result" || A.writeDone) return assessResult(A, false);
  return assessWriting(A, false);
}

/* ================= 홈 ================= */
function viewHome(){
  const adv = maybeAdvanceDay();
  if(adv === "advanced") toast(`${S.day}일차를 시작해요`);
  const n = S.day, cur = curDay(n), kind = dayKind(n);
  const dl = dayLog(n);
  const ov = S.levels ? overallLevel(S.levels) : null;
  const firstTodo = PERIODS.find(p => !periodDone(n, p.k));
  const goal = cur ? (cur.kind === "content" ? `${cur.title}: ${(cur.concepts || []).map(id => (CONCEPT_BY_ID[id] || {}).name).join(", ")}` : cur.title) : "90일 이후 심화: 약한 영역 보강과 실제 자료 분석";
  const can = canDoList().slice(0, 3);
  const dueC = srsDue("cc.").length + srsDue("vv.").length;
  const ask = adv === "ask" ? `<section class="card warn"><h3>어제 공부를 다 마치지 못했어요</h3><p>${PERIODS.filter(p => !periodDone(n, p.k)).map(p => p.n + "교시").join(", ")}가 남았어요. 어떻게 할까요?</p><div class="row"><button class="btn" data-act="continueDay">어제 남은 교시 이어 하기</button><button class="btn ghost" data-act="skipToNext">오늘 학습(${n + 1}일차)으로 넘어가기</button></div><p class="small muted">넘어가도 어제 기록은 그대로 남아요.</p></section>` : "";
  const backupWarn = (!Sync.enabled || Sync.err) && Date.now() - (S.lastBackup || S.created) > 7 * 864e5 ? `<section class="card warn small">기록이 이 기기에만 있어요. 마지막 백업 후 7일이 지났어요. <button class="btn small" data-act="exportAll">지금 백업하기</button></section>` : "";
  return `${ask}${backupWarn}
  ${(S.guideSeen || 0) < 3 ? `<section class="card small row between"><span>처음이라면 <b>사용 설명서</b>를 먼저 읽어 보세요. 순서와 기능을 다 알려 줘요.</span><button class="btn small" data-act="go" data-v="guide">사용 설명서</button></section>` : `<div class="row" style="justify-content:flex-end"><button class="btn small ghost" data-act="go" data-v="guide">사용 설명서</button></div>`}
  <section class="card today"><div class="row between"><div class="crumb">${n <= 90 ? `${n}일차 / 90일` : `심화 ${n - 90}일차`} · ${kind === "content" ? "새 학습" : kind === "review" ? "복습의 날" : kind === "checkpoint" ? "평가의 날" : "심화"}${CHECKPOINTS.includes(n) ? " · 평가 있음" : ""}</div><span class="small muted">${fmtDate(today())}</span></div>
  <h1>${esc(cur ? cur.title : "심화 학습")}</h1><p>오늘의 목표: ${esc(goal)}</p>
  <ol class="periods">${PERIODS.map(p => { const pl = (dl.periods || {})[p.k] || {}; const st = pl.st === "done" ? "완료" : pl.st === "doing" ? "진행 중" : pl.st === "skip" ? "건너뜀" : "시작 전"; return `<li class="${pl.st || "todo"}"><span class="pn">${p.n}</span><span class="pt">${esc(p.name)}<small>${p.mins.map(x => x[0]).slice(0, 3).join(" · ")}</small></span><span class="ps">${st}${pl.active ? `<small>${mins(pl.active)}분</small>` : ""}</span></li>`; }).join("")}</ol>
  ${firstTodo ? `<button class="btn big" data-act="startPeriod" data-k="${firstTodo.k}">${dl.periods && Object.keys(dl.periods).length ? `${firstTodo.n}교시 이어서 공부하기` : "오늘 학습 시작 (1교시부터)"}</button>` : `<div class="notebox">오늘 여섯 교시를 모두 마쳤어요.</div><div class="row"><button class="btn big" data-act="dayReport" data-d="${n}">오늘의 성장 보고서 보기</button><button class="btn big ghost" data-act="nextDayNow">바로 ${n + 1}일차 시작하기</button></div>`}
  <p class="small muted">위 버튼만 누르면 순서대로 진행돼요. 교시마다 50분(마지막에 AI 실전 과제와 평가), 사이에 10분 쉬어요.</p></section>
  <p class="small muted center">${S.levels ? `종합 레벨 ${ov} (${LEVEL_NAMES[ov]}) · ` : ""}<button class="linkbtn" data-act="go" data-v="records" data-t="growth">내 성장 기록 보기</button></p>`;
}
function levelBars(lv){
  return `<div class="lvbars">${DOM_ORDER.map(d => `<div class="lvrow" ><span class="lvn">${esc(DOMAINS[d])}</span><span class="lvbar" aria-label="레벨 ${lv[d]}">${[1,2,3,4,5,6].map(i => `<i class="${i <= (lv[d] || 0) ? "on" : ""}"></i>`).join("")}</span><span class="lvv">레벨 ${lv[d] ?? 0}</span><button class="lvinfo" data-act="evidence" data-d="${d}" aria-label="${esc(DOMAINS[d])} 근거 보기">근거</button></div>`).join("")}</div>`;
}

/* ================= 교시 진행 ================= */
function startPeriod(k){
  const n = S.day;
  const pl = periodLog(n, k);
  if(pl.st === "todo"){ pl.st = "doing"; pl.startedAt = Date.now(); }
  dayLog(n).lastDate = today();
  UI.run = {day:n, k, steps:buildSteps(n, k), si:Math.min(pl.step || 0, 99)};
  if(UI.run.si >= UI.run.steps.length) UI.run.si = 0;
  UI.qset = {};
  enterStep();
  timerStart(n, k);
  UI.view = "run"; S.pos = {day:n, k}; touch(); render();
}
function enterStep(){
  const s = UI.run.steps[UI.run.si];
  UI.run.retryId = null;
  if(s && s.qs && !UI.qset[s.id]) qsetStart(s.id, s.qs(), {onWeak:s.weak ? weakExtra(s.weak) : null, onStrong:s.strong ? strongExtra(s.strong) : null});
  if(s && s.id === "vocab" && s.after) s.after();
  periodLog(UI.run.day, UI.run.k).step = UI.run.si;
}
function viewRun(){
  const r = UI.run; if(!r){ UI.view = "home"; return viewHome(); }
  const P = PERIODS.find(p => p.k === r.k), s = r.steps[r.si];
  const pl = periodLog(r.day, r.k);
  const html = (s.render ? s.render(s) : "") + (s.qs ? (r.retryId ? qsetHTML(r.retryId) : qsetHTML(s.id)) : "");
  return `<section class="card runhead"><div class="row between"><div><div class="crumb">${r.day}일차 · ${P.n}교시 / 6</div><h2>${esc(P.name)}</h2></div><div id="ptimer" class="small muted">집중 ${fmtDur(pl.active)} · 화면 ${fmtDur(pl.open)}</div></div>
  <div class="dots">${r.steps.map((x, i) => `<button class="dot ${i < r.si ? "past" : i === r.si ? "now" : ""}" data-act="jumpStep" data-i="${i}" title="${esc(x.title)}" aria-label="${i + 1}. ${esc(x.title)}"></button>`).join("")}</div>
  <div class="small muted">활동 ${r.si + 1}/${r.steps.length}: <b>${esc(s.title)}</b> · 약 ${s.mins}분 · 남은 활동: ${r.steps.slice(r.si + 1).map(x => esc(x.title)).join(", ") || "없음"}</div></section>
  <section class="card">${html}${qaButton()}</section>
  <div class="navrow"><button class="btn ghost" data-act="stepPrev">← ${r.si ? "이전 활동" : "홈으로"}</button>${r.si < r.steps.length - 1 ? `<button class="btn" data-act="stepNext">다음 활동 →</button>` : `<button class="btn" data-act="endPeriod">${P.n < 6 ? "교시 끝내기 → 쉬는 시간" : "오늘 공부 끝내기 → 성장 보고서"}</button>`}</div>`;
}
function endPeriod(){
  const r = UI.run; const pl = periodLog(r.day, r.k);
  pl.st = "done"; pl.doneAt = Date.now(); pl.step = r.steps.length - 1;
  timerStop();
  const dl = dayLog(r.day); dl.lastDate = today();
  if(dayIsDone(r.day)){ dl.done = true; dl.doneDate = today(); dl.doneAt = Date.now(); }
  const got = checkAchievements();
  touch(); saveNow(); if(Sync.authed) syncPush();
  if(got.length) setTimeout(() => toast(`새 성취: ${got.map(g => g.name).join(", ")}`), 400);
  UI.run = null;
  if(dl.done){ UI.reportDay = r.day; UI.view = "dayReport"; }
  else { UI.view = "break"; UI.breakUntil = Date.now() + 10 * 60000; UI.nextK = (PERIODS.find(p => !periodDone(r.day, p.k)) || {}).k; }
  render();
}
let breakIv = null;
function viewBreak(){
  clearInterval(breakIv);
  breakIv = setInterval(() => { const el = $("#breakLeft"); if(!el){ clearInterval(breakIv); return; } const s = Math.max(0, Math.round((UI.breakUntil - Date.now()) / 1000)); el.textContent = `${Math.floor(s / 60)}분 ${s % 60}초`; if(!s) clearInterval(breakIv); }, 1000);
  const P = PERIODS.find(p => p.k === UI.nextK);
  return `<section class="card today"><h2>쉬는 시간 10분</h2><p class="lead">자리에서 일어나 물을 마시고, 먼 곳을 바라보세요. 눈과 머리가 쉬어야 다음 교시에 더 잘 기억해요.</p><p>남은 시간: <b id="breakLeft">10분 0초</b></p>
  ${P ? `<p>다음: ${P.n}교시 ${esc(P.name)}</p><div class="row"><button class="btn" data-act="startPeriod" data-k="${P.k}">${P.n}교시 시작</button><button class="btn ghost" data-act="go" data-v="home">홈으로</button></div>` : ""}
  <p class="small muted">쉬는 시간은 학습 시간에 넣지 않아요.</p></section>`;
}

/* ================= 하루 보고서 ================= */
function dayData(n){
  const dl = S.dayLog[n] || {periods:{}};
  const dateISO = dl.started || today();
  const atts = S.attempts.filter(a => a.day === n && a.s !== "retry");
  const per = PERIODS.map(p => { const pl = dl.periods[p.k] || {}; const pa = atts.filter(a => a.s === "p" + p.n); return {p, active:pl.active || 0, open:pl.open || 0, st:pl.st || "todo", selfRate:pl.selfRate, acc:accuracy(pa), n:pa.length}; });
  const totalActive = per.reduce((a, x) => a + x.active, 0), totalOpen = per.reduce((a, x) => a + x.open, 0);
  const cur = curDay(n);
  const concepts = (cur && cur.concepts) || [];
  const dc = dayContent(n);
  const vocabOk = dc ? dc.vocab.filter((v, i) => { const a = atts.find(x => x.k === `d${n}.v${i}`); return a && a.o; }).map(v => v.w) : [];
  const byDom = {}; DOM_ORDER.forEach(d => { const a = atts.filter(x => x.d === d); byDom[d] = {n:a.length, acc:accuracy(a)}; });
  const prevDom = domainStats(addDays(dateISO, -7), addDays(dateISO, -1));
  const good = DOM_ORDER.filter(d => byDom[d].n >= 3 && byDom[d].acc >= 80);
  const hard = DOM_ORDER.filter(d => byDom[d].n >= 3 && byDom[d].acc < 60);
  const improved = DOM_ORDER.filter(d => byDom[d].n >= 3 && prevDom[d].n >= 5 && byDom[d].acc - prevDom[d].acc >= 10);
  const wrongToday = atts.filter(a => !a.o).map(a => itemByKey(a.k)).filter(Boolean);
  const cans = canDoList().filter(c => isoOf(c.t) === (dl.doneDate || dateISO) || (c.t >= (dl.periods.p1 || {}).startedAt));
  const comebacks = S.comebacks.filter(c => isoOf(c.rightAt) === (dl.lastDate || dateISO));
  const news = S.news.filter(x => x.day === n);
  const writes = S.portfolio.filter(p => p.day === n);
  const calib = per.filter(x => x.selfRate && x.acc !== null && x.n >= 3).map(x => ({p:x.p, self:x.selfRate * 20, acc:x.acc, gap:x.selfRate * 20 - x.acc}));
  const nextCur = curDay(n + 1);
  const ach = Object.entries(S.achievements).filter(([, a]) => a.day === n).map(([id]) => ACHIEVE.find(x => x.id === id)).filter(Boolean);
  return {n, dateISO, per, totalActive, totalOpen, concepts, vocabOk, byDom, good, hard, improved, wrongToday, cans, comebacks, news, writes, calib, nextCur, ach, dc, atts};
}
function viewDayReport(n){
  const r = dayData(n);
  return `<section class="card today"><div class="crumb">${n}일차 성장 보고서 · ${fmtDate(r.dateISO)}</div><h1>오늘 새롭게 할 수 있게 된 것</h1>
  ${r.cans.length || r.comebacks.length || r.ach.length ? `<ul class="clean big-list">${r.ach.map(a => `<li><b>성취: ${esc(a.name)}</b> <span class="small muted">(${esc(a.verify)})</span></li>`).join("")}${r.cans.map(c => `<li>${esc(c.text)}</li>`).join("")}${r.comebacks.length ? `<li>예전에 틀렸던 문제 <b>${r.comebacks.length}개</b>를 오늘 다시 맞혔어요.</li>` : ""}</ul>` : `<p>오늘 처음 배운 내용은 <b>다른 날 복습에서 다시 맞혀야</b> ‘할 수 있게 된 것’으로 기록돼요. 확인되지 않은 실력은 칭찬하지 않을게요.</p>`}</section>
  ${reportSections(r)}
  <div class="row">${n === S.day && dayIsDone(n) && !VIEW_MODE ? `<button class="btn" data-act="nextDayNow">바로 ${n + 1}일차 시작하기</button>` : ""}<button class="btn ${n === S.day && dayIsDone(n) ? "ghost" : ""}" data-act="go" data-v="home">홈으로</button><button class="btn ghost" data-act="go" data-v="records" data-t="growth">성장 화면 보기</button></div>
  ${n === S.day && dayIsDone(n) && !VIEW_MODE ? `<p class="small muted">더 공부하고 싶으면 바로 다음 일차로 넘어가도 돼요. 복습 카드는 날짜 기준으로 계속 나와요. 하루에 너무 많이 넘기면 복습 간격이 짧아져 기억에 덜 남을 수 있어요.</p>` : ""}`;
}
function reportSections(r){
  return `<section class="card"><h2>공부한 시간</h2><p>집중한 시간 <b>${fmtDur(r.totalActive)}</b> · 화면을 연 시간 ${fmtDur(r.totalOpen)}</p>
  <div class="tbl-wrap"><table class="dt"><thead><tr><th>교시</th><th>상태</th><th>집중</th><th>정답률</th><th>스스로 평가</th></tr></thead><tbody>${r.per.map(x => `<tr><th scope="row">${x.p.n}. ${esc(x.p.name)}</th><td>${({done:"완료", doing:"진행 중", todo:"안 함", skip:"건너뜀"})[x.st]}</td><td>${mins(x.active)}분</td><td>${x.acc !== null ? x.acc + "% (" + x.n + "문제)" : "-"}</td><td>${x.selfRate ? x.selfRate + "/5" : "-"}</td></tr>`).join("")}</tbody></table></div>
  <p class="small muted">집중 시간은 화면에서 활동한 시간이에요. 실제로 얼마나 집중했는지는 브라우저로 정확히 잴 수 없어요.</p></section>
  ${dayWeakSection(r.atts)}
  <section class="card"><h2>새로 배운 개념과 낱말</h2><p>${r.concepts.map(id => esc((CONCEPT_BY_ID[id] || {}).name)).join(", ") || "새 개념 없음(복습·평가의 날)"}</p>${r.vocabOk.length ? `<p class="small">맞힌 낱말: ${r.vocabOk.map(esc).join(", ")}</p>` : ""}</section>
  <section class="card"><h2>문제 결과</h2><div class="tbl-wrap"><table class="dt"><thead><tr><th>영역</th><th>문제 수</th><th>정답률</th></tr></thead><tbody>${DOM_ORDER.filter(d => r.byDom[d].n).map(d => `<tr><th scope="row">${esc(DOMAINS[d])}</th><td>${r.byDom[d].n}</td><td>${r.byDom[d].acc}%</td></tr>`).join("") || "<tr><td colspan='3'>객관식 문제를 풀지 않았어요.</td></tr>"}</tbody></table></div>
  <p><b>잘 이해한 부분</b>: ${r.good.map(d => esc(DOMAINS[d])).join(", ") || "아직 판단할 만큼 문제를 풀지 않았어요"}</p>
  <p><b>아직 어려워하는 부분</b>: ${r.hard.map(d => esc(DOMAINS[d])).join(", ") || "뚜렷하게 낮은 영역 없음"}</p>
  ${r.wrongToday.length ? `<details class="ev"><summary>오늘 틀린 문제 ${r.wrongToday.length}개 (며칠 뒤 복습에 다시 나와요)</summary>${r.wrongToday.slice(0, 15).map(q => `<div class="ansrow"><div class="q">${esc(q.where)}</div><div class="a small">${esc(q.stem)}</div></div>`).join("")}</details>` : ""}
  <p><b>이전보다 발전한 영역</b> (최근 7일 평균보다 정답률 10%p 이상 높음): ${r.improved.map(d => esc(DOMAINS[d])).join(", ") || "없음"}</p></section>
  ${r.calib.length ? `<section class="card"><h2>스스로 평가 vs 문제 결과</h2><ul class="clean">${r.calib.map(c => `<li>${c.p.n}교시: 스스로 ${c.self / 20}/5 · 정답률 ${c.acc}% → ${c.gap > 25 ? "<b>스스로 생각보다 결과가 낮아요(과대평가 가능성)</b>" : c.gap < -25 ? "<b>생각보다 잘 풀었어요(과소평가)</b>" : "비슷해요"}</li>`).join("")}</ul></section>` : ""}
  <section class="card"><h2>오늘의 결과물</h2><p><b>분석한 뉴스</b>: ${r.news.map(x => esc(x.headline)).join(" / ") || "없음"}</p><p><b>기업</b>: ${r.dc ? esc(r.dc.company.title) : "워크북"}${activeCompany() ? ` · 내 기업 ${esc(activeCompany().name)}` : ""}</p><p><b>작성한 글</b>: ${r.writes.map(p => `${esc(WRITE_TYPES[p.type] || p.type)}(${countSent(p.text)}문장)`).join(", ") || "없음"}</p></section>
  <section class="card"><h2>내일 강화할 내용</h2><ul class="clean">${r.hard.map(d => `<li>${esc(DOMAINS[d])}: 오늘 틀린 문제가 복습에 나와요</li>`).join("")}<li>복습 카드 ${Object.values(S.srs).filter(c => c.due <= addDays(today(), 1)).length}장</li>${r.nextCur ? `<li>${r.n + 1}일차: ${esc(r.nextCur.title)}</li>` : ""}</ul></section>`;
}

/* ================= 성장 대시보드 ================= */
function viewGrowth(){
  const lv = S.levels, base = baseline(), last = latestAssessment();
  if(!lv) return `<section class="card"><p>첫날 진단을 마치면 성장 기록이 시작돼요.</p></section>`;
  const ov = overallLevel(lv);
  const t = today();
  const w1 = domainStats(addDays(t, -6), t), w0 = domainStats(addDays(t, -13), addDays(t, -7));
  const trend = DOM_ORDER.map(d => ({d, now:w1[d].acc, prev:w0[d].acc, n:w1[d].n, diff:(w1[d].acc ?? 0) - (w0[d].acc ?? 0)}));
  const strong = trend.filter(x => x.n >= 5).sort((a, b) => b.now - a.now)[0];
  const weak = trend.filter(x => x.n >= 5).sort((a, b) => a.now - b.now)[0];
  const can = canDoList();
  const nextCp = CHECKPOINTS.find(c => c >= S.day) || (Math.ceil(S.day / 30) * 30);
  const weakConcepts = Object.entries(S.srs).filter(([k, c]) => k.startsWith("cc.") && c.box === 0 && c.n > 0).map(([k]) => CONCEPT_BY_ID[k.slice(3)]).filter(Boolean).slice(0, 6);
  const self = selfWriting();
  return `<section class="card"><h2>현재 나의 수준</h2><p>종합 단계: <b>레벨 ${ov}</b> · ${LEVEL_NAMES[ov]}</p>${levelBars(lv)}
  <ul class="clean small">${DOM_ORDER.map(d => `<li><b>${esc(DOMAINS[d])}</b>: ${esc(LEVEL_CAN[d][lv[d] || 0])}</li>`).join("")}</ul>
  <p class="small muted">근거: ${last ? `${last.cp === 0 ? "첫날 진단" : last.cp + "일 평가"} (${fmtDate(last.date)})` : ""} · ‘근거’를 누르면 그 레벨을 정한 문제를 볼 수 있어요.</p>
  ${self ? `<p class="small">글쓰기 자가 평가(검증되지 않음): 최근 글의 스스로 점검 평균 ${self.recent}/6${self.first !== null ? ` · 처음 2주 ${self.first}/6` : ""}</p>` : ""}</section>
  <section class="card"><h2>과거의 나와 비교</h2>
  ${base && last && last.id !== base.id ? `<div class="tbl-wrap"><table class="dt"><thead><tr><th>영역</th><th>첫날</th><th>지금</th></tr></thead><tbody>${DOM_ORDER.map(d => `<tr><th scope="row">${esc(DOMAINS[d])}</th><td>${base.levels[d]}</td><td><b>${last.levels[d]}</b></td></tr>`).join("")}</tbody></table></div>` : `<p class="small muted">첫 평가(7일차)를 마치면 첫날과 비교할 수 있어요.</p>`}
  <h3>처음에는 못했지만 지금은 할 수 있는 것</h3>${can.length ? `<ul class="clean">${can.slice(0, 12).map((c, i) => `<li>${esc(c.text)} <button class="lvinfo" data-act="canEvidence" data-i="${i}">근거</button> <span class="small muted">${esc(c.verified)}</span></li>`).join("")}</ul>` : `<p class="small muted">아직 확인된 항목이 없어요. 배운 날과 다른 날의 복습에서 다시 맞혀야 기록돼요.</p>`}
  ${base ? `<div class="row"><button class="btn small ghost" data-act="compareFirst">첫날 쓴 글과 최근 글 나란히 보기</button></div>` : ""}</section>
  <section class="card"><h2>잘하는 것과 부족한 것</h2><p class="small muted">최근 7일 연습 문제 정답률(객관식·계산만). 평가 레벨과 별개예요.</p>
  ${chartAcc(trend)}
  <p>${strong ? `가장 잘하는 영역: <b>${esc(DOMAINS[strong.d])}</b> (${strong.now}%)` : "아직 판단할 만큼 문제를 풀지 않았어요."}${weak && weak !== strong ? ` · 더 훈련할 영역: <b>${esc(DOMAINS[weak.d])}</b> (${weak.now}%)` : ""}</p>
  ${calibSummary()}</section>
  <section class="card"><h2>다음 단계로 가기 위한 목표</h2><p>다음 평가: <b>${nextCp}일차</b></p><ul class="clean">${DOM_ORDER.filter(d => (lv[d] || 0) < 6).map(d => `<li><b>${esc(DOMAINS[d])} 레벨 ${(lv[d] || 0) + 1}</b>: ${esc(LEVEL_CAN[d][(lv[d] || 0) + 1])}</li>`).join("")}</ul>
  ${weakConcepts.length ? `<p>다시 다질 개념: ${weakConcepts.map(c => esc(c.name)).join(", ")}</p>` : ""}</section>
  <section class="card"><h2>그래프</h2><h3>평가로 확인된 영역별 레벨 변화</h3>${chartLevels()}<h3>날짜별 집중 시간 (실력이 아니라 시간 기록)</h3>${chartTime()}</section>
  <section class="card"><h2>성취 기록</h2><ul class="clean">${ACHIEVE.map(a => { const g = S.achievements[a.id]; return `<li class="${g ? "" : "muted"}">${g ? "✔" : "○"} <b>${esc(a.name)}</b> <span class="small">— ${esc(a.how)} (${esc(a.verify)})${g ? ` · ${g.day}일차` : ""}</span></li>`; }).join("")}</ul></section>`;
}
function selfWriting(){
  if(!S.portfolio.length) return null;
  const avg = arr => arr.length ? (arr.reduce((a, p) => a + (p.self || []).filter(Boolean).length, 0) / arr.length).toFixed(1) : null;
  const rec = S.portfolio.slice(-5), first = S.portfolio.filter(p => p.day <= (S.portfolio[0].day + 13));
  return {recent:avg(rec), first:S.portfolio.length > 5 ? avg(first) : null};
}
function calibSummary(){
  const rows = [];
  Object.entries(S.dayLog).slice(-14).forEach(([n, dl]) => PERIODS.forEach(p => { const pl = dl.periods[p.k]; if(!pl || !pl.selfRate) return; const pa = S.attempts.filter(a => a.day === +n && a.s === "p" + p.n); if(pa.length < 3) return; rows.push(pl.selfRate * 20 - accuracy(pa)); }));
  if(rows.length < 3) return "";
  const avg = Math.round(rows.reduce((a, b) => a + b, 0) / rows.length);
  return `<p class="small">스스로 평가와 실제 결과의 차이(최근 2주 평균): ${avg > 15 ? `<b>스스로를 ${avg}점쯤 높게 보는 편</b>이에요. 확인 문제를 더 꼼꼼히 풀어 보세요.` : avg < -15 ? `<b>실제보다 ${-avg}점쯤 낮게 보는 편</b>이에요. 생각보다 잘하고 있어요.` : "대체로 정확하게 보고 있어요."}</p>`;
}
function chartAcc(trend){
  const W = 640, H = 210, L = 150;
  const rows = trend.map((x, i) => { const y = 14 + i * 27; const w = x.now === null ? 0 : (W - L - 60) * x.now / 100; const pw = x.prev === null ? null : (W - L - 60) * x.prev / 100; return `<text x="${L - 8}" y="${y + 12}" text-anchor="end" class="ct">${esc(DOMAINS[x.d])}</text><rect x="${L}" y="${y}" width="${W - L - 60}" height="16" class="cbg"/><rect x="${L}" y="${y}" width="${w}" height="16" class="cbar"/>${pw !== null ? `<line x1="${L + pw}" x2="${L + pw}" y1="${y - 2}" y2="${y + 18}" class="cprev"/>` : ""}<text x="${W - 52}" y="${y + 12}" class="ct">${x.now === null ? "-" : x.now + "%"}</text>`; }).join("");
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="영역별 최근 7일 정답률">${rows}</svg><p class="small muted">막대: 최근 7일 · 세로선: 그 전 7일</p>`;
}
function chartLevels(){
  const as = S.assessments.filter(a => a.done);
  if(as.length < 1) return `<p class="small muted">평가 기록이 없어요.</p>`;
  const W = 640, H = 220, L = 30, B = 30, T = 10, R = 120;
  const x = i => L + (as.length === 1 ? (W - L - R) / 2 : i * (W - L - R) / (as.length - 1));
  const y = v => T + (H - T - B) * (1 - v / 6);
  const colors = ["#1e4b9b","#b0571c","#1d7444","#7a3fb0","#a1306e","#2a7f8f","#6b6b2a"];
  const grid = [0,1,2,3,4,5,6].map(v => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="cgrid"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end" class="ct">${v}</text>`).join("");
  const lines = DOM_ORDER.map((d, k) => { const pts = as.map((a, i) => `${x(i)},${y((a.levels[d] || 0) + (k - 3) * 0.04)}`).join(" "); const last = as[as.length - 1]; return `<polyline points="${pts}" fill="none" stroke="${colors[k]}" stroke-width="2.5"/>${as.map((a, i) => `<circle cx="${x(i)}" cy="${y((a.levels[d] || 0) + (k - 3) * 0.04)}" r="3.5" fill="${colors[k]}"/>`).join("")}<text x="${W - R + 8}" y="${14 + k * 17}" class="ct" fill="${colors[k]}">● ${esc(DOMAINS[d].slice(0, 7))} ${last.levels[d]}</text>`; }).join("");
  const labels = as.map((a, i) => `<text x="${x(i)}" y="${H - 8}" text-anchor="middle" class="ct">${a.cp === 0 ? "첫날" : a.cp === "extra" ? "재평가" : a.cp + "일"}</text>`).join("");
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="평가별 영역 레벨">${grid}${lines}${labels}</svg>`;
}
function chartTime(){
  const days = Object.entries(S.dayLog).map(([n, dl]) => ({n:+n, m:Math.round(PERIODS.reduce((a, p) => a + ((dl.periods[p.k] || {}).active || 0), 0) / 60)})).sort((a, b) => a.n - b.n).slice(-21);
  if(!days.length) return `<p class="small muted">아직 기록이 없어요.</p>`;
  const W = 640, H = 170, L = 34, B = 24, T = 8;
  const max = Math.max(300, ...days.map(d => d.m));
  const bw = (W - L - 10) / days.length;
  const y = v => T + (H - T - B) * (1 - v / max);
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="날짜별 집중 시간">${[0, 150, 300].map(v => `<line x1="${L}" x2="${W - 10}" y1="${y(v)}" y2="${y(v)}" class="cgrid"/><text x="${L - 4}" y="${y(v) + 4}" text-anchor="end" class="ct">${v}</text>`).join("")}${days.map((d, i) => `<rect x="${L + i * bw + 2}" y="${y(d.m)}" width="${bw - 4}" height="${H - B - y(d.m)}" class="cbar"/><text x="${L + i * bw + bw / 2}" y="${H - 8}" text-anchor="middle" class="ct">${d.n}</text>`).join("")}</svg><p class="small muted">세로: 분(목표 300분) · 가로: 일차</p>`;
}
function evidenceModal(d){
  const last = S.assessments.filter(a => a.done).slice(-1)[0];
  const items = last ? last.doms[d].items : [];
  const prac = S.attempts.filter(a => a.d === d && !a.k.startsWith("a.") && a.s !== "retry").slice(-12).reverse();
  showModal({title:`${DOMAINS[d]} 근거`, body:`<h3>레벨을 정한 평가 문항 (${last ? (last.cp === 0 ? "첫날 진단" : last.cp + "일 평가") : "-"})</h3>${items.map(x => { const it = ASSESS_BY_ID[x.id]; return `<div class="ansrow"><div class="q">레벨 ${x.lv} · ${x.ok ? "정답" : "오답"}</div><div class="a small">${esc(it ? it.stem : x.id)}</div></div>`; }).join("") || "<p>없음</p>"}<h3>최근 연습 문제</h3>${prac.map(a => { const q = itemByKey(a.k); return `<div class="ansrow"><div class="q">${a.day}일차 · ${a.o ? "정답" : "오답"} · ${esc(q ? q.where : a.k)}</div><div class="a small">${esc(q ? q.stem : "")}</div></div>`; }).join("") || "<p>없음</p>"}`, ok:"닫기"});
}

/* ================= 기록 ================= */
function viewRecords(){
  const tab = UI.tab || "growth";
  const tabs = [["growth","성장"],["missions","실전 과제"],["write","글쓰기"],["news","뉴스 기록"],["market","시장 기록"],["company","기업분석"],["qa","질문·첨삭"],["days","학습 일지"]].map(([k, t]) => `<button class="tab" data-act="rtab" data-t="${k}" aria-selected="${tab === k}">${t}</button>`).join("");
  let body = "";
  if(tab === "growth") body = viewGrowth();
  if(tab === "missions") body = recMissions();
  if(tab === "write") body = recWrite();
  if(tab === "news") body = recNews();
  if(tab === "market") body = recMarket();
  if(tab === "company") body = recCompany();
  if(tab === "days") body = recDays();
  if(tab === "qa") body = recQA() + recEvals();
  return `<section class="card"><h2>나의 기록</h2><div class="tabs">${tabs}</div></section>${body}`;
}
function recWrite(){
  const f = UI.wfilter || "";
  const list = S.portfolio.filter(p => !f || p.type === f).slice().reverse();
  const sel = UI.compare || [];
  return `<section class="card"><div class="row"><label class="f" for="wf">글 종류<select id="wf" data-wfilter="1"><option value="">전체</option>${Object.entries(WRITE_TYPES).map(([k, v]) => `<option value="${k}" ${f === k ? "selected" : ""}>${v}</option>`).join("")}</select></label></div>
  <p class="small muted">비교하고 싶은 글 두 개를 고르면 나란히 보여 드려요. 같은 종류의 예전 글과 최근 글을 비교해 보세요.</p>
  ${sel.length === 2 ? compareBox(sel) : ""}
  ${list.map(p => `<div class="ansrow"><div class="row between"><span class="q">${p.day}일차 · ${esc(WRITE_TYPES[p.type] || p.type)}${p.rewriteOf ? " · 고쳐 쓰기" : ""}${p.source === "assess" ? " · 평가" : ""}</span><label class="small"><input type="checkbox" data-cmp="${p.id}" ${sel.includes(p.id) ? "checked" : ""}> 비교</label></div><div class="small muted">${esc(p.title || "")}</div><div class="a">${esc(p.text)}</div><div class="small muted">스스로 점검 ${(p.self || []).filter(Boolean).length}/6${p.note ? ` · 고칠 점: ${esc(p.note)}` : ""}</div></div>`).join("") || "<p class='muted'>아직 글이 없어요.</p>"}</section>`;
}
function compareBox(ids){
  const [a, b] = ids.map(id => S.portfolio.find(p => p.id === id)).sort((x, y) => x.day - y.day);
  if(!a || !b) return "";
  return `<div class="cols"><div><div class="lbl">${a.day}일차 ${esc(WRITE_TYPES[a.type] || "")}</div><div class="echo">${esc(a.text)}</div><div class="small muted">${countInfo(a.text)} · 점검 ${(a.self || []).filter(Boolean).length}/6</div></div><div><div class="lbl">${b.day}일차 ${esc(WRITE_TYPES[b.type] || "")}</div><div class="echo">${esc(b.text)}</div><div class="small muted">${countInfo(b.text)} · 점검 ${(b.self || []).filter(Boolean).length}/6</div></div></div><p class="small">비교 기준: ${CRITERIA8.join(" · ")}. 길이가 늘어난 것만으로 나아졌다고 보지 마세요.</p>`;
}
function recNews(){
  const list = S.news.slice().reverse();
  return `<section class="card">${list.map(x => `<div class="ansrow"><div class="q">${x.day}일차 · ${x.isReal ? `실제 기사 · ${esc(x.source)} · ${esc(x.srcDate || "")}` : "교육용 가상 기사"}</div><div><b>${esc(x.headline)}</b></div>${[["fact","사실"],["meaning","의미"],["why","원인"],["stakeholders","이해관계자"],["impactShort","단기 영향"],["impactLong","중장기 영향"],["stockLink","주식 연관"],["btcLink","비트코인 연관"],["knownNew","알려진 것/새로운 것"],["check","추가 확인"]].filter(([k]) => x.fields[k] || (!x.isReal && S.answers[`d${x.day}.ns${["fact","meaning","why"].indexOf(k)}`])).map(([k, l]) => `<div class="small"><b>${l}</b>: ${esc(x.fields[k] || ((S.answers[`d${x.day}.ns${["fact","meaning","why"].indexOf(k)}`] || {}).text) || "")}</div>`).join("")}${(x.links || []).length ? `<div class="small">연결: ${x.links.map(l => esc((S.news.find(y => y.id === l.id) || {}).headline || "")).join(", ")}${x.fields.linkWhy ? ` — ${esc(x.fields.linkWhy)}` : ""}</div>` : ""}</div>`).join("") || "<p class='muted'>아직 뉴스 기록이 없어요.</p>"}</section>`;
}
function recMarket(){
  return `<section class="card">${S.marketLog.slice().reverse().map(m => `<div class="ansrow"><div class="q">${m.day}일차 · ${m.isReal ? `실제 기록 · 출처 ${esc(m.source || "")} · ${esc(m.when || "")}` : "가상 자료 메모"}</div>${m.data ? `<div class="small">${esc(m.data)}</div>` : ""}<div class="a">${esc(m.text)}</div></div>`).join("") || "<p class='muted'>아직 시장 기록이 없어요.</p>"}</section>`;
}
function recCompany(){
  const cs = Object.values(S.companies || {});
  return `<section class="card">${cs.map(c => { const notes = (c.ideaNotes || []); return `<div class="ansrow"><div><b>${esc(c.name)}</b> <span class="small muted">${esc(c.year)}년 ${esc(c.rtype || "")}</span></div><div class="small">처리한 질문 ${WB.progress(c).doneN}/${WB.progress(c).total} · 투자 아이디어 노트 ${notes.length}개</div>${Object.keys(c.dayNotes || {}).length ? `<details class="ev"><summary>날짜별 사업보고서 노트 ${Object.keys(c.dayNotes).length}개</summary>${Object.entries(c.dayNotes).sort((a, b) => b[0] - a[0]).map(([d, x]) => `<div class="ansrow"><div class="q">${d}일차 · ${esc((REAL_DART[d] || [""])[0])}</div><div class="a small">${esc(x.text || "")}${x.src ? `<br><span class="muted">근거: ${esc(x.src)}</span>` : ""}</div></div>`).join("")}</details>` : ""}${notes.length ? `<details class="ev"><summary>투자 아이디어 노트 ${notes.length}개</summary>${notes.slice().reverse().map(x => `<div class="ansrow"><div class="q">${x.day}일차 · ${esc(x.prompt || "")}</div><div class="a small">${esc(x.text)}</div></div>`).join("")}</details>` : ""}${VIEW_MODE ? "" : `<div class="row"><button class="btn small" data-act="openWBRecord" data-id="${c.id}">분석글 보기</button></div>`}</div>`; }).join("") || `<p class="muted">아직 분석한 기업이 없어요. 31일차부터 실제 기업을 골라 공부해요. 미리 시작하려면 ‘기업 워크북’에서 기업을 등록하세요.</p>`}</section>`;
}
function recDays(){
  const days = Object.keys(S.dayLog).map(Number).sort((a, b) => b - a);
  return `<section class="card">${days.map(n => { const dl = S.dayLog[n]; const act = PERIODS.reduce((a, p) => a + ((dl.periods[p.k] || {}).active || 0), 0); return `<div class="ansrow"><div class="row between"><span><b>${n}일차</b> ${esc((curDay(n) || {}).title || "심화")}</span><span class="small">${dl.done ? "완료" : "진행 중"} · 집중 ${fmtDur(act)}</span></div><div><button class="btn small ghost" data-act="dayReport" data-d="${n}">보고서</button></div></div>`; }).join("") || "<p class='muted'>기록이 없어요.</p>"}</section>`;
}

/* ================= 심화 ================= */
function viewExtra(){
  const tab = UI.tab || "realnews";
  const tabs = [["realnews","실제 뉴스 분석"],["realmarket","실제 시장 기록"],["retry","틀린 문제 다시 풀기"],["challenge","도전 문제"],["library","개념 사전"],["gloss","용어 사전"],["reassess","영역 재평가"]].map(([k, t]) => `<button class="tab" data-act="xtab" data-t="${k}" aria-selected="${tab === k}">${t}</button>`).join("");
  let body = "";
  if(tab === "realnews") body = xRealNews();
  if(tab === "realmarket") body = xRealMarket();
  if(tab === "retry" || tab === "challenge") body = `<section class="card">${qsetHTML("x-" + tab) || "<p class='muted'>풀 문제가 없어요.</p>"}</section>`;
  if(tab === "library") body = xLibrary();
  if(tab === "gloss") body = xGloss();
  if(tab === "reassess") body = xReassess();
  return `<section class="card"><h2>심화 학습</h2><p class="small muted">기본 학습 경로와 별도로 더 공부하고 싶을 때 쓰는 곳이에요.</p><div class="tabs">${tabs}</div>${qaButton()}</section>${body}`;
}
function xRealNews(){
  const d = UI.realNews || {};
  const steps = [["fact","무엇이 사실인가요?"],["meaning","그 말은 무슨 뜻인가요?"],["why","왜 일어났나요?"],["link","다른 현상과 어떻게 연결되나요?"],["unknown","내가 아직 모르는 것은?"],["judge","어떤 판단을 할 수 있나요?"],["counter","내 판단이 틀릴 수 있는 이유는?"]];
  return `<section class="card"><h3>실제 경제기사 분석</h3><p class="small muted">실제 기사를 붙여넣어 7단계로 분석해요. <b>제목·출처·날짜는 꼭</b> 적어요. 프로그램은 기사 내용이 사실인지 확인하지 않아요.</p>
  <div class="grid2"><label class="f" for="rn-h">기사 제목<input id="rn-h" data-rn="headline" value="${esc(d.headline || "")}"></label><label class="f" for="rn-s">출처(신문사·사이트)<input id="rn-s" data-rn="source" value="${esc(d.source || "")}"></label><label class="f" for="rn-d">기사 날짜<input id="rn-d" type="date" data-rn="srcDate" value="${esc(d.srcDate || "")}"></label></div>
  <label class="f" for="rn-b">본문(핵심 부분만 붙여넣어도 돼요)<textarea id="rn-b" data-rn="body">${esc(d.body || "")}</textarea></label>
  ${steps.map(([k, q]) => `<label class="f" for="rn-${k}">${q}<textarea id="rn-${k}" data-rn="${k}" rows="2" style="min-height:64px">${esc(d[k] || "")}</textarea></label>`).join("")}
  ${[["stakeholders","주요 이해관계자"],["impactShort","단기 영향"],["impactLong","중장기 영향"],["stockLink","주식시장 연관"],["btcLink","비트코인 연관"],["knownNew","이미 알려진 것 vs 새로운 것"],["check","추가 확인 사항"]].map(([k, l]) => `<label class="f" for="rn-${k}">${l}<input id="rn-${k}" data-rn="${k}" value="${esc(d[k] || "")}"></label>`).join("")}
  <div class="row"><button class="btn" data-act="saveRealNews">뉴스 기록에 저장</button></div></section>`;
}
function xRealMarket(){
  const d = UI.realMkt || {};
  return `<section class="card"><h3>실제 시장 기록</h3><p class="small muted">숫자는 직접 확인한 것만 적고, 출처와 시각을 꼭 남겨요. 나중에 시황 글의 근거가 돼요.</p>
  <div class="grid2"><label class="f" for="rm-w">기준 날짜·시각<input id="rm-w" data-rm="when" value="${esc(d.when || "")}" placeholder="예: 11월 4일 15:30 마감"></label><label class="f" for="rm-s">출처<input id="rm-s" data-rm="source" value="${esc(d.source || "")}" placeholder="예: 증권사 앱, 한국거래소"></label></div>
  <label class="f" for="rm-d">숫자 메모 (코스피, 코스닥, 나스닥, 원·달러 환율, 미국 10년 국채금리, 외국인 순매수, 비트코인, 펀딩비 등)<textarea id="rm-d" data-rm="data">${esc(d.data || "")}</textarea></label>
  <label class="f" for="rm-t">해석: 가장 중요한 움직임과 원인 후보(가능한 설명/확인된 원인 구분)<textarea id="rm-t" data-rm="text">${esc(d.text || "")}</textarea></label>
  <div class="row"><button class="btn" data-act="saveRealMarket">시장 기록에 저장</button></div></section>`;
}
function xLibrary(){
  const learned = Object.keys(S.concepts).filter(id => D.concepts[id]);
  const q = UI.libQ || "";
  const list = (D.conceptList || []).filter(([id, name, day]) => (learned.includes(id) || day <= S.day) && (!q || name.includes(q)));
  return `<section class="card"><label class="f" for="libq">찾기<input id="libq" data-libq="1" value="${esc(q)}"></label>${list.map(([id, name, day]) => { const c = D.concepts[id]; const st = S.concepts[id] || {}; return c ? `<details class="ev"><summary><b>${esc(name)}</b> <span class="small muted">${day}일차${st.mastered ? " · 확인됨" : ""}</span></summary><p>${esc(c.easy)}</p><p class="small">${esc(c.real)}</p><p class="small muted">${esc(c.analogy)}</p></details>` : ""; }).join("") || "<p class='muted'>아직 배운 개념이 없어요.</p>"}</section>`;
}
function xGloss(){
  const q = UI.glossQ || "";
  const entries = Object.entries(WB.GLOSS).filter(([k]) => !q || k.includes(q));
  return `<section class="card"><label class="f" for="glq">찾기<input id="glq" data-glossq="1" value="${esc(q)}"></label>${entries.map(([k, [d, r]]) => `<div class="ex-card"><h3>${esc(k)}</h3><div class="daily"><span class="k">일상 예시</span><span>${esc(d)}</span></div><div class="daily"><span class="k">기업에서</span><span>${esc(r)}</span></div></div>`).join("")}</section>`;
}
function xReassess(){
  const last = {};
  S.assessments.forEach(a => DOM_ORDER.forEach(d => { if(a.doms[d] && a.doms[d].items.length) last[d] = a.date; }));
  return `<section class="card"><h3>영역 재평가</h3><p class="small">한 영역만 다시 평가해 레벨을 확인해요. 같은 영역은 7일에 한 번만 할 수 있어요(새 문항을 아끼고, 연습한 효과가 아니라 실력을 보려고).</p>
  ${DOM_ORDER.map(d => { const ok = !last[d] || diffDays(last[d], today()) >= 7; return `<div class="row between"><span>${esc(DOMAINS[d])} · 지금 레벨 ${S.levels ? S.levels[d] : "-"}${last[d] ? ` · 마지막 ${fmtDate(last[d])}` : ""}</span><button class="btn small ${ok ? "" : "ghost"}" data-act="reassess" data-d="${d}" ${ok ? "" : "disabled"}>${ok ? "재평가" : `${7 - diffDays(last[d], today())}일 뒤 가능`}</button></div>`; }).join("")}
  ${UI.reA ? `<div class="qbox">${reassessBody()}</div>` : ""}</section>`;
}
function reassessBody(){
  const A = UI.reA;
  if(A.phase === "obj"){
    const it = A.cur ? ASSESS_BY_ID[A.cur.id] : assessNext(A);
    if(!it){ const d = A.order[0]; const lv = A.doms[d].level; const levels = Object.assign({}, S.levels, {[d]:lv}); A.levels = levels; A.overall = overallLevel(levels); A.done = true; A.finished = Date.now(); A.phase = "result"; S.assessments.push(A); S.levels = levels; touch(); return `<p class="notebox">${esc(DOMAINS[d])} 재평가 결과: 레벨 ${lv}</p>`; }
    return `<h3 class="qtext">${esc(it.stem)}</h3>${it.passage ? `<div class="passage small">${esc(it.passage)}</div>` : ""}${it.t === "num" ? `<div class="row"><input id="anum" inputmode="decimal"><button class="btn" data-act="aNum">확인</button></div>` : `<div class="opts">${it.options.map((o, i) => `<button class="opt" data-act="aAns" data-o="${i}">${esc(o)}</button>`).join("")}</div>`}<div class="row end"><button class="btn ghost small" data-act="aAns" data-o="-1">모르겠어요</button></div>`;
  }
  return `<p class="notebox">재평가를 마쳤어요.</p>`;
}

/* ================= 설정·보고서 ================= */
function viewSettings(){
  const s = saveStatus();
  const viewLink = location.href.split("#")[0] + "#view";
  return `<section class="card"><h2>저장 상태</h2><p><b>${esc(s.txt)}</b></p>
  <p class="small">${Sync.enabled ? (Sync.authed ? "기록이 이 기기와 관리자(형)의 Google 드라이브에 함께 저장돼요. 아래 ‘함께 보기 링크’를 가진 사람은 로그인 없이 기록을 볼 수 있어요. 기록을 바꾸려면 비밀번호가 필요해요." : "서버 저장이 꺼져 있어요(비밀번호 확인 필요). 이 기기에만 저장돼요.") : (Store.mode === "memory" ? "이 화면에서는 자동 저장이 안 돼요. 꼭 백업하세요." : "기록이 이 기기의 브라우저에만 저장돼요. 브라우저 기록을 지우거나 기기를 바꾸면 사라질 수 있어요. 여러 기기가 자동으로 맞춰지지 않아요.")}</p>
  ${Sync.enabled ? `<div class="row"><button class="btn small" data-act="syncNow">지금 서버에 저장</button>${!Sync.authed ? `<button class="btn small ghost" data-act="pinEnter">비밀번호 입력</button>` : ""}</div><p class="small">함께 보기 링크(형에게 보내기): <code>${esc(viewLink)}</code> <button class="btn small ghost" data-act="copyView">복사</button></p>` : ""}</section>
  <section class="card"><h2>백업과 복원</h2><p class="small">마지막 백업: ${S.lastBackup ? fmtDate(isoOf(S.lastBackup)) : "없음"}</p><div class="row"><button class="btn small" data-act="exportAll">백업 파일 저장</button><button class="btn small ghost" data-act="importOpen">백업 파일로 복원</button><button class="btn small ghost" data-act="importPaste">백업 내용 붙여넣기</button></div></section>
  <section class="card"><h2>보고서</h2><div class="row"><button class="btn small" data-act="weeklyDl" data-n="7">주간 보고서 저장(.md)</button><button class="btn small ghost" data-act="weeklyDl" data-n="30">월간 보고서 저장</button><button class="btn small ghost" data-act="go" data-v="reports">화면에서 보기</button></div></section>
  <section class="card"><h2>사용 설명서</h2><p class="small muted">기능과 공부 순서를 처음부터 자세히 알려 줘요.</p><button class="btn small" data-act="go" data-v="guide">사용 설명서 보기</button></section>
  <section class="card"><h2>보기 설정</h2><div class="row"><span>글자 크기</span>${[16,18,20,22].map(f => `<button class="btn small ${S.settings.font === f ? "" : "ghost"}" data-act="font" data-f="${f}">${f}</button>`).join("")}</div>
  <label class="row"><input type="checkbox" data-tts="1" ${S.settings.tts ? "checked" : ""}> 읽어주기 버튼 보이기 (브라우저가 지원할 때)</label></section>
  <section class="card"><h2>일차 다시 하기</h2><p class="small muted">시험으로 눌러 본 일차가 있으면 그 일차의 기록만 지우고 처음부터 다시 할 수 있어요. 다른 일차 기록은 그대로예요.</p><div class="row"><label class="f" for="rdN" style="max-width:8rem">일차<input id="rdN" type="number" min="1" max="${S.day}" value="${S.day}" inputmode="numeric"></label><button class="btn small" data-act="resetDay">이 일차 기록 지우기</button></div></section>
  <section class="card"><h2>학습자</h2><p>${esc(S.profile.name)} · 시작 ${fmtDate(isoOf(S.created))} · ${S.day}일차</p><button class="btn danger small" data-act="wipe">모든 기록 지우기</button></section>`;
}
function viewReports(){
  const n = UI.repN || 7;
  return `<section class="card"><div class="tabs">${[[7,"주간 보고서"],[30,"월간 보고서"]].map(([k, t]) => `<button class="tab" data-act="repN" data-n="${k}" aria-selected="${n === k}">${t}</button>`).join("")}${!VIEW_MODE ? `<button class="btn small ghost" data-act="weeklyDl" data-n="${n}">파일로 저장</button>` : ""}</div></section><section class="card report">${mdToHtml(periodReportMd(n))}</section>
  ${VIEW_MODE ? `<section class="card"><h2>날짜별 하루 보고서</h2>${recDays()}</section>` : ""}`;
}
function periodReportMd(nDays){
  const t = today(), from = addDays(t, -(nDays - 1));
  const days = Object.entries(S.dayLog).filter(([, dl]) => (dl.lastDate || dl.started) >= from);
  const act = days.reduce((a, [, dl]) => a + PERIODS.reduce((b, p) => b + ((dl.periods[p.k] || {}).active || 0), 0), 0);
  const open = days.reduce((a, [, dl]) => a + PERIODS.reduce((b, p) => b + ((dl.periods[p.k] || {}).open || 0), 0), 0);
  const cur = domainStats(from, t), prev = domainStats(addDays(from, -nDays), addDays(from, -1));
  const conceptsNew = Object.entries(S.concepts).filter(([, c]) => c.learnedDate && c.learnedDate >= from).map(([id]) => (CONCEPT_BY_ID[id] || {}).name);
  const mastered = Object.entries(S.concepts).filter(([, c]) => c.mastered && c.masteredAt >= new Date(from).getTime()).map(([id]) => (CONCEPT_BY_ID[id] || {}).name);
  const as = S.assessments.filter(a => a.done);
  const last = as[as.length - 1], before = as[as.length - 2];
  const writes = S.portfolio.filter(p => p.date >= from);
  const lastCo = S.portfolio.filter(p => p.type === "company").slice(-1)[0];
  const lastMk = S.portfolio.filter(p => ["stock","crypto","macro"].includes(p.type)).slice(-1)[0];
  const strong = DOM_ORDER.filter(d => cur[d].n >= 10 && cur[d].acc >= 80).map(d => DOMAINS[d]);
  const weakD = DOM_ORDER.filter(d => cur[d].n >= 10 && cur[d].acc < 65);
  const selfRates = []; days.forEach(([, dl]) => PERIODS.forEach(p => { const r = (dl.periods[p.k] || {}).selfRate; if(r) selfRates.push(r); }));
  const co = activeCompany();
  const L = [];
  L.push(`# ${S.profile ? S.profile.name : "학습자"}의 ${nDays === 7 ? "주간" : "월간"} 학습 보고서`);
  L.push(`> 기간: ${fmtDate(from)} ~ ${fmtDate(t)} · 현재 ${S.day}일차 · 작성: 프로그램 자동 집계`);
  L.push(`## 학습량`);
  L.push(`- 학습한 날: ${days.length}일 (완료 ${days.filter(([, dl]) => dl.done).length}일)\n- 기록된 집중 시간: ${fmtDur(act)} · 화면을 연 시간 ${fmtDur(open)}\n- 집중 시간은 화면 활동 기준이며 실제 집중도를 정확히 재지는 못함`);
  L.push(`## 영역별 학습 결과 (객관적: 연습 문제 정답률)`);
  L.push(DOM_ORDER.map(d => `- ${DOMAINS[d]}: ${cur[d].n}문제 ${cur[d].acc === null ? "-" : cur[d].acc + "%"}${prev[d].acc !== null && cur[d].acc !== null ? ` (이전 기간 ${prev[d].acc}%)` : ""}`).join("\n"));
  L.push(`## 평가로 확인된 레벨`);
  L.push(last ? DOM_ORDER.map(d => `- ${DOMAINS[d]}: 레벨 ${last.levels[d]}${before ? ` (이전 평가 ${before.levels[d]})` : ""}`).join("\n") + `\n- 종합: 레벨 ${last.overall} (${last.cp === 0 ? "첫날 진단" : last.cp + "일 평가"}, ${fmtDate(last.date)})` : "- 평가 기록 없음");
  L.push(`## 새롭게 이해한 주요 개념`);
  L.push(`- 이번 기간에 배운 개념: ${conceptsNew.join(", ") || "없음"}\n- 다른 날 복습에서 다시 맞혀 확인된 개념: ${mastered.join(", ") || "없음"}`);
  L.push(`## 강점과 취약 영역`);
  L.push(`- 강점(정답률 80% 이상): ${strong.join(", ") || "아직 판단 어려움"}\n- 취약(65% 미만): ${weakD.map(d => DOMAINS[d]).join(", ") || "뚜렷한 취약 영역 없음"}`);
  L.push(`## 주관적 평가 (학습자 스스로 평가, 검증 안 됨)`);
  L.push(`- 교시별 이해도 자기 평가 평균: ${selfRates.length ? (selfRates.reduce((a, b) => a + b, 0) / selfRates.length).toFixed(1) + "/5" : "기록 없음"}\n- 글 스스로 점검 평균: ${writes.length ? (writes.reduce((a, p) => a + (p.self || []).filter(Boolean).length, 0) / writes.length).toFixed(1) + "/6" : "기록 없음"}`);
  L.push(`## 최근 기업분석 글`);
  L.push(lastCo ? `(${lastCo.day}일차)\n\n${lastCo.text}` : "- 없음");
  if(co){ const r = WB.buildReport(co); L.push(`### 워크북 기업: ${co.name} (처리한 질문 ${WB.progress(co).doneN}/${WB.progress(co).total})`); L.push(r.md.split("\n").slice(0, 30).join("\n")); }
  L.push(`## 최근 시황 글`);
  L.push(lastMk ? `(${lastMk.day}일차, ${WRITE_TYPES[lastMk.type]})\n\n${lastMk.text}` : "- 없음");
  L.push(`## 다음 기간 목표`);
  const nextCp = CHECKPOINTS.find(c => c > S.day);
  L.push(`- ${weakD.length ? weakD.map(d => DOMAINS[d]).join(", ") + " 보강(틀린 문제 복습, 다른 설명 보기)" : "현재 진도 유지"}\n- 다음 평가: ${nextCp ? nextCp + "일차" : "30일마다"}\n- 복습 카드 대기: ${Object.values(S.srs).filter(c => c.due <= t).length}장`);
  return L.join("\n\n");
}
function mdToHtml(md){
  return md.split(/\n\n+/).map(b => { if(b.startsWith("# ")) return `<h1>${esc(b.slice(2))}</h1>`; if(b.startsWith("## ")) return `<h2>${esc(b.slice(3))}</h2>`; if(b.startsWith("### ")) return `<h3>${esc(b.slice(4))}</h3>`; if(b.startsWith("> ")) return `<div class="meta">${b.split("\n").map(x => esc(x.replace(/^> /, ""))).join("<br>")}</div>`; if(/^- /.test(b)) return `<ul>${b.split("\n").map(x => `<li>${esc(x.replace(/^- /, ""))}</li>`).join("")}</ul>`; return `<p style="white-space:pre-wrap">${esc(b)}</p>`; }).join("");
}

/* ================= 관리자 보기(읽기 전용) ================= */
function viewModeRender(){
  if(!UI.viewLoaded) return `<section class="card"><p>${Sync.enabled ? "동생 기록을 불러오는 중이에요…" : "이 주소에는 기록 저장소가 연결되어 있지 않아요."}</p></section>`;
  if(!S.profile) return `<section class="card"><p>아직 저장된 학습 기록이 없어요.</p></section>`;
  const v = UI.view === "home" ? "growth" : UI.view;
  if(v === "reports") return viewReports();
  if(v === "dayReport") return viewDayReport(UI.reportDay) + "";
  if(v === "records"){ const tab = UI.tab || "write"; let body = tab === "write" ? recWrite() : tab === "news" ? recNews() : tab === "market" ? recMarket() : tab === "company" ? viewCompanyReports() : tab === "qa" ? recQA() + recEvals() : recDays(); return `<section class="card"><div class="tabs">${[["write","글"],["news","뉴스"],["market","시장"],["company","기업"],["qa","질문·첨삭"],["days","일지"]].map(([k, t]) => `<button class="tab" data-act="rtab" data-t="${k}" aria-selected="${tab === k}">${t}</button>`).join("")}</div></section>${body}`; }
  return `<section class="card"><p><b>${esc(S.profile.name)}</b> · ${S.day}일차 · 마지막 저장 ${Sync.remoteUpdated ? new Date(Sync.remoteUpdated).toLocaleString("ko-KR") : "-"}</p><p class="small muted">읽기 전용 화면이에요. 기록을 바꿀 수 없어요.</p></section>${viewGrowth()}`;
}
function viewCompanyReports(){ return recCompany() + Object.values(S.companies || {}).map(c => `<section class="card report">${WB.buildReport(c).html}</section>`).join("") || `<section class="card"><p class="muted">기업 기록이 없어요.</p></section>`; }

function recEvals(){
  const all = Object.entries(S.evals || {}).flatMap(([k, arr]) => arr.map(e => Object.assign({k}, e))).sort((a, b) => b.at - a.at);
  return `<section class="card"><h3>AI 첨삭 기록 (참고 평가)</h3>${all.map(e => `<div class="ansrow"><div class="q">${e.day}일차 · ${esc(e.label || "")}${e.verdict ? ` · ${esc(e.verdict)}` : ""}</div><details class="ev"><summary>내 답과 첨삭 보기</summary><div class="small"><b>내 답</b>: ${esc(e.answer || "")}</div><div class="a small" style="white-space:pre-wrap"><b>첨삭</b>: ${esc(e.text)}</div></details></div>`).join("") || "<p class='muted'>아직 첨삭 기록이 없어요.</p>"}</section>`;
}
