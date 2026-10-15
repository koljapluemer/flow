"""In-memory editing of the repo pools of one language, shared by the import scripts."""

from collections import Counter
from itertools import islice

from flowcms import repo
from flowcms.generate_examples import generate_examples
from flowcms.languages import Language
from flowcms.validate import MIN_EXAMPLES

EXAMPLE_BATCH = 20
EXAMPLE_ROUNDS = 3


class Pools:
    """Item pools of one language, held in memory until saved."""

    def __init__(self, lang: str, names: tuple[str, ...] = ("sentences", "vocab")):
        self.lang = lang
        self.items = {pool: repo.read_pool(pool) for pool in names}
        self.added: dict[str, list[str]] = {pool: [] for pool in names}
        self.lemma_refs = {item["lemma"]: ref for ref, item in self.own("vocab").items()}

    def own(self, pool: str) -> dict[str, dict]:
        return {ref: item for ref, item in self.items[pool].items() if ref.startswith(f"{self.lang}/")}

    def put(self, pool: str, ref: str, item: dict) -> str:
        self.items[pool][ref] = item
        self.added[pool].append(ref)
        return ref

    def add(self, pool: str, slug_text: str, item: dict) -> str:
        return self.put(pool, repo.unique_ref(self.lang, slug_text, set(self.items[pool])), item)

    def vocab_ref(self, lemma: str, translation: str) -> str:
        lemma = lemma.strip()
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


def batches(items: dict, size: int):
    iterator = iter(items.items())
    while batch := dict(islice(iterator, size)):
        yield batch


def missing_examples(pools: Pools) -> dict[str, int]:
    counts = Counter(ref for item in pools.own("sentences").values() for ref in item["vocab"])
    return {lemma: MIN_EXAMPLES - counts[ref] for lemma, ref in pools.lemma_refs.items() if counts[ref] < MIN_EXAMPLES}


def add_examples(pools: Pools, language: Language) -> list[str]:
    """Adds generated sentences until every vocab item of the language has MIN_EXAMPLES. Returns their refs.
    Retries for a few rounds, since replies sometimes skip requested lemmas."""
    refs = []
    for _ in range(EXAMPLE_ROUNDS):
        missing = missing_examples(pools)
        if not missing:
            break
        texts = {item["text"] for item in pools.own("sentences").values()}
        for batch in batches(missing, EXAMPLE_BATCH):
            for lemma, examples in generate_examples(language, batch, texts).items():
                for example in examples:
                    texts.add(example["text"])
                    refs.append(pools.add_sentence(example["text"], example["translation"], [pools.lemma_refs[lemma]]))
    return refs


def add_to_topic(topic_id: str, title: str, refs_by_pool: dict[str, list[str]]) -> None:
    """Appends refs to a topic's pool lists, creating the topic if needed."""
    topic_ids = repo.read_index("topics")
    if topic_id in topic_ids:
        topic = repo.read_item("topics", topic_id)
    else:
        topic = {"title": title}
        repo.write_index("topics", topic_ids + [topic_id])
    for pool, refs in refs_by_pool.items():
        if refs:
            topic[pool] = topic.get(pool, []) + refs
    repo.write_item("topics", topic_id, topic)
