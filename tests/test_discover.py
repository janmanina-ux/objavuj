import json, pathlib, unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
class DiscoveryTests(unittest.TestCase):
 def test_discovery_links(self):
  data=json.loads((ROOT/'data/discover.json').read_text())
  self.assertGreaterEqual(len(data['resources']),6)
  for r in data['resources']:
   self.assertTrue(r['url'].startswith('https://'))
   self.assertEqual(r['source_type'],'website_directory')
 def test_workflow_publishes_discovery(self):
  text=(ROOT/'.github/workflows/update.yml').read_text()
  self.assertIn('data/discover.json public/data/',text)
 def test_ui_section(self):
  text=(ROOT/'index.html').read_text()
  self.assertIn('id="discoverGrid"',text)
  self.assertIn('data/discover.json',text)
if __name__=='__main__':unittest.main()
