"use strict";
/* ================= 매일의 실제 자료 가이드 ================= */
/* 1~29일차와 61~89일차: 내 기업 사업보고서에서 그날 볼 곳. 31~59일차는 워크북 학습(L0~L9)이 이어받는다. */
const REAL_DART = {
  1:["DART에서 내 기업의 최신 사업보고서 열기","보고서 이름, 제출일(접수일자), 사업연도(예: 2025.12)","이 보고서는 몇 년도 성적표인가요? 제출일은 언제인가요?"],
  2:["I. 회사의 개요 → 1. 회사의 개요","회사의 정식 이름, 설립일, 상장된 시장(유가증권시장=코스피 / 코스닥)","이 회사는 언제 생겼고, 어느 시장에 상장돼 있나요?"],
  3:["III. 재무에 관한 사항 → 1. 요약재무정보","‘매출액’ 줄의 최근 3년 숫자와 표 위의 단위","최근 3년 매출액을 단위와 함께 적어 보세요. 늘었나요, 줄었나요?"],
  4:["III-1 요약재무정보","‘영업이익’, ‘당기순이익’ 줄의 최근 3년 숫자","올해 매출액과 영업이익을 비교해, 1,000원어치 팔면 대략 몇 원이 남는지 말해 보세요."],
  5:["연결재무제표 → 연결 포괄손익계산서","‘금융비용’ 또는 ‘이자비용’ 줄","이 회사가 1년에 이자 등으로 낸 돈(금융비용)은 얼마인가요? 영업이익과 비교하면 큰가요?"],
  6:["III-1 요약재무정보","올해와 작년 매출액","전년 대비 매출 증감률을 직접 계산해 보세요. (올해−작년)÷작년×100"],
  8:["II. 사업의 내용 → 5. 위험관리 및 파생거래","‘이자율 위험’ 또는 ‘금리’라는 말이 들어간 문장","금리가 오르면 이 회사에 어떤 영향이 있다고 적혀 있나요?"],
  9:["II-4 매출 및 수주상황 (또는 II-2 주요 제품 및 서비스)","‘수출’, ‘내수’, ‘해외’, ‘지역별’ 매출","이 회사 매출 중 해외(수출) 비중은 대략 얼마인가요? 적혀 있지 않으면 ‘없음’이라고 쓰세요."],
  10:["II-1 사업의 개요","‘경기’, ‘경기변동’, ‘계절’이라는 말이 들어간 문장","경기가 나빠지면 이 회사 매출은 어떻게 된다고 설명하나요?"],
  11:["I-4 주식의 총수 등 (또는 회사의 개요의 상장 정보)","발행한 보통주 주식 수","이 회사가 발행한 보통주는 몇 주인가요?"],
  12:["증권사 앱이나 포털 증권 화면 + I-4 주식의 총수","오늘 주가와 시가총액","오늘 시가총액을 찾아 적고, 주식 수 × 주가로 직접 계산한 값과 비교해 보세요."],
  13:["VII. 주주에 관한 사항","최대주주 이름과 특수관계인 포함 지분율","최대주주는 누구이고 지분율은 몇 %인가요?"],
  15:["III-7 증권의 발행을 통한 자금조달에 관한 사항 (또는 연결 주석 ‘사채’)","회사채(사채) 발행 여부, 금액, 이자율","이 회사는 회사채로 돈을 빌렸나요? 이자율은 몇 %인가요?"],
  16:["연결재무제표 → 연결 재무상태표","자산총계, 부채총계, 자본총계","자산 = 부채 + 자본이 맞는지 확인하고, 부채가 자본보다 큰지 작은지 적어 보세요."],
  17:["연결재무제표 → 연결 현금흐름표","‘영업활동으로 인한 현금흐름’ 합계와 당기순이익","당기순이익과 영업활동현금흐름 중 어느 쪽이 더 큰가요? 차이가 크다면 왜일까요?"],
  18:["II-2 주요 제품 및 서비스","사업부문 이름과 매출 비중(%)","가장 큰 사업부문과 그 비중은? 이 회사는 무엇으로 돈을 버나요?"],
  19:["III-6 배당에 관한 사항","주당 현금배당금, (연결)현금배당성향","주당 배당금과 배당성향을 적고, 번 돈의 몇 %를 주주에게 나눴는지 말해 보세요."],
  20:["II-1 사업의 개요 또는 연결 주석 ‘무형자산’·‘금융자산’","가상자산·디지털·블록체인 관련 사업이나 보유 자산이 있는지","이 회사는 가상자산과 관련된 사업이나 자산이 있나요? 없으면 ‘없음’도 좋은 답이에요."],
  22:["IV. 이사의 경영진단 및 분석의견","실적이 변한 이유를 설명한 문장(‘~로 인해’, ‘~에 기인’)","경영진은 올해 실적 변화의 이유를 무엇이라고 설명하나요?"],
  23:["DART 회사별 공시 목록 (최근 공시)","최근 공시 3개의 제목과 날짜","최근 공시 3개를 적고, 각각 ‘확정된 사실’인지 ‘회사의 계획·주장’인지 구분해 보세요."],
  24:["II-3 원재료 및 생산설비","주요 원재료와 가격 변동","이 회사의 주요 원재료는 무엇이고, 값이 올랐나요 내렸나요?"],
  25:["II-4 매출 및 수주상황 또는 II-2","주요 판매 지역·거래처 국가","이 회사 제품은 어느 나라로 많이 팔리나요? 관세가 생기면 영향이 있을까요?"],
  26:["II-5 위험관리 및 파생거래","‘환율 10% 상승(하락) 시’ 손익 영향 표","환율이 10% 오르면 이 회사 이익은 늘어나나요 줄어드나요? 얼마인가요?"],
  27:["II-7 기타 참고사항 (산업의 특성)","산업이 경기를 타는지, 경쟁 상황 설명","이 회사 산업은 경기를 많이 타는 편인가요? 근거 문장을 옮겨 보세요."],
  29:["II-2 주요 제품 및 서비스 + XI. 그 밖에 투자자 보호를 위하여 필요한 사항","사업부문 수, 투자자에게 알리는 위험(소송·제재 등)","이 회사는 사업이 하나에 몰려 있나요, 나뉘어 있나요? 가장 큰 위험 하나는?"],
  61:["III-1 요약재무정보 + 증권 앱 시가총액","당기순이익(지배기업 몫), 자본총계, 오늘 시가총액","내 기업의 PER(시가총액÷순이익)과 PBR(시가총액÷자본)을 계산해 보세요."],
  62:["연결 포괄손익계산서 (기타수익·기타비용) + 주석","일회성으로 보이는 큰 수익·비용(자산 매각 이익, 손상차손 등)","올해 이익에 반복되지 않을 일회성 항목이 있나요? 빼고 보면 이익은 얼마인가요?"],
  64:["II-7 기타 참고사항 (시장점유율·경쟁요소)","점유율, 회사가 꼽는 경쟁우위","회사가 말하는 경쟁우위는 무엇이고, 숫자(점유율·이익률)로 확인되나요?"],
  65:["II-3 원재료 및 생산설비 + II-4 매출 및 수주상황","원재료를 어디서 사고, 누구에게 파는지","내 기업은 가치사슬의 어느 단계에 있나요? 앞뒤 단계는 누구인가요?"],
  66:["연결 주석 ‘영업부문’","부문별 매출 증가율과 이익","산업이 커질 때 내 기업의 어느 부문이 수혜를 받고, 어느 부문은 아닌가요?"],
  67:["III-1 요약재무정보 (3년)","매출 증감률과 영업이익 증감률","매출이 변할 때 영업이익은 더 크게 변하나요? 3년 숫자로 확인해 보세요."],
  68:["연결 주석 ‘투자부동산’, ‘관계기업투자’, ‘금융자산’","장부에 적힌 자산 중 시장이 놓칠 수 있는 것","숨은 가치 후보가 있나요? 그 가치가 실제로 주주에게 돌아올 길이 있나요?"],
  69:["지금까지의 워크북 분석 노트","확인한 사실과 내 해석","내 기업 투자 가설을 한 문장으로 쓰고, 근거 2개와 틀릴 조건 1개를 적어 보세요."],
  71:["XI. 그 밖에 투자자 보호를 위하여 필요한 사항 + II-5 위험관리","소송, 제재, 우발부채, 위험요인","내 가설에 대한 가장 강한 반론은 무엇인가요? 보고서의 어느 문장이 근거인가요?"],
  72:["DART 공시 목록 + 회사 IR 일정","다음 실적 발표일, 주주총회, 큰 계약 일정","앞으로 3개월 안에 내 기업 주가를 움직일 수 있는 일정 3개를 적어 보세요."],
  73:["II-4 매출 (지역별) + II-5 환율 위험","미국·해외 고객 비중, 달러 매출","미국 시장의 변화가 내 기업에 전해지는 길을 설명해 보세요."],
  74:["연결 주석 ‘무형자산’·‘금융자산’ + II-1","가상자산 보유·관련 사업, 금리 민감도","비트코인 시장 변화가 내 기업에 직접 영향을 주나요? 근거는?"],
  75:["연결 주석 ‘파생상품’ + II-5","선물환·통화스와프 등 파생상품 계약","내 기업은 파생상품을 무슨 목적(위험 회피/투자)으로 쓰나요?"],
  76:["증권 앱의 최근 한 달 주가·거래량 + 최근 공시","주가가 크게 움직인 날과 그날의 공시·뉴스","최근 큰 주가 움직임은 실적·공시 때문인가요, 시장 분위기 때문인가요?"],
  78:["연결 주석 ‘차입금’","차입금 금액과 이자율, 변동금리 여부","금리가 1%p 내리면 내 기업 이자비용은 대략 얼마나 줄까요?"],
  79:["최근 분기 실적 공시(잠정실적) + 그날 주가","실적 숫자와 발표 다음 날 주가 반응","최근 실적 발표 뒤 주가 반응이 실적과 같은 방향이었나요? 이유 후보는?"],
  80:["연결 재무상태표 (재고자산, 3년) + II-3 가동률","재고자산 변화, 공장 가동률","내 기업 산업은 지금 사이클의 어디쯤인가요? 근거 숫자는?"],
  81:["II-1 사업의 개요 (정부 정책·규제 관련 문장)","정책·규제·보조금 언급","정부 정책이 내 기업 매출에 실제로 이어진 숫자가 있나요?"],
  82:["연결 재무상태표","현금성자산, 단기차입금(1년 안에 갚을 빚)","위기가 오면 내 기업은 1년을 버틸 현금이 있나요?"],
  83:["증권 앱 PER + 같은 업종 다른 기업 PER","내 기업 PER과 업종 평균","내 기업 주가에 과한 기대가 들어 있다고 볼 근거와 아니라는 근거를 하나씩 적어 보세요."],
  85:["지금까지의 분석 전체","투자 가설, 틀릴 조건","가상으로 투자한다면 손실 한도와 ‘판단이 틀렸다’고 볼 조건을 숫자로 적어 보세요."],
  86:["워크북 분석 노트 다시 읽기","내가 사실처럼 쓴 해석, 근거 없는 확신","내 분석에서 확증편향으로 보이는 문장을 하나 찾아 고쳐 써 보세요."],
  87:["최근 실적 공시 + 워크북 분석 노트","사실·해석·반론·확인할 것","내 기업 실적 코멘트를 4문장으로 써 보세요: 사실 / 해석 / 반론 / 확인할 것."],
  88:["오늘의 시장 + 내 기업 최근 주가","시장 전체와 내 기업의 움직임 차이","오늘 시장과 내 기업 움직임의 차이를 한 문단으로 설명해 보세요."],
  89:["워크북 ‘기록’ 탭의 분석글","확인한 사실, 내 해석, 아직 모르는 것","내 기업 최종 분석글에서 아직 확인하지 못한 것 3개와 확인 방법을 적어 보세요."]
};
function realNewsGuide(n){
  const cur = curDay(n);
  const ph = phaseOf(Math.min(n, 90));
  const words = cur && cur.concepts && cur.concepts.length ? cur.concepts.map(id => (CONCEPT_BY_ID[id] || {}).name || "").map(s => s.replace(/\(.*?\)/g, "").trim()).filter(Boolean) : ["금리","환율","주식","실적"];
  const focus = ph === 1 ? "기사에서 오늘 배운 말이 나온 문장을 찾아 쉬운 말로 바꾸고, 무슨 일이 있었는지·왜 그런지·누가 영향을 받는지 쓰세요."
    : ph === 2 ? "7단계 질문에 모두 답하고, ‘이미 시장이 알고 있던 것’과 ‘새로 나타난 변화’를 구분하세요."
    : "같은 주제의 기사 두 편을 비교해 연결하고, 내 판단과 그 판단이 틀릴 수 있는 이유까지 쓰세요.";
  return {topic:cur ? cur.title : "최근 시장 이슈", kw:words, focus, steps:ph === 1 ? ["fact","meaning","why"] : ["fact","meaning","why","link","unknown","judge","counter"]};
}

/* ================= 오늘의 실제 자료 활동 ================= */
function stepRealNewsDaily(){
  const n = UI.run.day, g = realNewsGuide(n);
  const d = UI.realNews || (UI.realNews = {});
  const done = S.news.filter(x => x.isReal && x.day === n);
  const labels = {fact:"무엇이 사실인가요?", meaning:"그 말은 무슨 뜻인가요?", why:"왜 일어났나요?", link:"다른 현상과 어떻게 연결되나요?", unknown:"내가 아직 모르는 것은?", judge:"어떤 판단을 할 수 있나요?", counter:"내 판단이 틀릴 수 있는 이유는?"};
  return `<div class="help-panel"><b>오늘 찾을 실제 기사</b>: ‘${esc(g.topic)}’와 관련된 최근 경제기사 1편<br>검색어 예: ${g.kw.map(k => `<b>${esc(k)}</b>`).join(", ")}<br>찾는 곳: 포털 뉴스의 경제 섹션, 경제신문 사이트. 오늘이나 최근 3일 안의 기사로 고르세요.<br>오늘의 초점: ${esc(g.focus)}</div>
  ${done.length ? `<div class="notebox">오늘 실제 기사 ${done.length}편을 저장했어요: ${done.map(x => esc(x.headline)).join(", ")}</div>` : ""}
  <div class="grid2"><label class="f" for="rn-h">기사 제목<input id="rn-h" data-rn="headline" value="${esc(d.headline || "")}"></label><label class="f" for="rn-s">출처(신문사·사이트)<input id="rn-s" data-rn="source" value="${esc(d.source || "")}"></label><label class="f" for="rn-d">기사 날짜<input id="rn-d" type="date" data-rn="srcDate" value="${esc(d.srcDate || "")}"></label></div>
  <label class="f" for="rn-b">본문 핵심 부분 붙여넣기<textarea id="rn-b" data-rn="body">${esc(d.body || "")}</textarea></label>
  <label class="f" for="rn-words">어려웠던 낱말<input id="rn-words" data-rn="words" value="${esc(d.words || "")}"></label>
  ${g.steps.map(k => `<label class="f" for="rn-${k}">${labels[k]}<textarea id="rn-${k}" data-rn="${k}" rows="2" style="min-height:64px">${esc(d[k] || "")}</textarea></label>`).join("")}
  ${phaseOf(Math.min(n, 90)) >= 2 ? `<label class="f" for="rn-kn">이미 알려진 것과 새로 나타난 것<input id="rn-kn" data-rn="knownNew" value="${esc(d.knownNew || "")}"></label>` : ""}
  <div class="row"><button class="btn" data-act="saveRealNews">이 기사 분석 저장</button><button class="btn ghost small" data-act="skipReal" data-w="news">오늘은 실제 기사를 못 찾았어요</button></div>
  <p class="small muted">막히면 아래 ‘질문하기’를 눌러 물어보세요. 프로그램은 기사 내용이 사실인지 확인하지 않아요. 출처와 날짜를 꼭 적어요.</p>`;
}
function makeCompany(name, url, industry){
  const c = {id:"c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7), name, year:String(new Date().getFullYear() - 1), rtype:"사업보고서", submitted:"", url:url || "", industry:industry || "general", basis:"", unit:"", mode:"intro", created:Date.now(), updated:Date.now(), answers:{}, lessons:{}, notes:[], pos:null, dayNotes:{}};
  S.companies[c.id] = c; S.activeCompany = c.id; touch(); return c;
}
function stepRealDart(){
  const n = UI.run.day, g = REAL_DART[n];
  const co = activeCompany();
  if(!co){
    const opts = Object.entries(WB.INDUSTRIES).map(([k, v]) => `<option value="${k}">${esc(v.name)}</option>`).join("");
    return `<div class="help-panel"><b>오늘부터 함께 공부할 실제 기업을 하나 정해요</b><br>이름을 들어 본 회사, 내가 쓰는 물건이나 서비스를 만드는 회사가 좋아요. 매일 이 회사 사업보고서의 한 부분씩을 읽게 돼요.</div>
    <div class="grid2"><label class="f" for="mc-n">기업 이름<input id="mc-n" placeholder="예: 현대건설"></label><label class="f" for="mc-i">업종<select id="mc-i">${opts}</select></label></div>
    <label class="f" for="mc-u">DART 보고서 주소(선택)<input id="mc-u" type="url" placeholder="https://dart.fss.or.kr/..."></label>
    <div class="row"><button class="btn" data-act="pickCompany">이 기업으로 정하기</button></div>
    <p class="small muted">DART에서 찾는 법: dart.fss.or.kr → 위 검색창에 회사 이름 → 목록에서 ‘사업보고서 (연도.12)’ 클릭.</p>`;
  }
  if(!g) return `<p class="muted">오늘은 따로 정해진 사업보고서 과제가 없어요.</p>`;
  co.dayNotes = co.dayNotes || {};
  const note = co.dayNotes[n] || {};
  return `<div class="help-panel"><b>${esc(co.name)} 사업보고서 · 오늘 볼 곳</b><br>📍 ${esc(g[0])}<br>🔎 찾을 것: ${esc(g[1])}</div>
  <p>${co.url ? `<a href="${esc(co.url)}" target="_blank" rel="noopener">${esc(co.name)} 사업보고서 열기</a>` : `<a href="https://dart.fss.or.kr" target="_blank" rel="noopener">DART에서 ${esc(co.name)} 찾기</a>`} <span class="small muted">(새 창에서 열려요)</span></p>
  <label class="f" for="rd-q">${esc(g[2])}<textarea id="rd-q" data-dnote="${n}">${esc(note.text || "")}</textarea></label>
  <label class="f" for="rd-src">보고서에서 찾은 문장이나 숫자(근거, 짧게)<input id="rd-src" data-dsrc="${n}" value="${esc(note.src || "")}"></label>
  ${evalBox("ev.creal." + n, {stem:g[2] + " (볼 곳: " + g[0] + ")", model:"(실제 자료라 모범 답 없음: 질문에 맞게 찾았는지, 단위·기간을 밝혔는지, 쉬운 말로 설명했는지로 평가)", kp:[], text:(note.text || "") + "\n(근거: " + (note.src || "") + ")", label:"사업보고서 과제"})}
  <p class="small muted">답은 ‘기록 → 기업분석’의 ${esc(co.name)} 노트에 날짜별로 쌓여요. 못 찾겠으면 아래 ‘질문하기’를 누르세요. <button class="btn small ghost" data-act="changeCompany">기업 바꾸기</button></p>`;
}

/* ================= 질문하기 (Claude API, 항목별 10번) ================= */
const QA_LIMIT = 10;
function qaEnabled(){ return Sync.enabled; }
function qaKeyAndContext(){
  if(UI.view === "wb"){ const w = WB.context ? WB.context() : null; return w ? {key:w.key, ctx:w.text, label:"기업분석 워크북"} : null; }
  if(UI.view === "extra") return qaExtraContext();
  const r = UI.run; if(!r) return null;
  const s = r.steps[r.si]; const P = PERIODS.find(p => p.k === r.k);
  if(s.id === "assess" || s.id === "wassess") return null;
  const lines = [`[학습 위치] ${r.day}일차 ${P.n}교시 ${P.name} / 활동: ${s.title}`, `[학습자 수준] 종합 레벨 ${S.levels ? overallLevel(S.levels) : 0}, 독해 레벨 ${S.levels ? S.levels.R : 0}`];
  let key = `d${r.day}.${r.k}.${s.id}`;
  const dc = dayContent(r.day);
  const st = s.qs ? UI.qset[r.retryId || s.id] : null;
  if(st && st.i < st.items.length){
    const it = st.items[st.i], q = it.q, res = st.res[st.i];
    key = it.key;
    lines.push(`[문제] ${q.stem}`);
    if(q.passage) lines.push(`[문제 지문] ${q.passage}`);
    if(q.options) lines.push(`[보기] ${q.options.map((o, i) => `${i + 1}) ${o}`).join(" / ")}`);
    if(res && !res.restored){ lines.push(`[학습자는 이미 답함] 학습자 답: ${q.t === "mcq" ? (res.chosen + 1) + "번" : (res.val || (S.answers[it.key] || {}).text || "")} / 정답: ${q.t === "mcq" ? (q.answer + 1) + "번" : q.t === "num" ? q.answer : "서술형"} / 해설: ${q.explain || q.model || ""}`); }
    else lines.push("[학습자는 아직 답하지 않음 → 정답을 말하지 말고 힌트로 도와줄 것]");
  }
  if(dc){
    if(r.k === "p1") lines.push(`[오늘 지문] ${dc.reading.title}\n${dc.reading.text}`);
    if(r.k === "p3") lines.push(`[오늘 기사(교육용 가상)] ${dc.news.headline}\n${dc.news.body}`);
    if(r.k === "p4") lines.push(`[오늘 기업 사례(가상)] ${dc.company.title}\n${dc.company.text}\n${dc.company.table ? JSON.stringify(dc.company.table) : ""}`);
    if(r.k === "p5") lines.push(`[오늘 시장 자료(가상)] ${dc.market.title}\n${JSON.stringify(dc.market.table)}\n${(dc.market.notes || []).join(" ")}`);
    if(r.k === "p6"){ const w = writingTask(r.day); const p = portfolioFor(w.key); lines.push(`[글쓰기 과제] ${w.prompt}\n[학습자 글] ${p ? p.v1 : "(아직 없음)"}`); }
  }
  if(s.concept){ const c = D.concepts[s.concept]; if(c) lines.push(`[오늘 개념] ${c.name}: ${c.easy} ${c.real}`); }
  if(s.id === "mis" || s.id === "mx") lines.push(...missionContextLines(r.day, r.k, s.id));
  if(s.id === "rq0") lines.push("[어제 지적 복습 질문] " + reviewDue(r.day).map(x => x.q).join(" / ") + "\n[학습자는 기억으로 답하는 중 → 답을 대신 쓰지 말고 힌트만]");
  if(s.id === "rnews" || s.id === "nreal"){ const d = UI.realNews || {}; lines.push(`[학습자가 붙여넣은 실제 기사] 제목: ${d.headline || ""} / 출처: ${d.source || ""} / 날짜: ${d.srcDate || ""}\n${(d.body || "").slice(0, 2500)}`); }
  if(s.id === "creal"){ const g = REAL_DART[r.day]; const co = activeCompany(); if(g) lines.push(`[실제 사업보고서 과제] 기업: ${co ? co.name : "(미정)"} / 볼 곳: ${g[0]} / 찾을 것: ${g[1]} / 질문: ${g[2]}`); }
  return {key, ctx:lines.join("\n").slice(0, 7800), label:s.title};
}
function qaLeft(key){ if(S.qaLim !== QA_LIMIT){ S.qaLeft = {}; S.qaLim = QA_LIMIT; } const v = (S.qaLeft || {})[key]; return v === undefined ? QA_LIMIT : v; }
function qaItemLines(st, lines){
  const it = st.items[st.i], q = it.q, res = st.res[st.i];
  lines.push(`[문제] ${q.stem}`);
  if(q.passage) lines.push(`[문제 지문] ${q.passage}`);
  if(q.options) lines.push(`[보기] ${q.options.map((o, i) => `${i + 1}) ${o}`).join(" / ")}`);
  if(res && !res.restored){ lines.push(`[학습자는 이미 답함] 학습자 답: ${q.t === "mcq" ? (res.chosen + 1) + "번" : (res.val || (S.answers[it.key] || {}).text || "")} / 정답: ${q.t === "mcq" ? (q.answer + 1) + "번" : q.t === "num" ? q.answer : "서술형"} / 해설: ${q.explain || q.model || ""}`); }
  else lines.push("[학습자는 아직 답하지 않음 → 정답을 말하지 말고 힌트로 도와줄 것]");
  return it.key;
}
function qaExtraContext(){
  const tab = UI.tab || "realnews";
  if(tab === "reassess") return null;
  const names = {realnews:"실제 뉴스 분석", realmarket:"실제 시장 기록", retry:"틀린 문제 다시 풀기", challenge:"도전 문제", library:"개념 사전", gloss:"용어 사전"};
  const lines = [`[학습 위치] 심화 학습 / ${names[tab] || tab} (${S.day}일차 무렵)`, `[학습자 수준] 종합 레벨 ${S.levels ? overallLevel(S.levels) : 0}`];
  let key = `x.${tab}.${isoOf(new Date())}`;
  if(tab === "realnews"){ const d = UI.realNews || {}; lines.push(`[학습자가 붙여넣은 실제 기사] 제목: ${d.headline || ""} / 출처: ${d.source || ""} / 날짜: ${d.srcDate || ""}\n${(d.body || "").slice(0, 2500)}`); const a = ["fact","meaning","why","link","unknown","judge","counter"].filter(k => d[k]).map(k => `${k}: ${d[k]}`).join(" / "); if(a) lines.push(`[학습자 분석 메모] ${a}`); }
  if(tab === "realmarket"){ const d = UI.realMkt || {}; lines.push(`[학습자 시장 기록] 기준: ${d.when || ""} / 출처: ${d.source || ""}\n숫자: ${d.data || ""}\n해석: ${d.text || ""}`); }
  if(tab === "retry" || tab === "challenge"){ const st = UI.qset["x-" + tab]; if(st && st.i < st.items.length) key = qaItemLines(st, lines); }
  return {key, ctx:lines.join("\n").slice(0, 7800), label:names[tab] || "심화 학습"};
}
function qaButton(){
  if(!qaEnabled()) return "";
  const k = qaKeyAndContext(); if(!k) return "";
  const left = qaLeft(k.key);
  return `<div class="qa-bar"><button class="btn small ${left ? "" : "ghost"}" data-act="askOpen" ${left ? "" : "disabled"}>막혔어요: 질문하기</button><span class="small muted">이 항목 질문 ${left}번 남음</span></div>`;
}
function askOpen(){
  const k = qaKeyAndContext(); if(!k) return;
  const left = qaLeft(k.key);
  const prev = (S.qa || []).filter(x => x.key === k.key);
  UI.qaPending = k;
  showModal({title:"질문하기", body:`<p class="small muted">${esc(k.label)} · 이 항목은 ${left}번 더 물어볼 수 있어요. 무엇이 어려운지 구체적으로 쓰면 더 잘 답해 줘요.</p>
  ${prev.map(x => `<div class="prev"><div class="lbl">내 질문</div><div class="small">${esc(x.q)}</div><div class="lbl">답변</div><div class="small" style="white-space:pre-wrap">${esc(x.a)}</div></div>`).join("")}
  <label class="f" for="qaIn">질문<textarea id="qaIn" maxlength="1000" placeholder="예: ‘영업이익’이랑 ‘순이익’이 왜 다른지 모르겠어요"></textarea></label>
  <div id="qaOut" class="ai-out" hidden></div>
  <p class="small muted">답변은 AI(Claude)가 해요. 틀릴 수도 있으니 중요한 숫자는 자료에서 다시 확인하세요. 질문과 답변은 학습 기록에 남아요.</p>`, ok:"질문 보내기", cancel:"닫기", keep:true, onOk:() => { askSend(); return false; }});
}
async function askSend(){
  const k = UI.qaPending; const ta = $("#qaIn"); const out = $("#qaOut"); const okBtn = $("[data-act=modalOk]");
  const q = (ta && ta.value || "").trim();
  if(!q){ toast("질문을 써 주세요"); return; }
  if(qaLeft(k.key) <= 0){ toast("이 항목의 질문 "+QA_LIMIT+"번을 모두 썼어요"); return; }
  const pin = await getPin();
  out.hidden = false; out.textContent = "생각하는 중이에요… (10~30초)"; if(okBtn) okBtn.disabled = true;
  let j;
  try{
    const r = await fetch(CFG.SYNC_URL, {method:"POST", headers:{"Content-Type":"text/plain;charset=utf-8"}, body:JSON.stringify({id:CFG.LEARNER_ID, pin, action:"ask", item:k.key, question:q, context:k.ctx})});
    j = await r.json();
  }catch(e){ j = {ok:false, error:"net"}; }
  if(okBtn) okBtn.disabled = false;
  S.qaLeft = S.qaLeft || {};
  if(j.left !== undefined) S.qaLeft[k.key] = j.left;
  if(!j.ok){
    const msg = {item_limit:"이 항목의 질문 10번을 모두 썼어요. 해설과 쉬운 설명을 다시 읽어 보거나, 다음 활동으로 넘어가세요.", day_limit:"오늘 질문할 수 있는 전체 횟수를 다 썼어요. 내일 다시 물어볼 수 있어요.", no_key:"질문 기능이 아직 준비되지 않았어요. 관리자(형)에게 알려 주세요.", pin:"비밀번호 확인이 필요해요. 설정에서 비밀번호를 다시 입력해 주세요.", api:"답변 서비스에 잠시 문제가 있어요. 조금 뒤 다시 시도하세요. (이번 질문은 횟수에서 빼지 않았어요)", net:"인터넷 연결을 확인해 주세요."}[j.error] || "질문을 보내지 못했어요.";
    if(j.error === "item_limit") S.qaLeft[k.key] = 0;
    out.textContent = msg; touch(); return;
  }
  S.qa = S.qa || [];
  S.qa.push({key:k.key, label:k.label, day:S.day, q, a:j.answer, at:Date.now()});
  touch();
  out.textContent = j.answer + `\n\n(이 항목 질문 ${j.left}번 남음)`;
  if(ta) ta.value = "";
  if(j.left <= 0 && okBtn) okBtn.disabled = true;
}
function recQA(){
  const list = (S.qa || []).slice().reverse();
  return `<section class="card">${list.map(x => `<div class="ansrow"><div class="q">${x.day}일차 · ${esc(x.label || "")} · ${new Date(x.at).toLocaleString("ko-KR")}</div><div><b>질문</b>: ${esc(x.q)}</div><div class="a small"><b>답변</b>: ${esc(x.a)}</div></div>`).join("") || "<p class='muted'>아직 질문 기록이 없어요.</p>"}</section>`;
}

/* ================= 약점 진단과 개선 방법 ================= */
const SKILL_TIPS = {
  main:["중심 내용 찾기","첫 문장과 마지막 문장을 다시 읽고 ‘이 글은 결국 ○○에 대한 이야기다’를 한 문장으로 말해 보세요."],
  detail:["세부 내용 확인","질문 속 낱말을 본문에서 찾아 그 문장만 천천히 다시 읽어요. 기억 말고 본문으로 확인해요."],
  vocab:["낱말 뜻","모르는 낱말 앞뒤 문장으로 뜻을 먼저 짐작하고, 낱말을 눌러 실제 뜻과 비교해요."],
  cause:["원인과 결과","‘때문에, 그래서, ~로 인해’를 찾아 ‘원인 → 결과’ 화살표를 그려 보세요."],
  inference:["추론","보기마다 ‘본문 어느 문장이 근거인가?’를 물어요. 근거 문장이 없으면 고르지 않아요."],
  structure:["긴 문장 읽기","‘무엇이 – 어떻게 되었다’만 먼저 찾고, 꾸밈말은 나중에 붙여 읽어요."],
  calc:["계산","단위와 비교 기준(무엇 대비)을 먼저 적고, 식을 한 줄로 쓴 뒤 계산해요. 증감률은 항상 ‘이전 값’으로 나눠요."],
  link:["개념 연결","‘A가 오르면 → (중간 단계) → B’처럼 화살표를 쓰고, 중간 단계를 빠뜨리지 않았는지 확인해요."],
  judge:["판단","결론보다 먼저 ‘자료에 있는 근거인가, 아직 추측인가’를 나눠요."],
  counter:["반론","내 생각과 반대로 움직일 수 있는 요인 하나를 일부러 찾아 적어요."],
  fact:["사실과 의견","숫자·날짜·발표 내용은 사실, ‘~로 보인다, 우려, 전망’은 의견이에요."]
};
const DOM_TIPS = {R:"main", V:"vocab", E:"link", N:"fact", C:"calc", M:"judge", W:"structure"};
function weakSkills(entries){
  const g = {};
  entries.forEach(({q, ok, dom}) => { const sk = (q && q.skill && SKILL_TIPS[q.skill]) ? q.skill : (DOM_TIPS[dom] || "main"); const x = g[sk] || (g[sk] = {n:0, wrong:0, stems:[]}); x.n++; if(!ok){ x.wrong++; if(q && q.stem) x.stems.push(q.stem); } });
  return Object.entries(g).filter(([, x]) => x.wrong).map(([sk, x]) => Object.assign({sk, rate:x.wrong / x.n}, x)).sort((a, b) => b.rate - a.rate || b.wrong - a.wrong);
}
function periodDiagnosis(){
  const r = UI.run, pl = periodLog(r.day, r.k);
  const entries = Object.entries(pl.ans || {}).filter(([, v]) => v !== null).map(([k, ok]) => { const q = itemByKey(k); return {q, ok, dom:(S.attempts.find(a => a.k === k) || {}).d}; });
  const weak = weakSkills(entries).slice(0, 2);
  const frees = Object.keys(pl.ans || {}).filter(k => pl.ans[k] === null).map(k => S.answers[k]).filter(Boolean);
  const lowSelf = frees.filter(a => a.kp && a.kp.length && a.kp.filter(Boolean).length / a.kp.length < 0.5).length;
  let html = `<div class="check"><h3>이번 교시 평가: 약한 부분과 고치는 방법</h3>`;
  if(!entries.length && !frees.length) html += `<p class="small muted">이번 교시에 푼 문제가 없어요.</p>`;
  else if(!weak.length) html += `<p>객관식·계산 문제는 모두 맞혔어요. 아래 응용 문제로 처음 보는 상황에서도 되는지 확인해 보세요.</p>`;
  else html += weak.map(w => `<div class="warnbox"><b>${esc(SKILL_TIPS[w.sk][0])}</b>: ${w.n}문제 중 ${w.wrong}문제 틀림<br>고치는 방법: ${esc(SKILL_TIPS[w.sk][1])}${w.stems.length ? `<br><span class="small">틀린 문제: ${w.stems.slice(0, 2).map(esc).join(" / ")}</span>` : ""}</div>`).join("");
  if(lowSelf) html += `<div class="warnbox"><b>자기 말로 쓰기</b>: 서술형 ${frees.length}개 중 ${lowSelf}개는 스스로 점검에서 핵심 요소가 절반도 안 들어갔어요.<br>고치는 방법: 모범 답안을 보고 빠진 핵심 낱말 하나를 내 문장에 넣어 다시 써 보세요.</div>`;
  const target = weak[0] ? SKILL_TIPS[weak[0].sk][0] : "오늘 배운 내용";
  html += applyBox(r.day, r.k, target) + `</div>`;
  return html;
}
function applyBox(n, k, target){
  if(!qaEnabled()) return `<p class="small muted">응용 문제와 AI 첨삭은 공부방 주소(서버 연결)에서 쓸 수 있어요. 지금은 ‘심화 → 틀린 문제 다시 풀기’로 보충하세요.</p>`;
  const key = `ap.d${n}.${k}`;
  const list = (S.applied || []).filter(x => x.key === key);
  const left = qaLeft(key);
  return `<div><div class="lbl">약점 응용 문제 (AI가 오늘 자료로 새 문제를 내요)</div>
  ${list.map((x, i) => `<div class="prev"><div><b>응용 문제 ${i + 1}</b> <span class="small muted">(${esc(x.target)})</span></div><div style="white-space:pre-wrap">${esc(x.q)}</div><label class="f" for="apa-${i}">내 답<textarea id="apa-${i}" data-apans="${esc(key)}" data-i="${i}">${esc(x.ans || "")}</textarea></label>${evalBox(`ev.${key}.${i}`, {stem:x.q, model:"(AI가 낸 응용 문제라 모범 답이 없어요. 오늘 자료와 개념에 맞는지, 근거와 논리가 맞는지로 평가)", kp:[], text:x.ans || "", label:"응용 문제 채점"})}</div>`).join("")}
  <div class="row"><button class="btn small" data-act="applyGen" data-k="${esc(key)}" data-t="${esc(target)}" ${left ? "" : "disabled"}>응용 문제 받기</button><span class="small muted">이 교시 응용 문제 ${left}번 남음</span></div></div>`;
}
async function aiAsk(item, context, question){
  const pin = await getPin();
  try{
    const r = await fetch(CFG.SYNC_URL, {method:"POST", headers:{"Content-Type":"text/plain;charset=utf-8"}, body:JSON.stringify({id:CFG.LEARNER_ID, pin, action:"ask", item, question, context:String(context).slice(0, 7800)})});
    const j = await r.json(); S.qaLeft = S.qaLeft || {}; if(j.left !== undefined) S.qaLeft[item] = j.left; if(j.error === "item_limit") S.qaLeft[item] = 0; touch(); return j;
  }catch(e){ return {ok:false, error:"net"}; }
}
function aiErrMsg(e){ return {item_limit:"이 항목은 10번을 모두 썼어요.", day_limit:"오늘 전체 횟수를 다 썼어요. 내일 다시 할 수 있어요.", no_key:"AI 기능이 아직 준비되지 않았어요. 관리자(형)에게 알려 주세요.", pin:"비밀번호 확인이 필요해요(설정 → 비밀번호 입력).", api:"AI 서비스에 잠시 문제가 있어요. 조금 뒤 다시 해 보세요(횟수는 빠지지 않았어요).", net:"인터넷 연결을 확인해 주세요."}[e] || "보내지 못했어요."; }
const EVAL_INFO = {};
function evalBox(evKey, info){
  if(!qaEnabled()) return "";
  if(info) EVAL_INFO[evKey] = info;
  const id = "evb-" + evKey.replace(/[^A-Za-z0-9_-]/g, "_");
  const prev = ((S.evals || {})[evKey] || []);
  const left = qaLeft(evKey);
  return `<div class="evalbox" id="${id}">${prev.map((x, i) => `<div class="ai-out small"><b>AI 첨삭 ${i + 1}</b>${x.verdict ? ` · <span class="${x.verdict === "적절" ? "ok-t" : "no-t"}">${esc(x.verdict)}</span>` : ""}\n${esc(x.text)}</div>`).join("")}
  <div class="row"><button class="btn small ghost" data-act="aiEval" data-k="${esc(evKey)}" ${left ? "" : "disabled"}>AI 첨삭 받기</button><span class="small muted">${left}번 남음 · 고친 뒤 다시 받아 보세요</span></div></div>`;
}
async function aiEval(evKey){
  const info = EVAL_INFO[evKey]; if(!info) return;
  const text = typeof info.text === "function" ? info.text() : info.text;
  const live = currentEvalText(evKey);
  const answer = (live !== null ? live : text || "").trim();
  if(!answer || answer === "(모르겠어요)"){ toast("먼저 답을 써 주세요"); return; }
  const id = "evb-" + evKey.replace(/[^A-Za-z0-9_-]/g, "_");
  const box = document.getElementById(id); if(box) box.insertAdjacentHTML("beforeend", `<div class="ai-out small" id="${id}-wait">첨삭하는 중이에요… (10~30초)</div>`);
  const lv = S.levels ? overallLevel(S.levels) : 0;
  const ctx = `[첨삭 요청] 아래 학습자의 서술형 답을 평가하라.\n[학습자 수준] 종합 레벨 ${lv} (0~6), ${S.day}일차\n[과제] ${info.stem}\n[좋은 답에 들어갈 요소] ${(info.kp || []).join(" / ") || "(없음)"}\n[참고 모범 답안] ${info.model || "(없음)"}\n[학습자 답]\n${answer}\n\n[형식] 첫 줄은 반드시 '판정: 적절' 또는 '판정: 부분 적절' 또는 '판정: 부적절' 중 하나. 이어서 '잘한 점:' 1줄, '고칠 점:' 1~3줄(어느 문장을 어떻게 바꿀지, 고친 문장 예시 포함), 마지막에 한 줄 요약. 모범 답안을 통째로 베껴 주지 말고 학습자 문장을 고치는 방식으로. 사실이 틀린 부분은 분명히 지적.`;
  const j = await aiAsk(evKey, ctx, "제 답이 적절한지 평가하고, 어디를 어떻게 고치면 되는지 알려 주세요.");
  const w = document.getElementById(id + "-wait"); if(w) w.remove();
  if(!j.ok){ toast(aiErrMsg(j.error)); if(box) box.outerHTML = evalBox(evKey); return; }
  const m = String(j.answer).match(/판정\s*[:：]\s*(부분 적절|부적절|적절)/);
  S.evals = S.evals || {}; (S.evals[evKey] = S.evals[evKey] || []).push({at:Date.now(), day:S.day, text:j.answer, verdict:m ? m[1] : "", answer, label:info.label || info.stem.slice(0, 40)});
  touch();
  const nb = document.getElementById(id); if(nb) nb.outerHTML = evalBox(evKey);
}
function currentEvalText(evKey){
  const k = evKey.replace(/^ev\./, "");
  const ta = document.querySelector(`[data-free="${CSS.escape(k)}"], [data-write="${CSS.escape(k)}"]`);
  if(ta) return ta.value;
  const m = k.match(/^(ap\.d\d+\.p\d)\.(\d+)$/); if(m){ const x = (S.applied || []).filter(a => a.key === m[1])[+m[2]]; return x ? x.ans || "" : null; }
  const dn = k.match(/^creal\.(\d+)$/); if(dn){ const co = activeCompany(); const nt = co && co.dayNotes && co.dayNotes[dn[1]]; return nt ? `${nt.text || ""}\n(근거: ${nt.src || ""})` : null; }
  return null;
}
async function applyGen(key, target){
  const r = UI.run; if(!r) return;
  const kc = qaKeyAndContext();
  const ctx = `[응용 문제 출제 요청] 학습자가 이번 교시에서 약했던 부분: ${target}\n${kc ? kc.ctx : ""}\n\n[요구] 오늘 자료와 개념을 쓰되 처음 보는 상황(다른 가상 회사·다른 숫자)으로 새 문제 1개만 내라. 학습자가 2~4문장으로 답하는 주관식. 문제만 쓰고 정답·해설은 쓰지 마라. 실제 기업 이름과 실제 최신 수치는 쓰지 말고 '가상'이라고 밝혀라. 300자 이내.`;
  toast("응용 문제를 만드는 중이에요…");
  const j = await aiAsk(key, ctx, "제 약점을 연습할 응용 문제를 하나 내 주세요.");
  if(!j.ok){ toast(aiErrMsg(j.error)); render(); return; }
  S.applied = S.applied || [];
  S.applied.push({key, day:r.day, k:r.k, target, q:j.answer, ans:"", at:Date.now()});
  touch(); render();
  setTimeout(() => { const el = document.querySelector(".evalbox:last-of-type"); if(el) el.scrollIntoView({block:"center"}); }, 50);
}
function dayWeakSection(atts){
  const entries = atts.map(a => ({q:itemByKey(a.k), ok:!!a.o, dom:a.d}));
  const weak = weakSkills(entries).slice(0, 3);
  const evs = Object.values(S.evals || {}).flat().filter(e => e.day === UI.reportDay || e.day === S.day);
  const vc = {적절:0, "부분 적절":0, 부적절:0}; evs.forEach(e => { if(vc[e.verdict] !== undefined) vc[e.verdict]++; });
  return `<section class="card"><h2>약한 부분과 개선 방법</h2>${weak.length ? weak.map(w => `<p><b>${esc(SKILL_TIPS[w.sk][0])}</b> (${w.n}문제 중 ${w.wrong}개 틀림): ${esc(SKILL_TIPS[w.sk][1])}</p>`).join("") : "<p>오늘 틀린 문제가 뚜렷하게 몰린 부분은 없어요.</p>"}
  ${evs.length ? `<p class="small">서술형 AI 첨삭(참고): 적절 ${vc["적절"]} · 부분 적절 ${vc["부분 적절"]} · 부적절 ${vc["부적절"]}</p>` : ""}</section>`;
}
