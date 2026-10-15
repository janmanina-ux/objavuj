import ast, pathlib, unittest
P=pathlib.Path(__file__).resolve().parents[1]/'scripts'/'update_feeds.py'
tree=ast.parse(P.read_text())
parts=[n for n in tree.body if isinstance(n,(ast.Import,ast.ImportFrom,ast.FunctionDef))]
ns={};exec(compile(ast.Module(body=parts,type_ignores=[]),str(P),'exec'),ns)
class LearningTests(unittest.TestCase):
 def test_only_excerpt(self):
  x=ns['learning_companion']({'summary':'Prvá veta. Druhá veta obsahuje viac.','topic':'Veda'})
  self.assertEqual(x['excerpt_highlight'],'Prvá veta.')
  self.assertIn('RSS',x['scope'])
  self.assertIn('dôkaz',x['question'])
 def test_blank(self):
  self.assertEqual(ns['learning_companion']({'summary':''})['excerpt_highlight'],'')
if __name__=='__main__': unittest.main()
