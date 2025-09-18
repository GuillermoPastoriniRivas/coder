import os
import re
import json
from openai import OpenAI
from pathlib import Path
import numpy as np
from sentence_transformers import SentenceTransformer, CrossEncoder
from aidoc import AIDocumenter
import argparse
from datetime import datetime
import sys
from pymongo import MongoClient
import time
from bson import ObjectId
from datetime import datetime
from google import genai

sys.stdout.reconfigure(encoding='utf-8')

# ***REMOVED***
# ***REMOVED***
# ***REMOVED*** previus
# ***REMOVED***
client = genai.Client(api_key="***REMOVED***")
# top_k = 50 # Removed top_k

api_key_openai = "***REMOVED***"
client_openai = OpenAI(api_key=api_key_openai)

input_price_usd_per_M = 1.1
output_price_usd_per_M = 4.4

current_model = "google/gemini-2.5-pro-exp-03-25:free"
# google/gemini-2.5-pro-exp-03-25:free
# google/gemini-2.0-pro-exp-02-05:free

# google/gemini-2.0-flash-thinking-exp:free
# google/gemini-2.0-flash-exp

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
    parser.add_argument("--previous-response", required=False, default=None) # Add new argument for previous response
    args = parser.parse_args()

    sub_folders = args.subfolders.split(',') if args.subfolders else []
    selected_files = args.selectedFiles.split(',') if args.selectedFiles else []
    carpeta_proyecto = args.project
    instruccion_usuario = args.instruction
    json_path = args.config
    coder_model = args.model
    userId = args.userId
    token_limit = args.tokenLimit
    previous_response = args.previous_response # Get previous response

    contexto = generar_contexto(instruccion_usuario, carpeta_proyecto, json_path, sub_folders, selected_files, token_limit)
    cambios = obtener_cambios_openai(contexto, instruccion_usuario, coder_model, carpeta_proyecto, userId, previous_response) # Pass previous_response
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
                    print(f"Warning: Invalid token count '{tokens}' for file {file_path_rel}. Defaulting to 0.")
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
            print("MongoDB URI is not set.")
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
        print(f"Error en actualización de tokens: {str(e)}")

def _get_project_structure(root_dir, exclude_dirs={'node_modules', '.git', '__pycache__', 'dist', 'build'}):
    structure = []
    try:
        for root, dirs, files in os.walk(root_dir, topdown=True):
            dirs[:] = [d for d in dirs if d not in exclude_dirs]

            rel_path = os.path.relpath(root, root_dir).replace("\\", "/") # Use forward slashes
            # Skip the root directory itself if needed, or format it differently
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
    
def obtener_cambios_openai(contexto, instruccion_usuario, coder_model, carpeta_proyecto, userId, previous_response):
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
    # if previous_response:
    #     previous_response_section = f"""
    #     ### PREVIOUS RESPONSE:
    #     This is the assistant's previous response in the ongoing conversation.
    #     ```
    #     {previous_response}
    #     ```
    #     ---
    #     """

    prompt = f"""
        ### Role:
        You are a Code Editor Assistant AI. Your purpose is to apply specific code changes requested by the user and output the *entire modified file(s)* with *absolute precision*, making NO other alterations.

        ### Core Directive:
        Analyze the User Request and the Project Context. Identify the exact file(s) needing modification. Apply ONLY the changes specified in the User Request. Output the complete content of each modified file using the specified format.

        ### User Request:
        {contexto.get('query', instruccion_usuario)}

        {previous_response_section}

        ### Project Context:
        This contains the original code for relevant files selected by the RAG process:
        {contexto.get('context', '[]')}

        ---
        Additional Project Information:

        Project Root: {carpeta_proyecto}

        Project Structure Overview:
        ```
        {project_structure}
        ```

        package.json:
        ```json
        {package_json_content}
        ```
        ---

        ### Strict Output Format:
        For EACH file you modify, use this exact structure:
        --------------------
        [full/file/path/from/root]
        +++++
        [ENTIRE MODIFIED FILE CONTENT]
        --------------------

        ### Coding Best Practices
            AVOID add comments to the code you write, unless the user asks you to.
            When making changes to files, first understand the file's code conventions. Mimic code style, use existing libraries and utilities, and follow existing patterns.
            NEVER assume that a given library is available, even if it is well known. Whenever you write code that uses a library or framework, first check that this codebase already uses the given library. For example, you might look at neighboring files, or check the package.json (or cargo.toml, and so on depending on the language).
            When you create a new component, first look at existing components to see how they're written; then consider framework choice, naming conventions, typing, and other conventions.
            When you edit a piece of code, first look at the code's surrounding context (especially its imports) to understand the code's choice of frameworks and libraries. Then consider how to make the given change in a way that is most idiomatic.

        ### Critical Rules for Modification and Output:

        1.  **Minimal Change Principle:**
            *   Modify ONLY the specific lines/sections of code necessary to implement the User Request. WITHOUT adding any comments.
            *   Keep all other code completely unchanged — including comments, formatting, naming, and structure — unless explicitly instructed otherwise
            *   Maintain the original style of the code without performing any refactoring, improvements, or additions unless the user clearly asks for them.

        2.  **Preserve Original Structure & Style:**
            *   Use the original file's indentation, spacing, naming conventions, and overall code style precisely.
            *   The output file content must be identical to the input context, *except* for the targeted modifications.

        3.  **Completeness:**
            *   Return the *entire* content of the modified file(s), including all original lines that were not changed.
            *   Ensure all necessary imports/dependencies are present if the changes require them.

        4.  **Format Enforcement:**
            *   Use exactly 20 dashes (`--------------------`) before and after each file block.
            *   Use exactly 5 plus signs (`+++++`) to separate the file path and content.
            *   Output ONLY the file blocks in the specified format. NO introductory text, NO explanations, NO summaries, NO markdown code fences (```).

        5.  **Accuracy:**
            *   Only output files that were actually modified. If no files need changes based on the request, output nothing.

        6. IMPORTANT! **Avoid Explanation and Comments:** 
            *   The output should be purely the modified code. It's not necesary to explain the changes or provide comments within the code.

        ### Example Output Structure:
        --------------------
        api/src/utils/logger.ts
        +++++
        <ENTIRE NEW FILE CONTENT>
        --------------------
        --------------------
        ui/src/components/SearchBar.jsx
        +++++
        <ENTIRE NEW FILE CONTENT>
        --------------------

        ### FINAL CHECK: Ensure your output strictly follows the format and contains only the necessary, minimal code changes requested by the user withput comments, preserving everything else.
    """

    max_retries = 3
    retry_count = 0
    last_exception = None

    while retry_count < max_retries:
        try:
            start_time = time.time()
            
            end_time = time.time()
            duration = end_time - start_time


            response = client.models.generate_content(
                model="gemini-2.5-flash-preview-05-20", contents=prompt
            )
            if response and response.text and response.usage_metadata.candidates_token_count:
                content = response.text
                try:
                    input_tokens = response.usage_metadata.prompt_token_count
                    output_tokens = response.usage_metadata.candidates_token_count
                    _update_tokens_usage(input_tokens, output_tokens, carpeta_proyecto, coder_model, userId, duration)
                except Exception as e:
                    print(f"Error updating token usage: {e}", file=sys.stderr)

                return content
            else:
                 raise AttributeError("Unexpected response structure from API.")

            # response = client_openai.responses.create(
            #     model="o4-mini",
            #     input=[
            #         {
            #             "role": "user",
            #             "content": prompt,
            #         }
            #     ]
            # )
            
            # try:
            #     usage = response.usage
            #     if usage:
            #         input_tokens = usage.input_tokens
            #         output_tokens = usage.output_tokens
            #         _update_tokens_usage(input_tokens, output_tokens, carpeta_proyecto, "o3-mini", userId, duration)
            # except Exception as e:
            #     print(f"Error updating token usage: {e}")


        except (TypeError, AttributeError, IndexError) as e: # Catch potential errors accessing potentially None objects or incorrect structure
            last_exception = e
            retry_count += 1
            print(f"Attempt {retry_count}/{max_retries} failed: Error processing response - {e}. Response: {response}", file=sys.stderr)
            if retry_count < max_retries:
                print("Retrying in 1 second...", file=sys.stderr)
                time.sleep(1)
            else:
                print(f"Max retries reached. Error processing OpenAI response: {e}", file=sys.stderr)
                return ""
        except Exception as e:
            last_exception = e
            retry_count += 1
            print(f"Attempt {retry_count}/{max_retries} failed: OpenAI API Error - {e}", file=sys.stderr)
            if retry_count < max_retries:
                 print("Retrying in 1 second...", file=sys.stderr)
                 time.sleep(1)
            else:
                print(f"Max retries reached. Error al obtener cambios de OpenAI: {e}", file=sys.stderr)
                return ""

    print(f"Failed after {max_retries} attempts. Last error: {last_exception}", file=sys.stderr)
    return ""

if __name__ == "__main__":
    main()