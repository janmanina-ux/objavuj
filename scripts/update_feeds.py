#!/usr/bin/env python3
"""Daily feed importer. Standard library only. Optional AI summary is deliberately disabled by default."""
import datetime as dt, email.utils, html, json, os, re, sys, urllib.request, xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import urlparse, urlsplit, urlunsplit

ROOT=Path(__file__).resolve().parents[1]
CONFIG=json.loads((ROOT/'feeds.json').read_text(encoding='utf-8'))
DEST=ROOT/'data'/'latest.json'
MAX_PER_SOURCE=12
LIMIT=36
MAX_PER_CATEGORY=10

def clean(s):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]*>', ' ', s or ''))).strip()

def find_text(node, keys):
    for k in keys:
        v=node.find(k)
        if v is not None and v.text: return v.text.strip()
    return ''

def parse_date(value):
    try:
        parsed=email.utils.parsedate_to_datetime(value)
        return parsed.astimezone(dt.timezone.utc).isoformat() if parsed.tzinfo else parsed.replace(tzinfo=dt.timezone.utc).isoformat()
    except (TypeError, ValueError, OverflowError):
        try: return dt.datetime.fromisoformat(value.replace('Z','+00:00')).astimezone(dt.timezone.utc).isoformat()
        except (TypeError, ValueError): return ''

def normalize_url(url):
    p=urlsplit(url.strip())
    if p.scheme not in ('http','https') or not p.hostname: return ''
    return urlunsplit((p.scheme,p.netloc,p.path,p.query,''))

def fetch(feed):
    req=urllib.request.Request(feed['url'],headers={'User-Agent':'ObjavujPersonalReader/0.3 (+rss feed reader)', 'Accept':'application/rss+xml, application/atom+xml, application/xml, text/xml'})
    with urllib.request.urlopen(req,timeout=18) as response:
        if response.status != 200: raise RuntimeError('HTTP '+str(response.status))
        data=response.read(2_000_001)
        if len(data)>2_000_000: raise RuntimeError('RSS too large')
    root=ET.fromstring(data)
    items=root.findall('./channel/item') if root.tag.lower()=='rss' or root.find('./channel') is not None else root.findall('{http://www.w3.org/2005/Atom}entry')
    out=[]
    for it in items[:MAX_PER_SOURCE]:
        atom=root.tag.endswith('feed')
        if atom:
            ns='{http://www.w3.org/2005/Atom}'
            title=find_text(it,[ns+'title']); excerpt=find_text(it,[ns+'summary',ns+'content']); date=find_text(it,[ns+'updated',ns+'published'])
            link=next((e.get('href','') for e in it.findall(ns+'link') if e.get('rel','alternate')=='alternate'), '') or next((e.get('href','') for e in it.findall(ns+'link')), '')
        else:
            title=find_text(it,['title']); excerpt=find_text(it,['description','{http://purl.org/rss/1.0/modules/content/}encoded']); date=find_text(it,['pubDate','{http://purl.org/dc/elements/1.1/}date']); link=find_text(it,['link'])
        link=normalize_url(link)
        if not title or not link:continue
        excerpt=clean(excerpt)[:430]
        if not excerpt: excerpt='Otvoriť pôvodný článok a prečítať si viac.'
        out.append({'id':link,'tag':feed['category'],'title':clean(title)[:170],'summary':excerpt,'source':feed['name'],'url':link,'date':parse_date(date),'type':'rss'})
    return out

items=[]; errors=[]; seen=set(); success=0
previous=[]
if DEST.exists():
    try: previous=json.loads(DEST.read_text(encoding='utf-8')).get('articles',[])
    except (OSError, ValueError, TypeError): pass
for feed in CONFIG:
    try:
        rows=fetch(feed)
        if not rows: raise RuntimeError('Zdroj vrátil nulový počet platných položiek')
        success+=1
        print(f"OK {feed['name']} {len(rows)}",flush=True)
        for row in rows:
            if row['id'] not in seen: items.append(row);seen.add(row['id'])
    except Exception as ex:
        errors.append({'source':feed['name'],'reason':str(ex)[:160]})
        print(f"ERROR {feed['name']}: {ex}",file=sys.stderr)
# Keep previous valid articles when a feed fails (or drops older items), avoiding blank cards.
for row in previous:
    if row.get('id') not in seen and row.get('url','').startswith(('https://','http://')):
        items.append(row);seen.add(row['id'])
if not items:
    print('No usable RSS items. Keeping last successful file.',file=sys.stderr)
    sys.exit(1)
items.sort(key=lambda row:row.get('date') or '', reverse=True)
counts={};selected=[]
for row in items:
    category=row.get('tag','Iné')
    if counts.get(category,0)>=MAX_PER_CATEGORY: continue
    counts[category]=counts.get(category,0)+1
    selected.append(row)
    if len(selected)>=LIMIT:break
DEST.parent.mkdir(parents=True,exist_ok=True)
payload={'updated':dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds'),'articles':selected,'errors':errors,'successful_sources':success,'configured_sources':len(CONFIG)}
DEST.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Wrote {len(selected)} items -> {DEST}')
if success == 0:
    print('All live feeds failed; stored historical articles only.',file=sys.stderr)
    sys.exit(1)
