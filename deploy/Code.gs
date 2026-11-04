// 금융 공부방 저장소 + AI(질문·평가·실전 과제) — 5판
const FOLDER = '금융공부방_기록';
const PER_ITEM = 10;        // 질문하기: 항목마다
const DAILY_LIMIT = 80;     // 질문하기: 하루 전체
const GRADE_DAILY = 150;    // 평가·첨삭·응용 문제: 하루 전체
const MISSION_DAILY = 30;   // 실전 과제 만들기(웹 검색): 하루 전체
const SYS_TUTOR = '너는 경제·금융을 처음 배우는 성인 학습자를 돕는 한국어 과외 선생님이다. 학습자는 독해력이 낮을 수 있으니 짧은 문장, 쉬운 낱말, 일상 예시로 설명한다. 규칙: 1) 학습자가 아직 답하지 않은 문제면 정답을 바로 말하지 말고 생각하는 순서와 힌트를 준다. 2) 함께 준 학습 자료를 기준으로 설명하고, 자료에 없는 숫자나 사실을 지어내지 않는다. 모르는 것은 모른다고 하고 확인할 곳을 알려 준다. 3) 특정 종목·코인을 사라·팔라고 권하지 않는다. 투자 이야기가 나오면 손실 가능성을 함께 말한다. 4) 답은 10문장 이하로 하고 마지막에 한 줄 요약을 붙인다. 5) 학습과 관계없는 요청은 정중히 학습 질문으로 돌린다.';
const SYS_GRADE = '너는 금융시장 분석가를 길러 내는 엄격한 평가자다. 학습자의 답을 채점 기준에 따라 냉정하고 구체적으로 평가한다. 칭찬은 짧게, 틀린 점은 근거와 함께 분명히, 고칠 방법은 바로 행동할 수 있게 쓴다. 자료에 없는 숫자나 사실을 지어내지 않는다. 네가 직접 볼 수 없는 원문(사업보고서·시장 숫자)은 형식과 논리로만 평가하고 "원문 대조 필요"라고 밝힌다. 특정 종목·코인 매수·매도를 권하지 않는다. 요청받은 형식(JSON 등)을 정확히 지킨다. 쉬운 한국어로 쓴다.';
const SYS_MISSION = '너는 90일 금융시장 분석가 과정의 과제 출제자다. 웹 검색으로 실제 최신 한국어 자료를 찾아 읽고, 정해진 학습 목적을 이루는 과제를 만든다. 규칙: 1) 자료 주소(url)는 검색 결과에 실제로 나온 주소만 쓴다. 절대 지어내지 않는다. 2) 질문은 그 자료를 읽어야 답할 수 있게 만들고, 채점 기준에는 자료 속 근거를 적는다. 3) 기사 문장을 길게 베끼지 말고 짧게 요약한다. 4) 정치 기사는 특정 정당·인물 편을 들지 않고 경제적 영향만 다룬다. 5) 특정 종목·코인을 사라·팔라고 하지 않는다. 6) 학습자는 초보자이므로 쉬운 말로 쓴다. 7) 요청한 JSON 하나만 출력한다.';

function doGet(e) {
  const id = clean_((e && e.parameter && e.parameter.id) || 'learner');
  const f = findName_(id + '.json');
  return out_({ ok: true, ver: 5, id: id, data: f ? JSON.parse(f.getBlob().getDataAsString()) : null });
}

function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return out_({ ok: false, error: 'bad_json' }); }
  const id = clean_(body.id);
  const pinErr = checkPin_(id, String(body.pin || ''));
  if (pinErr) return out_({ ok: false, error: pinErr });
  const a = body.action || '';
  if (a === 'auth') return out_({ ok: true });
  if (a === 'ask') return out_(ask_(id, body));
  if (a === 'mission') return out_(mission_(id, body));
  if (!a && body.state) {
    const lock = LockService.getScriptLock(); lock.waitLock(20000);
    try { save_(id + '.json', JSON.stringify({ savedAt: new Date().toISOString(), updated: body.updated || 0, state: body.state })); }
    finally { lock.releaseLock(); }
    return out_({ ok: true, savedAt: Date.now() });
  }
  return out_({ ok: false, error: 'unknown_action' });
}

/* ---------- 비밀번호 ---------- */
function checkPin_(id, pin) {
  const props = PropertiesService.getScriptProperties();
  const stored = props.getProperty('pin_' + id);
  if (!stored) {
    if (pin.length < 4) return 'pin_short';
    props.setProperty('pin_' + id, hashB64_(pin + '|' + id));
    return null;
  }
  const cands = [pin + '|' + id, pin, id + '|' + pin];
  for (const c of cands) { if (stored === hashB64_(c) || stored === hashHex_(c)) return null; }
  return 'pin';
}
function digest_(s) { return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8); }
function hashB64_(s) { return Utilities.base64Encode(digest_(s)); }
function hashHex_(s) { return digest_(s).map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join(''); }

/* ---------- 횟수 ---------- */
function count_(id, bucket, item, perItem, daily) {
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const name = id + '_ai_counts.json';
    const f = findName_(name);
    const c = f ? JSON.parse(f.getBlob().getDataAsString()) : {};
    const day = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd');
    const b = c[bucket] = c[bucket] || { items: {}, days: {} };
    const used = item ? (b.items[item] || 0) : 0;
    const dayUsed = b.days[day] || 0;
    if (item && perItem && used >= perItem) return { ok: false, error: 'item_limit', left: 0 };
    if (dayUsed >= daily) return { ok: false, error: 'day_limit' };
    if (item) b.items[item] = used + 1;
    b.days[day] = dayUsed + 1;
    save_(name, JSON.stringify(c));
    return { ok: true, left: item && perItem ? perItem - used - 1 : undefined };
  } finally { lock.releaseLock(); }
}
function refund_(id, bucket, item) {
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const name = id + '_ai_counts.json';
    const f = findName_(name); if (!f) return;
    const c = JSON.parse(f.getBlob().getDataAsString());
    const day = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd');
    const b = c[bucket]; if (!b) return;
    if (item && b.items[item]) b.items[item]--;
    if (b.days[day]) b.days[day]--;
    save_(name, JSON.stringify(c));
  } finally { lock.releaseLock(); }
}

/* ---------- Claude 호출 ---------- */
function claude_(system, userText, opts) {
  const props = PropertiesService.getScriptProperties();
  const key = props.getProperty('ANTHROPIC_API_KEY');
  if (!key) return { ok: false, error: 'no_key' };
  const payload = { model: props.getProperty('MODEL') || 'claude-haiku-5-5', max_tokens: opts.max || 1200, system: system, messages: [{ role: 'user', content: userText }] };
  if (opts.search) payload.tools = [{ type: 'web_search_20250305', name: 'web_search', max_uses: opts.search, user_location: { type: 'approximate', country: 'KR', timezone: 'Asia/Seoul' } }];
  let text = '', stop = '';
  const sources = [];
  for (let i = 0; i < 4; i++) {
    let r;
    try {
      r = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', { method: 'post', contentType: 'application/json', headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' }, payload: JSON.stringify(payload), muteHttpExceptions: true });
    } catch (err) { return { ok: false, error: 'api', detail: String(err) }; }
    const code = r.getResponseCode();
    let j = {};
    try { j = JSON.parse(r.getContentText() || '{}'); } catch (err) {}
    if (code !== 200) return { ok: false, error: 'api', detail: code + ' ' + ((j.error && j.error.message) || '') };
    (j.content || []).forEach(function (b) {
      if (b.type === 'text') text += b.text;
      if (b.type === 'web_search_tool_result' && Array.isArray(b.content)) b.content.forEach(function (x) { if (x.url) sources.push({ url: x.url, title: x.title || '', age: x.page_age || '' }); });
    });
    stop = j.stop_reason || '';
    if (j.stop_reason === 'pause_turn') { payload.messages = payload.messages.concat([{ role: 'assistant', content: j.content }]); continue; }
    if (j.stop_reason === 'max_tokens' && !opts.search && i < 3) { payload.messages = [payload.messages[0], { role: 'assistant', content: text }, { role: 'user', content: '앞의 답이 중간에 끊겼다. 끊긴 바로 그 지점부터 이어서 끝까지 써라. 앞 내용을 되풀이하지 마라.' }]; continue; }
    break;
  }
  return { ok: true, text: text, sources: sources, stop: stop };
}

/* ---------- 질문·평가 ---------- */
function ask_(id, body) {
  const ctx = String(body.context || '');
  const mode = body.mode || (/\[첨삭 요청\]|\[응용 문제|\[평가 요청\]|\[복습 평가/.test(ctx) ? 'grade' : 'ask');
  const item = String(body.item || 'etc').slice(0, 120);
  const bucket = mode === 'ask' ? 'ask' : 'grade';
  const cnt = count_(id, bucket, item, PER_ITEM, mode === 'ask' ? DAILY_LIMIT : GRADE_DAILY);
  if (!cnt.ok) return cnt;
  const r = claude_(mode === 'ask' ? SYS_TUTOR : SYS_GRADE, '[학습 자료와 상황]\n' + ctx.slice(0, 14000) + '\n\n[요청]\n' + String(body.question || '').slice(0, 2000), { max: 8000 });
  if (!r.ok) { refund_(id, bucket, item); return { ok: false, error: r.error, detail: r.detail }; }
  return { ok: true, answer: r.text + (r.stop === 'max_tokens' ? '\n\n(답이 아주 길어 일부가 빠졌을 수 있어요.)' : ''), left: cnt.left };
}

/* ---------- 실전 과제 만들기 ---------- */
function mission_(id, body) {
  const key = String(body.key || '').replace(/[^A-Za-z0-9_.-]/g, '').slice(0, 60);
  if (!key) return { ok: false, error: 'bad_key' };
  const name = id + '_m_' + key + '.json';
  const f = findName_(name);
  if (f && !body.force) return { ok: true, mission: JSON.parse(f.getBlob().getDataAsString()), cached: true };
  const cnt = count_(id, 'mission', null, 0, MISSION_DAILY);
  if (!cnt.ok) return cnt;
  const search = Math.max(0, Math.min(+body.search || 0, 5));
  const r = claude_(SYS_MISSION, String(body.prompt || '').slice(0, 14000), { max: 8000, search: search });
  if (!r.ok) { refund_(id, 'mission', null); return { ok: false, error: r.error, detail: r.detail }; }
  let m = parseJson_(r.text);
  if (!m) { const fix = claude_('너는 JSON 교정기다. 받은 글을 올바른 JSON 하나로 고쳐 JSON만 출력한다. 내용은 바꾸지 않는다. 문자열 안의 큰따옴표는 작은따옴표로 바꾼다.', r.text.slice(0, 20000), { max: 8000 }); if (fix.ok) m = parseJson_(fix.text); }
  if (!m || !Array.isArray(m.tasks) || !m.tasks.length) { refund_(id, 'mission', null); return { ok: false, error: 'parse', detail: r.text.slice(0, 300) }; }
  m.searched = r.sources.slice(0, 15);
  m.madeAt = new Date().toISOString();
  save_(name, JSON.stringify(m));
  return { ok: true, mission: m };
}
function parseJson_(t) {
  t = String(t || '').replace(/```(?:json)?/g, '');
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a < 0 || b <= a) return null;
  let s = t.slice(a, b + 1);
  try { return JSON.parse(s); } catch (e) {}
  s = s.replace(/,\s*([}\]])/g, '$1').replace(/\r?\n/g, ' ');
  try { return JSON.parse(s); } catch (e) { return null; }
}

/* ---------- 드라이브 ---------- */
function folder_() { const it = DriveApp.getFoldersByName(FOLDER); return it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER); }
function findName_(name) { const it = folder_().getFilesByName(name); return it.hasNext() ? it.next() : null; }
function save_(name, text) { const f = findName_(name); if (f) f.setContent(text); else folder_().createFile(name, text, 'application/json'); }
function clean_(s) { return String(s || 'learner').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40) || 'learner'; }
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/* ---------- 확인용: 편집기에서 실행 ---------- */
function testMission() {
  const r = claude_(SYS_MISSION, '[오늘 날짜] ' + Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd') + '\n[할 일] web_search로 최근 3일 안의 한국어 경제 기사 1편을 찾아, 초보자용 질문 2개를 만들어라.\n[출력] JSON 하나만: {"title":"","sources":[{"title":"","outlet":"","date":"","url":""}],"tasks":[{"q":"","kind":"short","rubric":""}]}', { max: 2000, search: 2 });
  Logger.log(JSON.stringify(r).slice(0, 1500));
}
