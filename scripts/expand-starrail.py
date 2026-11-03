"""Expand the female HSR collection using official transparent portraits and signature cones."""
import json,subprocess,urllib.request,io,time,concurrent.futures
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];DATA=Path('/workspace/catalog-data')
old=json.loads(subprocess.check_output(['git','show','2a480fb:dist/catalog.js'],cwd=ROOT,text=True).split('=',1)[1].strip().rstrip(';'));old={x['id']:x for x in old}
chars=json.loads((DATA/'hsr-characters.json').read_text());cones=json.loads((DATA/'hsr-lightcones.json').read_text())
# Official signature light cone identifiers. No generic cone is labelled as a signature.
signatures={'1003':'23000','1006':'23007','1101':'23003','1102':'23001','1107':'23002','1112':'23016','1208':'23011','1211':'23013','1212':'23014','1217':'23017','1220':'23031','1221':'23030','1222':'23032','1225':'23035','1307':'23022','1314':'23028','1317':'23033','1402':'23036','1403':'23038','1406':'23043','1409':'23042','1410':'23047','1412':'23048','1413':'23049','1415':'23052','1321':'23050','1014':'23045'}
scenes={
 'express':('hsr-express','은하열차 · 별바다의 차창','은하가 비치는 열차 라운지와 따뜻한 실내 조명.','gold'),
 'belobog':('hsr-belobog','벨로보그 · 설원의 도시','눈 덮인 도시와 푸른 광석이 빛나는 야릴로의 풍경.','ocean'),
 'luofu':('hsr-luofu','선주 나부 · 별바다의 등불','옥빛 하늘과 공중 항구, 선주 건축과 등불이 이어지는 풍경.','forest'),
 'amphoreus':('hsr-amphoreus','엠포리어스 · 황금의 신전','고대 석주와 황금빛 실, 따뜻한 빛으로 가득한 신전.','gold'),
 'hunter':('hsr-1005','스텔라론 헌터 · 네온의 밤','스텔라론 헌터의 활동을 떠올리게 하는 보랏빛 미래 도시.','violet'),
 'penacony':('hsr-1309','페나코니 · 꿈의 무대','화려한 금빛 장식과 꿈속 도시의 무대.','gold'),
 'memory':('hsr-1407','기억 · 보랏빛 경계','기억과 꿈을 연상시키는 고대 기둥, 달빛과 보랏빛 나비.','violet'),
}
assign={**dict.fromkeys(['1101','1102','1107'],'belobog'),**dict.fromkeys(['1208','1211','1212','1217','1220','1221','1222','1225'],'luofu'),**dict.fromkeys(['1402','1403','1406','1409','1410','1412','1415'],'amphoreus'),'1003':'express','1006':'hunter','1112':'penacony','1307':'memory','1314':'penacony','1317':'penacony','1413':'memory','1321':'penacony','1014':'luofu'}
signatures.update(dict.fromkeys(['1001','1202','1013','1201','1210','1215','1206','1106','1105','1110','1207','1009','1103','1214','8002']))
assign.update({**dict.fromkeys(['1202','1201','1210','1215','1206','1207','1214'],'luofu'),**dict.fromkeys(['1106','1105','1110','1103'],'belobog'),**dict.fromkeys(['1001','8002'],'express'),'1013':'station','1009':'station'})
scenes['station']=('hsr-1401','헤르타 우주정거장 · 별의 관측실','우주를 향한 천문 장치와 빛나는 관측 서재.','violet')
BASE='https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/'
def fetch(url):
 for n in range(3):
  try:
   return urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=45).read()
  except Exception:
   if n==2:raise
   time.sleep(1)
def save(url,p,size,transparent=False):
 if p.exists():
  im=Image.open(p)
 else:
  im=Image.open(io.BytesIO(fetch(url))).convert('RGBA');im.thumbnail(size,Image.Resampling.LANCZOS);im.save(p,'WEBP',quality=93,method=5)
 if transparent:assert im.getchannel('A').getextrema()[0]==0,str(p)
def run(k):
 cid='hsr-'+k;c=old[cid].copy();cone=cones.get(signatures[k]);scene,label,desc,tone=scenes[assign[k]]
 c.update(special=False,mascot=False,popular=True,official=True,artMode='cutout',art='official/'+cid+'.webp',thumb='official/'+cid+'-thumb.webp',view={'zoom':103,'x':0,'y':130},assetVersion='expanded5',scene='backgrounds/'+scene+'.webp',sceneLabel=label,sceneDescription=desc,theme=tone,sourceArt=BASE+'image/character_preview/'+k+'.png')
 c['signature']={'name':cone['name'],'image':'weapons/'+cid+'.webp','type':'광추'} if cone else None
 save(c['sourceArt'],ROOT/'dist'/c['art'],(900,1200),True);save(BASE+chars[k]['icon'],ROOT/'dist'/c['thumb'],(180,180))
 if cone:save(BASE+cone['portrait'],ROOT/'dist'/c['signature']['image'],(600,800))
 print(c['name']+' → '+(cone['name'] if cone else 'no canonical signature'),flush=True);return c
if __name__=='__main__':
 with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:result=list(pool.map(run,signatures))
 (DATA/'expanded-starrail.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print('Added',len(result),'official female characters')
