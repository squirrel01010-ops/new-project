"""Expand the official Wuthering Waves female roster without changing live catalogue."""
import json,subprocess,urllib.request,io,time,concurrent.futures
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];DATA=Path('/workspace/catalog-data');OUT=ROOT/'dist'
def read(p):return json.loads(p.read_text())
old=json.loads(subprocess.check_output(['git','show','2a480fb:dist/catalog.js'],cwd=ROOT,text=True).split(' = ',1)[1].rsplit(';',1)[0]);lookup={c['id']:c for c in old}
current=json.loads((OUT/'catalog.js').read_text().split(' = ',1)[1].rsplit(';',1)[0]);existing=[c for c in current if c['game']=='wuwa'];scenes={c['id']:c for c in current}
weapons={str(x['Id']):x for x in read(DATA/'ww-weapons.json')['weapons']}
# ID: signature weapon, scene template, region, individualized scene label.
selection={
'1402':(None,'jinhsi','금주','금주 · 바람이 머무는 누각'),
'1202':(None,'ww-1302','금주','금주 · 순찰의 밤'),
'1503':(None,'hsr-1303','금주','금주 · 식물의 온실'),
'1102':(None,'jinhsi','금주','금주 · 설월의 수호'),
'1601':(None,'jinhsi','금주','금주 · 천공의 누각'),
'1502':(None,'jinhsi','솔라리스','솔라리스 · 여정의 달빛'),
'1103':(None,'hsr-1303','금주','금주 · 생명을 연구하는 정원'),
'1203':(None,'ww-1505','검은 해안','검은 해안 · 동화의 정원'),
'1602':(None,'ww-1205','금주','금주 · 붉은 검의 길'),
'1405':(None,'jinhsi','금주','금주 · 도사의 운해'),
'1105':('21050026','jinhsi','금주','금주 · 산수화의 달빛'),
'1504':(None,'jinhsi','금주','금주 · 배송길의 금빛 하늘'),
'1106':(None,'jinhsi','금주','금주 · 옛 보물의 정원'),
'1606':('21040026','ww-1409','라군나','라군나 · 극단의 바람'),
'1506':('21050046','ww-1409','라군나','라군나 · 신앙의 빛'),
'1407':('21030026','gi-10000091','라군나','라군나 · 음악가의 황금 무대'),
'1507':('21040036','ww-1107','라군나','라군나 · 미술관의 밤'),
'1207':('21010036','ww-1205','일곱 언덕','일곱 언덕 · 투사의 불꽃'),
'1608':('21050066','ww-1607','리나시타','리나시타 · 레퀴엠의 밤'),
'1306':('21010046','jinhsi','일곱 언덕','일곱 언덕 · 정복자의 태양'),
'1410':('21040046','ww-1409','일곱 언덕','일곱 언덕 · 달의 신탁'),
'1307':(None,'ww-1302','금주','금주 · 안개 속 흔적'),
'1208':('21030036','ww-1607','리나시타','리나시타 · 악몽의 경계'),
'1508':('21010056','hsr-1005','로야','로야 · 비 내리는 거리')}
standard={1:'21010015',2:'21020015',3:'21030015',4:'21040015',5:'21050015'}
def fetch(url):
 for attempt in range(4):
  try:
   return urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=45).read()
  except Exception:
   if attempt==3:raise
   time.sleep(attempt+1)
def save(url,path,size,alpha=False):
 im=Image.open(io.BytesIO(fetch(url))).convert('RGBA')
 if alpha:assert im.getchannel('A').getextrema()[0]==0,(path,'opaque')
 im.thumbnail(size,Image.Resampling.LANCZOS);im.save(path,'WEBP',quality=92,method=5)
def run(item):
 key,(sig,template,region,label)=item;cid='ww-'+key;d=read(DATA/'ww-details'/f'{key}.json');c=lookup[cid].copy();base=scenes[template]
 c.update(official=True,popular=True,mascot=False,special=key=='1502',artMode='cutout',art='official/'+cid+'.webp',thumb='official/'+cid+'-thumb.webp',region=region,assetVersion='expanded5',view={'zoom':116,'x':0,'y':-5},scene=base['scene'],sceneLabel=label,sceneDescription=base['sceneDescription'],theme=base['theme'])
 if region=='일곱 언덕':
  c.update(scene='backgrounds/ww-septimont.webp',sceneDescription='황금빛 원형 경기장과 대리석 신전, 일곱 언덕의 투쟁과 신탁을 담은 무대.')
 elif key=='1508':
  c.update(scene='backgrounds/ww-modern.webp',sceneDescription='비에 젖은 도심과 어두운 창문, 로야의 낯선 밤을 연상시키는 거리.')
 elif key=='1407':
  c['sceneDescription']='라군나의 음악을 떠올리는 금빛 건축과 꽃 장식, 고요한 공연의 무대.'
 elif key=='1503':
  c['sceneDescription']='식물과 생명의 빛이 가득한 초록빛 연구 온실.'
 w=weapons[sig or standard[d['WeaponType']]];c['signature']={'name':w['Name'],'image':'weapons/'+cid+'.webp','type':'전용무기' if sig else '추천 무기'}
 save(d['FormationRoleCard'],OUT/c['art'],(1700,1700),True);save(d['RoleHeadIconCircle'],OUT/c['thumb'],(180,180));save(w['Icon'],OUT/c['signature']['image'],(600,800))
 print(c['name'],w['Name'],flush=True);return c
if __name__=='__main__':
 with concurrent.futures.ThreadPoolExecutor(max_workers=5) as p:added=list(p.map(run,selection.items()))
 result=existing+added;assert len(result)==32
 (DATA/'expanded-wuwa.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print('COMPLETE',len(result))
