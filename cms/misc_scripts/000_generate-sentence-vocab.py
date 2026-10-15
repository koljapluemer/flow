"""Turns data/in/sentences/<lang>.txt ('"English": "Target"' per line) into sentence and vocab items in data/repo.

Already imported sentences are skipped, so reruns only process new lines. Afterwards, generated example
sentences are added until every vocab item of the language has at least MIN_EXAMPLES sentences.
All new sentences are added to the topic "Basic <Language>".

Usage: uv run misc_scripts/000_generate-sentence-vocab.py <lang>
"""

import re
import sys

from flowcms import repo
from flowcms.languages import LANGUAGES, Language
from flowcms.pools import Pools, add_examples, add_to_topic
from flowcms.split_vocab import split_vocab

LINE = re.compile(r'^"(?P<translation>.+?)":\s*"(?P<text>.+)"$')


def parse_input(lang: str) -> list[dict]:
    lines = (repo.ROOT / "data" / "in" / "sentences" / f"{lang}.txt").read_text(encoding="utf-8").splitlines()
    pairs = []
    for line in filter(None, map(str.strip, lines)):
        match = LINE.match(line)
        if not match:
            raise ValueError(f"Unparseable line: {line}")
        pairs.append(match.groupdict())
    return pairs


def import_sentences(pools: Pools, language: Language) -> list[str]:
    known_texts = {item["text"] for item in pools.own("sentences").values()}
    new = [pair for pair in parse_input(language.code) if pair["text"] not in known_texts]
    if not new:
        return []
    vocab_lists = split_vocab(language, new, list(pools.lemma_refs))
    return [
        pools.add_sentence(pair["text"], pair["translation"], [pools.vocab_ref(**entry) for entry in vocab])
        for pair, vocab in zip(new, vocab_lists)
    ]


def main(lang: str) -> None:
    language = LANGUAGES[lang]
    pools = Pools(lang)
    refs = import_sentences(pools, language)
    refs += add_examples(pools, language)
    pools.save()
    add_to_topic(f"basic-{language.name.lower()}", f"Basic {language.name}", {"sentences": refs})
    print(f"Added {len(pools.added['sentences'])} sentences and {len(pools.added['vocab'])} vocab items.")


if __name__ == "__main__":
    main(sys.argv[1])
