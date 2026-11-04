const { chromium } = require('playwright');
const URL='http://127.0.0.1:8788/sync.html';
const R=[]; const ok=(n,c,x='')=>R.push(`${c?'PASS':'FAIL'} | ${n}${x?' | '+x:''}`);
(async()=>{
  const b=await chromium.launch(); const errs=[];
  // 이전 버전 기록을 그대로 불러와도 되는지
  const c0=await b.newContext(); const p0=await c0.newPage(); p0.on('pageerror',e=>errs.push(e.message));
  await p0.goto('file:///home/claude/academy/dist/index.html'); await p0.waitForTimeout(300);
  await p0.setInputFiles('#importFile','/home/claude/academy/test/bk.json'); await p0.waitForTimeout(200); await p0.click('[data-act=modalOk]'); await p0.waitForTimeout(300);
  ok('이전 버전 백업 불러오기(기존 기록 유지)', (await p0.evaluate(()=>S.attempts.length))>0 && (await p0.textContent('#app')).includes('일차'));
  await c0.close();
  const c=await b.newContext({viewport:{width:1000,height:900}}); const p=await c.newPage(); p.on('pageerror',e=>errs.push(e.message));
  await p.goto(URL); await p.waitForTimeout(700);
  await p.fill('#nameIn','민수'); await p.fill('#pinNew','1111'); await p.click('[data-act=setupStart]'); await p.waitForTimeout(500);
  let n=0; while(n<200){ if(!(await p.$('[data-act=aAns]'))) break; await p.click('[data-act=aAns][data-o="-1"]'); n++; }
  const wd=await p.$('[data-act=aWriteDone]'); if(wd){ for(const x of await p.$$('[data-aw]')) await x.fill('첫날 글'); await wd.click(); }
  await p.click('[data-act=startAt][data-d="1"]'); await p.waitForTimeout(200);
  await p.click('[data-act=startPeriod]'); await p.waitForTimeout(200);
  // 질문하기 3번 + 4번째 차단
  for(let i=1;i<=10;i++){ await p.click('[data-act=askOpen]'); await p.fill('#qaIn','이 낱말 뜻이 뭐예요? '+i); await p.click('[data-act=modalOk]'); await p.waitForTimeout(500); const out=await p.textContent('#qaOut'); if(i===1) ok('질문 → 답변 표시', out.includes('한 줄 요약'), out.slice(0,40)); await p.click('[data-act=modalCancel]'); }
  await p.evaluate(()=>render());
  ok('같은 항목 11번째 질문 버튼 막힘', await p.$eval('[data-act=askOpen]', el=>el.disabled), await p.textContent('.qa-bar'));
  await p.evaluate(()=>{ S.qaLeft={}; }); await p.evaluate(()=>render());
  await p.click('[data-act=askOpen]'); await p.fill('#qaIn','4번째'); await p.click('[data-act=modalOk]'); await p.waitForTimeout(500);
  ok('화면 조작해도 서버에서 11번째 거부', (await p.textContent('#qaOut')).includes('10번을 모두'));
  await p.click('[data-act=modalCancel]');
  // 서술형 첨삭: 요약 단계로 이동
  await p.evaluate(()=>{ UI.run.si=UI.run.steps.findIndex(s=>s.id==='sum'); enterStep(); render(); });
  await p.fill('#qfree','사과를 사려는 사람이 늘고 사과가 줄어서 값이 올랐다.'); await p.click('[data-act=qFree]'); await p.waitForTimeout(200);
  await p.click('[data-act=aiEval]'); await p.waitForTimeout(800);
  const ev = await p.evaluate(()=>Object.values(S.evals||{})[0]);
  ok('서술형 AI 첨삭 + 판정 기록', ev && ev[0].verdict==='부분 적절', ev && ev[0].verdict);
  // 교시 마무리: 약점 진단 + 응용 문제
  await p.evaluate(()=>{ UI.run.si=UI.run.steps.length-1; enterStep(); render(); });
  ok('교시 평가(약한 부분과 고치는 방법) 표시', (await p.textContent('#app')).includes('약한 부분과 고치는 방법'));
  await p.click('[data-act=applyGen]'); await p.waitForTimeout(800);
  ok('응용 문제 생성', (await p.evaluate(()=>(S.applied||[]).length))===1 && (await p.textContent('#app')).includes('응용 문제 1'));
  await p.fill('#apa-0','이익이 줄어든다. 원가가 올라서다.'); await p.waitForTimeout(100);
  const evb = await p.$$('[data-act=aiEval]'); await evb[evb.length-1].click(); await p.waitForTimeout(800);
  ok('응용 문제 답 채점', (await p.evaluate(()=>Object.keys(S.evals||{}).some(k=>k.startsWith('ev.ap.'))))) ;
  // 3교시 실제 뉴스, 4교시 실제 사업보고서
  await p.evaluate(()=>{ timerStop(); startPeriod('p3'); UI.run.si=UI.run.steps.findIndex(s=>s.id==='rnews'); enterStep(); render(); });
  ok('3교시: 오늘의 실제 뉴스 가이드', (await p.textContent('#app')).includes('오늘 찾을 실제 기사'));
  await p.fill('#rn-h','배춧값 급등'); await p.fill('#rn-s','연합뉴스'); await p.fill('#rn-d','2026-11-04'); await p.fill('#rn-fact','배춧값이 올랐다'); await p.click('[data-act=saveRealNews]'); await p.waitForTimeout(200);
  ok('실제 뉴스 저장', await p.evaluate(()=>S.news.some(x=>x.isReal && x.headline==='배춧값 급등')));
  await p.evaluate(()=>{ timerStop(); startPeriod('p4'); UI.run.si=UI.run.steps.findIndex(s=>s.id==='creal'); enterStep(); render(); });
  ok('4교시: 내 기업 고르기(1일차부터)', (await p.textContent('#app')).includes('함께 공부할 실제 기업'));
  await p.fill('#mc-n','현대건설'); await p.click('[data-act=pickCompany]'); await p.waitForTimeout(200);
  ok('오늘 볼 곳 안내', (await p.textContent('#app')).includes('DART에서 내 기업의 최신 사업보고서 열기'));
  await p.fill('#rd-q','2025년 사업보고서, 2026년 3월 18일 제출'); await p.waitForTimeout(100);
  ok('사업보고서 노트 저장', await p.evaluate(()=>activeCompany().dayNotes[1].text.includes('2025')));
  // 하루 마치고 바로 다음 일차
  await p.evaluate(()=>{ timerStop(); UI.run=null; PERIODS.forEach(x=>{const pl=periodLog(1,x.k); pl.st='done';}); const dl=dayLog(1); dl.done=true; dl.doneDate=today(); UI.view='dayReport'; UI.reportDay=1; render(); });
  ok('보고서에 약한 부분 섹션', (await p.textContent('#app')).includes('약한 부분과 개선 방법'));
  await p.click('[data-act=nextDayNow]'); await p.waitForTimeout(200);
  ok('바로 2일차 시작', (await p.evaluate(()=>S.day))===2 && (await p.textContent('#app')).includes('2일차'));
  ok('2일차 4교시 사업보고서 과제 이어짐', await p.evaluate(()=>buildSteps(2,'p4').some(s=>s.id==='creal')));
  // 관리자 보기에 질문 기록
  await p.click('.nav [data-act=go][data-v=settings]'); await p.click('[data-act=syncNow]'); await p.waitForTimeout(800);
  const v=await (await b.newContext()).newPage(); await v.goto(URL+'#view'); await v.waitForTimeout(900);
  await v.click('[data-act=go][data-v=records]'); await v.click('[data-act=rtab][data-t=qa]'); await v.waitForTimeout(200);
  ok('형님 보기: 질문·첨삭 기록', (await v.textContent('#app')).includes('이 낱말 뜻이 뭐예요'));
  ok('오류 없음', errs.length===0, errs.slice(0,4).join(' / '));
  console.log(R.join('\n')); await b.close();
})();
