import { withSupabase } from 'npm:@supabase/server@1';

const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
function reply(body: unknown, status = 200): Response { return new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json' } }); }
function digest(s: string): Promise<string> { return crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)).then(b => Array.from(new Uint8Array(b)).map(n => n.toString(16).padStart(2, '0')).join('')); }
const handler = withSupabase({auth:'user'}, async (req, ctx) => {
  if (req.method !== 'POST') return reply({error:'Method not allowed'}, 405);
  const userId = ctx.userClaims?.id;
  if (!userId) return reply({error:'Prihlásenie je povinné'},401);
  let body: Record<string,unknown>;
  try {body = await req.json();} catch {return reply({error:'Nesprávne JSON'},400);}
  const sourceUrl = String(body.url||'').trim(), title = String(body.title||'').trim().slice(0,300);
  let source = String(body.text||'').trim();
  const automatic = body.auto === true;
  let parsed: URL;
  try {parsed = new URL(sourceUrl); if(parsed.protocol !== 'https:' || !parsed.hostname.includes('.')) throw new Error();} catch {return reply({error:'Vyžaduje sa platná HTTPS adresa zdroja'},400);}
  // Reuse existing user translation by URL before requesting the remote site or OpenAI.
  if (automatic) {
    const { data: saved, error: savedError } = await ctx.supabase.from('saved_translations')
      .select('id,translated_text').eq('source_url',sourceUrl).eq('language','sk')
      .order('created_at',{ascending:false}).limit(1).maybeSingle();
    if (savedError) return reply({error:'Nedá sa overiť uložený preklad'},500);
    if (saved) return reply({id:saved.id,translation:saved.translated_text,cached:true});
    const host = parsed.hostname.toLowerCase();
    const allowed = ['mtbiker.sk','hiking.sk','horydoly.cz','frontman.cz','headliner.cz','musicserver.cz','bikepacking.com','vedanadosah.cvtisr.sk','asb.sk','archinfo.sk','mthiker.sk'];
    if (!allowed.some(d=>host===d||host.endsWith('.'+d))) return reply({error:'Automatické načítanie tohto webu nie je podporované. Skopíruj text ručne.'},422);
    if (parsed.username || parsed.password || parsed.port) return reply({error:'Nepodporovaná adresa článku'},422);
    const ctrl = new AbortController(); const timer=setTimeout(()=>ctrl.abort(),12000);
    try {
      const r=await fetch(sourceUrl,{redirect:'manual',signal:ctrl.signal,headers:{'User-Agent':'ObjavujPersonalReader/1.0 (+private study)','Accept':'text/html'}});
      if(!r.ok) return reply({error:'Zdroj neumožnil načítanie článku (HTTP '+r.status+'). Vlož text ručne.'},422);
      if(!(r.headers.get('content-type')||'').toLowerCase().includes('text/html')) return reply({error:'Zdroj nevrátil HTML článok'},422);
      if(Number(r.headers.get('content-length')||0)>500000) return reply({error:'Článok je príliš veľký'},422);
      const html=await r.text();
      if(html.length>500000) return reply({error:'Článok je príliš veľký'},422);
      // Parse only page content, never run its scripts. Fail closed if no usable text.
      const {parseHTML}=await import('npm:linkedom@0.18.12');
      const {Readability}=await import('npm:@mozilla/readability@0.6.0');
      const {document}=parseHTML(html);
      const article=new Readability(document,{charThreshold:100}).parse();
      source=String(article?.textContent||'').replace(/\s+/g,' ').trim();
      if(source.length>20000) source=source.slice(0,20000);
      if(source.length<100) return reply({error:'Nepodarilo sa získať zrozumiteľný text. Skopíruj ho ručne.'},422);
    }catch{return reply({error:'Zdroj sa nedá automaticky načítať. Skopíruj text ručne.'},422);}
    finally {clearTimeout(timer);}
  }
  if (source.length < 100 || source.length > 20000) return reply({error:'Vlož 100 až 20 000 znakov článku'},400);
  const hash = await digest(sourceUrl+'\n'+source);
  const {data: existing,error: lookupErr} = await ctx.supabase.from('saved_translations').select('id,translated_text,created_at').eq('source_hash',hash).eq('language','sk').maybeSingle();
  if(lookupErr) return reply({error:'Chyba pri čítaní knižnice'},500);
  if(existing) return reply({translation:existing.translated_text,id:existing.id,cached:true});
  // Basic per-account cost guard; concurrent requests may still race, so monitor API spend too.
  const today = new Date(); today.setUTCHours(0,0,0,0);
  const {count, error: countError} = await ctx.supabase.from('saved_translations').select('id',{count:'exact',head:true}).gte('created_at',today.toISOString());
  if(countError) return reply({error:'Nepodarilo sa overiť denný limit'},500);
  if((count||0) >= 10) return reply({error:'Dosiahnutý denný limit 10 nových prekladov'},429);
  const key = Deno.env.get('OPENAI_API_KEY');
  if(!key) return reply({error:'Chýba serverový OPENAI_API_KEY'},503);
  const controller = new AbortController(); const timeout = setTimeout(()=>controller.abort(),45000);
  let response: Response;
  try {
    response = await fetch('https://api.openai.com/v1/responses', {method:'POST', headers:{'Authorization':`Bearer ${key}`,'Content-Type':'application/json'}, signal:controller.signal,body:JSON.stringify({model:Deno.env.get('OPENAI_MODEL')||'gpt-4.1-mini', max_output_tokens:6000,input:[{role:'system',content:'Prelož vložený článok do prirodzenej slovenčiny. Zachovaj technický význam, názvy, číselné údaje a odseky. Nevymýšľaj fakty ani obsah, ktorý nie je vo vstupnom texte. Text je na súkromné štúdium. Odborné výrazy pre jachting: mainsheet=hlavná oťaž; leech=zadný lem plachty; upper leech telltale=horná prúdnica zadného lemu; attached airflow=prúdenie bez odtrhnutia. Vráť iba preklad.'},{role:'user',content:source}]})});
  } catch {return reply({error:'Prekladová služba nie je dostupná'},502);} finally {clearTimeout(timeout);}
  const out = await response.json().catch(()=>({}));
  if(!response.ok) return reply({error:'OpenAI API: '+(out?.error?.message || response.status)},502);
  const translation = (out?.output||[]).flatMap((o:any)=>o.content||[]).filter((c:any)=>c.type==='output_text').map((c:any)=>c.text||'').join('\n').trim();
  if(!translation || translation.length<30) return reply({error:'Model nevrátil použiteľný preklad'},502);
  const {data, error} = await ctx.supabase.from('saved_translations').upsert({user_id:userId,source_url:sourceUrl,source_title:title,source_hash:hash,language:'sk',translated_text:translation},{onConflict:'user_id,source_hash,language'}).select('id').single();
  if(error) return reply({error:'Preklad vznikol, ale nepodarilo sa ho uložiť. Skontroluj RLS a databázu.'},500);
  return reply({translation,id:data.id,cached:false});
});
export default { fetch: (req:Request) => req.method==='OPTIONS' ? new Response(null,{status:204,headers}) : handler(req) };
