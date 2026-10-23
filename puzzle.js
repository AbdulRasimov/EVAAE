import {shuffled, solved, swap} from './engine.js';
import {isLater,renderLater} from './later.js';
const app=window.aether, root=document.getElementById('puzzleView');
const demo=!app.tg?.initData;
const photoRatios=[960/1200,369/656,873/755];
let state=null, selected=null, busy=false, online=false, notice='', lastIdentity='';
let demoState;
try{demoState=JSON.parse(localStorage.getItem('aether-puzzle-demo-v1'))}catch{}
if(!demoState||!Array.isArray(demoState.puzzles)||demoState.puzzles.length!==3||demoState.puzzles.some(p=>!Array.isArray(p.tiles)||p.tiles.length!==9||[...p.tiles].sort().join()!=='0,1,2,3,4,5,6,7,8')) demoState={phase:'photos',board:0,photo:0,photosDone:false,puzzles:Array.from({length:3},()=>({tiles:shuffled(),moves:0,revision:0,restored:false}))};
function current(){return state?.puzzles?.[Math.min(2,state.photo||0)]}
function render(){
 if(state&&isLater(state.phase)){renderLater(root,state,app);return}
 const p=current(), n=Math.min(2,state?.photo||0);
 root.innerHTML=`<p class="puzzle-eyebrow">РЕЗЕРВ-365 / СЛЕДЫ ПРОШЛОГО</p><h2 class="puzzle-heading">Восстановление памяти</h2><p class="puzzle-sub">Три снимка. Один утраченный фрагмент истории.</p>${demo?'<p class="puzzle-demo">Нет данных для синхронизации. Отправь боту /app и открой приложение кнопкой в его новом сообщении. Здесь доступен только предпросмотр.</p>':''}`;
 if(!state){root.insertAdjacentHTML('beforeend','<div class="puzzle-lock">Загружаю текущее задание…<div class="puzzle-actions"><button class="puzzle-button" id="retrySync">Повторить загрузку</button></div></div>');document.getElementById('retrySync').onclick=()=>app.sync();return}
 if(!['photos','afterphotos'].includes(state.phase)||!p){root.insertAdjacentHTML('beforeend','<div class="puzzle-lock">Архив ещё закрыт. Восстанови инструкцию РЕЗЕРВ-365 в чате E.V.A., затем нажми «Открыть архив „Следы прошлого“».</div>');return}
 const allDone=state.phase==='afterphotos';
 root.insertAdjacentHTML('beforeend',`<div class="puzzle-steps" aria-label="Восстановлено ${state.puzzles.filter(x=>x.restored).length} из 3">${state.puzzles.map(x=>`<span class="puzzle-step ${x.restored?'done':''}"></span>`).join('')}</div><section class="puzzle-card"><div class="puzzle-meta"><span>ФОТОГРАФИЯ ${n+1} / 3</span><span>${p.restored?'<span class="puzzle-badge">ВОССТАНОВЛЕНА</span>':`ПЕРЕСТАНОВОК: ${p.moves}`}</span></div><div id="photoBoard"></div><p class="puzzle-notice" id="puzzleNotice" role="status" aria-live="polite"></p><div class="puzzle-actions" id="puzzleActions"></div></section>`);
 const board=document.getElementById('photoBoard'), actions=document.getElementById('puzzleActions');
 if(p.restored){board.innerHTML=`<div class="restored-photo"><img class="puzzle-complete" src="assets/memory-${n+1}.jpg" alt="Восстановленная фотография ${n+1}"><div class="restored-hearts" aria-hidden="true"><span>♡</span><span>♥</span><span>♡</span><span>♥</span><span>♡</span><span>♥</span></div></div>`;
 notice='Воспоминание сохранено ♡\n'+(allDone?'Все три снимка восстановлены, места съёмки установлены. Продолжай расследование с E.V.A.':demo?'В Telegram на этом этапе бот спросит место съёмки.':state.puzzleDeliveryPending?'E.V.A. повторит отправку вопроса автоматически.':'Вернись в чат E.V.A. и укажи место съёмки — затем откроется следующий файл.');
 if(demo&&!allDone){const next=document.createElement('button');next.className='puzzle-button primary';next.textContent=n===2?'Завершить просмотр':'Следующий снимок';next.onclick=()=>{if(n===2)demoState.phase='afterphotos';else demoState.photo++;saveDemo();update(demoState)};actions.append(next)}
 }else{
 board.className='puzzle-grid';board.style.aspectRatio=String(photoRatios[n]);board.style.width=`min(100%, calc(58dvh * ${photoRatios[n]}))`;board.style.margin='0 auto';board.setAttribute('aria-label','Фотография из девяти фрагментов');
 p.tiles.forEach((tile,i)=>{const button=document.createElement('button');button.className='puzzle-tile'+(selected===i?' selected':'');button.style.backgroundImage=`url("assets/memory-${n+1}.jpg")`;button.style.backgroundPosition=`${tile%3*50}% ${Math.floor(tile/3)*50}%`;button.setAttribute('aria-label',`Ячейка ${i+1}, фрагмент ${tile+1}`);button.setAttribute('aria-pressed',String(selected===i));button.disabled=busy||(!demo&&!online);button.onclick=()=>choose(i);board.append(button)});
 const clear=document.createElement('button');clear.className='puzzle-button';clear.textContent='Снять выделение';clear.disabled=selected===null||busy;clear.onclick=()=>{selected=null;notice='';render()};actions.append(clear);
 if(!notice)notice='Коснись двух фрагментов, чтобы поменять их местами. Собери цельное изображение.';
 }
 if(!demo){const retry=document.createElement('button');retry.className='puzzle-button';retry.textContent='Обновить связь';retry.disabled=busy;retry.onclick=()=>app.sync();actions.append(retry)}
 document.getElementById('puzzleNotice').textContent=notice;
 if(demo&&allDone){const reset=document.createElement('button');reset.className='puzzle-button';reset.textContent='Начать предпросмотр заново';reset.onclick=()=>{demoState={phase:'photos',board:0,photo:0,photosDone:false,puzzles:Array.from({length:3},()=>({tiles:shuffled(),moves:0,revision:0,restored:false}))};saveDemo();update(demoState)};actions.append(reset)}
}
function saveDemo(){try{localStorage.setItem('aether-puzzle-demo-v1',JSON.stringify(demoState))}catch{}}
function update(next){
 if(busy)return;
 const identity=JSON.stringify([next.phase,next.photo,next.puzzles?.map(p=>[p.revision,p.restored]),next.puzzleDeliveryPending,next.adminStep,next.adminErrors,next.keyErrors,next.processingStarted]);
 state=next;online=true;
 if(identity===lastIdentity){return}lastIdentity=identity;selected=null;notice='';render();
}
async function choose(index){
 if(busy)return;
 if(selected===null){selected=index;notice='Теперь выбери второй фрагмент.';render();return}
 if(selected===index){selected=null;notice='';render();return}
 const a=selected,b=index,p=current(),photo=state.photo;
 selected=null;
 if(demo){p.tiles=swap(p.tiles,a,b);p.moves++;p.revision++;p.restored=solved(p.tiles);notice='';saveDemo();render();return}
 busy=true;notice='Сохраняю перестановку…';render();
 try{
 const response=await fetch(app.apiBase+'/api/puzzle',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({initData:app.tg.initData,photo,revision:p.revision,a,b}),signal:AbortSignal.timeout(15000)});
 const data=await response.json();busy=false;
 if(response.status===409&&data.state){app.applyState(data.state);notice='Состояние изменилось в другом окне. Загружен актуальный снимок.';render();return}
 if(!response.ok)throw Error(data.error||'Не удалось сохранить ход');
 notice='';app.applyState(data);render();
 try{app.tg.HapticFeedback?.notificationOccurred(current()?.restored?'success':'warning')}catch{}
 }catch(error){busy=false;online=false;notice=error.name==='TimeoutError'?'Ответ задержался. Обнови связь: ход мог сохраниться.':error.message;render()}
}
window.aetherPuzzle={update,get busy(){return busy},connectionLost(){online=false;lastIdentity='';notice='Нет связи с E.V.A. Нажми «Обновить связь», чтобы продолжить.';render()}};
if(demo){document.getElementById('connection').textContent='ПРЕДПРОСМОТР · БЕЗ БОТА';update(demoState)}else {render();app.sync();setInterval(()=>{if(!document.hidden)app.sync()},12000);window.addEventListener('online',()=>app.sync());app.tg?.onEvent?.('activated',()=>app.sync())}
