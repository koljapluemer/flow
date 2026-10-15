"""Reads and writes data/repo: one flat index list per pool, one YAML file per item."""

import os
import re
import unicodedata
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
REPO = ROOT / "data" / "repo"
SCHEMA_DIR = REPO / "schema"

POOLS = ("topics", "sentences", "vocab")
SCHEMA_NAMES = {"topics": "topic", "sentences": "sentence", "vocab": "vocab"}
MAX_SLUG_LENGTH = 60


def read_yaml(path: Path):
    return yaml.safe_load(path.read_text(encoding="utf-8"))


def write_yaml(path: Path, data, header: str = "") -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    body = yaml.safe_dump(data, allow_unicode=True, sort_keys=False, width=1000)
    path.write_text(header + body, encoding="utf-8")


def index_path(pool: str) -> Path:
    return REPO / f"{pool}.yaml"


def item_path(pool: str, ref: str) -> Path:
    return REPO / pool / f"{ref}.yaml"


def schema_path(pool: str) -> Path:
    return SCHEMA_DIR / f"{SCHEMA_NAMES[pool]}.schema.json"


def read_index(pool: str) -> list[str]:
    path = index_path(pool)
    return (read_yaml(path) or []) if path.exists() else []


def write_index(pool: str, refs: list[str]) -> None:
    write_yaml(index_path(pool), refs)


def read_item(pool: str, ref: str) -> dict:
    return read_yaml(item_path(pool, ref))


def write_item(pool: str, ref: str, data: dict) -> None:
    path = item_path(pool, ref)
    schema = Path(os.path.relpath(schema_path(pool), path.parent)).as_posix()
    write_yaml(path, data, f"# yaml-language-server: $schema={schema}\n")


def read_pool(pool: str) -> dict[str, dict]:
    return {ref: read_item(pool, ref) for ref in read_index(pool)}


def slugify(text: str) -> str:
    normalized = unicodedata.normalize("NFC", text).lower()
    return re.sub(r"[\W_]+", "-", normalized).strip("-")[:MAX_SLUG_LENGTH].strip("-")


def unique_ref(prefix: str, text: str, taken: set[str]) -> str:
    base = f"{prefix}/{slugify(text)}"
    ref, suffix = base, 2
    while ref in taken:
        ref, suffix = f"{base}-{suffix}", suffix + 1
    return ref
