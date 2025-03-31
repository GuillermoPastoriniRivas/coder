import os
import json
from typing import List
from openai import OpenAI
from .ast_parser import ASTParser
from .diff_engine import DiffEngine
from .context_manager import ContextManager
from utils.cache import ASTCache, EmbeddingCache
from utils.validation import CodeValidator

class SmartFileEditor:
    def __init__(self, docs: dict, api_key: str, project_root: str):
        self.docs = docs
        self.ast_parser = ASTParser()
        self.diff_engine = DiffEngine()
        self.context_manager = ContextManager(docs)
        self.client = OpenAI(api_key=api_key)
        self.ast_cache = ASTCache()
        self.embedding_cache = EmbeddingCache()
        self.validator = CodeValidator(project_root)
    
    def edit_file(self, file_path: str, instruction: str) -> str:
        original_code = self._read_file(file_path)
        architectural_context = self.context_manager.get_architectural_context(file_path)
        lines = original_code.split('\n')
        if len(lines) > 100:
            new_chunks = []
            chunk_size = 100
            for i in range(0, len(lines), chunk_size):
                chunk_lines = lines[i:i+chunk_size]
                chunk_text = "\n".join(chunk_lines)
                dummy_unit = {
                    'name': f"chunk {i//chunk_size + 1}",
                    'start_line': 1,
                    'end_line': len(chunk_lines),
                    'code': chunk_text
                }
                diff = self._get_llm_diff(dummy_unit, instruction, architectural_context)
                modified_chunk = self.diff_engine.apply_diff(chunk_text, diff)
                new_chunks.append(modified_chunk)
            modified_code = "\n".join(new_chunks)
        else:
            code_units = self.ast_parser.parse(original_code)
            for unit in code_units:
                unit['code'] = self._extract_code_section(original_code, unit)
            relevant_units = self.context_manager.get_relevant_sections(instruction, code_units)
            modified_code = original_code
            for unit in relevant_units:
                diff = self._get_llm_diff(unit, instruction, architectural_context)
                modified_code = self.diff_engine.apply_diff(modified_code, diff)
        is_valid, report = self.validator.validate_diff(original_code, modified_code)
        if not is_valid:
            raise ValueError(f"Error de validación: {report}")
        return modified_code
        
    def _read_file(self, file_path: str) -> str:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
        
    def _extract_code_section(self, code: str, unit: dict) -> str:
        lines = code.split('\n')
        return '\n'.join(lines[unit['start_line']-1:unit['end_line']])
        
    def _get_llm_diff(self, unit: dict, instruction: str, context: dict) -> List[str]:
        prompt = self._create_diff_prompt(unit, instruction, context)
        response = self._call_llm(prompt)
        return self._parse_diff_response(response)
        
    def _create_diff_prompt(self, unit: dict, instruction: str, context: dict) -> str:
        return f"""
        [ESTRICTO FORMATO DE SALIDA]
        Generar diff UNICAMENTE para:
        - Archivo: {unit['name']} (Líneas {unit['start_line']}-{unit['end_line']})
        - Instrucción: {instruction}
        
        Contexto Arquitectural:
        {context}
        
        Código Original:
        ```typescript
        {unit['code']}
        ```
        
        Reglas:
        1. Mantener estilo existente
        2. Respetar dependencias: {context['critical_dependencies']}
        3. Patrones requeridos: {context['design_patterns']}
        
        Formato:
        ```diff
        @@ -start_line,end_line +start_line,end_line @@
        - líneas eliminadas
        + líneas añadidas
        ```
        """
        
    def _call_llm(self, prompt: str) -> str:
        response = self.client.responses.create(
            model="o3-mini",
            reasoning={"effort": "high"},
            input=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ]
        )
        return response.output_text
        
    def _parse_diff_response(self, response: str) -> List[str]:
        return [line for line in response.split('\n') if line.startswith('@@') or line.startswith(('+', '-'))]