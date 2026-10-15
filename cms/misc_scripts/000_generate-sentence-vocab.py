"""Turns data/in/sentences/<lang>.txt ('"English": "Target"' per line) into sentence and vocab items in data/repo.

Already imported sentences are skipped, so reruns only process new lines. Afterwards, generated example
sentences are added until every vocab item of the language has at least MIN_EXAMPLES sentences.
All new sentences are added to the topic "Basic <Language>".

Usage: uv run misc_scripts/000_generate-sentence-vocab.py <lang>
"""

import re
import sys
from collections import Counter

from flowcms import repo
from flowcms.generate_examples import generate_examples
from flowcms.languages import LANGUAGES, Language
from flowcms.split_vocab import split_vocab
from flowcms.validate import MIN_EXAMPLES

LINE = re.compile(r'^"(?P<translation>.+?)":\s*"(?P<text>.+)"$')


class Pools:
    """Sentence and vocab pools of one language, held in memory until saved."""

    def __init__(self, lang: str):
        self.lang = lang
        self.items = {pool: repo.read_pool(pool) for pool in ("sentences", "vocab")}
        self.added: dict[str, list[str]] = {"sentences": [], "vocab": []}
        self.lemma_refs = {item["lemma"]: ref for ref, item in self.own("vocab").items()}

    def own(self, pool: str) -> dict[str, dict]:
        return {ref: item for ref, item in self.items[pool].items() if ref.startswith(f"{self.lang}/")}

    def add(self, pool: str, slug_text: str, item: dict) -> str:
        ref = repo.unique_ref(self.lang, slug_text, set(self.items[pool]))
        self.items[pool][ref] = item
        self.added[pool].append(ref)
        return ref

    def vocab_ref(self, lemma: str, translation: str) -> str:
        if lemma not in self.lemma_refs:
            self.lemma_refs[lemma] = self.add("vocab", lemma, {"lemma": lemma, "translation": translation})
        return self.lemma_refs[lemma]

    def add_sentence(self, text: str, translation: str, vocab_refs: list[str]) -> str:
        item = {"text": text, "translation": translation, "vocab": list(dict.fromkeys(vocab_refs))}
        return self.add("sentences", text, item)

    def save(self) -> None:
        for pool, refs in self.added.items():
            for ref in refs:
                repo.write_item(pool, ref, self.items[pool][ref])
            repo.write_index(pool, repo.read_index(pool) + refs)


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


def add_examples(pools: Pools, language: Language) -> list[str]:
    sentences = pools.own("sentences").values()
    counts = Counter(ref for item in sentences for ref in item["vocab"])
    missing = {
        lemma: MIN_EXAMPLES - counts[ref] for lemma, ref in pools.lemma_refs.items() if counts[ref] < MIN_EXAMPLES
    }
    examples = generate_examples(language, missing, {item["text"] for item in sentences})
    return [
        pools.add_sentence(example["text"], example["translation"], [pools.lemma_refs[lemma]])
        for lemma, lemma_examples in examples.items()
        for example in lemma_examples
    ]


def add_to_topic(language: Language, refs: list[str]) -> None:
    topic_id = f"basic-{language.name.lower()}"
    topic_ids = repo.read_index("topics")
    if topic_id in topic_ids:
        topic = repo.read_item("topics", topic_id)
    else:
        topic = {"title": f"Basic {language.name}", "sentences": []}
        repo.write_index("topics", topic_ids + [topic_id])
    topic["sentences"] += refs
    repo.write_item("topics", topic_id, topic)


def main(lang: str) -> None:
    language = LANGUAGES[lang]
    pools = Pools(lang)
    refs = import_sentences(pools, language)
    refs += add_examples(pools, language)
    pools.save()
    if refs:
        add_to_topic(language, refs)
    print(f"Added {len(pools.added['sentences'])} sentences and {len(pools.added['vocab'])} vocab items.")


if __name__ == "__main__":
    main(sys.argv[1])
