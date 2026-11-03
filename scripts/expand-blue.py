"""Import a broad popular-student roster and iconic outfits, using official game resources."""
import concurrent.futures, io, json, time, urllib.request
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DATA = Path('/workspace/catalog-data')
old = {c['name']: c for c in json.loads((DATA/'old-catalog.json').read_text()) if c['game']=='blue'}
students = json.loads((DATA/'ba-live.json').read_text())
current = json.loads((ROOT/'dist/catalog.js').read_text().split('=',1)[1].strip().rstrip(';'))
existing = {c['id'] for c in current}
names = '노아 리오 하나코 아코 이로하 히마리 토키 카린 네루 아카네 카요코 무츠키 하루카 이오리 하루나 후우카 아즈사 코하루 히후미 나기사 세이아 사쿠라코 우이 마리 이치카 카즈사 레이사 미네 세리나 하스미 아리스 모모이 미도리 유즈 코유키 히비키 마키 치히로 츠바키 이즈나 와카모 미모리 미치루 키쿄 유카리 나구사 슌 코코나 미나 레이죠 사오리 아츠코 미사키 히요리 미야코 미유 사키 모에 노노미 세리카 아야네 체리노 마리나 시구레 칸나'.split()
names += ['히나(드레스)','아코(드레스)','아루(드레스)','카요코(드레스)','하나코(수영복)','호시노(수영복)','시로코(수영복)','아스나(바니걸)','카린(바니걸)','토키(바니걸)','유우카(체육복)','노아(파자마)','시로코*테러']

def fetch(url):
    for i in range(3):
        try:
            return urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=40).read()
        except Exception:
            if i==2: raise
            time.sleep(i+1)

def save(url, path, size, transparent=False):
    im=Image.open(io.BytesIO(fetch(url))).convert('RGBA')
    if transparent: assert im.getchannel('A').getextrema()[0]==0, url
    im.thumbnail(size,Image.Resampling.LANCZOS)
    im.save(ROOT/'dist'/path,'WEBP',quality=91,method=5)

def scene_for(row,c):
    school=row['School'];club=row['Club']
    # Region and club, rather than arbitrary color, determine the environment.
    if school=='Millennium':
        return ('ba-16001' if club=='CleanNClearing' else 'ba-13010','밀레니엄 · '+('C&C의 티타임' if club=='CleanNClearing' else '학원 도시의 빛'))
    if school=='Gehenna':
        return ('aru' if club=='Kohshinjo68' else 'hina','게헨나 · '+('흥신소 68' if club=='Kohshinjo68' else '학원의 황혼'))
    if school=='Trinity': return ('ba-10059','트리니티 · 장미의 정원')
    if school=='Abydos': return ('ba-10005' if '호시노' in c['name'] else 'ba-10010','아비도스 · 사막의 학원')
    if school=='Hyakkiyako':return ('ba-hyakk','백귀야행 · 벚꽃의 밤')
    if school=='Shanhaijing':return ('ba-20039','산해경 · 연못의 달빛')
    if school=='Arius':return ('ba-arius','아리우스 · 폐허의 기억')
    if school=='SRT':return ('ba-srt','SRT · 공원의 푸른 시간')
    if school=='RedWinter':return ('hsr-belobog','붉은겨울 · 눈 내리는 학원')
    return ('ba-srt','키보토스 · 도시의 야경')

def run(name):
    if name not in old: print('Not in snapshot:',name,flush=True);return None
    c=old[name].copy()
    if c['id'] in existing:return None
    key=c['id'].removeprefix('ba-');row=students[key];cid=c['id']
    art='official/'+cid+'.webp';thumb='official/'+cid+'-thumb.webp';gear='weapons/'+cid+'.webp'
    save('https://schaledb.com/images/student/portrait/'+key+'.webp',art,(1500,1700),True)
    save('https://schaledb.com/images/student/collection/'+key+'.webp',thumb,(180,180))
    save('https://schaledb.com/images/weapon/'+row['WeaponImg']+'.webp',gear,(600,800))
    source,label=scene_for(row,c)
    c.update(art=art,thumb=thumb,artMode='cutout',official=True,popular=True,mascot=False,special=False,
             signature={'name':row['Weapon']['Name'],'image':gear,'type':'고유무기'},
             scene='backgrounds/'+source+'.webp',sceneLabel=label,
             sceneDescription=c['region']+'의 풍경과 소속을 바탕으로 구성한 장식 배경.',
             view={'zoom':118,'x':0,'y':60},assetVersion='expanded1')
    c['quote']=c.get('quote','').replace('\\n','\n')
    print(name,flush=True)
    return c

if __name__=='__main__':
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool: result=[c for c in pool.map(run,names) if c]
    (DATA/'expanded-blue.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
    print('Added',len(result),'students / outfits',flush=True)
