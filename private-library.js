(() => {
const $=id=>document.getElementById(id),status=$('privateStatus'),auth=$('authBox'),actions=$('privateActions'),form=$('translateForm'),list=$('privateList'),out=$('privateResult');
let libraryItems=[], libraryFilter='all', currentReader=null, scrollSaveTimeout=null;
let client=null,session=null;
let checkingSession=false;
const authFragment=()=>new URLSearchParams(location.hash.replace(/^#/,''));
const authQuery=()=>new URLSearchParams(location.search);
function callbackProblem(){
  const hash=authFragment(),query=authQuery();
  const issue=hash.get('error_description')||query.get('error_description')||hash.get('error')||query.get('error');
  return issue ? String(issue).slice(0,240) : null;
}
function returnToLibrary(){
  if(history.replaceState && (location.hash.includes('access_token=') || location.hash.includes('refresh_token=') || location.search.includes('code='))) {
    history.replaceState(null,'',location.pathname+'#moje-preklady');
  }
}

const say=s=>status.textContent=s;
const clear=()=>{list.replaceChildren();out.hidden=true;out.replaceChildren();};
const cfgUrl='./config/supabase.json';
function p(tag,text){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;}
function reveal(label,text){out.replaceChildren(p('h3',label));const div=p('div',text);div.className='private-text';out.append(div);out.hidden=false;out.scrollIntoView({behavior:'smooth',block:'nearest'});}
const cleanSearch=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function readerProgress(){
  const el=$('privateReadingText');
  if(!el||!currentReader)return;
  const max=Math.max(1,el.scrollHeight-el.clientHeight);
  const percent=Math.round(100*el.scrollTop/max);
  $('privateReadingProgress').textContent=percent+' %';
  clearTimeout(scrollSaveTimeout);
  scrollSaveTimeout=setTimeout(async()=>{
    if(!client||!session||!currentReader)return;
    const id=currentReader;
    const {error}=await client.from('saved_translations').update({reading_progress:percent,last_read_at:new Date().toISOString()}).eq('id',id);
    if(!error){const item=libraryItems.find(a=>a.id===id);if(item){item.reading_progress=percent;item.last_read_at=new Date().toISOString();}}
  },600);
}
function openReader(a){
  currentReader=a.id;
  out.replaceChildren(p('h3',a.source_title||'Slovenský preklad'));
  const top=p('div');top.className='private-meta';top.textContent='Prečítané: ';
  const pct=p('span',String(a.reading_progress||0)+' %');pct.id='privateReadingProgress';top.append(pct);
  const text=p('div',a.translated_text);text.className='private-reader';text.id='privateReadingText';text.tabIndex=0;
  text.setAttribute('role','region');text.setAttribute('aria-label','Text slovenského prekladu');
  text.addEventListener('scroll',readerProgress,{passive:true});
  const link=p('a','Originál ↗');link.href=a.source_url;link.target='_blank';link.rel='noopener noreferrer';
  const close=p('button','Zavrieť');close.onclick=()=>{out.hidden=true;currentReader=null;refresh();};
  out.append(top,text,link,close);out.hidden=false;
  out.scrollIntoView({behavior:'smooth',block:'start'});
  requestAnimationFrame(()=>{const max=Math.max(0,text.scrollHeight-text.clientHeight);text.scrollTop=max*(Math.min(100,Number(a.reading_progress||0))/100);});
}
function renderLibrary(){
  const term=cleanSearch($('privateSearch').value.trim());
  const matches=libraryItems.filter(a=>{
    const full=cleanSearch([a.source_title,a.source_url,a.translated_text].join(' '));
    return (!term||full.includes(term)) && (libraryFilter==='all'||(libraryFilter==='favorites'&&a.is_favorite)||(libraryFilter==='continue'&&a.last_read_at&&Number(a.reading_progress||0)<98));
  });
  list.replaceChildren();
  if(!matches.length)list.append(p('p','Nenašli sa žiadne články pre tento filter.'));
  for(const a of matches){
    const box=p('article');box.className='private-item';
    box.append(p('h4',a.source_title||a.source_url));
    const link=p('a','Originál ↗');link.href=a.source_url;link.target='_blank';link.rel='noopener noreferrer';
    const meta=p('span',' · '+new Date(a.created_at).toLocaleDateString('sk-SK'));meta.className='private-meta';box.append(link,meta);
    const bar=p('div');bar.className='private-progress';const progress=p('span');progress.style.width=Math.min(100,Math.max(0,Number(a.reading_progress||0)))+'%';bar.append(progress);box.append(bar);
    const read=p('button',a.last_read_at&&a.reading_progress<98?'↪ Pokračovať':'Čítať preklad');read.onclick=()=>openReader(a);
    const fav=p('button',a.is_favorite?'★ Obľúbené':'☆ Pridať medzi obľúbené');
    fav.onclick=async()=>{fav.disabled=true;const {error}=await client.from('saved_translations').update({is_favorite:!a.is_favorite}).eq('id',a.id);if(error)say('Nepodarilo sa uložiť obľúbené: '+error.message);else{a.is_favorite=!a.is_favorite;renderLibrary();}fav.disabled=false;};
    const del=p('button','Vymazať');del.onclick=async()=>{if(!confirm('Vymazať tento uložený preklad?'))return;const {error}=await client.from('saved_translations').delete().eq('id',a.id);if(error)say(error.message);else refresh();};
    box.append(read,fav,del);list.append(box);
  }
  say('Knižnica: '+libraryItems.length+' článkov · zobrazených '+matches.length+'.');
}
async function refresh(){
  if(!session)return;
  const {data,error}=await client.from('saved_translations').select('id,source_title,source_url,translated_text,created_at,is_favorite,reading_progress,last_read_at').order('created_at',{ascending:false}).limit(200);
  if(error){say('Nepodarilo sa načítať knižnicu: '+error.message+' (aplikuj migráciu 12.9)');return;}
  libraryItems=data||[];renderLibrary();
}
$('privateSearch').addEventListener('input',renderLibrary);
for(const [id,filter] of [['privateAll','all'],['privateFavorites','favorites'],['privateContinue','continue']]){
  $(id).onclick=()=>{libraryFilter=filter;for(const [other,value] of [['privateAll','all'],['privateFavorites','favorites'],['privateContinue','continue']])$(other).setAttribute('aria-pressed',String(value===filter));renderLibrary();};
}
async function show(){
  if(!client||checkingSession)return;
  checkingSession=true;
  try{
    const {data,error}=await client.auth.getSession();
    if(error)throw error;
    session=data.session;
    auth.hidden=!!session;actions.hidden=!session;form.hidden=!session;clear();
    if(session){
      returnToLibrary();
      say('Prihlásený účet: '+session.user.email);
      await refresh();
    }else{
      const problem=callbackProblem();
      say(problem?'Prihlasovací odkaz sa nepodarilo spracovať: '+problem:'Nie si prihlásený. Zadaj e-mail a heslo.');
    }
  }catch(e){auth.hidden=false;actions.hidden=true;form.hidden=true;say('Nepodarilo sa obnoviť reláciu: '+(e?.message||String(e)));}
  finally{checkingSession=false;}
}
(async()=>{try{const r=await fetch(cfgUrl,{cache:'no-store'});const c=await r.json();if(!c.url||!c.publishableKey){say('Súkromná knižnica nie je nakonfigurovaná. Postup je v SUPABASE-SETUP.md.');auth.hidden=true;return;}const {createClient}=await import('https://esm.sh/@supabase/supabase-js@2');client=createClient(c.url,c.publishableKey,{auth:{detectSessionInUrl:true,autoRefreshToken:true,persistSession:true,flowType:'implicit'}});
client.auth.onAuthStateChange((event)=>{
  if(event==='SIGNED_IN'||event==='TOKEN_REFRESHED'||event==='SIGNED_OUT'||event==='INITIAL_SESSION')setTimeout(show,0);
});
// The auth client initializes itself; getSession waits for callback handling.
const failure=callbackProblem();
await show();
if(failure&&!session){say('Prihlasovací odkaz zlyhal: '+failure+' Skús nový odkaz v rovnakom prehliadači.');}
window.addEventListener('pageshow',()=>setTimeout(show,0));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(show,0)});}catch(e){say('Supabase sa nepodarilo inicializovať: '+e.message);auth.hidden=true;}})();
$('privatePasswordLogin').onclick=async()=>{
  if(!client)return;
  const email=$('privateEmail').value.trim(),password=$('privatePassword').value;
  if(!email||!password)return say('Zadaj e-mail aj heslo.');
  const button=$('privatePasswordLogin');button.disabled=true;
  say('Prihlasujem…');
  try{
    const {data,error}=await client.auth.signInWithPassword({email,password});
    if(error)throw error;
    $('privatePassword').value='';
    session=data.session;
    await show();
  }catch(error){say('Prihlásenie zlyhalo: '+(error?.message||String(error)));}
  finally{button.disabled=false;}
};
$('privateLogin').onclick=async()=>{if(!client)return;const email=$('privateEmail').value.trim();if(!email)return say('Zadaj e-mail.');const {error}=await client.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+location.pathname+'#moje-preklady'}});say(error?'Prihlásenie zlyhalo: '+error.message:'Skontroluj e-mail a otvor prihlasovací odkaz.');};
$('privateLogout').onclick=async()=>{if(client)await client.auth.signOut();};$('privateRefresh').onclick=refresh;
$('translateNow').onclick=async()=>{if(!client||!session)return;const b=$('translateNow');const url=$('translateUrl').value.trim(),title=$('translateTitle').value.trim(),text=$('translateText').value.trim();if(text.length<100||text.length>20000)return say('Text musí mať 100 až 20 000 znakov.');if(!/^https:\/\//.test(url))return say('Vlož HTTPS adresu originálu.');b.disabled=true;say('Prekladám do slovenčiny…');try{const {data,error}=await client.functions.invoke('translate-article',{body:{url,title,text}});if(error){let detail=error.message;try{const json=await error.context.json();detail=json.error||detail}catch{}throw Error(detail);}await refresh();const saved=libraryItems.find(a=>a.id===data.id);if(saved)openReader(saved);else reveal(title||'Slovenský preklad',data.translation);say(data.cached?'Načítaný uložený preklad.':'Nový slovenský preklad uložený.');}catch(e){say('Preklad sa nepodaril: '+e.message);}finally{b.disabled=false;}};

$('translateAuto').onclick=async()=>{
  if(!client||!session)return say('Najprv sa prihlás.');
  const url=$('translateUrl').value.trim(),title=$('translateTitle').value.trim();
  if(!/^https:\/\//.test(url))return say('Najprv vlož HTTPS adresu článku.');
  const btn=$('translateAuto');btn.disabled=true;say('Načítavam článok a prekladám do slovenčiny…');
  try{
    const {data,error}=await client.functions.invoke('translate-article',{body:{url,title,auto:true}});
    if(error){let message=error.message;try{const j=await error.context.json();message=j.error||message;}catch{}throw Error(message);}
    await refresh();
    const saved=libraryItems.find(a=>a.id===data.id);
    if(saved)openReader(saved);else reveal(title||'Slovenský preklad',data.translation);
    say(data.cached?'Už preložený článok bol načítaný bez ďalších AI nákladov.':'Článok preložený a uložený.');
  }catch(e){say('Automatické načítanie sa nepodarilo: '+e.message+' Môžeš vložiť text článku ručne.');}
  finally{btn.disabled=false;}
};
window.objavujTranslate=(url,title)=>{const u=$('translateUrl'),t=$('translateTitle');u.value=url||'';t.value=title||'';document.getElementById('moje-preklady').scrollIntoView({behavior:'smooth'});};
// Offer on-demand translation for supported links; unsupported sites retain manual input.
const observer=new MutationObserver(()=>{document.querySelectorAll('.live-card:not([data-translate-added])').forEach(card=>{const a=[...card.querySelectorAll('a[href^="https://"]')].find(x=>!x.href.includes('google.com/search'));if(!a)return;card.dataset.translateAdded='1';const b=p('button','Preložiť jedným kliknutím');b.type='button';b.style.cssText='margin:10px 0;padding:8px 11px;border:1px solid #bfcac0;border-radius:5px;background:#fff;cursor:pointer';b.onclick=()=>{window.objavujTranslate(a.href,card.querySelector('h3')?.textContent||'');$('translateAuto').click();};card.append(b);});});observer.observe(document.body,{childList:true,subtree:true});
})();
