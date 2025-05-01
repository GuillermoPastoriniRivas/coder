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
import tiktoken # Added for token counting in snippets

sys.stdout.reconfigure(encoding='utf-8')

# AIzaSyCUDyQ7MwxmXSvK1yWYUNtMZlGtk4S9g74
# AIzaSyCZ5VeaVzxDBU4tPhvqjV7858NFfiMCWC0
# AIzaSyDftYyy8HKgn7hJqA2awBGG6Ub1m6067co
client = genai.Client(api_key="AIzaSyCUDyQ7MwxmXSvK1yWYUNtMZlGtk4S9g74")
# top_k = 50 # Removed top_k

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
    # parser.add_argument("--tokenLimit", type=int, required=True) # Removed tokenLimit argument
    args = parser.parse_args()

    sub_folders = args.subfolders.split(',') if args.subfolders else []
    selected_files = args.selectedFiles.split(',') if args.selectedFiles else []
    carpeta_proyecto = args.project
    instruccion_usuario = args.instruction
    json_path = args.config
    coder_model = args.model
    userId = args.userId
    # token_limit = args.tokenLimit # Removed token limit

    # documenter = AIDocumenter(
    #     api_key=api_key,
    #     code_path=carpeta_proyecto,
    #     output_file=json_path
    # )

    # documenter.generate_documentation()
    # Pass top_k=20 instead of token_limit
    contexto = generar_contexto(instruccion_usuario, carpeta_proyecto, json_path, sub_folders, selected_files)
    cambios = obtener_cambios_openai(contexto, instruccion_usuario, coder_model, carpeta_proyecto, userId)
    print(cambios)


class CodeRAG:
    def __init__(self, code_base_path, json_path, sub_folders, selected_files):
        self.selected_files = selected_files
        self.sub_folders = sub_folders
        self.model = SentenceTransformer('all-mpnet-base-v2')
        self.cross_encoder = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')
        self.encoder = tiktoken.get_encoding("cl100k_base") # Initialize encoder

        # Load file metadata if available (e.g., descriptions from JSON)
        # This JSON might not be strictly necessary if we chunk all code anyway,
        # but could be used to pre-filter files if needed.
        if os.path.exists(json_path):
            try:
                with open(json_path, 'r', encoding='utf-8') as f:
                    full_data = json.load(f)
                    self.project = full_data.get("project", {})
                    self.data = self.project.get("files", {})
            except (json.JSONDecodeError, Exception):
                self.project = {}
                self.data = {}
        else:
            self.project = {}
            self.data = {}

        self.chunk_records = []
        all_chunk_texts = []

        # Determine which files to process based on selection/subfolders
        files_to_process = []
        if self.data: # If JSON metadata exists, use it to filter files
            for file_path_rel, file_data in self.data.items():
                if not isinstance(file_data, dict): continue
                include = False
                if self.selected_files:
                    if file_path_rel in self.selected_files: include = True
                    elif self.sub_folders and any(file_path_rel.startswith(sub.strip() + '/') or file_path_rel == sub.strip() for sub in self.sub_folders if sub.strip()): include = True
                else:
                    if not self.sub_folders or any(file_path_rel.startswith(sub.strip() + '/') or file_path_rel == sub.strip() for sub in self.sub_folders if sub.strip()): include = True

                if include:
                    files_to_process.append(file_path_rel)
        else: # Fallback: Scan the directory if JSON is missing/empty
             # Warning: This might be slow for large projects
             # Consider requiring the JSON or implementing selective scanning
             for root, dirs, files in os.walk(code_base_path):
                 # Filter based on subfolders if provided
                 if self.sub_folders:
                     in_subfolder = False
                     for sub in self.sub_folders:
                         full_sub_path = os.path.join(code_base_path, sub.strip()).replace("\\", "/")
                         if root.replace("\\", "/").startswith(full_sub_path):
                             in_subfolder = True
                             break
                     if not in_subfolder:
                         continue # Skip this directory if not in a specified subfolder

                 for file in files:
                     abs_path = os.path.join(root, file).replace("\\", "/")
                     rel_path = os.path.relpath(abs_path, code_base_path).replace("\\", "/")
                     # Basic filtering (add more extensions if needed)
                     if file.endswith(('.py', '.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.java', '.c', '.cpp', '.h', '.cs', '.php', '.rb', '.go', '.rs', '.md')):
                          # Apply selected files filter if present
                          if not self.selected_files or rel_path in self.selected_files:
                              files_to_process.append(rel_path)

        # Process and chunk selected files
        for file_path_rel in files_to_process:
            abs_path = os.path.join(code_base_path, file_path_rel).replace("\\", "/")
            try:
                with open(abs_path, 'r', encoding='utf-8') as f:
                    code = f.read()
                chunks = self._split_into_chunks(code)
                for chunk in chunks:
                     record = {
                         'rel_path': file_path_rel,
                         'abs_path': abs_path,
                         'text': chunk['text'],
                         'start_line': chunk['start_line'],
                         'end_line': chunk['end_line']
                     }
                     self.chunk_records.append(record)
                     all_chunk_texts.append(chunk['text']) # Collect text for batch embedding
            except FileNotFoundError:
                # print(f"Warning: File not found during chunking: {abs_path}", file=sys.stderr)
                continue
            except Exception as e:
                # print(f"Warning: Error reading/chunking file {abs_path}: {e}", file=sys.stderr)
                continue

        # Embed all chunks together
        self.chunk_embeddings = np.array([])
        if self.chunk_records and all_chunk_texts:
            try:
                self.chunk_embeddings = self.model.encode(all_chunk_texts, show_progress_bar=False)
                # Normalize embeddings
                norms = np.linalg.norm(self.chunk_embeddings, axis=1, keepdims=True)
                # Handle zero vectors to avoid division by zero
                zero_norms = norms == 0
                norms[zero_norms] = 1e-10 # Replace zero norms with a small number
                self.chunk_embeddings = self.chunk_embeddings / norms
                # Add embeddings to records *or* keep them aligned (keeping aligned is often more efficient)
                # for i, record in enumerate(self.chunk_records):
                #     record['embedding'] = self.chunk_embeddings[i]

            except Exception as e:
                # print(f"Error encoding chunks: {e}", file=sys.stderr)
                self.chunk_embeddings = np.array([]) # Ensure it's an empty array on error
                self.chunk_records = [] # Clear records if embedding fails
        else:
            # print("No chunks found or generated to embed.", file=sys.stderr)
            self.chunk_embeddings = np.array([])
            self.chunk_records = []


    def _count_tokens(self, text):
        return len(self.encoder.encode(text))

    def _split_into_chunks(self, code, lines_per_chunk=50, overlap_lines=10):
        """Splits code into overlapping chunks based on line count."""
        lines = code.splitlines()
        chunks = []
        if not lines:
            return chunks

        i = 0
        while i < len(lines):
            start_line_num = i + 1
            end_index = min(i + lines_per_chunk, len(lines))
            chunk_lines = lines[i:end_index]

            if chunk_lines: # Ensure chunk is not empty
                chunk_text = "\
".join(chunk_lines) # Join with newline
                if chunk_text.strip(): # Avoid adding whitespace-only chunks
                    chunks.append({
                        'text': chunk_text,
                        'start_line': start_line_num,
                        'end_line': start_line_num + len(chunk_lines) - 1
                    })

            # Move to the next chunk start position
            next_start_index = i + lines_per_chunk - overlap_lines
            # Ensure progress and handle edge case where overlap is large
            if next_start_index <= i:
                next_start_index = i + 1 # Force progress if overlap logic fails

            i = next_start_index
            # Break if we have processed the last lines
            if i >= len(lines):
                break

        return chunks

    # _get_relevant_snippets removed as logic is integrated into query


    def query(self, query_text, top_k=20):
        """
        Performs RAG based on chunk vectors:
        1. Embeds the query.
        2. Finds potentially relevant chunks using vector similarity (SentenceTransformer).
        3. Re-ranks these candidate chunks using CrossEncoder.
        4. Returns the top_k most relevant chunks after re-ranking.
        """
        if not self.chunk_records or self.chunk_embeddings.size == 0:
            # print("Error: No code chunks available for search.", file=sys.stderr)
            return {'results': [], 'queries': [query_text], 'error': 'No code chunks available for search.'}

        # --- Step 1: Embed Query ---
        try:
            query_embedding = self.model.encode([query_text])[0]
            query_norm = np.linalg.norm(query_embedding)
            if query_norm == 0:
                query_norm = 1e-10 # Avoid division by zero
            query_embedding = query_embedding / query_norm
        except Exception as e:
            # print(f"Error encoding query: {e}", file=sys.stderr)
            return {'results': [], 'queries': [query_text], 'error': f'Error encoding query: {e}'}


        # --- Step 2: Initial Candidate Retrieval (Vector Similarity) ---
        similarities = np.dot(self.chunk_embeddings, query_embedding)

        # Get a larger initial set of candidates for cross-encoder re-ranking
        candidate_count = min(max(top_k * 2, 50), len(self.chunk_records)) # Get more candidates than final top_k
        # Handle case where similarities might contain NaN if embeddings had issues
        if np.isnan(similarities).any():
             # print("Warning: NaN values found in similarity scores. Check embeddings.", file=sys.stderr)
             similarities = np.nan_to_num(similarities) # Replace NaN with 0

        # Ensure candidate_count does not exceed available chunks
        candidate_count = min(candidate_count, len(similarities))
        if candidate_count <= 0:
            # print("No candidates found based on similarity.", file=sys.stderr)
            return {'results': [], 'queries': [query_text]}


        initial_candidate_indices = np.argsort(similarities)[::-1][:candidate_count]
        # Filter out candidates with very low similarity? Optional.
        # threshold = 0.1
        # initial_candidate_indices = [i for i in initial_candidate_indices if similarities[i] > threshold]


        if not initial_candidate_indices.size: # Check if size is zero
             # print("No candidates found after initial filtering.", file=sys.stderr)
             return {'results': [], 'queries': [query_text]}


        # --- Step 3: Re-ranking with CrossEncoder ---
        cross_input = [[query_text, self.chunk_records[i]['text']] for i in initial_candidate_indices]
        try:
            cross_scores = self.cross_encoder.predict(cross_input, show_progress_bar=False)
        except Exception as e:
             # print(f"CrossEncoder prediction failed: {e}. Falling back to similarity ranking.", file=sys.stderr)
             # Fallback: Use the initial similarity ranking
             ranked_indices = initial_candidate_indices[:top_k]
             final_results_data = [self.chunk_records[i] for i in ranked_indices]
        else:
            # Sort the initial candidate indices based on the cross-encoder scores
            scored_candidates = sorted(zip(initial_candidate_indices, cross_scores), key=lambda x: x[1], reverse=True)
            # Select the top_k indices after re-ranking
            ranked_indices = [idx for idx, score in scored_candidates[:top_k]]
            final_results_data = [self.chunk_records[i] for i in ranked_indices]

        # --- Step 4: Format Results ---
        formatted_results = []
        for record in final_results_data:
             formatted_results.append({
                 # Use abs_path as file_path expected by generar_contexto
                 'file_path': record['abs_path'],
                 'start_line': record['start_line'],
                 'end_line': record['end_line'],
                 'text': record['text']
                 # Optional: add score if needed downstream 'score': score
             })

        return {'results': formatted_results, 'queries': [query_text]}


def generar_contexto(instruccion_usuario, carpeta_proyecto, json_path, sub_folders, selected_files): # Removed token_limit
    code_base_path = carpeta_proyecto # Use the provided project path directly
    rag = CodeRAG(code_base_path, json_path, sub_folders, selected_files)
    # Query with top_k=20
    rag_results = rag.query(instruccion_usuario, top_k=20)

    if 'error' in rag_results or not rag_results.get('results'):
        # print(f"RAG Error or no results: {rag_results.get('error', 'No results found')}", file=sys.stderr)
        return {
            'context': '[]', # Empty context if error or no snippets
            'query': instruccion_usuario
        }

    contexto = []
    # 'results' now contains a list of the top_k chunk dictionaries
    for chunk in rag_results.get('results', []):
        # Make file path relative to the project root for cleaner context
        try:
            # chunk['file_path'] should be the absolute path from CodeRAG.query
            rel_path = os.path.relpath(chunk['file_path'], code_base_path).replace("\\", "/")
        except ValueError: # Handle case where paths are on different drives
            rel_path = chunk['file_path'].replace("\\", "/") # Fallback to the path provided

        contexto.append({
            "archivo": rel_path,
            "linea_inicio": chunk['start_line'],
            "linea_fin": chunk['end_line'],
            # Use 'text' key from the chunk dictionary
            "fragmento_codigo": chunk['text']
        })

    # Sort context by file path then start line for better readability in the prompt
    contexto.sort(key=lambda x: (x['archivo'], x['linea_inicio']))

    return {
        'context': json.dumps(contexto, indent=2, ensure_ascii=False), # ensure_ascii=False for proper encoding
        'query': rag_results.get('queries', [instruccion_usuario])[0], # Assuming single query
    }

def _update_tokens_usage(prompt_tokens, completion_tokens, project_name, model, userId, duration):
    try:
        mongo_uri = "mongodb+srv://guillermo:guillermo@cluster0.7gaga4b.mongodb.net/coder"
        if not mongo_uri:
            return

        client = MongoClient(mongo_uri)
        db = client.get_database()

        # Calcular costos
        input_cost = (prompt_tokens * input_price_usd_per_M) / 1_000_000
        output_cost = (completion_tokens * output_price_usd_per_M) / 1_000_000
        total_cost = input_cost + output_cost

        # Actualizar saldo del usuario
        users_collection = db["users"]
        update_result = users_collection.update_one(
            {"_id": ObjectId(userId)},
            {"$inc": {"saldo": -total_cost}}
        )
        # Check if user was found and updated
        # if update_result.matched_count == 0:
            # print(f"User ID {userId} not found for balance update.", file=sys.stderr)
        # elif update_result.modified_count == 0:
            # print(f"Balance for user ID {userId} not modified (possibly no change or other issue).", file=sys.stderr)

        # Registrar transacción
        transaction = {
            "userId": ObjectId(userId),
            "project_name": project_name,
            "model": model, # Use the model name passed (e.g., 'qa')
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
        # print(f"Error en actualización de tokens: {str(e)}", file=sys.stderr)
        return

def obtener_cambios_openai(contexto, instruccion_usuario, coder_model, carpeta_proyecto, userId):
    """Envía la consulta a OpenAI y obtiene los cambios necesarios en formato JSON."""
    prompt = f"""
        ### Role:
        You are a Senior Software Engineer and AI assistant specialized in code analysis and explanation. Your goal is to help the user understand the provided code snippets based on their request.

        ### User Request:
        {contexto.get('query', instruccion_usuario)}

        ### Project Context:
        The following JSON array contains relevant code snippets retrieved from the project files based on the user's request. Each element represents a chunk of code from a specific file and line range. Focus your answer *only* on the provided snippets. Explain the code's purpose or answer the user's question based *solely* on this context. If the context is insufficient, state that clearly.

        ```json
        {contexto.get('context', '[]')}
        ```

        ### Core Instructions:
        - Analyze the user's request and the provided code snippets.
        - Provide a concise and clear explanation answering the user's question (e.g., "Where are filters added?", "What does this function do?").
        - Base your explanation *strictly* on the code shown in the `fragmento_codigo` fields within the JSON context.
        - Reference the specific file and line numbers (`linea_inicio` to `linea_fin`)** for the code snippets that support your explanation. For example: "Filters are added in `src/components/Filter.js` (lines 15-28)..."
        - If the provided snippets do not contain the answer, explicitly state that the necessary information is not present in the retrieved context. Do not guess or infer information beyond the snippets.
        - Do *not* suggest code modifications unless the user explicitly asked for them in their original request (`User Request` above). This model's primary function is code explanation and search based on the provided context.
        - Respond in the same language as the `User Request`.

        Think step by step to formulate your answer based *only* on the provided snippets and the user's question.
    """


    max_retries = 3
    retry_count = 0
    last_exception = None

    # Estimate prompt tokens (crude estimation, refine if needed)
    prompt_tokens_estimate = len(tiktoken.get_encoding("cl100k_base").encode(prompt))


    while retry_count < max_retries:
        try:
            start_time = time.time() # Start timer
            response = client.models.generate_content(
                model="gemini-2.5-pro-exp-03-25", contents=prompt # Use the specified model variable if needed
                # model=current_model # Or use the global variable
            )
            end_time = time.time() # End timer
            duration = end_time - start_time # Calculate duration

            # Robust check for response structure before accessing content
            # Ensure parts exist and have text
            if response and response.text:
                content = response.text
                # Safely access usage metadata
                input_tokens = response.usage_metadata.prompt_token_count if response.usage_metadata else prompt_tokens_estimate # Fallback estimate
                output_tokens = response.usage_metadata.candidates_token_count if response.usage_metadata else len(tiktoken.get_encoding("cl100k_base").encode(content)) # Fallback estimate



                # Update usage asynchronously or handle potential errors gracefully
                try:
                     # Use the model name defined for QA ('qa' or similar passed via args)
                    _update_tokens_usage(input_tokens, output_tokens, carpeta_proyecto, coder_model, userId, duration)
                except Exception as e:
                    # print(f"Error updating token usage: {e}", file=sys.stderr)
                    # Decide if this error should prevent returning the content
                    # For now, we'll still return the content even if usage update fails
                    pass # Logged in _update_tokens_usage

                return content # Success, return content
            else:
                 # Handle cases where the response structure is not as expected or lacks text
                 error_message = "Unexpected or empty response structure from API."
                #  print(f"Error processing response: {error_message}. Response: {response}", file=sys.stderr)
                 # Treat as a retryable error if structure is wrong
                 raise AttributeError(error_message)


        except (TypeError, AttributeError, IndexError, ValueError) as e: # Catch potential errors accessing potentially None objects or incorrect structure/values
            last_exception = e
            retry_count += 1
            # print(f"Attempt {retry_count}/{max_retries} failed: Error processing response - {e}. Response: {response}", file=sys.stderr) # Log the response for debugging
            if retry_count < max_retries:
                # print(f"Retrying in {2**retry_count} seconds...", file=sys.stderr) # Exponential backoff
                time.sleep(2**retry_count) # Wait longer before retrying
            else:
                # print(f"Max retries reached. Error processing OpenAI response: {e}", file=sys.stderr)
                return f"Error: Failed to get response from AI after {max_retries} attempts. Last error: {e}" # Return error message


        except Exception as e: # Catch other potential API errors (network, auth, rate limits, etc.)
            last_exception = e
            retry_count += 1
            error_code = getattr(e, 'code', 'N/A') # Check for specific API error codes if available
            # print(f"Attempt {retry_count}/{max_retries} failed: OpenAI API Error (Code: {error_code}) - {e}", file=sys.stderr)

            # Handle specific error codes if needed (e.g., rate limits)
            if 'rate limit' in str(e).lower():
                 wait_time = 5 * (retry_count) # Longer exponential backoff for rate limits
                 # print(f"Rate limit detected. Retrying in {wait_time} seconds...", file=sys.stderr)
                 time.sleep(wait_time)
            elif retry_count < max_retries:
                 wait_time = 2**retry_count # Exponential backoff for general errors
                 # print(f"Retrying in {wait_time} seconds...", file=sys.stderr)
                 time.sleep(wait_time) # General retry wait
            else:
                # print(f"Max retries reached. Error al obtener cambios de OpenAI: {e}", file=sys.stderr)
                return f"Error: Failed to get response from AI after {max_retries} attempts due to API error: {e}" # Return error message

    # Fallback if loop somehow exits without returning (shouldn't happen)
    # print(f"Failed after {max_retries} attempts. Last error: {last_exception}", file=sys.stderr)
    return f"Error: Unexpected failure after {max_retries} attempts. Last error: {last_exception}"


if __name__ == "__main__":
    main()