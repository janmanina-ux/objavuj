(() => {
const $=id=>document.getElementById(id),status=$('privateStatus'),auth=$('authBox'),actions=$('privateActions'),form=$('translateForm'),list=$('privateList'),out=$('privateResult');
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
async function refresh(){if(!session)return;const {data,error}=await client.from('saved_translations').select('id,source_title,source_url,translated_text,created_at').order('created_at',{ascending:false}).limit(100);if(error){say('Nepodarilo sa načítať knižnicu: '+error.message);return;}list.replaceChildren();if(!data.length)list.append(p('p','Zatiaľ nemáš uložené preklady.'));for(const a of data){const box=p('article');box.className='private-item';box.append(p('h4',a.source_title||a.source_url));const link=p('a','Originál ↗');link.href=a.source_url;link.target='_blank';link.rel='noopener noreferrer';box.append(link,p('span',' · '+new Date(a.created_at).toLocaleDateString('sk-SK')));const read=p('button','Čítať preklad');read.onclick=()=>reveal(a.source_title||'Slovenský preklad',a.translated_text);const del=p('button','Vymazať');del.onclick=async()=>{if(!confirm('Vymazať tento uložený preklad?'))return;const {error}=await client.from('saved_translations').delete().eq('id',a.id);if(error)say(error.message);else refresh();};box.append(p('div'),read,del);list.append(box);}say('Knižnica: '+data.length+' uložených slovenských prekladov.');}
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
      say(problem?'Prihlasovací odkaz sa nepodarilo spracovať: '+problem:'Nie si prihlásený. Prihlás sa e-mailovým odkazom.');
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
$('privateLogin').onclick=async()=>{if(!client)return;const email=$('privateEmail').value.trim();if(!email)return say('Zadaj e-mail.');const {error}=await client.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+location.pathname+'#moje-preklady'}});say(error?'Prihlásenie zlyhalo: '+error.message:'Skontroluj e-mail a otvor prihlasovací odkaz.');};
$('privateLogout').onclick=async()=>{if(client)await client.auth.signOut();};$('privateRefresh').onclick=refresh;
$('translateNow').onclick=async()=>{if(!client||!session)return;const b=$('translateNow');const url=$('translateUrl').value.trim(),title=$('translateTitle').value.trim(),text=$('translateText').value.trim();if(text.length<100||text.length>20000)return say('Text musí mať 100 až 20 000 znakov.');if(!/^https:\/\//.test(url))return say('Vlož HTTPS adresu originálu.');b.disabled=true;say('Prekladám do slovenčiny…');try{const {data,error}=await client.functions.invoke('translate-article',{body:{url,title,text}});if(error){let detail=error.message;try{const json=await error.context.json();detail=json.error||detail}catch{}throw Error(detail);}reveal(title||'Slovenský preklad',data.translation);say(data.cached?'Načítaný už uložený preklad (bez nového API volania).':'Nový slovenský preklad uložený.');await refresh();}catch(e){say('Preklad sa nepodaril: '+e.message);}finally{b.disabled=false;}};
window.objavujTranslate=(url,title)=>{const u=$('translateUrl'),t=$('translateTitle');u.value=url||'';t.value=title||'';document.getElementById('moje-preklady').scrollIntoView({behavior:'smooth'});};
// Offer a translate action on existing external article cards. This only pre-fills URL/title; user supplies text.
const observer=new MutationObserver(()=>{document.querySelectorAll('.live-card:not([data-translate-added])').forEach(card=>{const a=[...card.querySelectorAll('a[href^="https://"]')].find(x=>!x.href.includes('google.com/search'));if(!a)return;card.dataset.translateAdded='1';const b=p('button','Preložiť do slovenčiny');b.type='button';b.style.cssText='margin:10px 0;padding:8px 11px;border:1px solid #bfcac0;border-radius:5px;background:#fff;cursor:pointer';b.onclick=()=>window.objavujTranslate(a.href,card.querySelector('h3')?.textContent||'');card.append(b);});});observer.observe(document.body,{childList:true,subtree:true});
})();
