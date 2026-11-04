const { chromium, devices } = require('playwright');
const URL='file:///home/claude/academy/dist/index.html';
const R=[]; const ok=(n,c,x='')=>R.push(`${c?'PASS':'FAIL'} | ${n}${x?' | '+x:''}`);
(async()=>{
  const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:1000,height:900}, acceptDownloads:true}); const p=await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(URL); await p.waitForTimeout(400);
  await p.fill('#nameIn','민수'); await p.click('[data-act=setupStart]');
  let n=0; while(n<200){ if(!(await p.$('[data-act=aAns]'))) break; const num=await p.$('#anum'); if(num){await p.fill('#anum','0'); await p.click('[data-act=aNum]');} else await p.click('[data-act=aAns][data-o="-1"]'); n++; }
  const wd=await p.$('[data-act=aWriteDone]'); if(wd) await wd.click();
  await p.click('[data-act=startAt][data-d="1"]');
  // 하루 끝났다고 치고 날짜 넘기기
  await p.evaluate(()=>{ PERIODS.forEach(x=>{ const pl=periodLog(1,x.k); pl.st='done'; pl.active=3000; }); const dl=dayLog(1); dl.done=true; dl.doneDate=addDays(today(),-1); touch(); });
  await p.click('.nav [data-act=go][data-v=home]'); await p.waitForTimeout(200);
  ok('다음 날 자동으로 2일차', (await p.evaluate(()=>S.day))===2);
  // 미완료 상태로 날짜가 바뀐 경우
  await p.evaluate(()=>{ const pl=periodLog(2,'p1'); pl.st='done'; const dl=dayLog(2); dl.lastDate=addDays(today(),-1); touch(); });
  await p.click('.nav [data-act=go][data-v=home]'); await p.waitForTimeout(200);
  ok('미완료 날: 이어하기/넘어가기 선택', (await p.textContent('#app')).includes('어제 공부를 다 마치지 못했어요'));
  await p.click('[data-act=skipToNext]'); ok('넘어가기 → 3일차', (await p.evaluate(()=>S.day))===3);
  ok('넘어가도 2일차 기록 유지', await p.evaluate(()=>S.dayLog[2].periods.p1.st==='done'));
  // 복습 개념 카드: 1일차 개념 학습했다고 치고 다음날 복습 → 습득 판정
  await p.evaluate(()=>{ S.concepts.revenue={learned:1,learnedDate:addDays(today(),-2),mastered:false}; recordAttempt('c.revenue.0','C',1,true,'p2'); S.attempts[S.attempts.length-1].t=Date.now()-2*864e5; recordAttempt('c.revenue.3','C',1,false,'p2'); S.attempts[S.attempts.length-1].t=Date.now()-2*864e5; });
  await p.evaluate(()=>{ recordAttempt('c.revenue.3','C',1,true,'p2'); updateConceptMastery('revenue'); });
  const cd = await p.evaluate(()=>canDoList().map(c=>c.text));
  ok('처음 틀렸다가 다른 날 맞힌 개념 → 할 수 있게 된 것', cd.some(t=>t.includes('처음 풀었을 때는')), cd[0]);
  ok('틀렸던 문제 다시 맞힘 기록', await p.evaluate(()=>S.comebacks.length>=1));
  // 7일 평가
  await p.evaluate(()=>{ S.day=7; touch(); }); await p.click('.nav [data-act=go][data-v=home]');
  ok('7일차: 평가의 날 표시', (await p.textContent('#app')).includes('평가'));
  await p.click('[data-act=startPeriod]'); await p.waitForTimeout(150);
  ok('1교시 = 평가', (await p.textContent('#app')).includes('7일 평가'));
  await p.click('[data-act=assessStart]');
  n=0; while(n<200){ if(!(await p.$('[data-act=aAns]'))) break; const num=await p.$('#anum'); if(num){await p.fill('#anum','5'); await p.click('[data-act=aNum]');} else await p.click('[data-act=aAns][data-o="0"]'); n++; }
  const as = await p.evaluate(()=>S.assessments.map(a=>({cp:a.cp,ov:a.overall,n:Object.values(a.doms).reduce((s,d)=>s+d.items.length,0)})));
  ok('7일 평가 완료·저장', as.length>=2 && as[as.length-1].cp===7, JSON.stringify(as));
  const fresh = await p.evaluate(()=>{ const a=S.assessments; const ids0=new Set(Object.values(a[0].doms).flatMap(d=>d.items.map(x=>x.id))); const ids1=Object.values(a[a.length-1].doms).flatMap(d=>d.items.map(x=>x.id)); return ids1.filter(i=>ids0.has(i)).length; });
  ok('7일 평가는 첫날과 다른 새 문항', fresh===0, 'overlap '+fresh);
  // 복습 단계 구성 (7일차 3교시)
  const steps = await p.evaluate(()=>['p3','p4','p5','p6'].map(k=>buildSteps(7,k).map(s=>s.title).join('/')));
  ok('평가일 3~6교시는 복습 활동', steps.every(s=>s.length>10), steps.join(' | '));
  // 31일차 기업분석: 워크북 연결
  await p.evaluate(()=>{ timerStop(); UI.run=null; S.day=31; touch(); });
  await p.click('.nav [data-act=go][data-v=home]');
  await p.evaluate(()=>startPeriod('p4')); await p.waitForTimeout(150);
  ok('31일차 4교시: 사업보고서 연습 발췌', (await p.textContent('#app')).includes('연습'));
  await p.evaluate(()=>{ UI.run.si=UI.run.steps.findIndex(s=>s.id==='capply'); enterStep(); render(); });
  ok('실제 기업 고르기 안내', (await p.textContent('#app')).includes('실제 기업을 하나 골라'));
  await p.click('[data-act=openWB]'); await p.waitForTimeout(200);
  await p.fill('#f-name','현대건설'); await p.selectOption('#f-ind','construction'); await p.click('#newForm button[type=submit]'); await p.waitForTimeout(200);
  ok('워크북에서 기업 등록', await p.evaluate(()=>Object.values(S.companies).some(c=>c.name==='현대건설')));
  await p.click('[data-act=wbBack]'); await p.waitForTimeout(150);
  ok('워크북 → 교시로 복귀', (await p.textContent('#app')).includes('워크북 학습'));
  // 유휴 감지
  await p.evaluate(()=>{ Timer.lastAct = Date.now()-200000; }); await p.waitForTimeout(1500);
  ok('3분 무활동 → 확인 창', !!(await p.$('#idleBack')));
  await p.click('[data-act=idleNo]');
  // 백업·복원
  await p.evaluate(()=>{ timerStop(); UI.run=null; });
  await p.click('.nav [data-act=go][data-v=settings]');
  const [dl]=await Promise.all([p.waitForEvent('download'), p.click('[data-act=exportAll]')]); const bp='/home/claude/academy/test/bk.json'; await dl.saveAs(bp);
  const before = await p.evaluate(()=>S.attempts.length);
  await p.click('[data-act=wipe]'); await p.fill('#wipeIn','삭제'); await p.click('[data-act=modalOk]'); await p.waitForTimeout(300);
  ok('삭제 확인 후 초기화', (await p.textContent('#app')).includes('시작하기'));
  await p.setInputFiles('#importFile', bp); await p.waitForTimeout(200); await p.click('[data-act=modalOk]'); await p.waitForTimeout(300);
  ok('백업 복원', (await p.evaluate(()=>S.attempts.length))===before);
  // 모바일
  const m=await b.newContext({...devices['iPhone 13']}); const pm=await m.newPage(); await pm.goto(URL); await pm.waitForTimeout(300);
  await pm.setInputFiles('#importFile', bp); await pm.waitForTimeout(200); await pm.click('[data-act=modalOk]'); await pm.waitForTimeout(300);
  await pm.evaluate(()=>{ S.day=3; touch(); render(); }); await pm.evaluate(()=>startPeriod('p1')); await pm.waitForTimeout(200);
  await pm.evaluate(()=>{ UI.run.si=UI.run.steps.findIndex(s=>s.id==='read'); enterStep(); render(); });
  await pm.screenshot({path:'/home/claude/academy/test/mobile_read.png'});
  const sw=await pm.evaluate(()=>document.documentElement.scrollWidth); ok('모바일 가로 넘침 없음', sw<=390, 'sw='+sw);
  await pm.evaluate(()=>{ timerStop(); UI.run=null; UI.view='home'; render(); }); await pm.screenshot({path:'/home/claude/academy/test/mobile_home.png'});
  ok('오류 없음', errs.length===0, errs.slice(0,5).join(' / '));
  console.log(R.join('\n')); await b.close();
})();
