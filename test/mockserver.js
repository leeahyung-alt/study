// Apps Script 저장소 흉내: GET ?id= / POST {id,pin,action,state}
const http = require('http'); const crypto = require('crypto');
const files = {}, pins = {};
const srv = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const u = new URL(req.url, 'http://x'); const send = o => { res.setHeader('Content-Type','application/json'); res.end(JSON.stringify(o)); };
  if(req.method === 'GET'){ const id = (u.searchParams.get('id')||'learner'); return send({ok:true, ver:3, id, data: files[id] ? JSON.parse(files[id]) : null}); }
  if(req.method === 'POST'){ let b=''; req.on('data', c => b += c); req.on('end', () => { let body; try{ body = JSON.parse(b);}catch(e){ return send({ok:false,error:'bad_json'}); }
    const id = body.id||'learner'; const h = crypto.createHash('sha256').update(String(body.pin||'')+'|'+id).digest('base64');
    if(!pins[id]){ if(String(body.pin||'').length<4) return send({ok:false,error:'pin_short'}); pins[id]=h; } else if(pins[id]!==h) return send({ok:false,error:'pin'});
    if(body.action==='auth') return send({ok:true});
    if(body.action==='mission'){ global.ms = global.ms || {}; if(global.ms[body.key] && !body.force) return send({ok:true, mission:global.ms[body.key], cached:true});
      const isDart = /사업보고서/.test(body.prompt||''); const m = {title: isDart ? '사업보고서 과제(모의)' : '실제 기사 과제(모의)', goal:'모의 목적', why:'모의 이유', minutes:35, sources: isDart ? [{title:'사업보고서',outlet:'DART',url:'https://dart.fss.or.kr'}] : [{title:'금리 동결 기사',outlet:'연합뉴스',date:'2026-11-04',url:'https://www.yna.co.kr/view/AKR1'}], guide:['처음부터 끝까지 읽기'], words:[{w:'동결',hint:'그대로 둠'}], tasks:[{q:'무엇이 사실인가요?',kind:'short',rubric:'금리 2.5% 동결'},{q:'왜 그랬나요?',kind:'long',rubric:'물가'}], selfcheck:['단위']};
      m.searched = isDart ? [] : [{url:'https://www.yna.co.kr/view/AKR1'}]; global.ms[body.key] = m; return send({ok:true, mission:m}); }
    if(body.action==='ask' && body.mode==='grade'){ global.gc = global.gc || {}; const it = String(body.item); global.gc[it] = (global.gc[it]||0)+1;
      if(/복습 평가/.test(body.context||'')) return send({ok:true, answer: JSON.stringify({items:[{no:1,ok:true,fb:'맞아요'}]})});
      const pass = global.gc[it] >= 2; return send({ok:true, answer: JSON.stringify({score: pass?85:55, verdict: pass?'적절':'부분 적절', summary:'모의 총평', items:[{no:1,verdict:pass?'적절':'부분 적절',comment:'근거 부족',fix:'숫자 넣기'}], now:'기사 2문단 다시 읽기', tomorrow:'동결이란 무엇인가?', redo:'1번에 숫자 넣기'}), left:10-global.gc[it]}); }
    if(body.action==='ask'){ global.qa = global.qa || {items:{}, day:0}; const it = String(body.item||'etc'); const used = global.qa.items[it]||0; if(used>=10) return send({ok:false,error:'item_limit',left:0}); if(global.qa.day>=80) return send({ok:false,error:'day_limit'}); global.qa.items[it]=used+1; global.qa.day++;
      const isEval = /첨삭 요청/.test(body.context||''); const isGen = /응용 문제 출제/.test(body.context||'');
      const ans = isEval ? '판정: 부분 적절\n잘한 점: 핵심을 짚었어요.\n고칠 점: 원인을 한 문장 더 쓰세요.\n한 줄 요약: 거의 맞아요.' : isGen ? '(가상) 한솔빵의 밀가루 값이 20% 올랐어요. 빵 가격을 그대로 두면 영업이익은 어떻게 될까요? 이유와 함께 2~3문장으로 쓰세요.' : '쉽게 말하면 이래요. 한 줄 요약: 힌트예요.';
      return send({ok:true, answer:ans, left:10-global.qa.items[it]}); }
    if(body.action) return send({ok:false,error:'unknown_action'});
    files[id] = JSON.stringify({savedAt:new Date().toISOString(), updated:body.updated||0, state:body.state}); send({ok:true, savedAt:Date.now()}); }); return; }
  res.end();
});
srv.listen(8787, () => console.log('mock on 8787'));
