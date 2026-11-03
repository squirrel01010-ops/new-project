export function createViewer(card,options={}){
 let rx=-3,ry=-7,tx=-3,ty=-7,auto=false,drag=null,last=0,frame;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function setAuto(value){auto=value;options.onAuto?.(auto)}
 function reset(){setAuto(false);tx=0;ty=Math.round(ty/360)*360}
 card.addEventListener('pointerdown',e=>{if(e.button!==0)return;setAuto(false);drag={x:e.clientX,y:e.clientY,tx,ty};card.setPointerCapture(e.pointerId);card.focus({preventScroll:true})});
 card.addEventListener('pointermove',e=>{if(!drag)return;ty=drag.ty+(e.clientX-drag.x)*.65;tx=Math.min(65,Math.max(-65,drag.tx-(e.clientY-drag.y)*.4))});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])card.addEventListener(event,()=>drag=null);
 card.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key))return;e.preventDefault();setAuto(false);if(e.key==='Home')reset();if(e.key==='ArrowLeft')ty-=12;if(e.key==='ArrowRight')ty+=12;if(e.key==='ArrowUp')tx=Math.max(-65,tx-8);if(e.key==='ArrowDown')tx=Math.min(65,tx+8)});
 function tick(time){const dt=Math.min((time-last)/1000,.05);last=time;if(auto&&!document.hidden)ty+=dt*23;const ease=reduced?1:1-Math.exp(-dt*12);rx+=(tx-rx)*ease;ry+=(ty-ry)*ease;card.style.transform=`rotateX(${rx}deg) rotateY(${ry}deg)`;card.style.setProperty('--px',(50+Math.sin(ry*Math.PI/180)*45)+'%');card.style.setProperty('--py',(45+Math.sin(rx*Math.PI/180)*45)+'%');card.style.setProperty('--angle',(125+ry*.7+rx)+'deg');frame=requestAnimationFrame(tick)}frame=requestAnimationFrame(tick);
 return {reset,flip(){setAuto(false);ty+=180},toggleAuto(){setAuto(!auto)},stop(){cancelAnimationFrame(frame)}};
}
