"""Validate the expanded official roster; never prune it to a fixed count."""
import json
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];DIST=ROOT/'dist'
rows=json.loads((DIST/'catalog.js').read_text().split('=',1)[1].strip().rstrip(';'))
assert len({c['id'] for c in rows})==len(rows)
for c in rows:
    assert c.get('official') and c['artMode']=='cutout',c['name']
    for key in ['art','thumb','scene']:assert (DIST/c[key]).is_file(),(c['name'],key)
    assert Image.open(DIST/c['art']).convert('RGBA').getchannel('A').getextrema()[0]==0,c['name']
    if c.get('signature'):assert (DIST/c['signature']['image']).is_file(),c['name']
print({game:sum(c['game']==game for c in rows) for game in ['genshin','starrail','wuwa','blue']})
print(len(rows),'official card presets validated')
