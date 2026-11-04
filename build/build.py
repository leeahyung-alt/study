#!/usr/bin/env python3
"""콘텐츠와 소스를 묶어 단일 index.html을 만든다. 사용: python3 build.py [SYNC_URL]"""
import json, os, re, sys, glob
ROOT = '/home/claude/academy'
old = open('/home/claude/bizreport/index.html', encoding='utf-8').read()
base_css = old.split('<style>', 1)[1].split('</style>', 1)[0]
extra_css = open(f'{ROOT}/src/extra.css', encoding='utf-8').read()
cur = json.load(open(f'{ROOT}/spec/curriculum.json', encoding='utf-8'))
clist = json.load(open(f'{ROOT}/spec/concepts_list.json', encoding='utf-8'))
concepts = {}
for f in sorted(glob.glob(f'{ROOT}/content/concepts/*.json')):
    try:
        c = json.load(open(f, encoding='utf-8')); concepts[c['id']] = c
    except Exception as e:
        print('SKIP concept', f, e)
days = {}
for f in sorted(glob.glob(f'{ROOT}/content/days/d*.json')):
    try:
        d = json.load(open(f, encoding='utf-8')); days[str(d['day'])] = d
    except Exception as e:
        print('SKIP day', f, e)
assess = {}
for dom in 'RVENCMW':
    p = f'{ROOT}/content/assess/{dom}.json'
    if os.path.exists(p):
        try: assess[dom] = json.load(open(p, encoding='utf-8'))
        except Exception as e: print('SKIP assess', p, e)
wp = f'{ROOT}/content/assess/writing.json'
if os.path.exists(wp):
    assess['writing'] = json.load(open(wp, encoding='utf-8'))
data = {'curriculum': cur, 'conceptList': clist, 'concepts': concepts, 'days': days, 'assess': assess}
sync = sys.argv[1] if len(sys.argv) > 1 else ''
cfg = {'SYNC_URL': sync, 'LEARNER_ID': 'learner', 'APP_NAME': '금융시장 분석가 공부방'}
js = ''.join(open(f'{ROOT}/src/{n}', encoding='utf-8').read() + '\n' for n in ['core.js', 'workbook.js', 'period.js', 'realqa.js', 'mission.js', 'guide.js', 'ui.js', 'actions.js'])
def safe(s): return s.replace('</', '<\\/')
html = f'''<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>금융시장 분석가 공부방</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@700&family=IBM+Plex+Sans+KR:wght@400;500;600&display=swap" rel="stylesheet">
<style>{base_css}
{extra_css}</style>
</head>
<body>
<header class="top"><div class="top-in" id="top"></div></header>
<div class="wrap"><main id="app" aria-live="polite"><section class="card"><p>공부방을 여는 중이에요…</p></section></main></div>
<input type="file" id="importFile" accept=".json,application/json" class="sr" tabindex="-1" aria-hidden="true">
<script>window.ACADEMY_CONFIG = {json.dumps(cfg, ensure_ascii=False)};</script>
<script>window.ACADEMY_DATA = {safe(json.dumps(data, ensure_ascii=False, separators=(",", ":")))};</script>
<script>
{safe(js)}
</script>
</body>
</html>
'''
os.makedirs(f'{ROOT}/dist', exist_ok=True)
open(f'{ROOT}/dist/index.html', 'w', encoding='utf-8').write(html)
print('built', len(html), 'bytes;', 'days', len(days), 'concepts', len(concepts), 'assess', {k: (len(v) if isinstance(v, list) else 0) for k, v in assess.items()}, 'sync', bool(sync))
