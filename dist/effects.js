export const EFFECTS={holo:'홀로그램',pearl:'진주광',prism:'프리즘',starlight:'별빛'};
// Shared by the studio and its self-contained offline export.
export const EFFECT_CSS=`
.card[data-effect=pearl] .foil{background:conic-gradient(from var(--angle) at var(--px) var(--py),#fff1e4,#e0e5ff,#e2fff9,#ffe4f0,#fff1e4);background-size:160% 160%;mix-blend-mode:soft-light;opacity:calc(var(--power)*.75);mask-image:linear-gradient(120deg,#000a,#0004,#000a)}
.card[data-effect=pearl] .glare{background:radial-gradient(ellipse at var(--px) var(--py),#fff6e7aa,transparent 58%);opacity:calc(var(--power)*.7)}
.card[data-effect=prism] .foil{background:repeating-conic-gradient(from var(--angle) at var(--px) var(--py),#85fff955 0deg,#a0c5ff99 18deg,#ecabff66 36deg,#ffe4ab88 54deg,#85fff955 72deg);background-size:180% 180%;mix-blend-mode:screen;opacity:calc(var(--power)*.48);mask-image:linear-gradient(125deg,#0001,#000b 30%,#0002 55%,#000d 80%,#0001)}
.card[data-effect=starlight] .foil{background:radial-gradient(ellipse at var(--px) var(--py),#9ad5ff55,transparent 65%);opacity:calc(var(--power)*.55);mix-blend-mode:screen}
.card[data-effect=starlight] .sparkle{background-image:radial-gradient(ellipse at 18% 24%,#fff 0 1px,transparent 3px),radial-gradient(ellipse at 76% 17%,#fff6dc 0 1.5px,transparent 4px),radial-gradient(ellipse at 86% 61%,#c7f0ff 0 1px,transparent 3px),radial-gradient(ellipse at 24% 78%,#fff 0 1px,transparent 3px),radial-gradient(ellipse at 61% 45%,#fff 0 1px,transparent 3px);background-size:100% 100%;mask-image:none;mix-blend-mode:screen;opacity:calc(var(--power)*.9);animation:atelier-twinkle 5s ease-in-out infinite alternate}
@keyframes atelier-twinkle{from{filter:drop-shadow(0 0 2px #b0dfff);transform:translateY(0) scale(1)}to{filter:drop-shadow(0 0 7px #fff);transform:translateY(-5px) scale(1.015)}}
@media(prefers-reduced-motion:reduce){.card[data-effect=starlight] .sparkle{animation:none}}
`;
