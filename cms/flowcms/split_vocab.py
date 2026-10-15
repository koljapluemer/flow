from flowcms.languages import Language
from flowcms.llm import json_completion

VOCAB_ITEM = {
    "type": "object",
    "additionalProperties": False,
    "required": ["lemma", "translation"],
    "properties": {"lemma": {"type": "string"}, "translation": {"type": "string"}},
}

SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": ["sentences"],
    "properties": {
        "sentences": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": ["index", "vocab"],
                "properties": {"index": {"type": "integer"}, "vocab": {"type": "array", "items": VOCAB_ITEM}},
            },
        }
    },
}


def build_prompt(language: Language, sentences: list[dict], known_lemmas: list[str]) -> str:
    listed = "\n".join(f"{index}. {s['text']} ({s['translation']})" for index, s in enumerate(sentences))
    return "\n".join([
        f"For each numbered {language.name} sentence below, list all vocab needed to understand it.",
        f"Vocab lemma: dictionary form; {language.lemma_rule}.",
        "Vocab translation: short English meaning as used in the sentence.",
        f"Reuse these existing lemmas where they fit: {known_lemmas}.",
        "Return one entry per sentence, with its number as index.",
        listed,
    ])


def split_vocab(language: Language, sentences: list[dict], known_lemmas: list[str]) -> list[list[dict]]:
    """Returns the vocab ({lemma, translation}) of each given {text, translation} sentence, in input order."""
    result = json_completion(build_prompt(language, sentences, known_lemmas), "sentence_vocab", SCHEMA)
    vocab_by_index = {entry["index"]: entry["vocab"] for entry in result["sentences"]}
    missing = [s["text"] for index, s in enumerate(sentences) if not vocab_by_index.get(index)]
    if missing:
        raise RuntimeError(f"No vocab returned for: {missing}")
    return [vocab_by_index[index] for index in range(len(sentences))]
