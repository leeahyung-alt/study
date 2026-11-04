const { chromium } = require('playwright');
(async()=>{
  const b=await chromium.launch(); const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file:///home/claude/academy/dist/index.html'); await p.waitForTimeout(300);
  await p.fill('#nameIn','테스트'); await p.click('[data-act=setupStart]');
  await p.evaluate(()=>{ S.pendingAssess=null; S.levels={R:2,V:2,E:2,N:2,C:2,M:2,W:2}; S.companies={}; });
  const res = await p.evaluate(()=>{
    const out=[]; 
    for(let n=1;n<=95;n++){
      S.day=n;
      for(const P of PERIODS){
        try{ startPeriod(P.k); for(let i=0;i<UI.run.steps.length;i++){ UI.run.si=i; enterStep(); render(); const s=UI.run.steps[i]; if(s.qs){ const st=UI.qset[s.id]; if(st && st.items.length){ const it=st.items[st.i]; if(it && it.q.t==='mcq'){ qsetAnswer(s.id,{o:0}); render(); } } } } timerStop(); }
        catch(e){ out.push(`d${n} ${P.k} step ${UI.run&&UI.run.si}: ${e.message}`); }
      }
    }
    return out;
  });
  console.log('render errors', res.length); res.slice(0,15).forEach(x=>console.log(' ',x));
  console.log('page errors', errs.length, errs.slice(0,5));
  // growth/report screens with data
  for(const v of ['growth','records','extra','settings','reports']){ await p.evaluate(v=>{UI.run=null;UI.view=v;render();},v); }
  await p.evaluate(()=>{ UI.view='dayReport'; UI.reportDay=50; render(); });
  console.log('after screens page errors', errs.length);
  await b.close();
})();
