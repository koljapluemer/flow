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


def check_vocab_refs(where: str, owner_ref: str, vocab_refs: list[str], vocab: dict) -> list[str]:
    errors = []
    for vocab_ref in vocab_refs:
        if vocab_ref not in vocab:
            errors.append(f"{where}: unknown vocab {vocab_ref}")
        elif lang_of(vocab_ref) != lang_of(owner_ref):
            errors.append(f"{where}: vocab {vocab_ref} is in another language")
    return errors


def check_topics(topics: dict, pools: dict) -> list[str]:
    return [
        f"topics/{topic_id}: unknown {pool[:-1]} {ref}"
        for topic_id, topic in topics.items()
        for pool in ("sentences", "videos")
        for ref in topic.get(pool, [])
        if ref not in pools[pool]
    ]


def check_videos(videos: dict, vocab: dict) -> list[str]:
    errors = []
    for ref, video in videos.items():
        previous_end = 0.0
        for index, snippet in enumerate(video.get("snippets", [])):
            where = f"videos/{ref}#{index}"
            start, end = snippet.get("start", 0), snippet.get("end", 0)
            if start >= end:
                errors.append(f"{where}: start is not before end")
            if start < previous_end:
                errors.append(f"{where}: overlaps the previous snippet")
            previous_end = end
            errors += check_vocab_refs(where, ref, snippet.get("vocab", []), vocab)
            errors += [f"{where}: core {core} is not in vocab" for core in set(snippet.get("core", [])) - set(snippet.get("vocab", []))]
    return errors


def check_examples(sentences: dict, vocab: dict) -> list[str]:
    counts = Counter(vocab_ref for sentence in sentences.values() for vocab_ref in sentence.get("vocab", []))
    return [f"vocab/{ref}: only {counts[ref]} of {MIN_EXAMPLES} sentences" for ref in vocab if counts[ref] < MIN_EXAMPLES]


def validate() -> list[str]:
    errors = []
    pools = {}
    for pool in repo.POOLS:
        errors += check_index(pool)
        refs = [ref for ref in repo.read_index(pool) if repo.item_path(pool, ref).exists()]
        pools[pool] = {ref: repo.read_item(pool, ref) or {} for ref in refs}
        errors += check_schema(pool, pools[pool])
    for ref, sentence in pools["sentences"].items():
        errors += check_vocab_refs(f"sentences/{ref}", ref, sentence.get("vocab", []), pools["vocab"])
    return (
        errors
        + check_topics(pools["topics"], pools)
        + check_videos(pools["videos"], pools["vocab"])
        + check_examples(pools["sentences"], pools["vocab"])
    )
