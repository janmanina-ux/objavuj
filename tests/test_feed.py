"""Offline checks of feed parsing and ranking, without live network access."""
import ast
import pathlib
import unittest

SOURCE=pathlib.Path(__file__).resolve().parents[1]/'scripts'/'update_feeds.py'
module=ast.parse(SOURCE.read_text(encoding='utf-8'))
# Execute definitions and constants, but never the module-level fetch loop.
selected=[]
for node in module.body:
    if isinstance(node, (ast.Import, ast.ImportFrom, ast.FunctionDef, ast.Assign)):
        if isinstance(node, ast.Assign) and any(isinstance(t,ast.Name) and t.id in ('ROOT','CONFIG','DEST','payload') for t in node.targets):
            continue
        selected.append(node)
namespace={'__file__':str(SOURCE)}
exec(compile(ast.Module(body=selected,type_ignores=[]),str(SOURCE),'exec'), namespace)

class FeedTests(unittest.TestCase):
    def test_media_image_enclosure(self):
        import xml.etree.ElementTree as ET
        item=ET.fromstring('<item xmlns:media="http://search.yahoo.com/mrss/"><media:thumbnail url="https://example.org/photo.jpg"/></item>')
        self.assertEqual(namespace['extract_image'](item),'https://example.org/photo.jpg')

    def test_no_image_for_insecure_http(self):
        import xml.etree.ElementTree as ET
        item=ET.fromstring('<item><enclosure url="http://example.org/photo.jpg" type="image/jpeg"/></item>')
        self.assertEqual(namespace['extract_image'](item),'')

    def test_focused_jachting(self):
        article={'title':'Trim plachty na Europe v slabom vetre','summary':'Nastavenie plachty a obraty','tag':'Veda'}
        result=namespace['rank'](article)
        self.assertEqual(result['topic'],'Jachting')
        self.assertGreaterEqual(result['relevance'],48)
        self.assertIn('why_read',result)

    def test_generic_source_low_priority(self):
        article={'title':'V Indii objavili fosíliu hada','summary':'Výskum hada v Indii','tag':'Veda'}
        result=namespace['rank'](article)
        self.assertLess(result['relevance'],48)

if __name__=='__main__':
    unittest.main()
