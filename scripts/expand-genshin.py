"""Expand female roster using official art and explicit signature equipment metadata.
Outputs a merge fragment; never prunes or modifies the live catalogue.
"""
import json,subprocess,urllib.request,io,concurrent.futures
from pathlib import Path
from PIL import Image,ImageOps
R=Path(__file__).resolve().parents[1];D=Path('/workspace/catalog-data')
old=json.loads(subprocess.check_output(['git','show','2a480fb:dist/catalog.js'],cwd=R,text=True).split('=',1)[1].strip().rstrip(';'));old={c['id']:c for c in old}
imgs=json.loads((D/'gi-character-images.json').read_text());weapons=json.loads((D/'gi-weapon-images.json').read_text())
# ID, source slug, signature slug (none means no unambiguous signature), lore scene.
rows=[
(2,'kamisatoayaka','mistsplitterreforged','raiden','이나즈마 · 백로의 달빛','달빛과 일본풍 건축으로 꾸민 야시로 봉행 아가씨의 무대.','ocean'),
(3,'jean',None,'mondstadt-knights','몬드 · 민들레 기사','바람과 민들레가 흐르는 페보니우스 기사단의 발코니.','gold'),
(37,'ganyu','amosbow','jinhsi','리월 · 선인의 달빛','구름과 달빛, 고전적인 궁전 장식으로 표현한 리월 선인의 정취.','ocean'),
(41,'mona',None,'mona-astrology','몬드 · 별의 운명','천문 도구와 물거울에 비친 별빛이 가득한 점성술의 서재.','violet'),
(42,'keqing',None,'gi-10000060','리월 · 옥형의 야경','리월항의 야경을 배경으로 옥형성의 도시를 담은 무대.','violet'),
(49,'yoimiya','thunderingpulse','hutao','이나즈마 · 나가노하라의 밤','홍등과 불꽃의 색채로 표현한 나가노하라 폭죽가게의 축제 분위기.','rose'),
(51,'eula','songofbrokenpines','mondstadt-knights','몬드 · 파도의 기사','기사단의 고전적인 건축과 차가운 달빛이 어우러진 무대.','ocean'),
(54,'sangonomiyakokomi','everlastingmoonglow','kokomi-watatsumi','와타츠미 · 산호궁의 꿈','산호와 진주, 분홍빛 바다에 떠오른 와타츠미의 신전.','ocean'),
(63,'shenhe','calamityqueller','jinhsi','리월 · 고독한 선산','달빛과 흰 구름, 선인의 궁전을 연상시키는 고요한 풍경.','ocean'),
(70,'nilou','keyofkhajnisut','nahida','수메르 · 연꽃의 무대','수메르의 푸른 정원과 화려한 아치로 꾸민 춤의 무대.','forest'),
(79,'dehya','beaconofthereedsea','natlan-desert','수메르 · 사막의 용병','뜨거운 사막과 금빛 모래, 붉은 석양을 담은 용병의 무대.','rose'),
(93,'xianyun','cranesechoingcall','jinhsi','리월 · 구름 속 한운','구름 위 궁전과 금빛 장식이 어우러지는 선인의 하늘.','forest'),
(94,'chiori','urakumisugiri','gi-10000091','폰타인 · 치오리 부티크','장미와 정교한 금속 장식으로 표현한 폰타인의 우아한 패션 감성.','gold'),
(95,'sigewinne','silvershowerheartstrings','furina','폰타인 · 물빛 휴식','푸른 물결과 장미, 포근한 빛으로 표현한 멜뤼진 간호사의 물빛 무대.','ocean'),
(98,'clorinde','absolution','gi-10000096','폰타인 · 결투의 장막','고딕 아치와 짙은 붉은 장막으로 꾸민 결투 대리인의 무대.','violet'),
(99,'emilie','lumidouceelegy','hsr-1303','폰타인 · 향기의 온실','유리 온실과 초록빛 식물, 빛나는 꽃으로 표현한 조향사의 정원.','forest'),
(102,'mualani','surfsup','natlan-coast','나타 · 샘물 무리의 파도','열대 해안과 수정빛 파도가 넘실대는 샘물 무리의 풍경.','ocean'),
(103,'xilonen','peakpatrolsong','natlan-forge','나타 · 메아리의 장인','금빛 광석과 기하학 무늬, 장인의 불꽃이 어우러진 나타의 공방.','gold'),
(104,'chasca','astralvulturescrimsonplumage','natlan-sky','나타 · 꽃깃회의 하늘','높은 절벽과 거친 바람, 깃털과 노을이 만나는 하늘.','rose'),
(106,'mavuika','athousandblazingsuns','natlan-flame','나타 · 타오르는 태양','화산과 불꽃, 금빛 태양이 비추는 불의 신의 무대.','rose'),
(107,'citlali','starcallerswatch','natlan-stars','나타 · 별을 부르는 밤','보랏빛 밤과 고대의 문양, 별의 빛이 흐르는 신비한 무대.','violet'),
(109,'yumemizukimizuki','sunnymorningsleepin','gi-10000058','이나즈마 · 꿈의 벚꽃','벚꽃과 달빛이 어우러진 몽환적인 이나즈마의 풍경.','rose'),
(111,'varesa','vividnotions','natlan-sky','나타 · 비옥한 대지','높은 절벽과 따뜻한 하늘빛으로 표현한 풍요로운 나타의 대지.','rose'),
(112,'escoffier','symphonistofscents','gi-10000091','폰타인 · 향미의 연주','우아한 금빛 장식과 장미로 표현한 폰타인 미식의 무대.','ocean'),
(114,'skirk','azurelight','skirk-abyss','심연 · 별을 가르는 검','얼음처럼 빛나는 균열과 끝없는 우주가 펼쳐지는 심연.','ocean'),
(116,'ineffa','fracturedhalo','nodkrai-machine','노드크라이 · 기계의 심장','차가운 달빛 아래 정교한 기계 장치와 푸른 빛이 흐르는 작업실.','gold'),
(119,'lauma','nightweaverslookingglass','nodkrai-forest','노드크라이 · 달의 숲','달빛이 비치는 고대 숲과 흰 꽃, 은빛 나뭇가지가 펼쳐지는 정원.','forest'),
(122,'nefer','reliquaryoftruth','nodkrai-nefer','노드크라이 · 비밀의 장막','에메랄드빛 보석과 금빛 장막, 비밀을 품은 밤의 정보상 무대.','forest')]
rows += [
(31,'fischl',None,'gi-astrology','몬드 · 황녀의 별밤','보랏빛 별과 천문 장식으로 표현한 단죄의 황녀의 몽환적인 무대.','violet'),
(6,'lisa',None,'gi-mondstadt','몬드 · 도서관의 마녀','몬드의 고전적인 건축과 은은한 빛으로 꾸민 마녀의 휴식.','violet'),
(14,'barbara',None,'gi-mondstadt','몬드 · 바람의 노래','따스한 햇살과 고전적인 몬드 건축이 어우러진 기도의 무대.','ocean'),
(27,'ningguang',None,'jinhsi','리월 · 천권의 궁전','금빛 장식과 구름 위 궁전으로 표현한 천권성의 우아함.','gold'),
(24,'beidou',None,'gi-10000060','리월 · 남십자의 밤','리월항의 푸른 야경을 배경으로 표현한 남십자 함대의 항해.','rose'),
(45,'rosaria',None,'gi-mondstadt','몬드 · 어둠 속의 기도','고전적인 몬드 건축과 차가운 빛이 어우러진 조용한 무대.','rose'),
(74,'layla',None,'gi-astrology','수메르 · 잠든 별의 기록','별과 천문 도구, 몽환적인 밤빛으로 표현한 명론파 학도의 꿈.','ocean'),
(61,'kirara',None,'gi-10000058','이나즈마 · 벚꽃길 배달','벚꽃이 흐드러진 이나즈마 풍경을 지나가는 배달원의 여정.','forest'),
(65,'kukishinobu',None,'raiden','이나즈마 · 고요한 번개','이나즈마의 달빛과 번개로 꾸민 아라타키파 조력자의 무대.','violet'),
(34,'noelle',None,'gi-mondstadt','몬드 · 기사로 향하는 길','몬드의 우아한 건축과 밝은 빛으로 표현한 예비 기사의 꿈.','gold'),
(43,'sucrose',None,'hsr-1303','몬드 · 생명의 연금술','유리 온실과 초록빛 식물로 표현한 생물 연금술사의 연구 정원.','forest'),
(48,'yanfei',None,'gi-10000060','리월 · 계약의 도시','밤빛이 내려앉은 리월항을 배경으로 표현한 법률 자문의 도시.','rose'),
(83,'lynette',None,'furina','폰타인 · 막 뒤의 고양이','화려한 커튼과 물빛 무대로 표현한 마술 조수의 신비로운 밤.','ocean'),
(88,'charlotte',None,'gi-10000091','폰타인 · 진실의 한 장','금빛 장식과 장미가 어우러진 폰타인 도시의 취재 풍경.','rose')]
scene_remap={'mondstadt-knights':'gi-mondstadt','mona-astrology':'gi-astrology','kokomi-watatsumi':'gi-watatsumi','natlan-coast':'gi-natlan','natlan-forge':'gi-natlan','natlan-sky':'gi-natlan','natlan-flame':'gi-natlan','natlan-stars':'gi-natlan','skirk-abyss':'gi-abyss','nodkrai-machine':'gi-nodkrai','nodkrai-forest':'gi-nodkrai','nodkrai-nefer':'gi-nodkrai'}
rows=[tuple(list(row[:3])+[scene_remap.get(row[3],row[3])]+list(row[4:])) for row in rows]
rows=[(row[:3]+('gi-10000058',)+row[4:]) if row[0]==49 else row for row in rows]

def fetch(url):
 req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'})
 with urllib.request.urlopen(req,timeout=45) as r:return r.read()
def write_im(raw,path,size,crop=False):
 im=ImageOps.exif_transpose(Image.open(io.BytesIO(raw))).convert('RGBA')
 if crop:im=im.crop(im.getchannel('A').getbbox())
 im.thumbnail(size,Image.Resampling.LANCZOS);im.save(path,'WEBP',quality=92,method=5);return im
cache=D/'gi-weapon-meta';cache.mkdir(exist_ok=True)
def run(row):
 num,slug,gear,scene,label,desc,tone=row;cid=f'gi-{10000000+num}';c=old[cid].copy();meta=imgs[slug]
 art=R/'dist/official'/f'{cid}.webp';thumb=R/'dist/official'/f'{cid}-thumb.webp'
 clean=False
 if not art.exists():
  for key in ['cover1','cover2']:
   if meta.get(key):
    try:
     raw=fetch(meta[key]);im=Image.open(io.BytesIO(raw)).convert('RGBA')
     if im.getchannel('A').getextrema()[0]!=0:continue
     write_im(raw,art,(1700,1700),True);clean=True;c['sourceArt']=meta[key];break
    except Exception as e:print('cover fallback',cid,type(e).__name__,flush=True)
  if not art.exists():
   raw=subprocess.check_output(['git','show','2a480fb:dist/'+c['art']],cwd=R);im=write_im(raw,art,(1700,1700));assert im.getchannel('A').getextrema()[0]==0;c['sourceArt']='official game splash via Enka'
 else:clean=bool(meta.get('cover1'))
 if not thumb.exists():thumb.write_bytes(subprocess.check_output(['git','show','2a480fb:dist/'+c['thumb']],cwd=R))
 signature=None
 if gear:
  wp=cache/(gear+'.json')
  if not wp.exists():wp.write_bytes(fetch('https://raw.githubusercontent.com/theBowja/genshin-db/main/src/data/Korean/weapons/'+gear+'.json'))
  wm=json.loads(wp.read_text());target=R/'dist/weapons'/f'{cid}.webp'
  if not target.exists():
   urls=[weapons[gear].get('mihoyo_icon'),'https://enka.network/ui/'+weapons[gear]['filename_icon']+'.png']
   for url in urls:
    if not url:continue
    try:write_im(fetch(url),target,(600,800));break
    except Exception as e:print('gear fallback',gear,type(e).__name__,flush=True)
   if not target.exists():raise RuntimeError('Missing gear '+gear)
  signature={'name':wm['name'],'image':f'weapons/{cid}.webp','type':'전용무기'}
 c.update(art=f'official/{cid}.webp',thumb=f'official/{cid}-thumb.webp',official=True,popular=True,artMode='cutout',signature=signature,scene=f'backgrounds/{scene}.webp',sceneLabel=label,sceneDescription=desc,region=label.split(' · ')[0],subtitle=label.split(' · ')[1],theme=tone,view={'zoom':100 if clean else 115,'x':0,'y':155 if clean else 0},assetVersion='expanded5')
 print(c['name'],signature and signature['name'],flush=True);return c
if __name__=='__main__':
 with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:result=list(pool.map(run,rows))
 (D/'expanded-genshin.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print('GI added',len(result))
