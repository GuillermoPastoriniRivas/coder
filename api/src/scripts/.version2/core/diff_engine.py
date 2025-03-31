import re
import difflib
from typing import List, Tuple

class DiffEngine:
    def __init__(self):
        self.diff_parser = re.compile(r'@@ -(\d+),(\d+) \+(\d+),(\d+) @@')
    
    def generate_diff(self, original: str, modified: str) -> List[Tuple]:
        diff = difflib.unified_diff(
            original.splitlines(keepends=True),
            modified.splitlines(keepends=True),
            n=3
        )
        return list(diff)
    
    def apply_diff(self, original: str, diff: List[str]) -> str:
        if not diff:
            return original
        lines = original.split("\n")
        for d in diff:
            if d.startswith('-'):
                content = d[1:].strip()
                for i, line in enumerate(lines):
                    if line.strip() == content:
                        del lines[i]
                        break
            elif d.startswith('+'):
                content = d[1:].strip()
                lines.append(content)
        return "\n".join(lines)
    
    def _apply_patches(self, lines: List[str], patches: List[Tuple]) -> str:
        offset = 0
        for patch in patches:
            start, old_len, new_len = patch
            start += offset
            if start < 0 or start + old_len > len(lines):
                continue
            del lines[start:start+old_len]
            offset -= old_len
            if new_len > 0:
                pass
        return '\n'.join(lines)