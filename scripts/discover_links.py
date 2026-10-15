#!/usr/bin/env python3
"""Conservative link discovery from public category listings (no full article scraping)."""
import datetime as dt, html, json, re, sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit, urlunsplit
from urllib.request import Request, urlopen
from urllib.robotparser import RobotFileParser

ROOT=Path(__file__).resolve().parents[1]
CONFIG=ROOT/'discovery-sources.json'
DEST=ROOT/'data'/'discovered.json'
USER_AGENT='ObjavujPersonalReader/0.5 (+personal reading links)'
MAX_BYTES=650_000

class Anchors(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True);self.items=[];self.href=None;self.parts=[]
    def handle_starttag(self, tag, attrs):
        if tag=='a' and self.href is None:
            self.href=dict(attrs).get('href','');self.parts=[]
    def handle_data(self, data):
        if self.href is not None:self.parts.append(data)
    def handle_endtag(self,tag):
        if tag=='a' and self.href is not None:
            title=' '.join(' '.join(self.parts).split())
            if self.href and title:self.items.append((self.href,html.unescape(title)))
            self.href=None;self.parts=[]

def valid_article_url(page_url,href,host,path_regex):
    target=urlsplit(urljoin(page_url,href))
    if target.scheme!='https' or target.hostname!=host or target.username or target.password: return ''
    if not re.fullmatch(path_regex,target.path):return ''
    return urlunsplit(('https',target.netloc,target.path,'',''))

def can_fetch(page_url):
    p=urlsplit(page_url);rp=RobotFileParser()
    rp.set_url(f'{p.scheme}://{p.netloc}/robots.txt')
    rp.read()
    return rp.can_fetch(USER_AGENT,page_url)

def parse_listing(text,src):
    parser=Anchors();parser.feed(text);out=[];seen=set()
    for href,title in parser.items:
        url=valid_article_url(src['url'],href,src['allowed_host'],src['link_regex'])
        if not url or url in seen or len(title)<18 or len(title)>175:continue
        seen.add(url)
        out.append({'id':url,'title':title,'url':url,'topic':src['topic'],'source':src['name'],'type':'category_listing','note':'Titulok a odkaz z tematickej stránky. Úplný článok nebol stiahnutý ani analyzovaný.'})
        if len(out)>=src.get('max_items',10):break
    return out

def collect():
    cfg=json.loads(CONFIG.read_text(encoding='utf-8'));errors=[];found=[];seen=set();success=0
    for src in cfg['sources']:
        try:
            if urlsplit(src['url']).hostname!=src['allowed_host']:raise ValueError('Host mismatch')
            if not can_fetch(src['url']):raise PermissionError('robots.txt does not allow retrieval')
            req=Request(src['url'],headers={'User-Agent':USER_AGENT,'Accept':'text/html'})
            with urlopen(req,timeout=15) as response:
                final=response.geturl()
                if urlsplit(final).hostname!=src['allowed_host']:raise RuntimeError('Redirected to another domain')
                content_type=response.headers.get('Content-Type','').lower()
                if 'html' not in content_type:raise RuntimeError('Not an HTML page')
                body=response.read(MAX_BYTES+1)
                if len(body)>MAX_BYTES:raise RuntimeError('Page too large')
            entries=parse_listing(body.decode('utf-8',errors='replace'),src)
            if not entries:raise RuntimeError('No matching article links')
            success+=1
            for row in entries:
                if row['id'] not in seen:found.append(row);seen.add(row['id'])
            print('OK discovery:',src['name'],len(entries))
        except Exception as err:
            errors.append({'source':src['name'],'reason':str(err)[:180]})
            print('WARN discovery:',src['name'],str(err),file=sys.stderr)
    old={}
    if DEST.exists():
        try:old=json.loads(DEST.read_text(encoding='utf-8'))
        except (ValueError,OSError):pass
    if not found:
        found=old.get('articles',[])
        print('No new discovery items; preserving previously published links.')
    payload={'updated':dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds') if success else old.get('updated'),
      'articles':found[:35], 'errors':errors,'successful_sources':success,'configured_sources':len(cfg['sources']),
      'note':'Len automaticky objavené titulky a odkazy; nejde o RSS, súhrny článkov ani AI texty.'}
    DEST.parent.mkdir(parents=True,exist_ok=True)
    DEST.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('Discovered',len(payload['articles']),'unique links')
    return payload

if __name__=='__main__':collect()
