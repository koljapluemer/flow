"""Validates data/repo and renders it to compact JSON in public/data.

topics.json:       [{"id", "title"}]
topics/<id>.json:  {"v": [[ref, lemma, translation]],
                    "s": [[ref, text, translation, [vocab index]]],
                    "y": [[ref, youtube id, [[start, end, text, translation, [vocab index], [core vocab index]]]]]}

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


def render_topic(topic: dict, sentences: dict, vocab: dict, videos: dict) -> dict:
    topic_sentences = {ref: sentences[ref] for ref in topic.get("sentences", [])}
    topic_videos = {ref: videos[ref] for ref in topic.get("videos", [])}
    vocab_refs = list(
        dict.fromkeys(
            [ref for sentence in topic_sentences.values() for ref in sentence["vocab"]]
            + [ref for video in topic_videos.values() for snippet in video["snippets"] for ref in snippet["vocab"]]
        )
    )
    index = {ref: position for position, ref in enumerate(vocab_refs)}
    return {
        "v": [[ref, vocab[ref]["lemma"], vocab[ref]["translation"]] for ref in vocab_refs],
        "s": [
            [ref, sentence["text"], sentence["translation"], [index[vocab_ref] for vocab_ref in sentence["vocab"]]]
            for ref, sentence in topic_sentences.items()
        ],
        "y": [
            [ref, video["youtube"], [render_snippet(snippet, index) for snippet in video["snippets"]]]
            for ref, video in topic_videos.items()
        ],
    }


def main() -> None:
    errors = validate()
    if errors:
        print("\n".join(errors), file=sys.stderr)
        sys.exit(1)

    topics, sentences, vocab, videos = (repo.read_pool(pool) for pool in repo.POOLS)
    shutil.rmtree(OUT / "topics", ignore_errors=True)
    write_json(OUT / "topics.json", [{"id": topic_id, "title": topic["title"]} for topic_id, topic in topics.items()])
    for topic_id, topic in topics.items():
        write_json(OUT / "topics" / f"{topic_id}.json", render_topic(topic, sentences, vocab, videos))
    print(f"Rendered {len(topics)} topics.")


if __name__ == "__main__":
    main()
