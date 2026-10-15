from flowcms.languages import Language
from flowcms.llm import json_completion

EXAMPLE = {
    "type": "object",
    "additionalProperties": False,
    "required": ["text", "translation"],
    "properties": {"text": {"type": "string"}, "translation": {"type": "string"}},
}

SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": ["vocab"],
    "properties": {
        "vocab": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": ["lemma", "examples"],
                "properties": {"lemma": {"type": "string"}, "examples": {"type": "array", "items": EXAMPLE}},
            },
        }
    },
}


def build_prompt(language: Language, counts: dict[str, int], existing_texts: set[str]) -> str:
    requested = "\n".join(f"- {lemma}: {count}" for lemma, count in counts.items())
    return "\n".join([
        f"Write the requested number of short, natural {language.name} example sentences for each vocabulary item below.",
        "Each sentence must demonstrate the listed vocabulary item in a normal inflected form "
        "and have an accurate English translation.",
        "Return one vocab entry for every listed lemma. Do not return unrequested vocabulary entries.",
        f"Do not repeat any of these existing sentences: {sorted(existing_texts)}.",
        requested,
    ])


def generate_examples(language: Language, counts: dict[str, int], existing_texts: set[str]) -> dict[str, list[dict]]:
    """Returns up to the requested number of new {text, translation} examples per lemma."""
    if not counts:
        return {}
    result = json_completion(build_prompt(language, counts, existing_texts), "vocab_examples", SCHEMA)
    examples_by_lemma = {entry["lemma"]: entry["examples"] for entry in result["vocab"]}
    seen = set(existing_texts)
    picked = {}
    for lemma, count in counts.items():
        fresh = [example for example in examples_by_lemma.get(lemma, []) if example["text"] not in seen]
        picked[lemma] = fresh[:count]
        seen.update(example["text"] for example in picked[lemma])
    return picked
