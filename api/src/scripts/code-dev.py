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
sys.stdout.reconfigure(encoding='utf-8')

api_key = "sk-proj-iZUIWIoul2uPT3Si0x1DT3BlbkFJ0fSNIi1EVUCjp5ReYkJu"
client = OpenAI(api_key=api_key)
sub_carpeta=""
top_k = 10
coder_model = "gpt-4o-mini"
temperature = 0.2

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--instruction", required=True)
    parser.add_argument("--project", required=True)
    parser.add_argument("--config", required=True)
    args = parser.parse_args()

    carpeta_proyecto = args.project
    instruccion_usuario = args.instruction
    json_path = args.config

    documenter = AIDocumenter(
        api_key=api_key,
        code_path=carpeta_proyecto,
        output_file=json_path
    )

    documenter.generate_documentation()
    contexto = generar_contexto(instruccion_usuario, carpeta_proyecto, json_path)
    cambios = obtener_cambios_openai(contexto, instruccion_usuario)
    print(cambios)


class CodeRAG:

    def __init__(self, code_base_path, json_path):
        # Mejor modelo de embeddings
        self.model = SentenceTransformer('all-mpnet-base-v2')
        # Cross-encoder para reranking
        self.cross_encoder = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')

        with open(json_path) as f:
            full_data = json.load(f)
            self.project = full_data.get("project", {})
            self.data = self.project.get("files", {})

        self.file_records = []
        for file_path, file_data in self.data.items():
            if file_path.startswith(sub_carpeta):
                description = file_data.get("description", "")
                dependencies = file_data.get("dependencies", [])  # Corregido
                tokens = file_data.get("tokens", 0)

                # Mejor texto para embeddings incluyendo dependencias
                embedding_text = (
                    f"File Path: {file_path}/n"
                    f"Description: {description}/n"
                    f"Dependencies: {', '.join([dep.get('file_path', '') for dep in dependencies])}"
                )

                self.file_records.append({
                    'file_path': code_base_path + file_path,
                    'description': description,
                    'dependencies': dependencies,
                    'tokens': tokens,
                    'embedding_text': embedding_text
                })

        texts = [r['embedding_text'] for r in self.file_records]
        self.embeddings = self.model.encode(texts) if texts else np.array([])
        # Normalizar embeddings para cosine similarity
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

        # Paso 1: Expansión del query
        queries = [query_text]
        query_embeds = self.model.encode(queries)
        query_embedding = np.mean(query_embeds, axis=0)
        query_embedding = query_embedding / np.linalg.norm(query_embedding)

        # Paso 2: Búsqueda inicial
        similarities = np.dot(self.embeddings, query_embedding)
        initial_indices = np.argsort(similarities)[::-1][:top_k*2]

        # Paso 3: Reranking con cross-encoder
        candidates = [self.file_records[i] for i in initial_indices]
        cross_input = [[query_text, cand['embedding_text']] for cand in candidates]
        cross_scores = self.cross_encoder.predict(cross_input)

        # Obtener índices ordenados por cross-score
        ranked_indices = np.argsort(cross_scores)[::-1][:top_k]

        # Obtener los índices finales correctamente
        final_indices = [initial_indices[i] for i in ranked_indices]

        # Construir resultados con la relación correcta de índices
        results = []
        for i, idx in enumerate(final_indices):
            record = self.file_records[idx]
            results.append({
                'file_path': record['file_path'],
                'tokens': record['tokens'],
                'code': self._get_code_snippet(record['file_path']),
            })

        return { 'results': results, 'queries': queries}

def generar_contexto(instruccion_usuario, carpeta_proyecto, json_path):
    """Genera el contexto con la lista de archivos y su contenido utilizando CodeRAG."""
    # Inicializar CodeRAG
    code_base_path = carpeta_proyecto + "/"  # Ruta base del código
    rag = CodeRAG(code_base_path, json_path).query(instruccion_usuario)

    # Obtener información de CodeRAG
    contexto = []

    for item in rag.get('results', {}):
        file_path = item['file_path']
        contenido = item['code']
        contexto.append({"archivo": file_path, "contenido": contenido})

    return {
        'context': json.dumps(contexto, indent=2),
        'query': rag.get('queries', instruccion_usuario),
    }

def leer_codigo(archivo):
    """Lee el contenido de un archivo de código."""
    with open(archivo, "r", encoding="utf-8") as f:
        return f.read()

def escribir_codigo(archivo, nuevo_contenido):
    """Escribe el código modificado en el archivo original."""
    with open(archivo, "w", encoding="utf-8") as f:
        f.write(nuevo_contenido)

def obtener_cambios_openai(contexto, instruccion_usuario):
    """Envía la consulta a OpenAI y obtiene los cambios necesarios en formato JSON."""
    prompt = f"""
    Eres un asistente experto en código. Se te proporciona un proyecto con varios archivos y una instrucción.
    Si cambias un archivo, devuelve el archivo completo con los cambios aplicados
    Utiliza ---------------------- arriba y abajo para delimitar cada archivo
    GENERA SOLAMENTE TEXTO PLANO, NO generes NINGÚN marcador como ```jsx ni nada por el estilo, devuelve solo el texto listo para ser sobreescrito en el archivo

    ### Instrucción:
    {contexto.get('query', instruccion_usuario)}

    ### Proyecto:
    {contexto.get('context', '')}

    ### Formato de salida esperado (Ejemplo):
    ----------------------
    api/src/controllers/agentController.ts
    +++++
    <nuevo código>
    ----------------------
    ----------------------
    ui/src/styles/main.css
    +++++
    <nuevo código>
    ----------------------

    """
    try:
        respuesta = client.chat.completions.create(
            model=coder_model,
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature
        )
        return respuesta.choices[0].message.content
    except Exception as e:
        print(f"Error al obtener cambios de OpenAI: {e}")
        return ""

if __name__ == "__main__":
    main()