/* ================= AI 실전 과제 (실제 뉴스·사업보고서) ================= */
/* 교시마다 AI가 실제 자료를 찾아 과제를 만들고, 제출하면 냉정하게 평가한다.
   판정이 '적절'(70점 이상)이 아니면 고쳐서 다시 내야 다음으로 넘어간다(최대 3번 평가).
   평가에서 나온 '내일 복습'은 다음 날 첫 교시의 '어제 지적 복습'으로 들어간다. */

const NEWS_P1 = ["경제 일반", "산업·기업", "사회·시사", "국제 경제"];
const NEWS_P3 = ["정치·정책", "산업", "기업 공시·실적", "국제 경제", "사회·시사", "부동산·가계 빚", "금융·은행"];
const PASS_SCORE = 70, MAX_GRADES = 3, MIN_ACTIVE = 35 * 60;

/* 한 기업의 사업보고서를 90일 동안 처음부터 끝까지: [읽을 곳, 그날의 목표] */
const DART_PLAN = {
  1:["보고서 찾기와 목차 훑기","DART에서 내 기업의 최신 사업보고서를 열고 사업연도·제출일·목차 구성을 파악한다"],
  2:["I-1 회사의 개요","회사 이름·설립일·본사·상장 시장·주요 사업을 한 문단으로 정리한다"],
  3:["I-2 회사의 연혁","회사의 큰 변화 3가지(설립·상장·합병 등)를 시간 순서로 정리한다"],
  4:["I-3 자본금 변동사항 · I-4 주식의 총수 등","발행 주식 수와 자기주식을 찾아 유통 주식 수를 계산한다"],
  5:["I-5 정관에 관한 사항","정관의 '사업목적'과 실제로 하는 사업을 비교한다"],
  6:["II-1 사업의 개요 (1)","회사가 무엇을 팔아 돈을 버는지 한 문장으로 말한다"],
  8:["II-1 사업의 개요 (2)","산업의 특성(경기를 타는지·계절성·경쟁)을 찾아 쉬운 말로 바꾼다"],
  9:["II-2 주요 제품 및 서비스","제품·부문별 매출 비중을 옮기고 가장 큰 부문을 찾는다"],
  10:["II-2 주요 제품 가격 변동","주요 제품 가격이 어떻게 변했는지와 그 이유를 찾는다"],
  11:["II-3 원재료 및 생산설비","주요 원재료와 가격 변화, 공장 가동률을 찾는다"],
  12:["II-4 매출 및 수주상황 (판매)","판매 경로와 지역별 매출(내수·수출)을 정리한다"],
  13:["II-4 매출 및 수주상황 (수주)","받아 놓은 일감(수주잔고)이 있는지, 앞으로 매출에 어떤 의미인지 정리한다"],
  15:["II-5 위험관리 및 파생거래","환율·금리 민감도 표를 읽고 '환율이 10% 오르면' 이익이 어떻게 되는지 적는다"],
  16:["II-6 주요계약 및 연구개발활동","연구개발비와 매출 대비 비율, 주요 계약을 찾는다"],
  17:["II-7 기타 참고사항 (시장과 경쟁)","시장 점유율과 경쟁 회사를 찾는다"],
  18:["II-7 기타 참고사항 (경쟁력과 계획)","회사가 말하는 경쟁력과 앞으로의 사업 계획을 정리한다"],
  19:["II장 전체 정리","'무엇을, 누구에게, 어떻게 팔아 돈을 버나'를 다섯 문장으로 쓴다"],
  20:["III-1 요약재무정보 (손익)","최근 3년 매출·영업이익·순이익을 단위와 함께 옮긴다"],
  22:["III-1 요약재무정보 (재무상태)","최근 3년 자산·부채·자본 총계를 옮기고 부채비율을 계산한다"],
  23:["III-2 연결재무제표: 재무상태표","1년 안에 갚을 빚(유동부채)과 1년 안에 쓸 수 있는 자산(유동자산)을 비교한다"],
  24:["III-2 연결재무제표: 손익계산서","매출 → 매출원가 → 판관비 → 영업이익 순서를 따라가며 영업이익률을 계산한다"],
  25:["III-2 연결재무제표: 현금흐름표","영업·투자·재무활동 현금흐름의 +/−를 읽고 돈이 어디서 와서 어디로 갔는지 말한다"],
  26:["III-2 연결 자본변동표","배당·자기주식 등 자본이 바뀐 이유를 찾는다"],
  27:["III-3 연결재무제표 주석 (영업부문)","부문별 매출과 이익을 찾아 돈 버는 부문과 돈 쓰는 부문을 나눈다"],
  29:["III-3 연결 주석 (차입금·사채)","빌린 돈의 종류·금액·이자율을 정리한다"],
  30:["1~29일 정리","지금까지 읽은 내용으로 '회사 한 장 요약'을 만든다"],
  31:["III-3 연결 주석 (재고자산·매출채권)","재고와 받을 돈(매출채권)이 매출보다 빨리 늘었는지 확인한다"],
  32:["III-3 연결 주석 (유형·무형자산)","설비투자 규모와 감가상각비를 찾는다"],
  33:["III-3 연결 주석 (충당부채·우발부채)","앞으로 나갈 수 있는 돈(소송·보증 등)을 찾는다"],
  34:["III-4 재무제표 (별도)","연결과 별도 숫자를 비교해 자회사가 차지하는 몫을 가늠한다"],
  36:["III-6 배당에 관한 사항","주당 배당금·배당성향·배당수익률을 정리한다"],
  37:["III-7 증권의 발행을 통한 자금조달","최근 회사채·유상증자 등 돈을 모은 기록과 쓴 곳을 찾는다"],
  38:["III-8 기타 재무에 관한 사항","대손충당금·재고 평가 등 숨은 위험 신호를 찾는다"],
  39:["IV 이사의 경영진단 및 분석의견 (1)","경영진이 말하는 실적 변화 이유를 찾는다"],
  40:["IV 경영진단 (2)","경영진 설명을 III장의 실제 숫자와 대조해 맞는지 확인한다"],
  41:["IV 경영진단 (3)","유동성과 자금조달 계획을 정리한다"],
  43:["V 회계감사인의 감사의견 등","감사의견과 핵심감사사항을 찾는다"],
  44:["VI 이사회 등 회사의 기관","이사회 구성과 사외이사 비율을 찾는다"],
  45:["VII 주주에 관한 사항","최대주주와 지분율, 5% 이상 주주를 정리한다"],
  46:["VIII 임원 및 직원 등","직원 수·평균 근속연수·평균 급여를 찾는다"],
  47:["IX 계열회사 등","계열회사 수와 주요 자회사를 정리한다"],
  48:["X 대주주 등과의 거래내용","대주주·계열사와의 거래 규모를 찾는다"],
  50:["XI 그 밖에 투자자 보호를 위하여 필요한 사항","소송·제재·우발채무 등 투자자에게 알리는 위험을 정리한다"],
  51:["사업보고서 1회독 정리 (1)","I~V장의 핵심을 한 장으로 요약한다"],
  52:["사업보고서 1회독 정리 (2)","VI~XI장의 핵심과 가장 큰 위험 3가지를 정리한다"],
  53:["최신 분기·반기보고서","사업보고서 이후 나온 분기보고서의 매출·영업이익을 찾는다"],
  54:["분기 실적과 작년 비교","작년 같은 분기 대비 증감률을 계산한다"],
  55:["최근 1년 공시 목록","주요 공시 5개를 '확정된 사실'과 '회사의 계획'으로 나눈다"],
  57:["수시공시 한 건 정독","공시 한 건을 골라 무엇이 정해졌고 주가에 어떤 의미일지 쓴다"],
  58:["잠정실적 공시","최근 잠정실적 공시와 그 뒤 주가 반응을 비교한다"],
  59:["IR 자료·기업설명회","회사가 투자자에게 강조한 내용과 보고서 숫자를 대조한다"],
  60:["31~59일 정리","재무·지배구조·위험을 담은 '회사 두 장 요약'을 만든다"],
  61:["경쟁사 사업보고서 II-1","같은 업종 경쟁사 한 곳의 사업 개요를 내 기업과 비교한다"],
  62:["경쟁사 III-1 요약재무정보","경쟁사와 매출·영업이익률을 비교한다"],
  64:["재무비율 (1) 수익성","영업이익률·순이익률·ROE를 3년치 계산한다"],
  65:["재무비율 (2) 안정성","부채비율·유동비율·이자보상배율을 계산한다"],
  66:["재무비율 (3) 성장성","매출·영업이익 성장률을 계산하고 경쟁사와 비교한다"],
  67:["가치평가 (1) PER·PBR","오늘 시가총액으로 PER·PBR을 계산한다"],
  68:["가치평가 (2) 업종 비교","경쟁사·업종 평균과 비교해 비싼지 싼지 근거를 쓴다"],
  69:["투자 가설 세우기","가설 한 문장, 근거 2개, 틀릴 조건 1개를 쓴다"],
  71:["반론 찾기 (1)","가설에 대한 가장 강한 반론을 보고서 문장에서 찾는다"],
  72:["반론 찾기 (2) 시나리오","좋은 경우·보통·나쁜 경우의 이익을 숫자로 쓴다"],
  73:["다가올 일정","실적 발표·주주총회·배당일 등 주가를 움직일 일정을 정리한다"],
  74:["위험 관리 계획","가상 투자라면 손절 가격·손실 한도·비중을 숫자로 정한다"],
  75:["분석 보고서 1장: 회사 소개","회사 소개와 사업 구조를 쓴다"],
  76:["분석 보고서 2장: 실적","실적과 재무 상태를 쓴다"],
  78:["분석 보고서 3장: 산업과 경쟁","산업과 경쟁 구도를 쓴다"],
  79:["분석 보고서 4장: 가치평가","가치평가를 쓴다"],
  80:["분석 보고서 5장: 위험과 반론","위험과 반론을 쓴다"],
  81:["분석 보고서 6장: 결론","결론과 앞으로 확인할 것을 쓴다"],
  82:["보고서 고쳐 쓰기 (1)","근거 없는 문장을 찾아 고친다"],
  83:["보고서 고쳐 쓰기 (2)","숫자와 출처를 하나하나 점검한다"],
  85:["손실 한도와 포지션 크기","내 기업에 가상 비중·손절·손실 한도를 적용한다"],
  86:["최신 공시 반영","보고서를 쓴 뒤 나온 공시·뉴스로 내용을 고친다"],
  87:["투자 메모 한 장","분석 보고서를 투자 메모 한 장으로 압축한다"],
  88:["3분 발표 원고","분석을 3분 발표 원고로 바꾼다"],
  89:["최종 점검","아직 확인하지 못한 것 3개와 확인 방법을 정한다"],
  90:["90일 정리","첫 주의 회사 소개와 지금의 분석 보고서를 비교해 성장한 점을 정리한다"]
};
function dartPlan(n){
  if(DART_PLAN[n]) return DART_PLAN[n];
  if(n > 90) return ["심화: 보고서 다시 읽기", "최신 공시와 분기보고서로 내 분석을 갱신한다"];
  const prev = []; for(let d = n - 6; d < n; d++) if(DART_PLAN[d]) prev.push(DART_PLAN[d][0]);
  return ["이번 주 읽은 곳 복습: " + (prev.join(", ") || "지난 내용"), "이번 주에 읽은 목차를 다시 보고, 가장 중요한 숫자와 문장을 한 장에 정리한다"];
}

/* ---------- 과제 설계 ---------- */
function missionsOn(){ return qaEnabled() && Sync.ver >= 3; }
function mKey(n, k, x){ return `d${n}_${k}${x ? "_" + x : ""}`; }
function phaseInfo(n){ const ph = phaseOf(Math.min(n, 90)); const P = ((D.curriculum || {}).phases || [])[ph - 1] || {}; return {ph, name:P.name || "", read:P.readLevel || "", write:P.writeSize || ""}; }
function hasMission(n, k){
  const kind = dayKind(n);
  const isCp = kind === "checkpoint" || CHECKPOINTS.includes(n) || (kind === "advanced" && n % 30 === 0);
  if(isCp && (k === "p1" || k === "p2")) return false;
  if(kind === "review" && (k === "p1" || k === "p2")) return false;
  return true;
}
function missionSpec(n, k){
  const pi = phaseInfo(n), cur = curDay(n);
  const lv = S.levels ? overallLevel(S.levels) : 0;
  const concepts = (cur && cur.concepts || []).map(id => (CONCEPT_BY_ID[id] || {}).name).filter(Boolean);
  const base = [`[오늘 날짜] ${today()} (서울)`, `[학습자] ${n}일차 / 90일, ${pi.ph}단계(${pi.name}), 종합 레벨 ${lv} (0~6). 경제 지식이 거의 없는 성인 초보자. 독해력이 낮아 쉬운 말이 필요함.`, `[이 단계의 글 수준] 읽기: ${pi.read} / 쓰기: ${pi.write}`, cur ? `[오늘의 주제] ${cur.title}${concepts.length ? " / 오늘 배운 개념: " + concepts.join(", ") : ""}` : "[오늘의 주제] 90일 이후 심화"];
  const nTasks = pi.ph === 1 ? "4~5개" : pi.ph === 2 ? "5~6개" : "6~7개";
  const common = `과제는 ${nTasks}. 쉬운 질문에서 어려운 질문 순서. 모든 질문은 그 자료를 읽어야 답할 수 있게 하고, 질문마다 채점 기준(rubric)에 자료 속 근거(숫자·사실)를 적어라. 학습자가 약 30~35분 걸리게.${pi.ph === 1 ? " 1단계 학습자이므로 기사 앞부분 3~4문단만 읽어도 답할 수 있게 만들고, guide에 '앞부분 몇 문단까지 읽으면 된다'고 밝혀라." : ""}`;
  let s = null;
  if(k === "p1"){
    const cat = NEWS_P1[(n - 1) % NEWS_P1.length];
    s = {title:"실제 기사로 독해·어휘 훈련", cat, search:3, mins:35,
      goal:"실제 경제기사를 끝까지 읽고, 모르는 낱말을 문맥으로 이해하고, 문단별 핵심을 자기 말로 정리하는 힘",
      shape:`기사 1편. 질문 구성: ①어려운 낱말 3~5개를 골라 기사 문맥에서 뜻 쓰기 ②문단(또는 앞부분 3문단)별 한 줄 요약 ③기사 전체를 '무엇이·왜·그래서' 한 문장으로 ④사실 문장 1개와 의견·전망 문장 1개를 골라 옮기기${pi.ph >= 2 ? " ⑤기자나 취재원이 말하는 주장과 그 근거 찾기" : ""}${pi.ph >= 3 ? " ⑥이 기사가 빠뜨린 관점 하나" : ""}. words에 어려운 낱말 4~6개.`};
  }
  if(k === "p2"){
    s = {title:"오늘 배운 개념을 실제 뉴스에서 찾기", cat:"경제", search:3, mins:35,
      goal:`오늘 배운 개념(${concepts.join(", ") || "오늘 주제"})이 실제 뉴스에서 어떻게 쓰이는지 찾아 설명하는 힘`,
      shape:"오늘 배운 개념이 직접 나오는 기사 1편. 질문 구성: ①개념이 나온 문장을 옮기고 쉬운 말로 바꾸기 ②그 개념으로 기사 속 원인과 결과를 설명하기 ③기사 속 숫자로 간단한 계산이나 비교(가능하면) ④이 일이 보통 사람(가계)·기업·정부 중 누구에게 어떤 영향을 주는지 ⑤헷갈리기 쉬운 비슷한 개념과의 차이."};
  }
  if(k === "p3"){
    const cat = NEWS_P3[(n - 1) % NEWS_P3.length];
    const review = dayKind(n) === "review";
    s = {title:review ? "이번 주 뉴스의 후속 보도 분석" : `실제 뉴스 분석: ${cat}`, cat, search:3, mins:40,
      goal:review ? "한 주 동안 본 이슈가 어떻게 이어졌는지 후속 기사로 확인하고 연결하는 힘" : `${cat} 분야 뉴스를 사실·의미·원인·연결·판단·반론으로 나눠 분석하는 힘`,
      shape:(review ? "이번 주 주제와 이어지는 최근 후속 기사 1~2편. " : "") + `질문 구성: ①무엇이 사실인가(누가·언제·무엇을·얼마나) ②그 말은 무슨 뜻인가 ③왜 일어났나(기사가 든 원인) ④다른 현상·시장과 어떻게 연결되나${pi.ph >= 2 ? " ⑤이미 알려진 것과 새로 나타난 것 ⑥어떤 판단을 할 수 있나" : ""}${pi.ph >= 3 ? " ⑦그 판단이 틀릴 수 있는 이유" : ""}. 정치·정책 기사라면 특정 정당 편을 들지 말고 경제적 영향만 묻는다.`};
  }
  if(k === "p4"){
    const co = activeCompany();
    const g = dartPlan(n);
    s = {title:`${co ? co.name : "내 기업"} 사업보고서: ${g[0]}`, cat:"사업보고서", search:0, mins:40, dart:g,
      goal:g[1],
      shape:`자료: ${co ? co.name : "(기업 미정)"}의 사업보고서(DART)에서 '${g[0]}'. 너는 보고서 원문을 볼 수 없다. 그러니 학습자가 보고서에서 직접 찾아 옮겨 적게 하는 질문(kind:"copy": 원문 문장이나 숫자를 그대로 옮기기)과, 옮긴 내용을 해석하는 질문(kind:"short" 또는 "long")을 섞어라. 단위·기간(몇 년, 원/백만원)을 꼭 적게 하라. 회사 업종: ${co ? ((WB.INDUSTRIES[co.industry] || {}).name || co.industry) : "미정"}. sources에는 {title:"${co ? co.name : ""} 사업보고서", outlet:"DART", url:"${co && co.url ? co.url : "https://dart.fss.or.kr"}"} 하나만 넣어라. guide에는 DART에서 그 목차를 여는 순서를 써라. rubric은 '무엇을 찾아야 맞는지'의 기준으로 쓰고, 이 회사의 실제 숫자를 지어내지 마라.`};
  }
  if(k === "p5"){
    const stock = n % 2 === 1;
    s = {title:stock ? "오늘의 주식시장 읽기" : "오늘의 비트코인·가상자산 시장 읽기", cat:stock ? "증시" : "비트코인·가상자산", search:3, mins:40,
      goal:"실제 시장 숫자를 직접 기록하고, 움직임의 원인을 '사실 / 가능한 설명 / 확인된 원인'으로 나누는 힘",
      shape:`${stock ? "오늘이나 가장 최근 거래일의 국내 증시 마감 시황 기사" : "최근 1~2일의 비트코인·가상자산 시장 기사"} 1편. 질문 구성: ①학습자가 증권 앱·포털에서 지금 숫자를 직접 찾아 적기(kind:"number": 코스피, 코스닥, 원·달러 환율, ${stock ? "외국인 순매수" : "비트코인 원화 가격, 24시간 변동률"}, 확인한 시각과 출처 포함) ②기사에서 오늘 시장을 움직인 '사실' 2개 ③기사가 말하는 '가능한 설명'과 '확인된 원인' 구분 ④내일 확인할 것 1~2개${pi.ph >= 2 ? " ⑤다른 시장(환율·금리·미국 증시)과의 연결" : ""}. 특정 종목·코인을 사라·팔라 하는 질문은 금지.`};
  }
  if(k === "p6"){
    const done = Object.entries(S.missions || {}).filter(([key]) => key.startsWith(`d${n}_`) && !/_x$/.test(key)).map(([, v]) => v.m).filter(Boolean);
    const mats = done.map(m => `- ${m.title}: ${(m.sources || []).map(x => `${x.outlet || ""} '${x.title || ""}'`).join(", ")}`).join("\n") || "(오늘 다른 실전 과제 없음: 오늘 주제로 써라)";
    s = {title:"오늘의 종합 분석 글", cat:"글쓰기", search:0, mins:35,
      goal:"오늘 읽은 실제 자료를 근거로, 사실과 해석을 구분한 짧은 시황·분석 글을 쓰는 힘",
      shape:`검색하지 마라. 오늘 학습자가 다룬 자료:\n${mats}\n질문 구성: 긴 글쓰기 1개(kind:"long", 길이는 이 단계의 쓰기 수준에 맞게, 구조: 사실 → 해석 → ${pi.ph >= 3 ? "반론 → " : ""}내가 확인할 것)와 짧은 질문 2~3개(제목 달기, 근거로 쓴 사실 2개 적기, 내 글에서 '확인되지 않은 추측' 표시하기). sources는 빈 배열.`};
  }
  if(!s) return null;
  s.key = mKey(n, k); s.k = k; s.n = n;
  const search = s.search ? `web_search로 최근 3일 안의 한국어 기사를 찾아라(오늘 ${today()}). 무료로 읽을 수 있는 언론사·공공기관 페이지만(예: 연합뉴스, 한국경제, 매일경제, 머니투데이, 이데일리, 조선비즈, 블록미디어, 한국은행·정부 보도자료). 원문 주소(url)는 검색 결과에 실제로 나온 주소만 쓰고 절대 지어내지 마라. 학습자 수준에 너무 어렵지 않은 기사를 골라라.` : "";
  s.prompt = `${base.join("\n")}\n[교시] ${PERIODS.find(p => p.k === k).n}교시 ${PERIODS.find(p => p.k === k).name}\n[분야] ${s.cat}\n[과제의 목적] ${s.goal}\n[할 일] ${search}\n${s.shape}\n${common}\n[출력] 아래 JSON 하나만 출력하라. 다른 글 금지.\n{"title":"과제 제목","goal":"이 과제로 얻는 능력 1문장","why":"이 자료를 고른 이유 1문장","minutes":35,"sources":[{"title":"기사 제목","outlet":"언론사","date":"YYYY-MM-DD","url":"https://...","category":"분야"}],"guide":["읽는 순서·볼 곳 안내 2~4개"],"words":[{"w":"낱말","hint":"쉬운 뜻"}],"tasks":[{"q":"질문","kind":"short|long|copy|number","rubric":"채점 기준과 자료 속 근거"}],"selfcheck":["제출 전 스스로 확인할 것 2개"]}`;
  return s;
}
function extraSpec(n, k){
  const main = (S.missions || {})[mKey(n, k)];
  const m = main && main.m;
  const pi = phaseInfo(n);
  const last = main && main.grades && main.grades.slice(-1)[0];
  const weak = last && last.j ? (last.j.items || []).filter(x => x.verdict && x.verdict !== "적절").map(x => x.comment).join(" / ") : "";
  return {key:mKey(n, k, "x"), k, n, title:"보충 과제", search:0, mins:15, goal:"같은 자료로 한 번 더 깊게: 약했던 부분을 다른 각도로 연습",
    prompt:`[오늘 날짜] ${today()}\n[학습자] ${n}일차, ${pi.ph}단계, 초보자\n[앞 과제] ${m ? m.title + " / 목적: " + m.goal : "(없음)"}\n[앞 과제 자료] ${m ? (m.sources || []).map(x => `${x.outlet} '${x.title}' ${x.date} ${x.url}`).join(" / ") : ""}\n[앞 과제 질문] ${m ? (m.tasks || []).map((t, i) => `${i + 1}) ${t.q} (기준: ${t.rubric})`).join(" / ") : ""}\n[약했던 점] ${weak || "(평가 기록 없음)"}\n[할 일] 검색하지 마라. 같은 자료로 풀 수 있는 보충 질문 3개를 만들어라. 앞 질문을 되풀이하지 말고, 약했던 점을 다른 각도에서 연습하게 하라. 약 15분 분량.\n[출력] JSON 하나만: {"title":"보충 과제","goal":"1문장","why":"","minutes":15,"sources":[같은 자료 그대로],"guide":["1~2개"],"words":[],"tasks":[{"q":"","kind":"short|long|copy|number","rubric":""}],"selfcheck":[]}`};
}

/* ---------- 서버 호출 ---------- */
async function aiCall(body){
  const pin = await getPin();
  try{
    const r = await fetch(CFG.SYNC_URL, {method:"POST", headers:{"Content-Type":"text/plain;charset=utf-8"}, body:JSON.stringify(Object.assign({id:CFG.LEARNER_ID, pin}, body))});
    const t = await r.text();
    try{ return JSON.parse(t); }catch(e){ return {ok:false, error:"server", detail:t.slice(0, 200)}; }
  }catch(e){ return {ok:false, error:"net"}; }
}
function mErr(j){
  return ({no_key:"AI 기능이 아직 준비되지 않았어요. 형에게 알려 주세요.", pin:"비밀번호 확인이 필요해요(설정 → 비밀번호 입력).", day_limit:"오늘 AI 사용 횟수를 다 썼어요. 내일 다시 할 수 있어요.", item_limit:"이 과제의 평가 횟수를 다 썼어요.", api:"AI 서비스에 문제가 있어요. 1~2분 뒤 다시 눌러 보세요.", parse:"AI가 과제를 이상하게 만들었어요. 다시 만들기를 눌러 보세요.", net:"인터넷 연결을 확인해 주세요.", server:"저장소 코드가 아직 예전 버전이에요. 형에게 알려 주세요.", unknown_action:"저장소 코드가 아직 예전 버전이에요. 형에게 알려 주세요."})[j.error] || ("문제가 생겼어요" + (j.detail ? ": " + String(j.detail).slice(0, 80) : ""));
}
const M_BUSY = {};
async function loadMission(spec, force){
  if(!spec || M_BUSY[spec.key]) return;
  if(!missionsOn()){ return; }
  M_BUSY[spec.key] = "load"; render();
  const j = await aiCall({action:"mission", key:spec.key, prompt:spec.prompt, search:spec.search, force:!!force});
  delete M_BUSY[spec.key];
  S.missions = S.missions || {};
  if(!j.ok || !j.mission || !Array.isArray(j.mission.tasks)){ (S.mErr = S.mErr || {})[spec.key] = mErr(j); render(); return; }
  if(S.mErr) delete S.mErr[spec.key];
  const prev = S.missions[spec.key];
  S.missions[spec.key] = {m:j.mission, ans:force || !prev ? {} : prev.ans, grades:force || !prev ? [] : prev.grades, passed:false, nowDone:false, day:spec.n, k:spec.k, at:Date.now(), title:j.mission.title || spec.title};
  touch(); render();
}

/* ---------- 과제 화면 ---------- */
function companyPicker(){
  const opts = Object.entries(WB.INDUSTRIES).map(([k, v]) => `<option value="${k}">${esc(v.name)}</option>`).join("");
  return `<div class="help-panel"><b>먼저, 90일 동안 사업보고서를 끝까지 읽을 기업 하나를 정해요</b><br>이름을 들어 본 회사, 내가 쓰는 물건·서비스를 만드는 회사가 좋아요. 상장 회사여야 사업보고서가 있어요.</div>
  <div class="grid2"><label class="f" for="mc-n">기업 이름<input id="mc-n" placeholder="예: 삼성전자, 현대건설"></label><label class="f" for="mc-i">업종<select id="mc-i">${opts}</select></label></div>
  <label class="f" for="mc-u">DART 사업보고서 주소(찾았으면 붙여넣기, 몰라도 돼요)<input id="mc-u" type="url" placeholder="https://dart.fss.or.kr/..."></label>
  <div class="row"><button class="btn" data-act="pickCompany">이 기업으로 정하기</button></div>
  <p class="small muted">DART에서 찾는 법: dart.fss.or.kr → 위 검색창에 회사 이름 → 목록에서 '사업보고서 (연도.12)' 누르기 → 주소창 주소 복사.</p>`;
}
function missionView(spec){
  if(!spec) return `<p class="muted">이 교시에는 실전 과제가 없어요.</p>`;
  if(!qaEnabled()) return `<div class="warnbox">실전 과제는 저장소(서버)가 연결돼야 쓸 수 있어요.</div>`;
  if(!missionsOn()) return `<div class="warnbox">${Sync.ver === undefined ? "서버를 확인하는 중이에요. 잠시 뒤 새로고침해 보세요." : "AI 실전 과제를 쓰려면 저장소 코드를 새 버전으로 바꿔야 해요. 형에게 알려 주세요. 지금은 이 단계를 건너뛰어도 돼요."}</div>`;
  if(spec.k === "p4" && !spec.extra && !activeCompany()) return companyPicker();
  const rec = (S.missions || {})[spec.key];
  const err = (S.mErr || {})[spec.key];
  if(!rec){
    if(M_BUSY[spec.key]) return `<div class="notebox"><b>AI가 ${spec.search ? "오늘의 실제 기사를 찾아 읽고" : "자료를 보고"} 과제를 만드는 중이에요.</b><br>${spec.search ? "30초~1분" : "20~40초"} 걸려요. 이 화면에서 기다려 주세요.</div>`;
    if(err) return `<div class="warnbox">${esc(err)}</div><button class="btn" data-act="mLoad" data-key="${spec.key}">다시 시도</button>`;
    setTimeout(() => loadMission(spec), 30);
    return `<div class="notebox">과제를 불러오는 중이에요…</div>`;
  }
  const m = rec.m, last = rec.grades.slice(-1)[0];
  const searched = (m.searched || []).map(x => x.url);
  const src = (m.sources || []).map(x => { const ok = !x.url || /dart\.fss\.or\.kr/.test(x.url) || !searched.length || searched.includes(x.url); return `<li><a href="${esc(x.url || "#")}" target="_blank" rel="noopener">${esc(x.title || "자료 열기")}</a><br><span class="small muted">${esc(x.outlet || "")} · ${esc(x.date || "")}${x.category ? " · " + esc(x.category) : ""}${ok ? "" : " · ⚠ 주소가 맞는지 확인 필요"}</span></li>`; }).join("");
  const locked = rec.passed;
  const tasks = (m.tasks || []).map((t, i) => { const v = (rec.ans || {})[i] || ""; const big = t.kind === "long"; const fb = last && last.j && (last.j.items || []).find(x => +x.no === i + 1);
    return `<div class="mtask"><label class="f" for="mt-${i}"><b>${i + 1}.</b> ${esc(t.q)}<span class="sub">${({copy:"보고서·기사에서 찾은 문장이나 숫자를 그대로 옮겨 적기", number:"숫자는 단위·시각·출처까지", long:"여러 문장으로", short:"1~3문장"})[t.kind] || ""}</span>
    <textarea id="mt-${i}" data-mans="${spec.key}|${i}" rows="${big ? 7 : 3}" ${locked ? "readonly" : ""}>${esc(v)}</textarea></label>
    ${fb ? `<div class="small ${fb.verdict === "적절" ? "ok-t" : "no-t"}">AI: ${esc(fb.verdict || "")} — ${esc(fb.comment || "")}${fb.fix ? `<br>고칠 방법: ${esc(fb.fix)}` : ""}</div>` : ""}</div>`; }).join("");
  const gradeHTML = rec.grades.map((g, gi) => gradeBox(g, gi + 1)).reverse().join("");
  const left = MAX_GRADES - rec.grades.length;
  const busy = M_BUSY[spec.key] === "grade";
  let action = "";
  if(rec.passed){
    action = rec.nowDone ? `<div class="notebox">이 과제를 마쳤어요. 아래 <b>다음 활동 →</b>을 누르세요.</div>` : `<div class="warnbox"><b>지금 바로 복습</b>: ${esc(((last || {}).j || {}).now || "평가에서 지적된 부분을 다시 읽어 보세요.")}<br><button class="btn small" data-act="mNowDone" data-key="${spec.key}">했어요</button></div>`;
  } else if(busy){ action = `<div class="notebox">AI가 냉정하게 평가하는 중이에요… (15~40초)</div>`; }
  else action = `<div class="row"><button class="btn" data-act="mSubmit" data-key="${spec.key}">${rec.grades.length ? "고쳐서 다시 제출하기" : "제출하고 평가받기"}</button><span class="small muted">평가 ${left}번 남음 · 70점 이상이면 통과</span></div>`;
  return `<div class="mhead"><div class="crumb">${spec.extra ? "보충 과제" : "AI 실전 과제"} · 약 ${m.minutes || spec.mins}분</div><h3>${esc(m.title || spec.title)}</h3>
  <p><b>이 과제의 목적</b>: ${esc(m.goal || spec.goal)}</p>${m.why ? `<p class="small muted">이 자료를 고른 이유: ${esc(m.why)}</p>` : ""}</div>
  ${src ? `<div class="help-panel"><b>① 먼저 자료를 끝까지 읽어요</b> (새 창으로 열려요)<ul class="clean">${src}</ul>${(m.guide || []).length ? `<b>읽는 법</b><ol>${m.guide.map(g => `<li>${esc(g)}</li>`).join("")}</ol>` : ""}</div>` : ""}
  ${(m.words || []).length ? `<div class="notebox small"><b>미리 보는 낱말</b>: ${m.words.map(w => `<b>${esc(w.w)}</b>(${esc(w.hint)})`).join(", ")}</div>` : ""}
  <h4>② 질문에 답해요</h4>${tasks}
  ${(m.selfcheck || []).length && !rec.passed ? `<p class="small"><b>제출 전 확인</b>: ${m.selfcheck.map(esc).join(" / ")}</p>` : ""}
  <h4>③ 제출하고 평가받기</h4>${action}${gradeHTML}
  ${rec.grades.length === 0 && !rec.passed ? `<p class="small muted">자료가 이상하면 <button class="btn small ghost" data-act="mLoad" data-key="${spec.key}" data-force="1">과제 다시 만들기</button></p>` : ""}`;
}
function gradeBox(g, no){
  const j = g.j;
  if(!j) return `<div class="ai-out small"><b>평가 ${no}</b>\n${esc(g.raw || "")}</div>`;
  const pass = (j.score || 0) >= PASS_SCORE && j.verdict !== "부적절";
  return `<div class="gradebox ${pass ? "pass" : "fail"}"><div class="row between"><b>평가 ${no}: ${esc(j.verdict || "")}</b><span class="score">${j.score ?? "?"}점</span></div>
  <p>${esc(j.summary || "")}</p>
  ${j.now ? `<p><b>지금 바로 복습</b>: ${esc(j.now)}</p>` : ""}${!pass && j.redo ? `<p><b>다시 쓸 것</b>: ${esc(j.redo)}</p>` : ""}${j.tomorrow ? `<p class="small muted">내일 복습으로 넘어감: ${esc(j.tomorrow)}</p>` : ""}</div>`;
}
function parseGrade(t){
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if(a < 0 || b <= a) return null;
  try{ const j = JSON.parse(t.slice(a, b + 1)); j.score = Math.max(0, Math.min(100, Math.round(+j.score || 0))); return j; }catch(e){ return null; }
}
async function submitMission(key){
  const rec = (S.missions || {})[key]; if(!rec || rec.passed || M_BUSY[key]) return;
  const m = rec.m;
  const blanks = (m.tasks || []).filter((t, i) => !String((rec.ans || {})[i] || "").trim()).length;
  if(blanks){ toast(`아직 비어 있는 답이 ${blanks}개 있어요. 모르면 '모르겠다'고 쓰고 이유를 적어요.`); return; }
  const n = rec.day, pi = phaseInfo(n);
  const lv = S.levels ? overallLevel(S.levels) : 0;
  const ctx = `[평가 요청] 학습자의 실전 과제 답을 냉정하게 평가하라.\n[학습자] ${n}일차, ${pi.ph}단계(${pi.name}), 종합 레벨 ${lv}. 초보자지만 봐주지 마라. 칭찬은 한 문장 이하.\n[과제] ${m.title}\n[목적] ${m.goal}\n[자료] ${(m.sources || []).map(x => `${x.outlet || ""} '${x.title || ""}' ${x.date || ""} ${x.url || ""}`).join(" / ")}\n` +
    (m.tasks || []).map((t, i) => `\n[${i + 1}번 질문] ${t.q}\n[채점 기준] ${t.rubric || ""}\n[학습자 답] ${String(rec.ans[i] || "").slice(0, 1800)}`).join("\n") +
    `\n\n[평가 규칙] 점수: 90~100 거의 완벽 / 70~89 핵심은 맞지만 빠진 것 있음 / 50~69 절반만 맞음 / 0~49 핵심이 틀리거나 근거 없음. 판정: 70점 이상이고 사실 오류가 없으면 '적절', 50~69는 '부분 적절', 그 아래는 '부적절'. 자료(사업보고서·시장 숫자)를 네가 직접 볼 수 없는 답은 형식(단위·기간·출처)과 앞뒤가 맞는지로 평가하고, comment에 '원문 대조 필요'라고 밝혀라. 숫자·사실을 지어내지 마라.${rec.grades.length ? "\n[참고] 이것은 고쳐서 다시 낸 답이다. 앞 평가의 지적이 고쳐졌는지 확인하라." : ""}\n[출력] JSON 하나만: {"score":0~100,"verdict":"적절|부분 적절|부적절","summary":"냉정한 총평 2문장","items":[{"no":1,"verdict":"적절|부분 적절|부적절","comment":"무엇이 틀렸고 왜(근거)","fix":"어떻게 고칠지 구체적으로"}],"now":"지금 바로 할 복습: 구체적 행동 1~2개(어느 부분을 다시 읽고 무엇을 찾아 쓰라 등)","tomorrow":"내일 복습 질문 1개(답을 써 볼 수 있는 질문 형태)","redo":"판정이 적절이 아니면 무엇을 고쳐 다시 낼지"}`;
  M_BUSY[key] = "grade"; UI.keepScroll = true; render();
  const j = await aiCall({action:"ask", mode:"grade", item:key, question:"제 과제 답을 평가해 주세요.", context:ctx});
  delete M_BUSY[key];
  if(!j.ok){ toast(mErr(j)); UI.keepScroll = true; render(); return; }
  const g = parseGrade(j.answer || "");
  rec.grades.push({at:Date.now(), j:g, raw:g ? "" : j.answer, ans:Object.assign({}, rec.ans)});
  const pass = g && g.score >= PASS_SCORE && g.verdict !== "부적절";
  if(pass || rec.grades.length >= MAX_GRADES){ rec.passed = true; rec.passedAt = Date.now(); rec.flag = !pass; }
  if(g && g.tomorrow){ S.reviewQ = S.reviewQ || []; S.reviewQ.push({id:key + "_" + rec.grades.length, q:g.tomorrow, from:m.title, day:n, due:n + 1, done:false}); }
  touch(); UI.keepScroll = true; render();
  if(rec.passed && !pass) toast("평가 3번을 다 썼어요. 부족한 부분은 내일 복습으로 넘어가요.");
}
function missionGate(key){
  const rec = (S.missions || {})[key];
  if(!rec) return "먼저 실전 과제를 받아 풀어야 해요.";
  if(!rec.passed) return "과제를 제출하고 70점 이상을 받아야 넘어갈 수 있어요. 지적받은 곳을 고쳐 다시 제출하세요.";
  if(!rec.nowDone) return "'지금 바로 복습'을 하고 '했어요'를 눌러 주세요.";
  return "";
}

/* ---------- 교시 단계 ---------- */
function missionSteps(n, k){
  if(!hasMission(n, k)) return [];
  const spec0 = missionSpec(n, k); if(!spec0) return [];
  const out = [{id:"mis", title:"AI 실전 과제: " + spec0.title.replace(/^실제 /, "실제 "), mins:spec0.mins, render:() => missionView(missionSpec(n, k)), gate:() => missionsOn() ? missionGate(spec0.key) : ""}];
  out.push({id:"mx", title:"분량 확인·보충 과제", mins:10, render:() => extraView(n, k), gate:() => extraGate(n, k)});
  return out;
}
function extraNeeded(n, k){ const pl = periodLog(n, k); const rec = (S.missions || {})[mKey(n, k, "x")]; if(rec) return true; return (pl.active || 0) < MIN_ACTIVE; }
function extraView(n, k){
  const pl = periodLog(n, k);
  if(!missionsOn()) return `<p class="muted">서버가 연결되면 보충 과제를 받을 수 있어요.</p>`;
  if(!extraNeeded(n, k)) return `<div class="notebox">이번 교시 집중 시간 <b>${fmtDur(pl.active)}</b>. 목표(35분 이상)를 채웠어요. 다음으로 넘어가세요.</div>`;
  const sp = extraSpec(n, k); sp.extra = true;
  return `<div class="warnbox">이번 교시 집중 시간이 <b>${fmtDur(pl.active)}</b>로 목표(35분)보다 짧아요. 실력이 쌓이려면 충분히 붙잡고 있어야 해요. 같은 자료로 보충 과제를 하나 더 해요.</div>${missionView(sp)}`;
}
function extraGate(n, k){ if(!missionsOn() || !extraNeeded(n, k)) return ""; return missionGate(mKey(n, k, "x")); }

/* ---------- 어제 지적 복습 ---------- */
function reviewDue(n){ return (S.reviewQ || []).filter(r => !r.done && r.due <= n).slice(0, 6); }
function reviewStep(n){
  const due = reviewDue(n);
  if(!due.length) return null;
  return {id:"rq0", title:"어제 지적받은 것 복습", mins:15, render:() => reviewView(n), gate:() => missionsOn() && reviewDue(n).length ? "복습 답을 쓰고 '복습 제출'을 눌러 주세요." : ""};
}
function reviewView(n){
  const due = reviewDue(n);
  if(!due.length) return `<div class="notebox">복습을 마쳤어요. 다음으로 넘어가세요.</div>${reviewDoneList(n)}`;
  return `<p>지난 과제에서 AI가 지적한 내용이에요. 자료를 보지 말고 먼저 기억으로 답해 보세요.</p>
  ${due.map((r, i) => `<label class="f" for="rv-${i}"><b>${i + 1}.</b> ${esc(r.q)}<span class="sub">${esc(r.from)} (${r.day}일차)</span><textarea id="rv-${i}" data-rvans="${esc(r.id)}" rows="3">${esc(r.ans || "")}</textarea></label>`).join("")}
  <div class="row"><button class="btn" data-act="rvSubmit" ${M_BUSY.rv ? "disabled" : ""}>${M_BUSY.rv ? "평가하는 중…" : "복습 제출하고 평가받기"}</button></div>`;
}
function reviewDoneList(n){ const xs = (S.reviewQ || []).filter(r => r.done && r.doneDay === n); return xs.length ? `<div class="small">${xs.map(r => `<div class="ansrow"><div class="q">${esc(r.q)}</div><div>${esc(r.ans || "")}</div>${r.fb ? `<div class="${r.ok ? "ok-t" : "no-t"}">${esc(r.fb)}</div>` : ""}</div>`).join("")}</div>` : ""; }
async function submitReview(n){
  const due = reviewDue(n);
  if(due.some(r => !String(r.ans || "").trim())){ toast("모든 복습 질문에 답을 써 주세요."); return; }
  M_BUSY.rv = 1; UI.keepScroll = true; render();
  const ctx = `[복습 평가 요청] 학습자가 지난 과제의 지적 사항을 기억으로 답했다. 각각 맞았는지 냉정하게 평가하라.\n` + due.map((r, i) => `[${i + 1}] 질문: ${r.q}\n학습자 답: ${r.ans}`).join("\n") + `\n[출력] JSON 하나만: {"items":[{"no":1,"ok":true,"fb":"한 문장 피드백(틀렸으면 바른 내용)"}]}`;
  const j = await aiCall({action:"ask", mode:"grade", item:"rv_d" + n, question:"복습 답을 평가해 주세요.", context:ctx});
  delete M_BUSY.rv;
  if(!j.ok){ toast(mErr(j)); UI.keepScroll = true; render(); return; }
  const g = parseGrade(j.answer || "") || {};
  due.forEach((r, i) => { const it = (g.items || []).find(x => +x.no === i + 1) || {}; r.done = true; r.doneDay = n; r.ok = !!it.ok; r.fb = it.fb || ""; if(!it.ok && !r.again){ S.reviewQ.push({id:r.id + "_r", q:r.q, from:r.from, day:r.day, due:n + 3, done:false, again:true}); } });
  touch(); UI.keepScroll = true; render();
}

/* ---------- 질문하기에 넘길 맥락 ---------- */
function missionContextLines(n, k, sid){
  const key = sid === "mx" ? mKey(n, k, "x") : mKey(n, k);
  const rec = (S.missions || {})[key]; if(!rec) return [];
  const m = rec.m;
  return [`[실전 과제] ${m.title} / 목적: ${m.goal}`, `[자료] ${(m.sources || []).map(x => `${x.outlet} '${x.title}' ${x.date} ${x.url}`).join(" / ")}`, ...(m.tasks || []).map((t, i) => `[${i + 1}번] ${t.q} / 학습자 답: ${(rec.ans || {})[i] || "(아직 없음)"}`), rec.passed ? "" : "[학습자는 아직 제출 전 → 정답을 대신 쓰지 말고, 자료의 어디를 보면 되는지 힌트로 도와줄 것]"].filter(Boolean);
}
function recMissions(){
  const xs = Object.entries(S.missions || {}).sort((a, b) => (b[1].at || 0) - (a[1].at || 0));
  if(!xs.length) return `<section class="card"><p class="muted">아직 실전 과제 기록이 없어요.</p></section>`;
  return xs.map(([key, r]) => { const last = r.grades.slice(-1)[0]; const j = last && last.j; return `<section class="card"><div class="crumb">${r.day}일차 · ${esc((PERIODS.find(p => p.k === r.k) || {}).name || "")}${/_x$/.test(key) ? " · 보충" : ""}</div><h3>${esc(r.m.title)}</h3>
  <p class="small">${(r.m.sources || []).map(x => `<a href="${esc(x.url || "#")}" target="_blank" rel="noopener">${esc(x.outlet || "")} ${esc(x.title || "")}</a>`).join(" · ")}</p>
  <p>${j ? `<b>${esc(j.verdict)} · ${j.score}점</b> (평가 ${r.grades.length}번${r.flag ? ", 3번 안에 통과 못 함" : ""})` : r.grades.length ? "평가 기록 있음" : "아직 제출 전"}</p>
  <details><summary>질문과 답 보기</summary>${(r.m.tasks || []).map((t, i) => `<div class="ansrow"><div class="q">${i + 1}. ${esc(t.q)}</div><div>${esc((r.ans || {})[i] || "")}</div></div>`).join("")}${r.grades.map((g, gi) => gradeBox(g, gi + 1)).join("")}</details></section>`; }).join("");
}
