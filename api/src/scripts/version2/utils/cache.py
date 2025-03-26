import os
import pickle
import hashlib
from pathlib import Path
from typing import Any, Optional
import lz4.frame

class CodeCache:
    def __init__(self, cache_dir: str = ".coder_cache", max_size_mb: int = 500):
        self.cache_dir = Path(cache_dir)
        self.max_size = max_size_mb * 1024 * 1024  # Convertir a bytes
        self.current_size = 0
        self._init_cache()

    def _init_cache(self):
        self.cache_dir.mkdir(exist_ok=True)
        self._cleanup_cache()

    def _get_key_path(self, key: str) -> Path:
        key_hash = hashlib.sha256(key.encode()).hexdigest()
        return self.cache_dir / f"{key_hash}.lz4"

    def _cleanup_cache(self):
        cache_files = sorted(self.cache_dir.glob("*.lz4"), key=os.path.getmtime, reverse=True)
        total_size = sum(f.stat().st_size for f in cache_files)
        
        while total_size > self.max_size and cache_files:
            removed = cache_files.pop()
            total_size -= removed.stat().st_size
            removed.unlink()

    def get(self, key: str) -> Optional[Any]:
        key_path = self._get_key_path(key)
        if not key_path.exists():
            return None

        with lz4.frame.open(str(key_path), "rb") as f:
            try:
                return pickle.load(f)
            except (pickle.UnpicklingError, EOFError):
                key_path.unlink()
                return None

    def put(self, key: str, value: Any):
        key_path = self._get_key_path(key)
        data = pickle.dumps(value)
        
        with lz4.frame.open(str(key_path), "wb") as f:
            f.write(data)
        
        self._cleanup_cache()

    def memoize(self, key_fn: callable):
        def decorator(func: callable):
            def wrapper(*args, **kwargs):
                self_key = key_fn(*args, **kwargs)
                cached = self.get(self_key)
                
                if cached is not None:
                    return cached
                
                result = func(*args, **kwargs)
                self.put(self_key, result)
                return result
            return wrapper
        return decorator

class ASTCache(CodeCache):
    def __init__(self):
        super().__init__(cache_dir=".ast_cache", max_size_mb=1000)
    
    def cache_key(self, file_path: str, file_hash: str) -> str:
        return f"{file_path}|{file_hash}"

class EmbeddingCache(CodeCache):
    def __init__(self):
        super().__init__(cache_dir=".emb_cache", max_size_mb=2000)
    
    def cache_key(self, text: str) -> str:
        return hashlib.sha256(text.encode()).hexdigest()