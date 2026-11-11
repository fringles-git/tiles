(function(){
'use strict';
const KEY='tiles:visitor-theme';
function rgb(hex){if(/^#[0-9a-f]{3}$/i.test(hex))hex='#'+hex.slice(1).split('').map(x=>x+x).join('');return /^#[0-9a-f]{6}$/i.test(hex)?[1,3,5].map(n=>parseInt(hex.slice(n,n+2),16)):null;}
function luminance(hex){const c=rgb(hex);if(!c)return null;const v=c.map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4});return .2126*v[0]+.7152*v[1]+.0722*v[2];}
function contrast(a,b){const x=luminance(a),y=luminance(b);return x===null||y===null?0:(Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
function ink(bg){return contrast(bg,'#FFFFFF')>=contrast(bg,'#000000')?'#FFFFFF':'#000000';}
function contact(p){const email=String(p.email||'').trim();if(/^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(email))return {href:'mailto:'+email+'?subject='+encodeURIComponent('Discutons de votre projet'),label:'Discutons de votre projet',track:'p-mail'};try{const u=new URL(p.booking);if(['https:','http:'].includes(u.protocol)&&!u.username&&!u.password)return {href:u.href,label:'Discutons de votre projet',track:'p-rdv'};}catch{}return null;}
function preference(storage){try{const v=storage.getItem(KEY);return ['light','dark'].includes(v)?v:'site';}catch{return 'site';}}
function apply(page,mode,accent,storage){const v=mode==='preview'?preference(storage):'site';if(v!=='site'){page.dataset.skin=v==='dark'?'graphite':'porcelain';document.documentElement.dataset.theme=v;}else delete document.documentElement.dataset.theme;const bg=rgb(accent)?accent:'#0B7A75';page.style.setProperty('--cta-bg',bg);page.style.setProperty('--cta-fg',ink(bg));return v;}
function bind({render,applyTheme}){document.addEventListener('click',e=>{const button=e.target.closest('[data-visitor-theme]');if(!button)return;let next;try{const value=preference(localStorage);next=value==='site'?'light':value==='light'?'dark':'site';if(next==='site')localStorage.removeItem(KEY);else localStorage.setItem(KEY,next);}catch{next='site';}render();});window.addEventListener('storage',e=>{if(e.key===KEY||e.key===null){applyTheme();render();}});}
window.TilesPolish={rgb,contrast,ink,contact,preference,apply,bind,KEY};
})();
