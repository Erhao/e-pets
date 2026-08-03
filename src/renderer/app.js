const dog = document.querySelector('#dog-wrap');
const head = document.querySelector('#head');
const messages = document.querySelector('#messages');
const menu = document.querySelector('#pet-menu');
let state, cursor = { x: innerWidth / 2, y: innerHeight / 2 }, watching = false, nextWatchAt = 0;

const random = (min, max) => min + Math.random() * (max - min);
function layout() {
  if (!state) return;
  const { position, scale } = state.config.pet;
  dog.style.transform = `scale(${scale})`;
  dog.style.bottom = `${position.bottom}px`;
  dog.style[position.edge === 'left' ? 'left' : 'right'] = `${position.side}px`;
  const rect = dog.getBoundingClientRect();
  messages.style.right = position.edge === 'left' ? 'auto' : `${innerWidth - rect.left + 5}px`;
  messages.style.left = position.edge === 'left' ? `${rect.right + 5}px` : 'auto';
  messages.style.bottom = `${Math.max(12, innerHeight - rect.bottom + 72)}px`;
}

function renderMessages() {
  const visible = state.messages.slice(-state.config.messages.maxVisible).reverse();
  messages.innerHTML = visible.map((item) => `<article class="message interactive ${item.priority}" data-id="${item.id}">${item.title ? `<div class="message-title">${escapeHtml(item.title)}</div>` : ''}<div class="message-text">${escapeHtml(item.text)}</div><div class="message-meta">${escapeHtml(item.source || state.config.pet.name)} · ${new Date(item.createdAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div><button class="ack">我知道了</button></article>`).join('');
}
function escapeHtml(value) { const el = document.createElement('div'); el.textContent = value; return el.innerHTML; }

function lookAt(point, strength = 1) {
  const rect = head.getBoundingClientRect();
  const dx = Math.max(-1, Math.min(1, (point.x - (rect.left + rect.width/2)) / 350));
  const dy = Math.max(-1, Math.min(1, (point.y - (rect.top + rect.height/2)) / 280));
  head.style.transform = `rotate(${dx * 8 * strength}deg) translate(${dx * 3 * strength}px,${dy * 3 * strength}px)`;
  document.querySelectorAll('.eye i').forEach((eye) => eye.style.transform = `translate(${dx * 4 * strength}px,${dy * 3 * strength}px)`);
}
function stopWatching() { watching = false; lookAt({x:innerWidth/2,y:innerHeight/2},0); const a=state.config.pet.attention; nextWatchAt=Date.now()+random(a.cooldownMinMs,a.cooldownMaxMs); }
function attentionTick() {
  if (!state || watching || Date.now() < nextWatchAt) return;
  if (Math.random() < state.config.pet.attention.lookChancePerSecond / 4) {
    watching = true; dog.classList.add('idle-tilt');
    const a=state.config.pet.attention; setTimeout(() => { dog.classList.remove('idle-tilt'); stopWatching(); }, random(a.lookDurationMinMs,a.lookDurationMaxMs));
  }
}
function blink() { if (!state) return; head.classList.add('blink'); setTimeout(()=>head.classList.remove('blink'),120); const i=state.config.pet.idle; setTimeout(blink,random(i.blinkIntervalMinMs,i.blinkIntervalMaxMs)); }
function idleMotion() { if (!state || watching) return setTimeout(idleMotion,1000); lookAt({x:random(0,innerWidth),y:random(innerHeight*.25,innerHeight)},.45); const i=state.config.pet.idle; setTimeout(()=>lookAt({x:innerWidth/2,y:innerHeight/2},0),random(900,1800)); setTimeout(idleMotion,random(i.wanderIntervalMinMs,i.wanderIntervalMaxMs)); }

window.desktopDog.onState((next) => { state=next; layout(); renderMessages(); if (!nextWatchAt) { nextWatchAt=Date.now()+2000; setTimeout(blink,1000); setTimeout(idleMotion,2500); } });
window.desktopDog.onCursor((point) => { cursor=point; if(watching) lookAt(cursor); });
document.addEventListener('mouseover',(e)=>{ if(e.target.closest('.interactive')) window.desktopDog.setInteractive(true); });
document.addEventListener('mouseout',(e)=>{ if(!e.relatedTarget?.closest?.('.interactive')) window.desktopDog.setInteractive(false); });
messages.addEventListener('click',async(e)=>{const button=e.target.closest('.ack');if(button){button.disabled=true;await window.desktopDog.acknowledge(button.closest('.message').dataset.id);}});
dog.addEventListener('dblclick',()=>{dog.classList.remove('petted');void dog.offsetWidth;dog.classList.add('petted','excited');head.classList.add('happy');setTimeout(()=>{dog.classList.remove('excited');head.classList.remove('happy')},1800)});
dog.addEventListener('contextmenu',(e)=>{e.preventDefault();menu.style.left=`${Math.min(e.clientX,innerWidth-155)}px`;menu.style.top=`${Math.min(e.clientY,innerHeight-95)}px`;menu.classList.remove('hidden')});
document.querySelector('#config').onclick=()=>window.desktopDog.openConfig();document.querySelector('#quit').onclick=()=>window.desktopDog.quit();
document.addEventListener('click',(e)=>{if(!e.target.closest('#pet-menu')&&!e.target.closest('#dog-wrap'))menu.classList.add('hidden')});
addEventListener('resize',layout); setInterval(attentionTick,250); window.desktopDog.ready();
