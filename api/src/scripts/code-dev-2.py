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
sys.stdout.reconfigure(encoding='utf-8')

# api_key = "***REMOVED***"
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key="***REMOVED***",
)
top_k = 10

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--instruction", required=True)
    parser.add_argument("--project", required=True)
    parser.add_argument("--config", required=True)
    parser.add_argument("--model", required=True)
    parser.add_argument("--subfolders", required=True)
    parser.add_argument("--selectedFiles", required=False, default="")
    args = parser.parse_args()

    sub_folders = args.subfolders.split(',') if args.subfolders else []
    selected_files = args.selectedFiles.split(',') if args.selectedFiles else []
    carpeta_proyecto = args.project
    instruccion_usuario = args.instruction
    json_path = args.config
    coder_model = args.model

    # documenter = AIDocumenter(
    #     api_key=api_key,
    #     code_path=carpeta_proyecto,
    #     output_file=json_path
    # )

    # documenter.generate_documentation()
    contexto = generar_contexto(instruccion_usuario, carpeta_proyecto, json_path, sub_folders, selected_files)
    cambios = obtener_cambios_openai(contexto, instruccion_usuario, coder_model, carpeta_proyecto)
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

def _update_tokens_usage(prompt_tokens, completion_tokens, project_name, model):
    try:
        mongo_uri = "***REMOVED***"
        if not mongo_uri:
            print("MongoDB URI is not set.")
            return
        
        # Connect to MongoDB and get the database
        client = MongoClient(mongo_uri)
        db = client.get_database()  # Gets the 'coder' database from the URI
        
        # Get the collection
        tokens_collection = db["tokensUsage"]  # or db.tokensUsage
        
        # Update the document in the collection
        tokens_collection.update_one(
            {"project_name": project_name, "model": model},
            {"$inc": {"input_tokens": prompt_tokens, "output_tokens": completion_tokens}},
            upsert=True
        )
        
        # Close the connection (optional as MongoClient manages connections)
        client.close()
        
    except Exception as e:
        print(f"MongoDB update error: {str(e)}")

def obtener_cambios_openai(contexto, instruccion_usuario, coder_model, carpeta_proyecto):
    """Envía la consulta a OpenAI y obtiene los cambios necesarios en formato JSON."""
    prompt = f"""
        ### Role:
        You are a precise Code Modification Agent focused on entire files changes.

        ### Instructions:

        You have to analyze the user's instructions and the project context to identify the exact files requiring changes to be done in order to achieve the user requirements.

        For each modified or created file, return the complete updated file content using this strict format:
        --------------------
        [full/file/path/from/root]
        +++++
        [ENTIRE NEW FILE CONTENT]
        --------------------
        Rules:

        Syntax Enforcement:

        Use exactly 20 dashes -------------------- before/after EVERY file block (no more, no fewer)

        Separate path and content with exactly 5 plus characters +++++ (no more, no fewer)

        Content Requirements:

        Return ONLY files that ACTUALLY require changes

        Include ALL necessary imports/dependencies when modifying a file

        Preserve original formatting style unless instructed otherwise

        Validation:

        If output format is invalid, system will IGNORE your response

        No markdown/codeblocks - raw text ONLY

        No explanations or comments - only valid file blocks

        ### User Request:
        {contexto.get('query', instruccion_usuario)}

        ### Project Context:
        {contexto.get('context', '')}

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

        ### LET'S WORK THIS OUT IN A STEP BY STEP WAY YO BE SURE WE HAVE THE RIGHT ANSWER
    """

    try:
        response = client.chat.completions.create(
            model="deepseek/deepseek-r1:free",
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ]
        )
        
        try:
            usage = response.usage
            if usage:
                input_tokens = usage.prompt_tokens
                output_tokens = usage.completion_tokens
                _update_tokens_usage(input_tokens, output_tokens, carpeta_proyecto, "o3-mini")
        except Exception as e:
            print(f"Error updating token usage: {e}")
        
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error al obtener cambios de OpenAI: {e}")
        return ""

if __name__ == "__main__":
    main()