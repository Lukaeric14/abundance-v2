"""
Centralized environment loader for all nodes.
Loads .env from CWD or nearest parent (up to 6 levels).
Relies solely on OPENAI_* variables.
"""

import os
from typing import Optional

try:
    from dotenv import load_dotenv  # type: ignore
except Exception:
    load_dotenv = None  # type: ignore


def _try_load(path: str) -> bool:
    if not load_dotenv:
        return False
    if os.path.exists(path):
        return load_dotenv(path)
    return False


def _scan_and_load_env(start_dir: Optional[str] = None) -> None:
    # 1) Try CWD
    if load_dotenv:
        load_dotenv()
    # If key is set, we are done
    if os.getenv("OPENAI_API_KEY"):
        return

    # 2) Walk up from start_dir (default: this file's directory)
    base = start_dir or os.path.abspath(os.path.dirname(__file__))
    for _ in range(6):
        candidate = os.path.join(base, ".env")
        if _try_load(candidate):
            break
        parent = os.path.dirname(base)
        if parent == base:
            break
        base = parent

    if os.getenv("OPENAI_API_KEY"):
        return

    # 3) Try well-known locations within this repo
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    candidates = [
        os.path.join(repo_root, '.env'),
        os.path.join(repo_root, 'generate-projectv2', '.env'),
        os.path.join(repo_root, 'generate-projectv2', 'utils', '.env'),
    ]
    for path in candidates:
        if _try_load(path) and os.getenv("OPENAI_API_KEY"):
            return


def _normalize_keys() -> None:
    # No provider aliasing; use OPENAI_* only
    return


def ensure_env_loaded() -> None:
    _scan_and_load_env()
    _normalize_keys()


# Run at import time for convenience
ensure_env_loaded()


