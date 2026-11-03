"""Audit maintained lore-scene assignments without overwriting the expanded roster."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];DIST=ROOT/'dist'
rows=json.loads((DIST/'catalog.js').read_text().split('=',1)[1].strip().rstrip(';'))
for c in rows:
    assert c.get('sceneLabel') and c.get('sceneDescription'),c['name']
    assert (DIST/c['scene']).is_file(),(c['name'],c['scene'])
print(len(rows),'lore assignments reference',len({c['scene'] for c in rows}),'available scene assets')
