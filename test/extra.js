const { chromium } = require('playwright');
const R=[]; const ok=(n,c,x='')=>R.push(`${c?'PASS':'FAIL'} | ${n}${x?' | '+x:''}`);
(async()=>{
  const b=await chromium.launch(); const errs=[];
  const c=await b.newContext({viewport:{width:1000,height:900}}); const p=await c.newPage(); p.on('pageerror',e=>errs.push(e.message));
  await p.goto('http://127.0.0.1:8788/sync.html'); await p.waitForTimeout(700);
  await p.fill('#nameIn','민수'); await p.fill('#pinNew','2222'); await p.click('[data-act=setupStart]'); await p.waitForTimeout(500);
  ok('첫날 진단 중에는 질문 버튼 없음', !(await p.$('[data-act=askOpen]')));
  let n=0; while(n<200){ if(!(await p.$('[data-act=aAns]'))) break; await p.click('[data-act=aAns][data-o="-1"]'); n++; }
  const wd=await p.$('[data-act=aWriteDone]'); if(wd){ for(const x of await p.$$('[data-aw]')) await x.fill('첫날 글'); await wd.click(); }
  for(const t of ['realnews','realmarket','retry','challenge','library','gloss','reassess']){
    await p.evaluate(t=>{ UI.view='extra'; UI.tab=t; render(); }, t); await p.waitForTimeout(150);
    const has=!!(await p.$('[data-act=askOpen]'));
    ok(`심화 ${t}: 질문 버튼 ${t==='reassess'?'없음':'있음'}`, t==='reassess'?!has:has);
  }
  await p.evaluate(()=>{ UI.view='extra'; UI.tab='realnews'; UI.realNews={headline:'금리 동결', source:'연합뉴스', body:'한국은행이 기준금리를 동결했다.'}; render(); });
  await p.click('[data-act=askOpen]'); await p.fill('#qaIn','동결이 무슨 뜻이에요?'); await p.click('[data-act=modalOk]'); await p.waitForTimeout(600);
  ok('심화 뉴스에서 질문 → 답변', (await p.textContent('#qaOut')).includes('한 줄 요약'));
  // 체크포인트 평가 단계엔 버튼 없음
  await p.evaluate(()=>{ UI.view='run'; S.day=7; UI.run={day:7,k:'p1',si:0,steps:buildSteps(7,'p1')}; render(); });
  const sid=await p.evaluate(()=>UI.run.steps[0].id);
  ok('7일차 평가 단계엔 질문 버튼 없음', sid==='assess' && !(await p.$('[data-act=askOpen]')), sid);
  ok('오류 없음', errs.length===0, errs.join(' / '));
  console.log(R.join('\n')); await b.close();
})();
