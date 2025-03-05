import os
import json
import hashlib
import tiktoken
from openai import OpenAI
from pathlib import Path
import re

class AIDocumenter:
    def __init__(self, api_key, code_path, output_file):
        self.api_key = api_key
        self.code_path = Path(code_path)
        self.output_file = output_file
        self.encoder = tiktoken.get_encoding("cl100k_base")
        self.excluded_dirs = {'node_modules', 'dist', 'build', '__pycache__', '.git'}
        self.client = OpenAI(api_key=self.api_key)
        
        # Cargar o inicializar documentación
        if Path(output_file).exists():
            with open(output_file, 'r') as f:
                self.docs = json.load(f)
        else:
            self.docs = {
                "project": {
                    "name": self.code_path.name,
                    "overview": "",
                    "files": {}
                },
                "file_hashes": {}
            }

    def _count_tokens(self, text):
        return len(self.encoder.encode(text))
    
    def _compute_file_hash(self, file_path):
        hasher = hashlib.sha256()
        try:
            with open(file_path, 'rb') as f:
                hasher.update(f.read())
            return hasher.hexdigest()
        except Exception as e:
            print(f"Error hash {file_path}: {str(e)}")
            return None
        
    def _is_valid_file(self, file_path):
        if any(part in self.excluded_dirs for part in file_path.parts):
            return False
        return file_path.suffix in {'.ts', '.js', '.tsx', '.jsx', '.css'}

    def _get_file_analysis(self, code, file_path):
        prompt = f"""
        Analyze this source file and generate documentation in JSON format. Follow this schema:
        {{
            "description": "string",  // Technical description in English
            "dependencies": [         // ONLY project files, not libraries, skip node_modules imports
                {{
                    "file_path": "string", // Copy the exact import path as it is in the file
                    "items": [ ] // Enum the items imported from that file
                }}
            ]
        }}

        Important:
        - All text in English
        - Ignore external dependencies (node_modules, etc.)
        - Focus on technical functionality
        - Current file path: {file_path}

        Code:
        {code[:20000]}  // Limitar código para ahorrar tokens
        """

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                response_format={"type": "json_object"}
            )

            try:
                response_text = response.choices[0].message.content.strip() 
                return json.loads(response.choices[0].message.content)
            except json.JSONDecodeError:
                print(f"⚠️ Error parsing JSON for {file_path}: {response_text}")
                return {}

        except Exception as e:
            print(f"⚠️ OpenAI API Error for {file_path}: {str(e)}")
            return {}
        
    def _process_file(self, file_path):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                code = f.read()
        except Exception as e:
            print(f"Error reading {file_path}: {str(e)}")
            return
        
        # Obtener análisis de OpenAI
        analysis = self._get_file_analysis(code, file_path.as_posix())
        
        # Construir entrada del archivo
        relative_path = file_path.relative_to(self.code_path).as_posix()
        self.docs["project"]["files"][relative_path] = {
            "tokens": self._count_tokens(code),
            "description": analysis.get("description", ""),
            "dependencies": analysis.get("dependencies", ""),
        }

    def generate_documentation(self):
        all_files = []
        for root, dirs, files in os.walk(self.code_path):
            dirs[:] = [d for d in dirs if d not in self.excluded_dirs]
            for file in files:
                file_path = Path(root) / file
                if self._is_valid_file(file_path):
                    all_files.append(file_path)

        existing_files = set(self.docs["project"]["files"].keys())

        current_files = {file.relative_to(self.code_path).as_posix() for file in all_files}

        deleted_files = existing_files - current_files

        if deleted_files:
            print(f"Archivos eliminados o movidos: {deleted_files}")
            for file in deleted_files:
                del self.docs["project"]["files"][file]
                self.docs["file_hashes"].pop(file, None) 

            self._save_progress() 

        for file in all_files:
            current_hash = self._compute_file_hash(file)
            relative_path = file.relative_to(self.code_path).as_posix()

            if not current_hash:
                continue

            if self.docs["file_hashes"].get(relative_path) == current_hash:
                continue

            try:
                self._process_file(file)
                self.docs["file_hashes"][relative_path] = current_hash
                self._save_progress()
            except Exception as e:
                print(f"Error en {file}: {str(e)}")

        # self._generate_project_overview()
        return self.docs

    def _save_progress(self):
        with open(self.output_file, 'w') as f:
            json.dump(self.docs, f, indent=2)

    def _generate_project_overview(self):

        if self.docs["project"]["overview"] != "":
            return
        
        architecture = {
            "components": len(self.docs["project"]["files"]),
        }
        
        prompt = f"""
        Generate a technical project overview in English based on this structure:
        {json.dumps(architecture, indent=2)}

        Include:
        - System architecture type
        - Main data flows
        - Critical components
        - Notable patterns
        - Security considerations
        """

        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3
        )
        
        self.docs["project"]["overview"] = response.choices[0].message.content
        self._save_progress()

# API_KEY = "***REMOVED***"
# PROJECT_PATH = "../turnos"
# JSON_PATH = "./turnos.json"

# documenter = AIDocumenter(
#     api_key=API_KEY,
#     code_path=PROJECT_PATH,
#     output_file=JSON_PATH
# )

# documentation = documenter.generate_documentation()