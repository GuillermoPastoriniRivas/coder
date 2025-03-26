import subprocess
from pathlib import Path
from typing import Tuple, Dict
import tempfile

class CodeValidator:
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
    
    def validate_typescript(self, code: str) -> Tuple[bool, Dict]:
        with tempfile.NamedTemporaryFile(suffix=".ts", delete=False) as tmp:
            tmp.write(code.encode('utf-8'))
            tmp_path = tmp.name
        
        result = subprocess.run(
            ["tsc", "--strict", "--noEmit", tmp_path],
            cwd=self.project_root,
            capture_output=True,
            text=True
        )
        
        Path(tmp_path).unlink()
        
        return result.returncode == 0, {
            "errors": result.stderr.splitlines(),
            "warnings": result.stdout.splitlines()
        }

    def validate_python(self, code: str) -> Tuple[bool, Dict]:
        try:
            compile(code, "<string>", "exec")
            return True, {}
        except Exception as e:
            return False, {
                "errors": [str(e)],
                "warnings": []
            }

    def validate_diff(self, original: str, modified: str) -> Tuple[bool, Dict]:
        lang = self.detect_language(original)
        
        if lang == "typescript":
            return self.validate_typescript(modified)
        elif lang == "python":
            return self.validate_python(modified)
        else:
            return True, {}  # Skip validation for unsupported languages
    
    def detect_language(self, code: str) -> str:
        if "def " in code or "import " in code:
            return "python"
        if "function " in code or "const " in code:
            return "typescript"
        return "unknown"
    
    def full_validation(self, file_path: str):
        original_code = Path(file_path).read_text(encoding='utf-8')
        backup_code = Path(f"{file_path}.bak").read_text(encoding='utf-8')
        
        is_valid, _ = self.validate_diff(backup_code, original_code)
        
        if not is_valid:
            self._restore_backup(file_path)
            raise RuntimeError("La validación falló, se restauró el backup")
    
    def _restore_backup(self, file_path: str):
        backup = Path(f"{file_path}.bak")
        if backup.exists():
            backup.rename(file_path)