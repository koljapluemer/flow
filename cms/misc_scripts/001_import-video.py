"""Imports a YouTube video as snippets with vocab into data/repo.

Config (data/in/videos/<name>.yaml):
  video_id: ZoYMAQgRMUw
  subtitle_lang: ar        # yt-dlp subtitle language code
  lang: arz                # repo language code, see flowcms/languages.py
  topic: egyptian-vlogs
  topic_title: Egyptian Vlogs

Audio, subtitles and silence detection are cached in data/in/videos/<video_id>/. Writes
data/repo/videos/<lang>/<video_id>.yaml and new vocab, adds generated example sentences until every
vocab item of the language has enough, and adds the video to the topic and these sentences as flashcards to
the set of the same id, which the topic references.

Usage: uv run misc_scripts/001_import-video.py <config>
"""

import sys
from pathlib import Path

from flowcms import repo
from flowcms.languages import LANGUAGES
from flowcms.pools import Pools, add_examples, add_to_set, add_to_topic
from flowcms.video.analyze import analyze
from flowcms.video.download import download_audio, download_subtitles, video_info
from flowcms.video.split import split_snippets

CONFIG_KEYS = {"video_id", "subtitle_lang", "lang", "topic", "topic_title"}


def load_config(path: Path) -> dict:
    config = {key: str(value) for key, value in (repo.read_yaml(path) or {}).items()}
    missing = CONFIG_KEYS - config.keys()
    if missing:
        raise SystemExit(f"{path.name}: missing keys {sorted(missing)}")
    return config


def build_snippets(pools: Pools, snippets: list[dict], analyses: list[dict]) -> list[dict]:
    built = []
    for snippet, analysis in zip(snippets, analyses):
        refs = [(pools.vocab_ref(item["lemma"], item["translation"]), item["core"]) for item in analysis["vocab"]]
        vocab = list(dict.fromkeys(ref for ref, _ in refs))
        core = list(dict.fromkeys(ref for ref, is_core in refs if is_core))
        built.append({**snippet, "translation": analysis["translation"], "vocab": vocab, "core": core})
    return built


def main(config_path: Path) -> None:
    config = load_config(config_path)
    language = LANGUAGES[config["lang"]]
    video_id = config["video_id"]
    ref = f"{language.code}/{video_id}"
    pools = Pools(language.code, ("sentences", "vocab", "videos"))
    if ref in pools.items["videos"]:
        raise SystemExit(f"{ref} is already imported")

    folder = repo.ROOT / "data" / "in" / "videos" / video_id
    folder.mkdir(parents=True, exist_ok=True)
    info = video_info(video_id)
    if not info.get("playable_in_embed", True):
        raise SystemExit(f"{video_id} cannot be embedded")
    audio = download_audio(video_id, folder)
    subtitles = download_subtitles(info, config["subtitle_lang"], folder)

    snippets = split_snippets(audio, subtitles, folder)
    analyses = analyze(language, [snippet["text"] for snippet in snippets], list(pools.lemma_refs))
    video = {
        "title": info["title"],
        "platform": "youtube",
        "platform_id": video_id,
        "immersion": True,
        "explanatory": False,
        "snippets": build_snippets(pools, snippets, analyses),
    }
    pools.put("videos", ref, video)
    sentence_refs = add_examples(pools, language)
    pools.save()
    add_to_set(config["topic"], config["topic_title"], sentence_refs, "flashcard")
    add_to_topic(config["topic"], config["topic_title"], {"videos": [ref], "sets": [config["topic"]]})
    print(
        f"Added {len(snippets)} snippets, {len(pools.added['vocab'])} vocab items "
        f"and {len(sentence_refs)} example sentences."
    )


if __name__ == "__main__":
    main(Path(sys.argv[1]))
