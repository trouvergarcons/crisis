import sys
from pathlib import Path

# Ensure both 'backend.app' and 'app' imports resolve regardless of CWD or deployment environment
backend_dir = Path(__file__).resolve().parent.parent
parent_dir = backend_dir.parent

for path_str in [str(backend_dir), str(parent_dir)]:
    if path_str not in sys.path:
        sys.path.insert(0, path_str)
