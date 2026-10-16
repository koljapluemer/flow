"""Validates data/repo and renders it to compact JSON in public/data.

topics.json:       [{"id", "title"}]
topics/<id>.json:  {"v": [[ref, lemma, translation, credits]],
                    "s": [[ref, text, translation, [vocab index], [mode], credits]],
                    "y": [[ref, title, platform, platform id, explanatory, credits]],
                    "n": [[video ref, [[start, end, text, translation, [vocab index], [core vocab index]]]]]}
                   Sentences ("s") are those of the topic's sets, with every mode a set gives them.
                   Snippets ("n") are only rendered for immersion videos.
credits:           [[author, source, source url | null, license, license url | null]]

Usage: uv run render.py
"""

import json
import shutil
import sys
from pathlib import Path

from flowcms import repo
from flowcms.validate import validate

OUT = repo.ROOT / "public" / "data"


def write_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


def render_snippet(snippet: dict, index: dict[str, int]) -> list:
    return [
        snippet["start"],
        snippet["end"],
        snippet["text"],
        snippet["translation"],
        [index[ref] for ref in snippet["vocab"]],
        [index[ref] for ref in snippet["core"]],
    ]


def render_credits(item: dict) -> list:
    return [
        [credit["author"], credit["source"], credit.get("source_url"), credit["license"], credit.get("license_url")]
        for credit in item.get("credits", [])
    ]


def sentence_modes(topic: dict, sets: dict) -> dict[str, list[str]]:
    modes: dict[str, list[str]] = {}
    for set_id in topic.get("sets", []):
        for entry in sets[set_id]["sentences"]:
            ref_modes = modes.setdefault(entry["ref"], [])
            if entry["mode"] not in ref_modes:
                ref_modes.append(entry["mode"])
    return modes


def render_topic(topic: dict, sets: dict, sentences: dict, vocab: dict, videos: dict) -> dict:
    modes = sentence_modes(topic, sets)
    topic_sentences = {ref: sentences[ref] for ref in modes}
    topic_videos = {ref: videos[ref] for ref in topic.get("videos", [])}
    immersion_videos = {ref: video for ref, video in topic_videos.items() if video["immersion"]}
    vocab_refs = list(
        dict.fromkeys(
            [ref for sentence in topic_sentences.values() for ref in sentence["vocab"]]
            + [ref for video in immersion_videos.values() for snippet in video["snippets"] for ref in snippet["vocab"]]
        )
    )
    index = {ref: position for position, ref in enumerate(vocab_refs)}
    return {
        "v": [[ref, vocab[ref]["lemma"], vocab[ref]["translation"], render_credits(vocab[ref])] for ref in vocab_refs],
        "s": [
            [
                ref,
                sentence["text"],
                sentence["translation"],
                [index[vocab_ref] for vocab_ref in sentence["vocab"]],
                modes[ref],
                render_credits(sentence),
            ]
            for ref, sentence in topic_sentences.items()
        ],
        "y": [
            [ref, video["title"], video["platform"], video["platform_id"], video["explanatory"], render_credits(video)]
            for ref, video in topic_videos.items()
        ],
        "n": [
            [ref, [render_snippet(snippet, index) for snippet in video["snippets"]]]
            for ref, video in immersion_videos.items()
        ],
    }


def main() -> None:
    errors = validate()
    if errors:
        print("\n".join(errors), file=sys.stderr)
        sys.exit(1)

    topics, sets, sentences, vocab, videos = (repo.read_pool(pool) for pool in repo.POOLS)
    shutil.rmtree(OUT / "topics", ignore_errors=True)
    write_json(OUT / "topics.json", [{"id": topic_id, "title": topic["title"]} for topic_id, topic in topics.items()])
    for topic_id, topic in topics.items():
        write_json(OUT / "topics" / f"{topic_id}.json", render_topic(topic, sets, sentences, vocab, videos))
    print(f"Rendered {len(topics)} topics.")


if __name__ == "__main__":
    main()
