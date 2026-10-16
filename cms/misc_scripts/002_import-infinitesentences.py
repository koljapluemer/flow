"""Imports infinite-sentences content (data/in/infinitesentences/eng-<lang>.json, exported by sam-learns-things)
into data/repo, keeping its split: every sentence part becomes a vocab item.

Sentences go to the set "General <Language>" as guess-once, the parts' usage examples as examples. At most
MAX_SENTENCES sentences per language, sentences before examples. Texts already in the repo are skipped. No
examples are generated. The topic "General <Language>" references the set.

Usage: uv run misc_scripts/002_import-infinitesentences.py <lang>
"""

import json
import re
import sys

from flowcms import repo
from flowcms.languages import LANGUAGES
from flowcms.pools import Pools, add_to_set, add_to_topic

MAX_SENTENCES = 1000
CREDIT = re.compile(r"^Sentence from Tatoeba by (?P<author>.+) \(CC-BY 2\.0 FR\)$")
TATOEBA = {
    "source": "Tatoeba",
    "source_url": "https://tatoeba.org",
    "license": "CC BY 2.0 FR",
    "license_url": "https://creativecommons.org/licenses/by/2.0/fr/",
}


def parse_credit(text: str) -> dict:
    match = CREDIT.match(text)
    if not match:
        raise ValueError(f"Unknown credit: {text}")
    return {"author": match["author"], **TATOEBA}


def load_sentences(lang: str) -> list[dict]:
    path = repo.ROOT / "data" / "in" / "infinitesentences" / f"eng-{lang}.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    return [data[key] for key in sorted(data, key=int)]


def part_refs(pools: Pools, parts: list[dict]) -> list[str]:
    return [pools.vocab_ref(part["content"], "/".join(part["translations"])) for part in parts]


def main_candidates(sentences: list[dict]) -> list[dict]:
    return [
        {
            "text": sentence["sentence"],
            "translation": " / ".join(sentence["translations"]),
            "parts": sentence["parts"],
            "credits": [parse_credit(credit) for credit in sentence.get("credits", [])],
        }
        for sentence in sentences
    ]


def example_candidates(sentences: list[dict]) -> list[dict]:
    """One candidate per example text, linked to every part it exemplifies."""
    by_text: dict[str, dict] = {}
    for sentence in sentences:
        for part in sentence["parts"]:
            for text, translation, *credit in part.get("usageExamples") or []:
                entry = by_text.setdefault(text, {"text": text, "translation": translation, "parts": [], "credits": []})
                entry["parts"].append(part)
                if credit and credit[0] and not entry["credits"]:
                    entry["credits"] = [parse_credit(credit[0])]
    return list(by_text.values())


def add_new(pools: Pools, candidates: list[dict], known: set[str], limit: int) -> list[str]:
    refs = []
    for candidate in candidates:
        if len(refs) >= limit:
            break
        if candidate["text"] in known:
            continue
        known.add(candidate["text"])
        vocab = part_refs(pools, candidate["parts"])
        refs.append(pools.add_sentence(candidate["text"], candidate["translation"], vocab, candidate["credits"]))
    return refs


def main(lang: str) -> None:
    language = LANGUAGES[lang]
    pools = Pools(lang)
    sentences = load_sentences(lang)
    known = {item["text"] for item in pools.own("sentences").values()}
    room = MAX_SENTENCES - len(known)
    guess_once = add_new(pools, main_candidates(sentences), known, room)
    examples = add_new(pools, example_candidates(sentences), known, room - len(guess_once))
    pools.save()

    set_id, title = f"general-{language.name.lower()}", f"General {language.name}"
    add_to_set(set_id, title, guess_once, "guess-once")
    add_to_set(set_id, title, examples, "example")
    add_to_topic(set_id, title, {"sets": [set_id]})
    print(
        f"Added {len(guess_once)} guess-once sentences, {len(examples)} examples "
        f"and {len(pools.added['vocab'])} vocab items."
    )


if __name__ == "__main__":
    main(sys.argv[1])
