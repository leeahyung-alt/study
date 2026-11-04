const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({viewport:{width:1000,height:900}}); const p = await ctx.newPage();
  const errs=[]; p.on('pageerror', e=>errs.push(e.message)); p.on('console', m=>{ if(m.type()==='error' && !/ERR_TUNNEL|fonts/.test(m.text())) errs.push('console:'+m.text()); });
  await p.goto('file:///home/claude/academy/dist/index.html'); await p.waitForTimeout(500);
  const t = async s => (await p.textContent(s))||'';
  console.log('setup:', (await t('#app')).slice(0,60));
  await p.fill('#nameIn','민수'); await p.click('[data-act=setupStart]'); await p.waitForTimeout(200);
  // diagnostic: answer first option always, max 200 clicks
  let n=0; while(n<200){ const ans = await p.$('[data-act=aAns]'); if(!ans) break; const num = await p.$('#anum'); if(num){ await p.fill('#anum','1'); await p.click('[data-act=aNum]'); } else await p.click('[data-act=aAns][data-o="0"]'); n++; }
  console.log('diag items answered', n);
  const tas = await p.$$('[data-aw]'); for(const x of tas) await x.fill('금리가 올라서 주식이 떨어졌다.');
  const wd = await p.$('[data-act=aWriteDone]'); if(wd){ await wd.click(); await p.waitForTimeout(200); }
  console.log('result:', (await t('#app')).match(/종합 레벨 \d/)?.[0]);
  await p.click('[data-act=startAt][data-d="1"]'); await p.waitForTimeout(200);
  console.log('home:', (await t('#app')).slice(0,120).replace(/\s+/g,' '));
  await p.click('[data-act=startPeriod]'); await p.waitForTimeout(200);
  // run through all 6 periods
  for(let per=1; per<=6; per++){
    let guard=0;
    while(guard++<80){
      // answer any open question
      const opt = await p.$('[data-act=qAns]:not([disabled])'); if(opt){ await opt.click(); await p.waitForTimeout(30); }
      const qn = await p.$('#qnum:not([disabled])'); if(qn){ await qn.fill('10'); await p.click('[data-act=qNum]'); }
      const qf = await p.$('#qfree:not([readonly])'); if(qf){ await qf.fill('내 생각은 이렇다. 이유가 있다.'); await p.click('[data-act=qFree]'); }
      const pk = await p.$('[data-act=pickKey]:not([disabled])'); if(pk){ await pk.click(); }
      const wt = await p.$('#wtext'); if(wt && !(await wt.inputValue())) { await wt.fill('금리가 오르면 이자 부담이 커진다. 그래서 기업 이익이 줄 수 있다. 하지만 다른 요인도 확인해야 한다. 이것은 내 생각이다.'); }
      const sc = await p.$$('[data-self]'); for(const c of sc) if(!(await c.isChecked())) await c.check();
      const nx = await p.$('[data-act=qNext]'); if(nx){ await nx.click(); continue; }
      const sr = await p.$('[data-act=selfRate][data-v="3"]'); if(sr && (await sr.getAttribute('aria-pressed'))!=='true'){ await sr.click(); }
      const step = await p.$('[data-act=stepNext]'); if(step){ await step.click(); continue; }
      const end = await p.$('[data-act=endPeriod]'); if(end){ await end.click(); break; }
      break;
    }
    await p.waitForTimeout(150);
    const txt = await t('#app');
    console.log('after period', per, ':', txt.slice(0,50).replace(/\s+/g,' '));
    const sp = await p.$('[data-act=startPeriod]'); if(sp && per<6) await sp.click();
  }
  await p.screenshot({path:'/home/claude/academy/test/dayreport.png', fullPage:true});
  await p.click('[data-act=go][data-v=growth]'); await p.waitForTimeout(200);
  await p.screenshot({path:'/home/claude/academy/test/growth.png', fullPage:true});
  for(const v of ['records','extra','settings','wb','home']){ await p.click(`.nav [data-act=go][data-v=${v}]`); await p.waitForTimeout(150); }
  await p.reload(); await p.waitForTimeout(600);
  console.log('after reload:', (await t('#app')).slice(0,80).replace(/\s+/g,' '));
  const st = await p.evaluate(()=>({day:S.day, atts:S.attempts.length, port:S.portfolio.length, news:S.news.length, store:Store.mode, done:S.dayLog[1]&&S.dayLog[1].done}));
  console.log(JSON.stringify(st));
  console.log('ERRORS', errs.length, errs.slice(0,10));
  await b.close();
})();
