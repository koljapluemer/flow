from dataclasses import dataclass


@dataclass(frozen=True)
class Language:
    code: str
    name: str
    lemma_rule: str


LANGUAGES = {
    language.code: language
    for language in [
        Language("deu", "German", 'nouns with their article (e.g. "der Tisch"), verbs in the infinitive'),
        Language("vie", "Vietnamese", 'keep multi-syllable words together as one item (e.g. "làm phiền")'),
    ]
}
