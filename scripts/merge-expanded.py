"""Merge the downloaded official roster without discarding existing cards."""
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DATA=Path('/workspace/catalog-data')
P=ROOT/'dist/catalog.js'
catalog=json.loads(P.read_text().split('=',1)[1].strip().rstrip(';'))
lookup={c['id']:c for c in catalog}
for game in ['genshin','starrail','wuwa','blue']:
    for row in json.loads((DATA/('expanded-'+game+'.json')).read_text()):
        if row['id'] not in lookup: lookup[row['id']]=row

remap={
 'mondstadt-knights':'gi-mondstadt','mona-astrology':'gi-astrology',
 'kokomi-watatsumi':'gi-watatsumi','natlan-desert':'gi-desert',
 'natlan-coast':'gi-natlan','natlan-forge':'gi-natlan','natlan-sky':'gi-natlan',
 'natlan-flame':'gi-natlan','natlan-stars':'gi-natlan','skirk-abyss':'gi-abyss',
 'nodkrai-machine':'gi-nodkrai','nodkrai-forest':'gi-nodkrai','nodkrai-nefer':'gi-nodkrai'
}
for c in lookup.values():
    scene=Path(c['scene']).stem
    if scene in remap:c['scene']='backgrounds/'+remap[scene]+'.webp'
    if c['name']=='요이미야':
        c.update(scene='backgrounds/raiden.webp',sceneLabel='이나즈마 · 여름의 등불',sceneDescription='이나즈마의 신사와 등불, 여름밤의 빛으로 꾸민 무대.')
    if c['game']=='wuwa':
        if c['name'] in ['아우구스타','유노','루파']:
            c.update(scene='backgrounds/ww-septimont.webp',sceneLabel='세븐힐즈 · 영광의 무대',sceneDescription='고대 원형경기장과 대리석 기둥, 황금빛과 달빛이 만나는 세븐힐즈의 풍경.')
        if c['name']=='치사':
            c.update(scene='backgrounds/ww-modern.webp',sceneLabel='치사 · 비 내리는 도시',sceneDescription='붉은 빛과 청록색 네온이 흐르는 현대 도시의 비 내리는 밤.')
    if c['name']=='세이버':
        c.update(scene='backgrounds/hsr-1309.webp',sceneLabel='페나코니 · 성배전쟁의 꿈',sceneDescription='화려한 꿈의 도시를 배경으로 한 기사왕의 무대.')
    c['quote']=c.get('quote','').replace('\\n','\n')
    c['artMode']='cutout'

result=list(lookup.values())
P.write_text('export const CATALOG_DATA = '+json.dumps(result,ensure_ascii=False,indent=2)+';\n')
print({g:sum(c['game']==g for c in result) for g in ['genshin','starrail','wuwa','blue']})
print('Total:',len(result))
