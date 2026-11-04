const { chromium } = require('playwright');
const URL = 'http://127.0.0.1:8788/sync.html';
const R=[]; const ok=(n,c,x='')=>R.push(`${c?'PASS':'FAIL'} | ${n}${x?' | '+x:''}`);
(async () => {
  const b = await chromium.launch();
  const errs=[]; const mk = async () => { const c = await b.newContext({viewport:{width:1000,height:900}}); const p = await c.newPage(); p.on('pageerror', e=>errs.push(e.message)); return [c,p]; };
  // 동생 기기 A
  let [cA,pA] = await mk(); await pA.goto(URL); await pA.waitForTimeout(600);
  await pA.fill('#nameIn','민수'); await pA.fill('#pinNew','12'); await pA.click('[data-act=setupStart]'); await pA.waitForTimeout(200);
  ok('짧은 비밀번호 거부', (await pA.textContent('#setupErr')).includes('4자리'));
  await pA.fill('#pinNew','2468'); await pA.click('[data-act=setupStart]'); await pA.waitForTimeout(600);
  let n=0; while(n<200){ if(!(await pA.$('[data-act=aAns]'))) break; const num = await pA.$('#anum'); if(num){ await pA.fill('#anum','1'); await pA.click('[data-act=aNum]'); } else await pA.click('[data-act=aAns][data-o="1"]'); n++; }
  const wd = await pA.$('[data-act=aWriteDone]'); if(wd){ for(const x of await pA.$$('[data-aw]')) await x.fill('첫날 글: 금리가 올라서 주식이 떨어졌다.'); await wd.click(); }
  await pA.click('[data-act=startAt][data-d="1"]'); await pA.waitForTimeout(300);
  await pA.click('[data-act=go][data-v=settings]'); await pA.click('[data-act=syncNow]'); await pA.waitForTimeout(800);
  const pill = await pA.textContent('#savePill'); ok('서버 저장 상태 표시', pill.includes('서버 저장'), pill);
  // 관리자(형) 보기 - 로그인 없이 링크
  let [cV,pV] = await mk(); await pV.goto(URL + '#view'); await pV.waitForTimeout(900);
  const vt = await pV.textContent('#app'); ok('관리자 보기: 동생 기록 표시(읽기 전용)', vt.includes('민수') && vt.includes('읽기 전용') && vt.includes('현재 나의 수준'));
  ok('관리자 보기: 입력 버튼 없음', !(await pV.$('[data-act=startPeriod]')) && !(await pV.$('textarea')));
  await pV.click('[data-act=go][data-v=reports]'); await pV.waitForTimeout(200);
  ok('관리자 보기: 주간 보고서', (await pV.textContent('#app')).includes('주간 학습 보고서'));
  await pV.click('[data-act=go][data-v=records]'); await pV.waitForTimeout(200);
  ok('관리자 보기: 기록(글) 표시', (await pV.textContent('#app')).includes('첫날'));
  // 다른 기기 B: 틀린 비밀번호 → 거부, 맞는 비밀번호 → 이어하기
  let [cB,pB] = await mk(); await pB.goto(URL); await pB.waitForTimeout(800);
  ok('다른 기기: 저장된 기록 안내', (await pB.textContent('#app')).includes('저장된 기록이 있어요'));
  await pB.fill('#pinIn','0000'); await pB.click('[data-act=resumeRemote]'); await pB.waitForTimeout(500);
  ok('틀린 비밀번호로 이어하기 거부', (await pB.textContent('#app')).includes('저장된 기록이 있어요'));
  await pB.fill('#pinIn','2468'); await pB.click('[data-act=resumeRemote]'); await pB.waitForTimeout(600);
  ok('맞는 비밀번호로 이어하기', (await pB.textContent('#app')).includes('1일차'));
  // B에서 공부 → A에서 새로 열면 최신 기록
  await pB.click('[data-act=startPeriod]'); await pB.waitForTimeout(200);
  const opt = await pB.$('[data-act=qAns]'); if(opt) await opt.click();
  await pB.click('[data-act=go][data-v=settings]').catch(()=>{});
  await pB.evaluate(() => { UI.run=null; }); await pB.click('.nav [data-act=go][data-v=settings]'); await pB.click('[data-act=syncNow]'); await pB.waitForTimeout(800);
  const attB = await pB.evaluate(() => S.attempts.length);
  await pA.reload(); await pA.waitForTimeout(1200);
  const attA = await pA.evaluate(() => S.attempts.length);
  ok('기기 간 최신 기록 이어받기', attA === attB, `A=${attA} B=${attB}`);
  // 직접 POST로 위조 시도
  const forged = await pV.evaluate(async () => { const r = await fetch(CFG.SYNC_URL, {method:'POST', headers:{'Content-Type':'text/plain'}, body:JSON.stringify({id:'learner', pin:'9999', state:{v:1}})}); return (await r.json()).error; });
  ok('비밀번호 없이 기록 덮어쓰기 차단', forged === 'pin', forged);
  ok('스크립트 오류 없음', errs.length===0, errs.join('/'));
  console.log(R.join('\n')); await b.close();
})();
