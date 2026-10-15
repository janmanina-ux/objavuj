import importlib.util, pathlib, unittest, json
ROOT=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('discover_links',ROOT/'scripts/discover_links.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class DiscoveryLinkTests(unittest.TestCase):
 def test_extract_and_dedup(self):
  source={'url':'https://www.mtbiker.sk/clanky/bikepacking','allowed_host':'www.mtbiker.sk','link_regex':r'^/clanky/\d+/[^/]+\.html$','topic':'Bikepacking','name':'MTBIKER','max_items':10}
  page="<a href='/clanky/12345/test-bikepacking.html'>Ako zbaliť výbavu na dlhý bikepacking</a><a href='/clanky/12345/test-bikepacking.html'>Duplicitný názov bikepacking článku</a><a href='https://evil.example/clanky/123/a.html'>Nežiaduci cudzí článok</a>"
  rows=m.parse_listing(page,source)
  self.assertEqual(len(rows),1)
  self.assertEqual(rows[0]['type'],'category_listing')
 def test_config_hosts(self):
  for source in json.loads((ROOT/'discovery-sources.json').read_text())['sources']:
   self.assertTrue(source['url'].startswith('https://'+source['allowed_host']+'/'))
 def test_workflow(self):
  s=(ROOT/'.github/workflows/update.yml').read_text();self.assertIn('python scripts/discover_links.py',s);self.assertIn('cp data/discovered.json public/data/',s)
 def test_ui(self):
  s=(ROOT/'index.html').read_text();self.assertIn('id="autoGrid"',s);self.assertIn('data/discovered.json',s)
if __name__=='__main__':unittest.main()
