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

api_key = "sk-proj-iZUIWIoul2uPT3Si0x1DT3BlbkFJ0fSNIi1EVUCjp5ReYkJu"
client = OpenAI(api_key=api_key)
sub_carpeta=""
top_k = 10

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--instruction", required=True)
    parser.add_argument("--project", required=True)
    parser.add_argument("--config", required=True)
    args = parser.parse_args()

    # carpeta_proyecto = args.project
    # instruccion_usuario = args.instruction
    # json_path = args.config

    # documenter = AIDocumenter(
    #     api_key=api_key,
    #     code_path=carpeta_proyecto,
    #     output_file=json_path
    # )

    # documenter.generate_documentation()
    # # save_log(carpeta_proyecto, "Generando contexto...")
    # contexto = generar_contexto(instruccion_usuario, carpeta_proyecto, json_path)
    # # save_log(carpeta_proyecto, contexto.get('query', instruccion_usuario))
    # # save_log(carpeta_proyecto, contexto.get('context', ''))
    # cambios = obtener_respuesta_openai(contexto, instruccion_usuario, carpeta_proyecto)
    print("Logramos enviar templates usando la funcion sendTemplate que requiere un templateId y un usuario")


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

def obtener_respuesta_openai(contexto, instruccion_usuario, carpeta_proyecto):
    """Envía la consulta a OpenAI y obtiene los cambios necesarios en formato JSON."""

    prompt = f"""
    Eres un ingeniero de software especializado en guiar a otros desarrolladores.
    Al recibir una consulta de otro dev, verás fragmentos de código fuente e información adicional 
    que debes usar como conocimiento para generar la respuesta adecuada a esa consulta.
    DEBES GENERAR UNA RESPUESTA PRECISA para que sea interpretada por el desarrollador a cargo de resolver el requerimiento

    ### Consulta:
    {contexto.get('query', instruccion_usuario)}

    ### Proyecto:
    {contexto.get('context', '')}

    """
    # save_log(carpeta_proyecto, "***PROMPT***")
    # save_log(carpeta_proyecto, prompt)
    try:
        respuesta = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3
        )
        return respuesta.choices[0].message.content
    except Exception as e:
        print(f"Error al obtener cambios de OpenAI: {e}")
        return ""

# def save_log(carpeta_proyecto, log):
#     with open(os.path.join(carpeta_proyecto, "log.txt"), "a") as f:
#         timestamp = datetime.now().isoformat()
#         f.write(f"[{timestamp}] {log}\n")

if __name__ == "__main__":
    main()