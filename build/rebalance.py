import json, re, sys, random, hashlib
CIR = '①②③④⑤'
ORD = {0:['첫째','첫 번째'],1:['둘째','두 번째'],2:['셋째','세 번째'],3:['넷째','네 번째']}
def remap_text(t, perm):  # perm[old]=new
    t = re.sub('[①②③④⑤]', lambda m: '\0' + str(perm.get(CIR.index(m.group()), CIR.index(m.group()))) + '\0', t)
    for old, words in ORD.items():
        for w in words:
            t = re.sub(w + r'(\s*)보기', lambda m, o=old: '\1' + str(perm.get(o, o)) + '\1' + m.group(1) + '보기', t)
    t = re.sub('\0(\\d)\0', lambda m: CIR[int(m.group(1))], t)
    t = re.sub('\1(\\d)\1', lambda m: ORD[int(m.group(1))][1], t)
    return t
changed = 0
def fix(q, key):
    global changed
    if q.get('t') != 'mcq' or not isinstance(q.get('options'), list): return
    n = len(q['options'])
    if any(c in q.get('stem','') for c in CIR) or any(any(c in o for c in CIR) for o in q['options']): return
    rnd = random.Random(int(hashlib.md5(key.encode()).hexdigest()[:8], 16))
    order = list(range(n)); rnd.shuffle(order)          # new position i holds old option order[i]
    perm = {old: new for new, old in enumerate(order)}
    q['options'] = [q['options'][o] for o in order]
    q['answer'] = perm[q['answer']]
    if q.get('explain'): q['explain'] = remap_text(q['explain'], perm)
    changed += 1
def walk(o, key):
    if isinstance(o, dict):
        fix(o, key)
        for k, v in o.items(): walk(v, key + '/' + str(k))
    elif isinstance(o, list):
        for i, v in enumerate(o): walk(v, key + '/' + str(i))
for f in sys.argv[1:]:
    d = json.load(open(f, encoding='utf-8')); walk(d, f.split('/')[-1])
    json.dump(d, open(f, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('shuffled', changed)
