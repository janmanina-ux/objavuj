import unittest
from scripts import translation_eval as tr
class TranslationEvalTests(unittest.TestCase):
    def test_schema(self):
        data=tr.payload('gpt-4.1-mini')
        self.assertEqual(data['text']['format']['type'],'json_schema')
        self.assertIn('hlavná oťaž',data['input'])
    def test_parse(self):
        source={'output':[{'type':'message','content':[{'type':'output_text','text':'{"translation_sk":"Ahoj","terminology_notes":"OK"}'}]}]}
        self.assertEqual(tr.parse_response(source)['translation_sk'],'Ahoj')
    def test_no_output(self):
        with self.assertRaises(ValueError):tr.parse_response({'output':[]})
