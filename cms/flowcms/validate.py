"""Checks data/repo: index lists match files, items match their schema, refs resolve."""

import json
from collections import Counter

from jsonschema import Draft202012Validator

from flowcms import repo

MIN_EXAMPLES = 3


def lang_of(ref: str) -> str:
    return ref.split("/")[0]


def check_index(pool: str) -> list[str]:
    refs = repo.read_index(pool)
    folder = repo.REPO / pool
    on_disk = {path.relative_to(folder).with_suffix("").as_posix() for path in folder.rglob("*.yaml")}
    duplicates = [ref for ref, count in Counter(refs).items() if count > 1]
    return (
        [f"{pool}.yaml: duplicate {ref}" for ref in duplicates]
        + [f"{pool}.yaml: {ref} has no file" for ref in sorted(set(refs) - on_disk)]
        + [f"{pool}.yaml: {ref} is not listed" for ref in sorted(on_disk - set(refs))]
    )


def check_schema(pool: str, items: dict[str, dict]) -> list[str]:
    validator = Draft202012Validator(json.loads(repo.schema_path(pool).read_text(encoding="utf-8")))
    return [f"{pool}/{ref}: {error.message}" for ref, item in items.items() for error in validator.iter_errors(item)]


def check_refs(topics: dict, sentences: dict, vocab: dict) -> list[str]:
    errors = [
        f"topics/{topic_id}: unknown sentence {ref}"
        for topic_id, topic in topics.items()
        for ref in topic.get("sentences", [])
        if ref not in sentences
    ]
    for ref, sentence in sentences.items():
        for vocab_ref in sentence.get("vocab", []):
            if vocab_ref not in vocab:
                errors.append(f"sentences/{ref}: unknown vocab {vocab_ref}")
            elif lang_of(vocab_ref) != lang_of(ref):
                errors.append(f"sentences/{ref}: vocab {vocab_ref} is in another language")
    counts = Counter(vocab_ref for sentence in sentences.values() for vocab_ref in sentence.get("vocab", []))
    errors += [
        f"vocab/{ref}: only {counts[ref]} of {MIN_EXAMPLES} sentences" for ref in vocab if counts[ref] < MIN_EXAMPLES
    ]
    return errors


def validate() -> list[str]:
    errors = []
    pools = {}
    for pool in repo.POOLS:
        errors += check_index(pool)
        refs = [ref for ref in repo.read_index(pool) if repo.item_path(pool, ref).exists()]
        pools[pool] = {ref: repo.read_item(pool, ref) or {} for ref in refs}
        errors += check_schema(pool, pools[pool])
    return errors + check_refs(pools["topics"], pools["sentences"], pools["vocab"])
