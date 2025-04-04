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
        self.client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key="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",
        )
        print("Initializing AIDocumenter...")
        print(f"Code path: {self.code_path}")
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
        return file_path.suffix in {'.ts', '.js', '.tsx', '.jsx', '.css', '.py', '.scss', '.html'} or file_path.name in ["package.json"]

    def _get_file_analysis(self, code, file_path):
        prompt = f"""
        Analyze this source file and generate documentation in JSON format. Follow this schema:
        {{
            "description": "string",  // Concise technical purpose/functionality. Text that will be used for vector search
        }}

        Important:
        - ONLY return a valid JSON with the above schema.
        - All text in English
        - Focus on technical functionality

        Source File:
        {code[:10000]}
        """
        try:
            response = self.client.chat.completions.create(
                model="deepseek/deepseek-r1-distill-qwen-32b:free",
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ]
            )

            content = response.choices[0].message.content
            
            # Extraer JSON del bloque Markdown
            json_match = re.search(r'```json\s*({.*?})\s*```', content, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
            else:
                json_str = content  # Intentar parsear directamente si no hay backticks
                
            return json.loads(json_str)
        except (json.JSONDecodeError, AttributeError) as e:
            print(f"Error parsing JSON for {file_path}: {str(e)}")
            print(f"Raw response: {content}")
            return {}
        except Exception as e:
            print(f"Error in Gemini API call for {file_path}: {str(e)}")
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
            for file in deleted_files:
                del self.docs["project"]["files"][file]
                self.docs["file_hashes"].pop(file, None) 

            self._save_progress() 

        for file in all_files:
            current_hash = self._compute_file_hash(file)
            relative_path = file.relative_to(self.code_path).as_posix()
            print(f"Processing {relative_path}...")
            if not current_hash:
                continue

            if self.docs["file_hashes"].get(relative_path) == current_hash:
                continue
            
            # For now we only add new files
            if self.docs["file_hashes"].get(relative_path):
                continue

            try:
                self._process_file(file)
                self.docs["file_hashes"][relative_path] = current_hash
                self._save_progress()
            except Exception as e:
                print(f"Error en {file}: {str(e)}")

        return self.docs

    def _save_progress(self):
        with open(self.output_file, 'w') as f:
            json.dump(self.docs, f, indent=2)


API_KEY = "sk-proj-iZUIWIoul2uPT3Si0x1DT3BlbkFJ0fSNIi1EVUCjp5ReYkJu"
PROJECT_PATH = "C:/Users/Usuario/Desktop/guille/coder2/api/sources/67c48e76f8288aad11d6bdf9/coder2"
JSON_PATH = "C:/Users/Usuario/Desktop/guille/coder2/api/sources/67c48e76f8288aad11d6bdf9/coder2.json"

documenter = AIDocumenter(
    api_key=API_KEY,
    code_path=PROJECT_PATH,
    output_file=JSON_PATH
)

documentation = documenter.generate_documentation()