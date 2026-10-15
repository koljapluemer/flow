"""Translates snippets and splits them into lemmatized vocab, each rated as core or not.

One call per snippet: batched calls dropped snippets from their replies.
"""

import sys

from flowcms.languages import Language
from flowcms.llm import json_completion

VOCAB_ITEM = {
    "type": "object",
    "additionalProperties": False,
    "required": ["lemma", "translation", "core"],
    "properties": {"lemma": {"type": "string"}, "translation": {"type": "string"}, "core": {"type": "boolean"}},
}

SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": ["translation", "vocab"],
    "properties": {"translation": {"type": "string"}, "vocab": {"type": "array", "items": VOCAB_ITEM}},
}


def build_prompt(language: Language, text: str, known_lemmas: list[str]) -> str:
    return "\n".join([
        f"Below is a snippet of a {language.name} video transcript.",
        "Transcripts may be auto-generated and contain errors; go with what is most plausibly meant.",
        "Give a natural English translation and list all vocab needed to understand the snippet.",
        f"Vocab lemma: dictionary form; {language.lemma_rule}.",
        "Vocab translation: short English meaning as used in the snippet.",
        "Vocab core: true if the item is essential to grasp the snippet's meaning, "
        "false for fillers, function words and details the gist does not depend on.",
        f"Reuse these existing lemmas where they fit: {known_lemmas}.",
        text,
    ])


def analyze(language: Language, texts: list[str], known_lemmas: list[str]) -> list[dict]:
    """Returns {translation, vocab: [{lemma, translation, core}]} per text, in input order."""
    results: list[dict] = []
    lemmas = list(known_lemmas)
    for number, text in enumerate(texts, start=1):
        print(f"Analyzing snippet {number}/{len(texts)}", file=sys.stderr)
        result = json_completion(build_prompt(language, text, lemmas), "snippet_vocab", SCHEMA)
        lemmas += [item["lemma"] for item in result["vocab"] if item["lemma"] not in lemmas]
        results.append(result)
    return results
