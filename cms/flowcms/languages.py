from dataclasses import dataclass

# Sentences each vocab item must appear in; generated examples fill the gap.
MIN_EXAMPLES = 3


@dataclass(frozen=True)
class Language:
    code: str
    name: str
    lemma_rule: str
    # Languages imported with a fixed split get no generated examples.
    min_examples: int = MIN_EXAMPLES


LANGUAGES = {
    language.code: language
    for language in [
        Language("deu", "German", 'nouns with their article (e.g. "der Tisch"), verbs in the infinitive'),
        Language("vie", "Vietnamese", 'keep multi-syllable words together as one item (e.g. "làm phiền")'),
        Language(
            "arz",
            "Egyptian Arabic",
            "without diacritics, nouns and adjectives in the masculine singular, "
            'verbs in the 3rd person masculine singular past tense (e.g. "كتب")',
        ),
        Language("fra", "French", 'nouns with their article (e.g. "la table"), verbs in the infinitive', min_examples=0),
        Language("ita", "Italian", 'nouns with their article (e.g. "il tavolo"), verbs in the infinitive', min_examples=0),
    ]
}


def min_examples(lang: str) -> int:
    language = LANGUAGES.get(lang)
    return language.min_examples if language else MIN_EXAMPLES
