import { withSupabase } from 'npm:@supabase/server@1';

const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
function reply(body: unknown, status = 200): Response { return new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json' } }); }
function digest(s: string): Promise<string> { return crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)).then(b => Array.from(new Uint8Array(b)).map(n => n.toString(16).padStart(2, '0')).join('')); }
const handler = withSupabase({auth:'user'}, async (req, ctx) => {
  if (req.method !== 'POST') return reply({error:'Method not allowed'}, 405);
  const userId = ctx.userClaims?.sub;
  if (!userId) return reply({error:'Prihlásenie je povinné'},401);
  let body: Record<string,unknown>;
  try {body = await req.json();} catch {return reply({error:'Nesprávne JSON'},400);}
  const sourceUrl = String(body.url||'').trim(), title = String(body.title||'').trim().slice(0,300), source = String(body.text||'').trim();
  let parsed: URL;
  try {parsed = new URL(sourceUrl); if(parsed.protocol !== 'https:' || !parsed.hostname.includes('.')) throw new Error();} catch {return reply({error:'Vyžaduje sa platná HTTPS adresa zdroja'},400);}
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
