import ast
import esprima
from typing import List, Dict

class ASTParser:
    def __init__(self, language: str = 'typescript'):
        self.language = language
        
    def parse(self, code: str) -> List[Dict]:
        if self.language == 'typescript':
            return self._parse_typescript(code)
        else:
            return self._parse_generic(code)
    
    def _parse_typescript(self, code: str) -> List[Dict]:
        try:
            parsed = esprima.parseScript(code, {'loc': True, 'range': True})
            return self._traverse_ast(parsed)
        except Exception as e:
            return self._parse_generic(code)
    
    def _traverse_ast(self, node) -> List[Dict]:
        units = []
        if node.type in ['ClassDeclaration', 'FunctionDeclaration', 'MethodDefinition']:
            unit = {
                'type': node.type,
                'name': getattr(node.id, 'name', 'anonymous'),
                'start_line': node.loc.start.line,
                'end_line': node.loc.end.line,
                'code': None  # Se poblará después
            }
            units.append(unit)
        
        for child in getattr(node, 'body', []):
            units.extend(self._traverse_ast(child))
            
        return units
    
    def _parse_generic(self, code: str) -> List[Dict]:
        lines = code.split('\n')
        units = []
        current_unit = None
        
        for i, line in enumerate(lines):
            if line.strip().startswith(('class ', 'def ', 'function ')):
                if current_unit:
                    current_unit['end_line'] = i-1
                    units.append(current_unit)
                current_unit = {
                    'type': 'class' if 'class ' in line else 'function',
                    'name': line.split(' ')[1].split('(')[0].strip(),
                    'start_line': i+1,
                    'end_line': None,
                    'code': None
                }
            elif current_unit and line.strip() == '':
                current_unit['end_line'] = i
                units.append(current_unit)
                current_unit = None
                
        return units