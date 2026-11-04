#!/usr/bin/env python3
"""콘텐츠 규격 검사기. 사용: python3 validate.py <파일|폴더> ..."""
import json, sys, os, re

BASE = os.path.dirname(os.path.abspath(__file__))
CONCEPT_IDS = {c[0] for c in json.load(open(os.path.join(BASE, 'concepts_list.json'), encoding='utf-8'))}
REAL_FIRMS = ['삼성', '현대', 'SK', 'LG', '네이버', '카카오', '애플', '엔비디아', '테슬라', '마이크로소프트', '구글', '아마존', '쿠팡', '포스코', '롯데', '한화', 'TSMC', '인텔', '메타', '셀트리온', '하이닉스']
errs = []

def E(path, msg):
    errs.append(f'{path}: {msg}')

def chkQ(q, where):
    if not isinstance(q, dict):
        return E(where, 'Q가 객체가 아님')
    t = q.get('t')
    if t not in ('mcq', 'num', 'free'):
        return E(where, f't 값 오류: {t}')
    if not str(q.get('stem', '')).strip():
        E(where, 'stem 비어 있음')
    lv = q.get('lv')
    if lv is not None and lv not in range(1, 7):
        E(where, f'lv 범위 오류: {lv}')
    if t == 'mcq':
        o = q.get('options')
        if not isinstance(o, list) or not (2 <= len(o) <= 5):
            E(where, 'options는 2~5개')
        else:
            if len(set(o)) != len(o):
                E(where, 'options 중복')
            a = q.get('answer')
            if not isinstance(a, int) or not (0 <= a < len(o)):
                E(where, f'answer 범위 오류: {a}')
        if not str(q.get('explain', '')).strip():
            E(where, 'explain 비어 있음')
    if t == 'num':
        if not isinstance(q.get('answer'), (int, float)):
            E(where, 'num answer는 숫자')
        if not isinstance(q.get('tol'), (int, float)):
            E(where, 'num tol은 숫자')
        if not str(q.get('explain', '')).strip():
            E(where, 'explain 비어 있음')
    if t == 'free':
        kp = q.get('keyPoints')
        if not isinstance(kp, list) or not (1 <= len(kp) <= 6):
            E(where, 'free keyPoints 1~6개')
        if not str(q.get('model', '')).strip():
            E(where, 'free model 비어 있음')

def chkTable(t, where):
    if t is None:
        return
    if not isinstance(t, dict) or not isinstance(t.get('head'), list) or not isinstance(t.get('rows'), list):
        return E(where, 'table 형식 오류(head, rows)')
    n = len(t['head'])
    for i, r in enumerate(t['rows']):
        if not isinstance(r, list) or len(r) != n:
            E(where, f'table 행 {i} 칸 수가 head({n})와 다름')

def realFirm(text, where):
    for f in REAL_FIRMS:
        if f in text:
            E(where, f'실제 기업명 의심: {f} (가상 사례에는 지어낸 이름만)')

def chkDay(d, p):
    for k in ('day', 'vocab', 'reading', 'news', 'company', 'market', 'writing'):
        if k not in d:
            E(p, f'필드 없음: {k}')
    if errs and errs[-1].startswith(p) and '필드 없음' in errs[-1]:
        pass
    day = d.get('day')
    v = d.get('vocab', [])
    if not (3 <= len(v) <= 6):
        E(p, 'vocab 3~6개')
    for i, w in enumerate(v):
        for k in ('w', 'm', 'ex', 'q'):
            if not w.get(k):
                E(p, f'vocab[{i}].{k} 없음')
        if w.get('q'):
            chkQ(w['q'], f'{p} vocab[{i}].q')
    r = d.get('reading', {})
    for k in ('title', 'level', 'text', 'easy', 'key', 'qs', 'sum'):
        if not r.get(k):
            E(p, f'reading.{k} 없음')
    if r.get('key') and r.get('text') and r['key'].strip() not in r['text']:
        E(p, 'reading.key가 본문에 그대로 없음')
    qs = r.get('qs', [])
    if not (5 <= len(qs) <= 8):
        E(p, f'reading.qs 5~8개 (현재 {len(qs)})')
    for i, q in enumerate(qs):
        chkQ(q, f'{p} reading.qs[{i}]')
    s = r.get('sum', {})
    if not s.get('keyPoints') or not s.get('model'):
        E(p, 'reading.sum keyPoints/model 없음')
    n = d.get('news', {})
    for k in ('headline', 'source', 'body', 'qs', 'steps', 'record'):
        if not n.get(k):
            E(p, f'news.{k} 없음')
    if n.get('source') and '가상' not in n['source'] and '역사' not in n['source'] and '교육' not in n['source']:
        E(p, 'news.source에 가상/교육용 표시 필요')
    for i, q in enumerate(n.get('qs', [])):
        chkQ(q, f'{p} news.qs[{i}]')
    st = n.get('steps', [])
    need = 3 if day and day <= 13 else (5 if day and day <= 29 else 7)
    if len(st) < need:
        E(p, f'news.steps {need}개 이상 필요 (현재 {len(st)})')
    for i, s2 in enumerate(st):
        if s2.get('k') not in ('fact', 'meaning', 'why', 'link', 'unknown', 'judge', 'counter'):
            E(p, f'news.steps[{i}].k 오류')
        if not s2.get('q') or not s2.get('model'):
            E(p, f'news.steps[{i}] q/model 없음')
    c = d.get('company', {})
    if c.get('mode') not in ('case', 'dart', 'idea'):
        E(p, 'company.mode 오류')
    for k in ('title', 'text', 'qs'):
        if not c.get(k):
            E(p, f'company.{k} 없음')
    chkTable(c.get('table'), f'{p} company.table')
    if not (3 <= len(c.get('qs', [])) <= 6):
        E(p, 'company.qs 3~6개')
    for i, q in enumerate(c.get('qs', [])):
        chkQ(q, f'{p} company.qs[{i}]')
    m = d.get('market', {})
    for k in ('title', 'table', 'qs', 'classify'):
        if not m.get(k):
            E(p, f'market.{k} 없음')
    chkTable(m.get('table'), f'{p} market.table')
    for i, q in enumerate(m.get('qs', [])):
        chkQ(q, f'{p} market.qs[{i}]')
    for i, cl in enumerate(m.get('classify', [])):
        if cl.get('a') not in ('fact', 'possible', 'verified') or not cl.get('s') or not cl.get('why'):
            E(p, f'market.classify[{i}] 형식 오류')
    w = d.get('writing', {})
    if w.get('type') not in ('concept', 'news', 'company', 'stock', 'crypto', 'macro'):
        E(p, 'writing.type 오류')
    for k in ('prompt', 'size', 'keyPoints', 'model'):
        if not w.get(k):
            E(p, f'writing.{k} 없음')
    if 'frame' not in w or not isinstance(w.get('frame'), list):
        E(p, 'writing.frame 배열 필요(없으면 [])')
    blob = json.dumps({k: d.get(k) for k in ('company', 'market', 'news')}, ensure_ascii=False)
    realFirm(blob, p)

def chkConcept(c, p):
    for k in ('id', 'name', 'easy', 'analogy', 'real', 'example', 'alt', 'altExample', 'links', 'canDo', 'quiz', 'explain'):
        if not c.get(k):
            E(p, f'필드 없음: {k}')
    if c.get('id') not in CONCEPT_IDS:
        E(p, f'알 수 없는 개념 id: {c.get("id")}')
    for l in c.get('links', []):
        if l.get('to') not in CONCEPT_IDS:
            E(p, f'links.to 알 수 없는 id: {l.get("to")}')
    qz = c.get('quiz', [])
    if not (3 <= len(qz) <= 6):
        E(p, 'quiz 3~6개')
    if not any(q.get('transfer') for q in qz):
        E(p, 'transfer 문항 1개 필요')
    for i, q in enumerate(qz):
        chkQ(q, f'{p} quiz[{i}]')
    ex = c.get('explain', {})
    if not ex.get('prompt') or not ex.get('keyPoints') or not ex.get('model'):
        E(p, 'explain prompt/keyPoints/model 필요')

def chkAssess(arr, p):
    ids = set()
    for i, it in enumerate(arr):
        w = f'{p}[{i}]'
        if it.get('id') in ids:
            E(w, f'id 중복 {it.get("id")}')
        ids.add(it.get('id'))
        if it.get('d') not in list('RVENCMW'):
            E(w, 'd 오류')
        if it.get('lv') not in range(1, 7):
            E(w, 'lv 오류')
        if it.get('t') not in ('mcq', 'num'):
            E(w, '평가 문항은 mcq 또는 num')
        chkQ(it, w)
        realFirm(json.dumps(it, ensure_ascii=False), w)

def run(path):
    if os.path.isdir(path):
        for f in sorted(os.listdir(path)):
            if f.endswith('.json'):
                run(os.path.join(path, f))
        return
    try:
        data = json.load(open(path, encoding='utf-8'))
    except Exception as e:
        return E(path, f'JSON 파싱 실패: {e}')
    base = os.path.basename(path)
    if re.match(r'd\d{3}\.json$', base):
        chkDay(data, path)
    elif '/concepts/' in path:
        chkConcept(data, path)
    elif '/assess/' in path and base != 'writing.json':
        chkAssess(data, path)
    elif base == 'writing.json':
        if not isinstance(data, list):
            E(path, 'writing.json은 배열')

for a in sys.argv[1:]:
    run(a)
print(f'오류 {len(errs)}개')
for e in errs[:200]:
    print(' -', e)
sys.exit(1 if errs else 0)
