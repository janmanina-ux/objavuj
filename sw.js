const CACHE='objavuj-shell-v12-8';const SHELL=['./','./index.html','./manifest.webmanifest','./icons/icon.svg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const req=e.request;if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
 if(['/index.html','/private-library.js','/config/supabase.json'].some(p=>new URL(req.url).pathname.endsWith(p)) || new URL(req.url).pathname.endsWith('/objavuj/')){e.respondWith(fetch(req).catch(()=>caches.match(req)));return}
 if(new URL(req.url).pathname.endsWith('/data/latest.json')){e.respondWith(fetch(req).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy))}return res}).catch(()=>caches.match(req)));return}
 e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(res=>{if(res.ok){let copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy))}return res})))
});
