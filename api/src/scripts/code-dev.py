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


client = genai.Client(api_key="***REMOVED***")
top_k = 30

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
    args = parser.parse_args()

    sub_folders = args.subfolders.split(',') if args.subfolders else []
    selected_files = args.selectedFiles.split(',') if args.selectedFiles else []
    carpeta_proyecto = args.project
    instruccion_usuario = args.instruction
    json_path = args.config
    coder_model = args.model
    userId = args.userId

    # documenter = AIDocumenter(
    #     api_key=api_key,
    #     code_path=carpeta_proyecto,
    #     output_file=json_path
    # )

    # documenter.generate_documentation()
    contexto = generar_contexto(instruccion_usuario, carpeta_proyecto, json_path, sub_folders, selected_files)
    cambios = obtener_cambios_openai(contexto, instruccion_usuario, coder_model, carpeta_proyecto, userId)
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

    def query(self, query_text, top_k=top_k):
        if self.embeddings.size == 0:
            return {'error': 'No hay archivos para buscar'}

        queries = [query_text]
        selected_files = self.selected_files

        if selected_files:
            selected_indices = []
            for i, record in enumerate(self.file_records):
                if record['rel_path'] in selected_files:
                    selected_indices.append(i)
            selected_records = [self.file_records[i] for i in selected_indices]

            remaining_k = max(top_k - len(selected_indices), 0)
            rag_records = []

            if len(self.sub_folders) > 0 and remaining_k > 0 and len(self.file_records) > len(selected_indices):
                other_indices = [i for i in range(len(self.file_records)) if i not in selected_indices]
                other_embeddings = self.embeddings[other_indices]

                query_embeds = self.model.encode(queries)
                query_embedding = np.mean(query_embeds, axis=0)
                query_embedding = query_embedding / np.linalg.norm(query_embedding)

                similarities = np.dot(other_embeddings, query_embedding)
                initial_rag_indices = np.argsort(similarities)[::-1][:remaining_k * 2]

                candidates = [self.file_records[other_indices[i]] for i in initial_rag_indices]
                cross_input = [[query_text, cand['embedding_text']] for cand in candidates]
                cross_scores = self.cross_encoder.predict(cross_input)

                ranked_rag_indices = np.argsort(cross_scores)[::-1][:remaining_k]
                final_rag_indices = [other_indices[initial_rag_indices[i]] for i in ranked_rag_indices]

                rag_records = [self.file_records[i] for i in final_rag_indices]

            all_records = selected_records + rag_records
            all_records = all_records[:top_k]
        else:
            query_embeds = self.model.encode(queries)
            query_embedding = np.mean(query_embeds, axis=0)
            query_embedding = query_embedding / np.linalg.norm(query_embedding)

            similarities = np.dot(self.embeddings, query_embedding)
            initial_indices = np.argsort(similarities)[::-1][:top_k * 2]

            candidates = [self.file_records[i] for i in initial_indices]
            cross_input = [[query_text, cand['embedding_text']] for cand in candidates]
            cross_scores = self.cross_encoder.predict(cross_input)

            ranked_indices = np.argsort(cross_scores)[::-1][:top_k]
            final_indices = [initial_indices[i] for i in ranked_indices]

            all_records = [self.file_records[i] for i in final_indices]

        results = []
        for record in all_records:
            results.append({
                'file_path': record['abs_path'],
                'tokens': record['tokens'],
                'code': self._get_code_snippet(record['abs_path']),
            })

        return { 'results': results, 'queries': queries}

def generar_contexto(instruccion_usuario, carpeta_proyecto, json_path, sub_folders, selected_files):
    code_base_path = carpeta_proyecto + "/"
    rag = CodeRAG(code_base_path, json_path, sub_folders, selected_files).query(instruccion_usuario)

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

        # Calcular costos
        input_cost = (prompt_tokens * input_price_usd_per_M) / 1_000_000
        output_cost = (completion_tokens * output_price_usd_per_M) / 1_000_000
        total_cost = input_cost + output_cost

        # Actualizar saldo del usuario
        users_collection = db["users"]
        users_collection.update_one(
            {"_id": ObjectId(userId)},
            {"$inc": {"saldo": -total_cost}}
        )

        # Registrar transacción
        transaction = {
            "userId": ObjectId(userId),
            "project_name": project_name,
            "model": model,
            "input_tokens": prompt_tokens,
            "output_tokens": completion_tokens,
            "input_cost": input_cost,
            "output_cost": output_cost,
            "total_cost": total_cost,  # Agregar costo total para facilitar consulta
            "delay": duration,          # Agregar demora
            "timestamp": datetime.now()
        }

        db["tokensUsage"].insert_one(transaction)
        client.close()

    except Exception as e:
        print(f"Error en actualización de tokens: {str(e)}")

def obtener_cambios_openai(contexto, instruccion_usuario, coder_model, carpeta_proyecto, userId):
    """Envía la consulta a OpenAI y obtiene los cambios necesarios en formato JSON."""
    prompt = f"""
        ### Role:
        You are a Surgical Code Editor AI. Your sole purpose is to apply specific code changes requested by the user and output the *entire modified file(s)* with *absolute precision*, making NO other alterations.

        ### Core Directive:
        Analyze the User Request and the Project Context. Identify the exact file(s) needing modification. Apply ONLY the changes specified in the User Request. Output the complete content of each modified file using the specified format.

        ### User Request:
        {contexto.get('query', instruccion_usuario)}

        ### Project Context:
        {contexto.get('context', '')} # This contains the original code for relevant files.

        ### Strict Output Format:
        For EACH file you modify, use this exact structure:
        --------------------
        [full/file/path/from/root]
        +++++
        [ENTIRE MODIFIED FILE CONTENT]
        --------------------

        ### Critical Rules for Modification and Output:

        1.  **Minimal Change Principle:**
            *   Modify ONLY the specific lines/sections of code necessary to implement the User Request.
            *   DO NOT add, remove, or change ANY code, comments, or formatting that is not explicitly part of the requested change.
            *   DO NOT refactor code or add explanatory comments unless the User Request specifically asks for it.

        2.  **Preserve Original Structure & Style:**
            *   Maintain the original file's indentation, spacing, naming conventions, and overall code style precisely.
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

        ### FINAL CHECK: Ensure your output strictly follows the format and contains only the necessary, minimal code changes requested by the user, preserving everything else.
    """

    max_retries = 3
    retry_count = 0
    last_exception = None

    while retry_count < max_retries:
        try:
            start_time = time.time() # Start timer
            response = client.models.generate_content(
                model="gemini-2.5-pro-exp-03-25", contents=prompt
            )
            end_time = time.time() # End timer
            duration = end_time - start_time # Calculate duration

            # Robust check for response structure before accessing content
            if response and response.text and response.usage_metadata.candidates_token_count:
                content = response.text
                # If successful, update usage and return content
                try:
                    input_tokens = response.usage_metadata.prompt_token_count
                    output_tokens = response.usage_metadata.candidates_token_count
                    # Use the actual model called for usage tracking
                    _update_tokens_usage(input_tokens, output_tokens, carpeta_proyecto, coder_model, userId, duration) # Pass duration
                except Exception as e:
                    print(f"Error updating token usage: {e}", file=sys.stderr)

                return content # Success, return content
            else:
                 # Handle cases where the response structure is not as expected
                 raise AttributeError("Unexpected response structure from API.")


        except (TypeError, AttributeError, IndexError) as e: # Catch potential errors accessing potentially None objects or incorrect structure
            last_exception = e
            retry_count += 1
            print(f"Attempt {retry_count}/{max_retries} failed: Error processing response - {e}. Response: {response}", file=sys.stderr) # Log the response for debugging
            if retry_count < max_retries:
                print("Retrying in 1 second...", file=sys.stderr)
                time.sleep(1) # Wait before retrying
            else:
                print(f"Max retries reached. Error processing OpenAI response: {e}", file=sys.stderr)
                return "" # Return empty string after max retries

        except Exception as e: # Catch other potential API errors (network, auth, etc.)
            last_exception = e
            retry_count += 1
            print(f"Attempt {retry_count}/{max_retries} failed: OpenAI API Error - {e}", file=sys.stderr)
            if retry_count < max_retries:
                 print("Retrying in 1 second...", file=sys.stderr)
                 time.sleep(1) # Wait before retrying
            else:
                print(f"Max retries reached. Error al obtener cambios de OpenAI: {e}", file=sys.stderr)
                return "" # Return empty string after max retries

    # Fallback if loop somehow exits without returning
    print(f"Failed after {max_retries} attempts. Last error: {last_exception}", file=sys.stderr)
    return ""

if __name__ == "__main__":
    main()