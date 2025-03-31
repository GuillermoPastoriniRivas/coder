import json
from typing import List
from sentence_transformers import CrossEncoder

class ContextManager:
    def __init__(self, docs: dict, model_name: str = 'cross-encoder/ms-marco-MiniLM-L-6-v2'):
        self.docs = docs
        self.cross_encoder = CrossEncoder(model_name)
        
    def get_relevant_sections(self, instruction: str, code_units: List[dict]) -> List[dict]:
        unit_texts = [self._format_unit(unit) for unit in code_units]
        scores = self.cross_encoder.predict([(instruction, text) for text in unit_texts])
        scored_units = sorted(zip(code_units, scores), key=lambda x: x[1], reverse=True)
        return [unit for unit, score in scored_units[:3]]
    
    def _format_unit(self, unit: dict) -> str:
        return f"""
        Code Unit: {unit['type']} {unit['name']}
        Lines: {unit['start_line']}-{unit['end_line']}
        {unit['code']}
        """
    
    def get_architectural_context(self, file_path: str) -> dict:
        deps = self.docs['project']['files'].get(file_path, {}).get('dependencies', [])
        critical = [d['file_path'] for d in deps if 'core' in d['file_path']]
        return {
            'critical_dependencies': critical,
            'design_patterns': self._detect_patterns(file_path)
        }
    
    def _detect_patterns(self, file_path: str) -> List[str]:
        return []