const { chromium } = require('playwright');
const R=[]; const ok=(n,c,x='')=>R.push(`${c?'PASS':'FAIL'} | ${n}${x?' | '+x:''}`);
(async()=>{
  const b=await chromium.launch(); const errs=[];
  const c=await b.newContext({viewport:{width:420,height:900}}); const p=await c.newPage(); p.on('pageerror',e=>errs.push(e.message));
  await p.goto('http://127.0.0.1:8788/sync.html'); await p.waitForTimeout(700);
  await p.fill('#nameIn','민수'); await p.fill('#pinNew','4444'); await p.click('[data-act=setupStart]'); await p.waitForTimeout(500);
  let n=0; while(n<200){ if(!(await p.$('[data-act=aAns]'))) break; await p.click('[data-act=aAns][data-o="-1"]'); n++; }
  const wd=await p.$('[data-act=aWriteDone]'); if(wd){ for(const x of await p.$$('[data-aw]')) await x.fill('첫날 글'); await wd.click(); }
  const st=await p.$('[data-act=startAt][data-d="1"]'); if(st) await st.click(); await p.waitForTimeout(200);
  const nav=await p.$$eval('.navb', els=>els.map(e=>e.textContent));
  ok('메뉴 3개', nav.join(',')==='오늘 공부,내 기록,설정', nav.join(','));
  await p.click('[data-act=startPeriod]'); await p.waitForTimeout(200);
  const ids=await p.evaluate(()=>UI.run.steps.map(s=>s.id));
  ok('1교시에 실전 과제·보충 단계', ids.includes('mis') && ids.includes('mx'), ids.join(','));
  // 과제 단계 전 이동 막힘 확인: 점으로 끝까지 점프
  await p.evaluate(()=>{ UI.run.si=UI.run.steps.findIndex(s=>s.id==='mis'); enterStep(); render(); }); await p.waitForTimeout(800);
  await p.waitForTimeout(1500); const tt=await p.textContent('#app'); ok('AI 과제 불러옴(기사 링크)', tt.includes('금리 동결 기사'), tt.slice(0,300));
  await p.click('[data-act=stepNext]'); await p.waitForTimeout(200);
  ok('제출 전 다음으로 못 감', await p.evaluate(()=>UI.run.steps[UI.run.si].id)==='mis');
  await p.click('[data-act=mSubmit]'); await p.waitForTimeout(200);
  ok('빈 답 제출 막힘', await p.evaluate(()=>!S.missions['d1_p1'].grades.length));
  await p.fill('#mt-0','금리가 2.5%로 그대로'); await p.fill('#mt-1','물가 때문'); await p.click('[data-act=mSubmit]'); await p.waitForTimeout(600);
  const t1=await p.textContent('#app');
  ok('1차 평가: 55점 부분 적절 + 고칠 방법', t1.includes('55점') && t1.includes('고칠 방법'));
  ok('통과 전 다음 막힘', !(await p.evaluate(()=>S.missions['d1_p1'].passed)));
  await p.fill('#mt-0','기준금리 2.5% 동결(11월 4일)'); await p.click('[data-act=mSubmit]'); await p.waitForTimeout(600);
  ok('2차 평가 통과', await p.evaluate(()=>S.missions['d1_p1'].passed && S.missions['d1_p1'].grades.length===2));
  ok('지금 바로 복습 지시', (await p.textContent('#app')).includes('기사 2문단 다시 읽기'));
  await p.click('[data-act=stepNext]'); await p.waitForTimeout(200);
  ok('복습 확인 전 막힘', await p.evaluate(()=>UI.run.steps[UI.run.si].id)==='mis');
  await p.click('[data-act=mNowDone]'); await p.click('[data-act=stepNext]'); await p.waitForTimeout(800);
  ok('보충 단계로 이동', await p.evaluate(()=>UI.run.steps[UI.run.si].id)==='mx');
  ok('시간 짧아 보충 과제 나옴', (await p.textContent('#app')).includes('목표(35분)보다 짧아요'));
  await p.waitForTimeout(500);
  await p.fill('#mt-0','a'); await p.fill('#mt-1','b'); await p.click('[data-act=mSubmit]'); await p.waitForTimeout(500); await p.click('[data-act=mSubmit]'); await p.waitForTimeout(500);
  await p.click('[data-act=mNowDone]'); await p.click('[data-act=stepNext]'); await p.waitForTimeout(200);
  ok('보충 끝나고 마무리로', await p.evaluate(()=>UI.run.steps[UI.run.si].id)==='end');
  ok('내일 복습 쌓임', await p.evaluate(()=>(S.reviewQ||[]).length)>=2);
  // 4교시: 기업 고르기
  await p.evaluate(()=>{ UI.run={day:1,k:'p4',steps:buildSteps(1,'p4'),si:0}; UI.run.si=UI.run.steps.findIndex(s=>s.id==='mis'); UI.view='run'; render(); }); await p.waitForTimeout(300);
  ok('4교시 기업 먼저 고르기', (await p.textContent('#app')).includes('90일 동안 사업보고서를 끝까지'));
  await p.fill('#mc-n','삼성전자'); await p.click('[data-act=pickCompany]'); await p.waitForTimeout(900);
  ok('사업보고서 과제 로드', (await p.textContent('#app')).includes('사업보고서 과제(모의)'));
  // 다음 날 어제 지적 복습
  await p.evaluate(()=>{ S.day=2; UI.run={day:2,k:'p1',steps:buildSteps(2,'p1'),si:0}; UI.view='run'; render(); }); await p.waitForTimeout(200);
  ok('2일차 첫 단계 = 어제 지적 복습', await p.evaluate(()=>UI.run.steps[0].id)==='rq0');
  for(const t of await p.$$('[data-rvans]')) await t.fill('그대로 두는 것');
  await p.click('[data-act=rvSubmit]'); await p.waitForTimeout(600);
  ok('복습 평가 후 통과', await p.evaluate(()=>!UI.run.steps[0].gate()));
  // 기록 탭
  await p.evaluate(()=>{ UI.view='records'; UI.tab='missions'; render(); });
  ok('기록 → 실전 과제', (await p.textContent('#app')).includes('실제 기사 과제(모의)'));
  // 7일차(평가의 날) 1교시엔 과제 없음
  ok('평가의 날 1교시엔 과제 없음', await p.evaluate(()=>!buildSteps(7,'p1').some(s=>s.id==='mis')));
  ok('평가의 날 3교시엔 과제 있음', await p.evaluate(()=>buildSteps(7,'p3').some(s=>s.id==='mis')));
  ok('예전 서버면 과제 대신 안내·막지 않음', await p.evaluate(()=>{ Sync.ver=0; return !missionSteps(5,'p3')[0].gate() && missionView(missionSpec(5,'p3')).includes('새 버전'); }));
  ok('오류 없음', errs.length===0, errs.join(' / '));
  console.log(R.join('\n')); await b.close();
})();
