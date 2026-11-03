import {CATALOG_DATA} from './catalog.js';
export const THEMES = {
 forest:{base:'#0b201c',mid:'#2d5b46',light:'#9cdb9b',foil:'#e2efcd',accent:'#c4ca93',label:'제이드 그린'},
 ocean:{base:'#06182c',mid:'#164569',light:'#64bcdf',foil:'#d6e8ee',accent:'#c4b58e',label:'사파이어 블루'},
 violet:{base:'#160d25',mid:'#492962',light:'#b48de6',foil:'#ecddf6',accent:'#d2b4cd',label:'로열 바이올렛'},
 rose:{base:'#2a131f',mid:'#713f57',light:'#ecb1bd',foil:'#f8e5df',accent:'#dfc0a1',label:'버건디 로즈'},
 gold:{base:'#181711',mid:'#51452c',light:'#e1bd74',foil:'#f3e4b6',accent:'#d3b36a',label:'샴페인 골드'}
};
export const FURINA_QUOTE='네 앞에 서 있는\n내가 바로\n폰타인의 슈퍼스타\n푸리나야.';
export const DEFAULT={game:'genshin',preset:'furina',name:'푸리나',region:'폰타인',element:'물',subtitle:'멈추지 않는 독무',quote:FURINA_QUOTE,theme:'ocean',level:'90',rank:'C2',weapon:'고요히 샘솟는 빛',refinement:'R1',stats:[{label:'체력',value:'38,450'},{label:'치명타 확률',value:'76.2%'},{label:'치명타 피해',value:'214.8%'},{label:'원소 충전 효율',value:'162.0%'}],zoom:125,offsetX:0,offsetY:-25,holo:28,effect:'holo',sparkle:true,ornament:true,showStats:true,owner:'여행자',serial:'0001',customArt:null};
export function preset(id){if(id==='furina')return structuredClone(DEFAULT);return {...structuredClone(DEFAULT),preset:'raiden',name:'라이덴 쇼군',region:'이나즈마',element:'번개',subtitle:'일심정토',quote:'',theme:'violet',rank:'C0',weapon:'예초의 번개',refinement:'R1',stats:[{label:'공격력',value:'2,145'},{label:'치명타 확률',value:'72.4%'},{label:'치명타 피해',value:'168.2%'},{label:'원소 충전 효율',value:'268.0%'}],zoom:125,offsetY:0,serial:'0002'};}
export function customPreset(game){return {...structuredClone(DEFAULT),game,preset:'custom',name:game==='wuwa'?'나의 공명자':'나의 학생',region:game==='wuwa'?'황룡':'키보토스',element:game==='wuwa'?'속성':'역할',subtitle:'나만의 이야기',quote:'',theme:game==='wuwa'?'violet':'ocean',level:game==='blue'?'90':'90',rank:game==='blue'?'★ 3':'0돌파',weapon:'',refinement:'',stats:game==='blue'?[{label:'공격력',value:'0'},{label:'최대 체력',value:'0'},{label:'방어력',value:'0'},{label:'치유력',value:'0'}]:[{label:'공격력',value:'0'},{label:'크리티컬',value:'0%'},{label:'크리티컬 피해',value:'0%'},{label:'공명 효율',value:'0%'}],zoom:100,offsetY:0};}
const limits={name:32,region:24,element:12,subtitle:30,quote:90,level:8,rank:8,weapon:32,refinement:12,owner:24,serial:12};
export function signatureForState(s){if(s.showWeapon===false)return null;const key=v=>String(v||'').replace(/[\s·•・]/g,'').toLowerCase();return CATALOG.map(c=>c.signature).find(w=>w&&key(w.name)===key(s.weapon))||null;}
export function normalize(raw){
 const char=CATALOG.find(c=>c.id===raw?.preset);if(!char)return {...characterPreset('furina'),holo:Math.min(100,Math.max(0,Number(raw?.holo??28))),owner:String(raw?.owner||'여행자').slice(0,24)};
 const v={...characterPreset(char.id),...raw,customArt:null,artMode:'cutout',signature:char.signature,assetVersion:char.assetVersion};
 if(raw.assetVersion!==char.assetVersion){const p=characterPreset(char.id);v.theme=char.theme;for(const k of ['zoom','offsetX','offsetY'])v[k]=p[k];if(!raw.weapon||raw.weapon.includes('입력'))v.weapon=p.weapon;if(char.id==='furina'&&String(raw.quote||'').replace(/\s/g,'')===FURINA_QUOTE.replace(/\s/g,''))v.quote=FURINA_QUOTE;v.showWeapon=true;}
 for(const [key,max] of Object.entries(limits))v[key]=String(v[key]??'').slice(0,max);if(!['holo','pearl','prism','starlight'].includes(v.effect))v.effect='holo';if(!THEMES[v.theme])v.theme=char.theme;v.game=char.game;
 for(const [key,min,max] of [['zoom',75,220],['offsetX',-400,400],['offsetY',-400,400],['holo',0,100]])v[key]=Math.min(max,Math.max(min,Number(v[key])||0));
 v.stats=Array.from({length:4},(_,i)=>({label:String(v.stats?.[i]?.label??DEFAULT.stats[i].label).slice(0,14),value:String(v.stats?.[i]?.value??'0').slice(0,16)}));for(const k of ['sparkle','ornament','showStats'])v[k]=!!v[k];v.showWeapon=v.showWeapon!==false;return v;
}
export const gameLabel=game=>({genshin:'원신',starrail:'붕괴: 스타레일',wuwa:'명조',blue:'블루 아카이브'})[game]||'캐릭터';
export function fileName(s){return (s.name||'내 캐릭터').replace(/[<>:"/\\|?*\x00-\x1f]/g,'').trim().slice(0,45)||'캐릭터';}
const CURATED=[
 {id:'furina',game:'genshin',name:'푸리나',region:'폰타인',element:'물',theme:'ocean',subtitle:'멈추지 않는 독무',motif:'water'},
 {id:'raiden',game:'genshin',name:'라이덴 쇼군',region:'이나즈마',element:'번개',theme:'violet',subtitle:'일심정토',motif:'lightning'},
 {id:'nahida',game:'genshin',name:'나히다',region:'수메르',element:'풀',theme:'forest',subtitle:'하얀 풀의 묵상',motif:'leaf'},
 {id:'hutao',game:'genshin',name:'호두',region:'리월',element:'불',theme:'rose',subtitle:'눈 그친 뒤의 매화향',motif:'petal'},
 {id:'jinhsi',game:'wuwa',name:'금희',region:'금주',element:'회절',theme:'gold',subtitle:'금주의 영윤',motif:'moon'},
 {id:'camellya',game:'wuwa',name:'카멜리아',region:'검은 해안',element:'인멸',theme:'rose',subtitle:'붉게 피어난 운명',motif:'petal'},
 {id:'aru',game:'blue',name:'아루',region:'게헨나 학원',element:'폭발',theme:'rose',subtitle:'흥신소 68',motif:'halo'},
 {id:'hina',game:'blue',name:'히나',region:'게헨나 학원',element:'폭발',theme:'violet',subtitle:'선도부',motif:'halo'}
];
const curatedMap=new Map(CURATED.map(c=>[c.id,c]));
export const CATALOG=[...CATALOG_DATA.map(c=>({...c,...(curatedMap.get(c.id)||{}),art:c.art,thumb:c.thumb,artMode:'cutout'}))];
export const GAME_INFO={genshin:{name:'원신',highest:5,level:'90',rank:'C0',refinement:'R1'},starrail:{name:'붕괴: 스타레일',highest:5,level:'80',rank:'E0',refinement:'S1'},wuwa:{name:'명조',highest:5,level:'90',rank:'0돌파',refinement:'1재련'},blue:{name:'블루 아카이브',highest:3,level:'90',rank:'★ 3',refinement:''}};
const EXAMPLE_STATS={
 genshin:[{label:'공격력',value:'2,000'},{label:'치명타 확률',value:'70.0%'},{label:'치명타 피해',value:'180.0%'},{label:'원소 충전 효율',value:'130.0%'}],
 starrail:[{label:'공격력',value:'3,000'},{label:'치명타 확률',value:'70.0%'},{label:'치명타 피해',value:'160.0%'},{label:'속도',value:'134'}],
 wuwa:[{label:'공격력',value:'2,200'},{label:'크리티컬',value:'70.0%'},{label:'크리티컬 피해',value:'250.0%'},{label:'공명 효율',value:'125.0%'}],
 blue:[{label:'공격력',value:'5,000'},{label:'최대 체력',value:'25,000'},{label:'방어력',value:'100'},{label:'치유력',value:'4,000'}]
};
export function characterPreset(id){
 const char=CATALOG.find(c=>c.id===id)||CATALOG.find(c=>c.id==='furina')||CATALOG[0],info=GAME_INFO[char.game];
 const s={...structuredClone(DEFAULT),...char,preset:char.id,quote:char.quote||'',level:info.level,rank:info.rank,refinement:info.refinement,weapon:'',stats:structuredClone(EXAMPLE_STATS[char.game]),zoom:char.artMode==='portrait'?110:125,offsetX:0,offsetY:char.artMode==='portrait'?10:-25,customArt:null};delete s.id;
 if(char.id==='furina'){s.quote=FURINA_QUOTE;s.weapon='고요히 샘솟는 빛';s.rank='C2';s.stats=structuredClone(DEFAULT.stats)}
 if(char.id==='raiden'){s.weapon='예초의 번개';s.stats=structuredClone(preset('raiden').stats)}
 if(char.id==='nahida'){s.weapon='떠오르는 천일 밤의 꿈';s.stats=[{label:'원소 마스터리',value:'840'},{label:'치명타 확률',value:'52.0%'},{label:'치명타 피해',value:'145.0%'},{label:'원소 충전 효율',value:'130.0%'}]}
 if(char.id==='hutao'){s.weapon='호마의 지팡이';s.rank='C1';s.stats=[{label:'체력',value:'32,000'},{label:'치명타 확률',value:'70.0%'},{label:'치명타 피해',value:'220.0%'},{label:'원소 마스터리',value:'180'}]}
 s.weapon=char.signature?.name||'';s.showWeapon=!!char.signature;if(!char.signature)s.refinement='';s.zoom=char.view.zoom;s.offsetX=char.view.x;s.offsetY=char.view.y;s.artMode='cutout';
 if(char.game==='blue')s.rank='★ '+(char.rarity||3);
 if(char.mascot){s.zoom=100;s.offsetY=70;s.showStats=false;s.weapon='';s.rank='';s.level=''}
 return s;
}
