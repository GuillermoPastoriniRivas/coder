import os
import re
import json
from openai import OpenAI
from pathlib import Path
import numpy as np
from sentence_transformers import SentenceTransformer, CrossEncoder
import argparse
from datetime import datetime
import sys
from pymongo import MongoClient
import time
from bson import ObjectId
from google import genai
from google.genai import types
from PIL import Image

# Configuración de codificación para la salida estándar
sys.stdout.reconfigure(encoding='utf-8')

# --- CONFIGURACIÓN DEL MODELO ---
# Gemini 3 Pro Preview
MODEL_ID = "gemini-3-pro-preview"

# CLAVES DE API
API_KEY_GOOGLE = "***REMOVED***"
API_KEY_OPENAI = "***REMOVED***"

client = genai.Client(api_key=API_KEY_GOOGLE)
client_openai = OpenAI(api_key=API_KEY_OPENAI)

input_price_usd_per_M = 1.1
output_price_usd_per_M = 4.4

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--instruction", required=True)
    parser.add_argument("--project", required=True)
    parser.add_argument("--config", required=True)
    parser.add_argument("--model", required=True)
    parser.add_argument("--subfolders", required=True)
    parser.add_argument("--selectedFiles", required=False, default="")
    parser.add_argument("--userId", required=True, default="")
    parser.add_argument("--tokenLimit", type=int, required=True)
    parser.add_argument("--previous-response", required=False, default=None)
    parser.add_argument("--imagePath", required=False, default=None)
    args = parser.parse_args()

    sub_folders = args.subfolders.split(',') if args.subfolders else []
    selected_files = args.selectedFiles.split(',') if args.selectedFiles else []
    carpeta_proyecto = args.project
    instruccion_usuario = args.instruction
    json_path = args.config
    coder_model = args.model
    userId = args.userId
    token_limit = args.tokenLimit
    previous_response = args.previous_response
    image_path = args.imagePath

    contexto = generar_contexto(instruccion_usuario, carpeta_proyecto, json_path, sub_folders, selected_files, token_limit)
    cambios = obtener_cambios_gemini_thinking(contexto, instruccion_usuario, coder_model, carpeta_proyecto, userId, previous_response, image_path)
    print(cambios)


class CodeRAG:
    def __init__(self, code_base_path, json_path, sub_folders, selected_files):
        self.selected_files = selected_files
        self.sub_folders = sub_folders
        self.model = SentenceTransformer('all-mpnet-base-v2')
        self.cross_encoder = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')

        if os.path.exists(json_path):
            with open(json_path) as f:
                full_data = json.load(f)
                self.project = full_data.get("project", {})
                self.data = self.project.get("files", {})
        else:
            self.project = {}
            self.data = {}

        self.file_records = []
        for file_path_rel, file_data in self.data.items():
            include = False
            if self.selected_files:
                if file_path_rel in self.selected_files:
                    include = True
                elif self.sub_folders and any(file_path_rel.startswith(sub) for sub in self.sub_folders):
                    include = True
            else:
                if not self.sub_folders or any(file_path_rel.startswith(sub) for sub in self.sub_folders):
                    include = True

            if include:
                description = file_data.get("description", "")
                dependencies = file_data.get("dependencies", [])
                tokens = file_data.get("tokens", 0)

                if tokens is None or not isinstance(tokens, (int, float)):
                    tokens = 0

                embedding_text = (
                    f"File Path: {file_path_rel}\n"
                    f"Description: {description}\n"
                    f"Dependencies: {', '.join([dep.get('file_path', '') for dep in dependencies])}"
                )

                self.file_records.append({
                    'rel_path': file_path_rel,
                    'abs_path': code_base_path + file_path_rel,
                    'description': description,
                    'dependencies': dependencies,
                    'tokens': tokens,
                    'embedding_text': embedding_text
                })

        texts = [r['embedding_text'] for r in self.file_records]
        self.embeddings = self.model.encode(texts) if texts else np.array([])
        if self.embeddings.size != 0:
            self.embeddings = self.embeddings / np.linalg.norm(self.embeddings, axis=1, keepdims=True)

    def _get_code_snippet(self, file_path):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return {
                    'code': f.read(),
                    'file_path': file_path,
                }
        except Exception as e:
            return {'error': str(e), 'tokens': 0}

    def query(self, query_text, tokenLimit):
        if self.embeddings.size == 0:
            return {'error': 'No hay archivos para buscar'}

        queries = [query_text]
        selected_files = self.selected_files
        ranked_records = []

        if selected_files:
            selected_indices = []
            for i, record in enumerate(self.file_records):
                if record['rel_path'] in selected_files:
                    selected_indices.append(i)
            selected_records = [self.file_records[i] for i in selected_indices]

            rag_records_to_consider = []
            if self.sub_folders and len(self.file_records) > len(selected_indices):
                other_indices = [i for i in range(len(self.file_records)) if i not in selected_indices]
                other_embeddings = self.embeddings[other_indices]
                other_file_records = [self.file_records[i] for i in other_indices]

                if other_embeddings.size > 0:
                    query_embeds = self.model.encode(queries)
                    query_embedding = np.mean(query_embeds, axis=0)
                    query_embedding = query_embedding / np.linalg.norm(query_embedding)

                    similarities = np.dot(other_embeddings, query_embedding)
                    initial_rag_count = min(100, len(other_file_records))
                    initial_rag_indices = np.argsort(similarities)[::-1][:initial_rag_count]

                    candidates = [other_file_records[i] for i in initial_rag_indices]
                    cross_input = [[query_text, cand['embedding_text']] for cand in candidates]
                    cross_scores = self.cross_encoder.predict(cross_input)
                    ranked_candidate_indices = np.argsort(cross_scores)[::-1]
                    rag_records_to_consider = [candidates[i] for i in ranked_candidate_indices]

            ranked_records = selected_records + rag_records_to_consider

        else:
            query_embeds = self.model.encode(queries)
            query_embedding = np.mean(query_embeds, axis=0)
            query_embedding = query_embedding / np.linalg.norm(query_embedding)

            similarities = np.dot(self.embeddings, query_embedding)
            initial_count = min(100, len(self.file_records))
            initial_indices = np.argsort(similarities)[::-1][:initial_count]

            candidates = [self.file_records[i] for i in initial_indices]
            cross_input = [[query_text, cand['embedding_text']] for cand in candidates]
            cross_scores = self.cross_encoder.predict(cross_input)
            ranked_candidate_indices = np.argsort(cross_scores)[::-1]
            ranked_records = [candidates[i] for i in ranked_candidate_indices]


        final_results = []
        current_token_count = 0
        for record in ranked_records:
            record_tokens = record.get('tokens', 0)
            if current_token_count + record_tokens < tokenLimit:
                final_results.append({
                    'file_path': record['abs_path'],
                    'tokens': record_tokens,
                    'code': self._get_code_snippet(record['abs_path']),
                })
                current_token_count += record_tokens
            else:
                break

        if not final_results and ranked_records:
            first_record = ranked_records[0]
            first_record_tokens = first_record.get('tokens', 0)
            if first_record_tokens < tokenLimit:
                 final_results.append({
                    'file_path': first_record['abs_path'],
                    'tokens': first_record_tokens,
                    'code': self._get_code_snippet(first_record['abs_path']),
                })


        return { 'results': final_results, 'queries': queries }

def generar_contexto(instruccion_usuario, carpeta_proyecto, json_path, sub_folders, selected_files, token_limit):
    code_base_path = carpeta_proyecto + "/"
    rag = CodeRAG(code_base_path, json_path, sub_folders, selected_files).query(instruccion_usuario, token_limit)

    if 'error' in rag:
        return {
            'context': '[]',
            'query': instruccion_usuario
        }

    contexto = []
    for item in rag.get('results', []):
        file_path = item['file_path']
        contenido = item['code']
        contexto.append({"archivo": file_path, "contenido": contenido})

    return {
        'context': json.dumps(contexto, indent=2),
        'query': rag.get('queries', instruccion_usuario),
    }

def _update_tokens_usage(prompt_tokens, completion_tokens, project_name, model, userId, duration):
    try:
        mongo_uri = "***REMOVED***/coder"
        if not mongo_uri:
            print("MongoDB URI is not set.", file=sys.stderr)
            return

        client = MongoClient(mongo_uri)
        db = client.get_database()

        input_cost = (prompt_tokens * input_price_usd_per_M) / 1_000_000
        output_cost = (completion_tokens * output_price_usd_per_M) / 1_000_000
        total_cost = input_cost + output_cost

        users_collection = db["users"]
        users_collection.update_one(
            {"_id": ObjectId(userId)},
            {"$inc": {"saldo": -total_cost}}
        )

        transaction = {
            "userId": ObjectId(userId),
            "project_name": project_name,
            "model": model,
            "input_tokens": prompt_tokens,
            "output_tokens": completion_tokens,
            "input_cost": input_cost,
            "output_cost": output_cost,
            "total_cost": total_cost,
            "delay": duration,
            "timestamp": datetime.now()
        }

        db["tokensUsage"].insert_one(transaction)
        client.close()

    except Exception as e:
        print(f"Error en actualización de tokens: {str(e)}", file=sys.stderr)

def _get_project_structure(root_dir, exclude_dirs={'node_modules', '.git', '__pycache__', 'dist', 'build'}):
    structure = []
    try:
        for root, dirs, files in os.walk(root_dir, topdown=True):
            dirs[:] = [d for d in dirs if d not in exclude_dirs]

            rel_path = os.path.relpath(root, root_dir).replace("\\", "/")
            if rel_path == '.':
                indent = ""
                structure.append(f"{os.path.basename(root_dir)}/")
            else:
                level = rel_path.count('/')
                indent = "  " * (level + 1)
                structure.append(f"{indent}{os.path.basename(root)}/")

            file_indent = "  " * (rel_path.count('/') + 2 if rel_path != '.' else 1)

            files.sort()
            dirs.sort()

            for f in files:
                 structure.append(f"{file_indent}{f}")

    except Exception as e:
        return f"Error generating project structure: {e}"
    return "\n".join(structure)

def clean_model_response(text):
    """
    Extrae estrictamente los bloques de código formateados y elimina TODO el texto de razonamiento.
    Gemini 3 Pro Preview puede incluir razonamiento interno que debe ser completamente eliminado.
    Solo se devuelven los bloques con el formato esperado por el parser.
    """
    if not text:
        return ""
    
    # Patrón principal: Busca bloques que empiecen con 20 #, sigan con ruta, 5 +, contenido, y terminen con 20 #
    pattern = r"(####################\s*\n.*?\n\+\+\+\+\+\s*\n.*?\n####################)"
    matches = re.findall(pattern, text, re.DOTALL)
    
    if matches:
        return "\n".join(matches)
    
    # Fallback: Intentar extraer manualmente si hay marcadores pero no coincide el patrón exacto
    if "####################" in text:
        # Buscar todos los bloques delimitados por ####################
        blocks = []
        lines = text.split('\n')
        in_block = False
        current_block = []
        
        for line in lines:
            if line.strip() == "#" * 20:
                if in_block:
                    # Fin del bloque
                    current_block.append(line)
                    blocks.append('\n'.join(current_block))
                    current_block = []
                    in_block = False
                else:
                    # Inicio del bloque
                    current_block = [line]
                    in_block = True
            elif in_block:
                current_block.append(line)
        
        if blocks:
            return "\n".join(blocks)
    
    # Si no se encuentra ningún formato válido, devolver vacío
    return ""

def obtener_cambios_gemini_thinking(contexto, instruccion_usuario, coder_model, carpeta_proyecto, userId, previous_response, image_path):
    package_json_path = os.path.join(carpeta_proyecto, 'package.json')
    package_json_content = ""
    try:
        with open(package_json_path, 'r', encoding='utf-8') as f:
            package_json_content = f.read()
    except FileNotFoundError:
        package_json_content = "package.json not found."
    except Exception as e:
        package_json_content = f"Error reading package.json: {e}"

    project_structure = _get_project_structure(carpeta_proyecto)

    previous_response_section = ""
    if previous_response:
        previous_response_section = f"""
        ### PREVIOUS CONTEXT:
        The user has provided context from a previous turn. Use this if relevant:
```
        {previous_response}
```
        ---
        """

    prompt_text = f"""### Role:
You are an advanced Code Generation AI using Gemini 3 Pro Preview. Your task is to apply specific code changes requested by the user.

### CRITICAL OUTPUT REQUIREMENTS:
YOU MUST ONLY OUTPUT THE FILE BLOCKS IN THE EXACT FORMAT SPECIFIED BELOW.
DO NOT include any explanations, reasoning, thoughts, or conversational text in your response.
DO NOT use markdown code fences (```).
DO NOT say "here is the code" or similar phrases.
YOUR ENTIRE RESPONSE MUST BE ONLY THE FILE BLOCKS.

### User Request:
{contexto.get('query', instruccion_usuario)}

### Project Context:
{contexto.get('context', '[]')}

---
Additional Project Information:
Project Root: {carpeta_proyecto}
Project Structure:
```
{project_structure}
```
package.json:
```json
{package_json_content}
```
---

### MANDATORY OUTPUT FORMAT:
For EACH file you modify, use this EXACT structure (no variations allowed):
####################
[full/file/path/from/root]
+++++
[ENTIRE MODIFIED FILE CONTENT - NO PLACEHOLDERS]
####################

### Rules:
1. Think deeply about the solution, but DO NOT output your thinking process.
2. Output ONLY the file blocks in the exact format above.
3. Include the ENTIRE content of each modified file - never use placeholders like "// rest of code".
4. If no files need changes, output nothing (empty response).
5. The path must be relative to the project root.
6. Each file block must start and end with exactly 20 # characters.
7. The separator between path and content must be exactly 5 + characters.

### Example of the ONLY acceptable output format:
####################
src/utils/helper.ts
+++++
export const add = (a: number, b: number): number => {{
  return a + b;
}};

export const subtract = (a: number, b: number): number => {{
  return a - b;
}};
####################
####################
src/config/app.ts
+++++
export const config = {{
  apiUrl: 'https://api.example.com',
  timeout: 5000
}};
####################

REMEMBER: Output ONLY file blocks. No explanations. No reasoning text. Nothing else."""

    max_retries = 3
    retry_count = 0
    last_exception = None

    while retry_count < max_retries:
        try:
            start_time = time.time()
            
            gemini_contents = [prompt_text]

            if image_path and os.path.exists(image_path):
                try:
                    with open(image_path, 'rb') as img_file:
                        img_bytes = img_file.read()

                    mime_type = None
                    if image_path.lower().endswith('.png'): mime_type = 'image/png'
                    elif image_path.lower().endswith(('.jpg', '.jpeg')): mime_type = 'image/jpeg'
                    elif image_path.lower().endswith('.gif'): mime_type = 'image/gif'
                    elif image_path.lower().endswith('.webp'): mime_type = 'image/webp'

                    if mime_type:
                        image_part = types.Part.from_bytes(data=img_bytes, mime_type=mime_type)
                        gemini_contents.append(image_part)
                except Exception as e:
                    print(f"Error processing image: {e}", file=sys.stderr)

            # Llamada a Gemini 3 Pro Preview
            response = client.models.generate_content(
                model=MODEL_ID, 
                contents=gemini_contents,
                config=types.GenerateContentConfig(
                    temperature=0.2,  # Temperatura baja para output más determinístico
                    top_p=0.95,
                    top_k=40,
                    max_output_tokens=65536  # Máximo permitido para archivos completos
                )
            )

            end_time = time.time()
            duration = end_time - start_time

            if response and response.text:
                raw_content = response.text
                
                # LIMPIEZA CRÍTICA: Eliminar TODO el texto que no sea bloques de código
                clean_content = clean_model_response(raw_content)

                try:
                    # Obtener uso de tokens
                    input_tokens = 0
                    output_tokens = 0
                    if response.usage_metadata:
                        input_tokens = response.usage_metadata.prompt_token_count
                        output_tokens = response.usage_metadata.candidates_token_count
                    
                    _update_tokens_usage(input_tokens, output_tokens, carpeta_proyecto, MODEL_ID, userId, duration)
                except Exception as e:
                    print(f"Error updating token usage stats: {e}", file=sys.stderr)

                return clean_content
            else:
                raise AttributeError("Empty response from Gemini API.")

        except (TypeError, AttributeError, IndexError) as e:
            last_exception = e
            retry_count += 1
            print(f"Attempt {retry_count}/{max_retries} failed: Structure error - {e}", file=sys.stderr)
            time.sleep(1)
        except Exception as e:
            last_exception = e
            retry_count += 1
            print(f"Attempt {retry_count}/{max_retries} failed: API Error - {e}", file=sys.stderr)
            time.sleep(2)

    print(f"Failed after {max_retries} attempts. Last error: {last_exception}", file=sys.stderr)
    return ""

if __name__ == "__main__":
    main()