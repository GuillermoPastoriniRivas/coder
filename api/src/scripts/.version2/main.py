import os
import argparse
import json
from core.file_editor import SmartFileEditor

def main():
    parser = argparse.ArgumentParser(description="AI Code Editor for Large Projects")
    parser.add_argument("--instruction", required=True)
    parser.add_argument("--project", required=True, help="Root folder of the project")
    parser.add_argument("--docs", required=True)
    parser.add_argument("--api-key", required=True)
    parser.add_argument("--subfolders", required=False, default="", help="Comma separated list of subfolders")
    parser.add_argument("--selectedFiles", required=False, default="", help="Comma separated list of files (relative to project root)")
    args = parser.parse_args()

    with open(args.docs) as f:
        docs = json.load(f)

    editor = SmartFileEditor(docs, args.api_key, args.project)

    files_in_docs = list(docs.get("project", {}).get("files", {}).keys())
    selected_files_filter = [f.strip() for f in args.selectedFiles.split(",") if f.strip()] if args.selectedFiles else []
    subfolders_filter = [s.strip() for s in args.subfolders.split(",") if s.strip()] if args.subfolders else []

    if selected_files_filter or subfolders_filter:
        files_to_process = []
        for file_rel in files_in_docs:
            include = False
            if selected_files_filter:
                if file_rel in selected_files_filter:
                    include = True
                elif subfolders_filter and any(file_rel.startswith(sub) for sub in subfolders_filter):
                    include = True
            else:
                if subfolders_filter and any(file_rel.startswith(sub) for sub in subfolders_filter):
                    include = True
            if include:
                files_to_process.append(file_rel)
    else:
        files_to_process = files_in_docs

    if not files_to_process:
        print("No files to process based on provided filters.")
        return

    for file_rel in files_to_process:
        full_path = os.path.join(args.project, file_rel)
        try:
            modified_code = editor.edit_file(full_path, args.instruction)
            backup_path = full_path + ".bak"
            os.rename(full_path, backup_path)
            with open(full_path, "w", encoding="utf-8") as f:
                f.write(modified_code)
            print(f"Archivo {full_path} modificado exitosamente. Backup en: {backup_path}")
        except Exception as e:
            print(f"Error processing {full_path}: {e}")

if __name__ == "__main__":
    main()