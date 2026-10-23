// The later puzzles use the same signed Telegram session as the photo puzzle.
const SYMBOLS=['◆','○','△','◇'];
let chosen=[],acting=false,audioUrl='',timer=null;
const phases=new Set(['adminPuzzle','doctorReveal','doctorReaction','keyPuzzle','processing','audioReady','audioPlayed','finalSearch','finalReady','finalReveal','awaitReunion','reunionOffer','storyComplete']);
export function isLater(phase){return phases.has(phase)}
export function renderLater(root,state,app){
 if(timer){clearTimeout(timer);timer=null}
 root.innerHTML='<p class="puzzle-eyebrow">A.E.T.H.E.R. / ЗАСЕКРЕЧЕННЫЕ МАТЕРИАЛЫ</p><h2 class="puzzle-heading">Головоломка</h2><div id="laterContent"></div>';
 const box=root.querySelector('#laterContent');
 if(state.phase==='adminPuzzle'){
  box.innerHTML='<p class="puzzle-sub">Сравни список действующих файлов с резервным реестром. Найди запись, которой нет в официальном списке, затем найди её след в журнале.</p><section class="puzzle-card"><h3>Официальный реестр</h3><p>РЕЗЕРВ-365 · A365-R/16<br>СЛЕДЫ ПРОШЛОГО · A365-R/18<br>ОБЩИЕ ВОСПОМИНАНИЯ · A365-R/19</p><h3>Резервная копия E.V.A.</h3><p>A365-R/16 · A365-R/17 · A365-R/18 · A365-R/19</p><div id="adminOptions"></div><p class="puzzle-notice" id="laterNotice"></p></section>';
  const options=state.adminStep===0?['A365-R/16','A365-R/17','A365-R/18','A365-R/19']:['EV-LOG/07','EV-LOG/08','EV-LOG/09','EV-LOG/10'];
  if(state.adminStep===1)box.querySelector('#adminOptions').insertAdjacentHTML('beforebegin','<h3>Журнал доступа к A365-R/17</h3><p>Одна из строк относится к скрытому каталогу. Сопоставь идентификатор файла и резервный журнал E.V.A.</p>');
  options.forEach(o=>button(box.querySelector('#adminOptions'),o,()=>act('admin',o,state,app,root)));
  if(state.adminErrors>=3)box.querySelector('#laterNotice').textContent=state.adminStep===0?'Подсказка: ищи номер между 16 и 18.':'Подсказка: нужная строка журнала заканчивается на 09.';
 }else if(state.phase==='doctorReveal'||state.phase==='doctorReaction'){
  box.innerHTML='<div class="puzzle-lock">'+(state.phase==='doctorReveal'?'Скрытый каталог восстановлен. Открой запись в чате E.V.A.':'E.V.A. анализирует разговор сотрудников. Продолжение появится в чате.')+'</div>';
 }else if(state.phase==='keyPuzzle'){
  box.innerHTML='<p class="puzzle-sub">Символы на заголовках архивов образуют ключ. Расположи их в порядке обнаружения материалов.</p><section class="puzzle-card"><p>РЕЗЕРВ-365 <b>◆</b><br>СЛЕДЫ ПРОШЛОГО <b>○</b><br>ОБЩИЕ ВОСПОМИНАНИЯ <b>△</b><br>СКРЫТЫЙ КАТАЛОГ <b>◇</b></p><p id="selectedSymbols" class="puzzle-notice"></p><div id="symbolButtons"></div><div class="puzzle-actions" id="keyActions"></div><p id="laterNotice" class="puzzle-notice"></p></section>';
  const update=()=>{box.querySelector('#selectedSymbols').textContent=chosen.join(' ')||'Выбери первый символ.'};
  SYMBOLS.forEach(x=>button(box.querySelector('#symbolButtons'),x,()=>{if(chosen.length<4){chosen.push(x);update()}}));
  button(box.querySelector('#keyActions'),'Сбросить',()=>{chosen=[];update()});
  button(box.querySelector('#keyActions'),'Проверить ключ',()=>{if(chosen.length===4)act('key',chosen.join(''),state,app,root)});
  if(state.keyErrors>=3)box.querySelector('#laterNotice').textContent='Подсказка: начни с резервной инструкции, затем восстановленные фотографии.';
  update();
 }else if(state.phase==='processing'){
  box.innerHTML='<section class="puzzle-card"><h3>ВОССТАНОВЛЕНИЕ ИНТЕРВЬЮ</h3><p>Повреждённый архив обрабатывается. Не закрывай приложение.</p><div class="progress-track"><div id="progressFill"></div></div><p id="progressNumber" class="puzzle-notice">0%</p></section>';
  const start=state.processingStarted||Date.now();
  const curve=[[0,0],[900,3],[2100,11],[2900,12],[4300,26],[5200,28],[6400,43],[7600,44],[8900,58],[9900,60],[11000,77],[12600,79],[13900,94],[15000,100]];
  const tick=()=>{const elapsed=Math.max(0,Date.now()-start);let percent=100;for(let i=1;i<curve.length;i++){if(elapsed<=curve[i][0]){const [x0,y0]=curve[i-1],[x1,y1]=curve[i];percent=Math.floor(y0+(y1-y0)*(elapsed-x0)/(x1-x0));break}}
   box.querySelector('#progressFill').style.width=percent+'%';box.querySelector('#progressNumber').textContent=percent+'%';
   if(elapsed>=15000)act('processing','',state,app,root);else timer=setTimeout(tick,170)};
  tick();
 }else if(state.phase==='storyComplete'){
  box.innerHTML='<div class="puzzle-lock">Эксперимент 366 открыт. История продолжается за пределами архива. ♡</div>';
 }else if(['audioReady','audioPlayed','finalSearch','finalReady','finalReveal','awaitReunion','reunionOffer'].includes(state.phase)){
  box.innerHTML='<section class="puzzle-card"><h3>ИНТЕРВЬЮ ИСПЫТУЕМОГО № 01</h3><p>Восстановленная запись эксперимента 365.</p><p id="audioStatus" class="puzzle-notice">Получаю защищённый аудиофайл…</p><div id="audioHolder"></div></section>';
  if(state.phase==='awaitReunion')box.querySelector('p').textContent='Фраза восстановлена. Произнеси её Амиру лично и вернись в чат E.V.A.';
  if(state.phase==='reunionOffer')box.querySelector('p').textContent='E.V.A. ждёт твоего ответа на последний вопрос в чате.';
  loadAudio(box,state,app);
 }
}
function button(parent,label,handler){const b=document.createElement('button');b.className='puzzle-button';b.textContent=label;b.disabled=acting;b.onclick=handler;parent.append(b)}
async function act(action,choice,state,app,root){if(acting)return;acting=true;const notice=root.querySelector('#laterNotice');try{
 const r=await fetch(app.apiBase+'/api/action',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({initData:app.tg.initData,action,choice}),signal:AbortSignal.timeout(20000)});const data=await r.json();
 if(!r.ok)throw Error(data.error||'Связь с E.V.A. прервана');chosen=[];app.applyState(data);
 }catch(e){if(notice)notice.textContent=e.message;else if(root.querySelector('#progressNumber')){root.querySelector('#progressNumber').textContent=e.message;timer=setTimeout(()=>{acting=false;act('processing','',state,app,root)},2500)}}finally{acting=false}}
function clock(seconds){if(!Number.isFinite(seconds))return '0:00';const n=Math.floor(seconds);return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`}
async function loadAudio(box,state,app){if(audioUrl)URL.revokeObjectURL(audioUrl);audioUrl='';
 try{const r=await fetch(app.apiBase+'/api/audio',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({initData:app.tg.initData}),signal:AbortSignal.timeout(120000)});if(!r.ok)throw Error('Аудиофайл пока недоступен.');audioUrl=URL.createObjectURL(await r.blob());
 const holder=box.querySelector('#audioHolder');if(!holder)return;
 holder.innerHTML='<div class="interview-player"><button type="button" class="interview-toggle" aria-label="Воспроизвести интервью">▶</button><div class="interview-display"><div class="interview-times"><span>0:00</span><span>0:00</span></div><div class="interview-track" role="progressbar" aria-label="Ход воспроизведения" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span></span></div></div></div>';
 const player=document.createElement('audio');player.preload='metadata';player.src=audioUrl;holder.append(player);
 const toggle=holder.querySelector('.interview-toggle'),times=holder.querySelectorAll('.interview-times span'),track=holder.querySelector('.interview-track'),fill=track.querySelector('span');
 const sync=()=>{times[0].textContent=clock(player.currentTime);times[1].textContent=clock(player.duration);const pct=player.duration?Math.min(100,player.currentTime/player.duration*100):0;fill.style.width=pct+'%';track.setAttribute('aria-valuenow',String(Math.round(pct)));toggle.textContent=player.paused?'▶':'Ⅱ';toggle.setAttribute('aria-label',player.paused?'Воспроизвести интервью':'Пауза')};
 toggle.onclick=async()=>{if(player.paused){try{await player.play()}catch{box.querySelector('#audioStatus').textContent='Не удалось начать воспроизведение. Попробуй ещё раз.'}}else player.pause();sync()};
 player.onloadedmetadata=sync;player.ontimeupdate=sync;player.onplay=sync;player.onpause=sync;
 let completed=false;player.onended=()=>{sync();if(state.phase==='audioReady'&&!completed){completed=true;box.querySelector('#audioStatus').textContent='Интервью прослушано полностью. E.V.A. ответит через несколько секунд.';act('audio-ended','',state,app,document.getElementById('puzzleView'))}};
 box.querySelector('#audioStatus').textContent=state.phase==='audioReady'?'Запись готова. Прослушай её полностью.':'Запись доступна для повторного прослушивания.';
 }catch(e){box.querySelector('#audioStatus').textContent=e.message;button(box.querySelector('#audioHolder'),'Повторить загрузку',()=>{box.querySelector('#audioHolder').replaceChildren();loadAudio(box,state,app)})}}
