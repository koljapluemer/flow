"""Splits a video's audio into snippets at speaking pauses and attaches subtitle text to each.

Cuts are placed in the middle of pauses (longest pause within the allowed window wins);
if a window contains no pause, the snippet is force-cut at the max length.
"""

import json
import re
import subprocess
import sys
from pathlib import Path

MIN_LEN = 5.0
MAX_LEN = 15.0
NOISE = "-30dB"
MIN_PAUSE = 0.3


def probe_duration(media: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(media)],
        check=True,
        capture_output=True,
        text=True,
    ).stdout
    return float(out.strip())


def detect_silences(media: Path) -> list[tuple[float, float]]:
    proc = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostats", "-i", str(media), "-vn",
         "-af", f"silencedetect=noise={NOISE}:d={MIN_PAUSE}", "-f", "null", "-"],
        check=True,
        capture_output=True,
        text=True,
    )
    silences: list[tuple[float, float]] = []
    start = None
    for line in proc.stderr.splitlines():
        if m := re.search(r"silence_start: (-?[\d.]+)", line):
            start = max(0.0, float(m.group(1)))
        elif (m := re.search(r"silence_end: ([\d.]+)", line)) and start is not None:
            silences.append((start, float(m.group(1))))
            start = None
    return silences


def load_or_detect_silences(media: Path, folder: Path) -> dict:
    cache = folder / "silences.json"
    params = {"noise": NOISE, "min_pause": MIN_PAUSE}
    if cache.exists():
        data = json.loads(cache.read_text(encoding="utf-8"))
        if data.get("params") == params:
            return data
    print("Running ffmpeg silencedetect...", file=sys.stderr)
    data = {"params": params, "duration": probe_duration(media), "silences": detect_silences(media)}
    cache.write_text(json.dumps(data), encoding="utf-8")
    return data


def split(duration: float, silences: list[tuple[float, float]]) -> list[tuple[float, float]]:
    # candidate cut = middle of a pause, weighted by pause length
    cuts = [((a + b) / 2, b - a) for a, b in silences]

    # skip leading and trailing silence
    start = silences[0][1] if silences and silences[0][0] <= 0.05 else 0.0
    end_of_speech = silences[-1][0] if silences and silences[-1][1] >= duration - 0.05 else duration

    segments: list[tuple[float, float]] = []
    while end_of_speech - start > MAX_LEN:
        window = [c for c in cuts if start + MIN_LEN <= c[0] <= start + MAX_LEN]
        cut = max(window, key=lambda c: c[1])[0] if window else start + MAX_LEN
        segments.append((start, cut))
        start = cut
    if end_of_speech > start:
        segments.append((start, end_of_speech))

    # too-short tail: merge into the previous snippet, or re-cut both so each is >= MIN_LEN
    if len(segments) >= 2 and segments[-1][1] - segments[-1][0] < MIN_LEN:
        prev_start, end = segments[-2][0], segments[-1][1]
        if end - prev_start <= MAX_LEN:
            segments[-2:] = [(prev_start, end)]
        else:
            window = [c for c in cuts if prev_start + MIN_LEN <= c[0] <= end - MIN_LEN and c[0] - prev_start <= MAX_LEN]
            cut = max(window, key=lambda c: c[1])[0] if window else end - MIN_LEN
            segments[-2:] = [(prev_start, cut), (cut, end)]
    return segments


def load_subtitle_words(path: Path) -> list[tuple[float, str]]:
    """Returns (time, text) pieces. Auto subs have per-word offsets, manual subs per-event text."""
    data = json.loads(path.read_text(encoding="utf-8"))
    pieces: list[tuple[float, str]] = []
    for event in data.get("events", []):
        if "segs" not in event or event.get("aAppend"):
            continue
        event_start = event.get("tStartMs", 0)
        event_end = event_start + event.get("dDurationMs", 0)
        for seg_idx, seg in enumerate(event["segs"]):
            text = seg.get("utf8", "")
            if not text.strip():
                continue
            if "tOffsetMs" in seg or len(event["segs"]) > 1:
                t = event_start + seg.get("tOffsetMs", 0)
            else:
                t = (event_start + event_end) / 2  # whole-line event: use its midpoint
            # events are separate lines, keep a word boundary between them
            pieces.append((t / 1000, f" {text}" if seg_idx == 0 else text))
    return pieces


def split_snippets(media: Path, subtitles: Path, folder: Path) -> list[dict]:
    """Returns [{start, end, text}] in video order, without snippets that have no text."""
    data = load_or_detect_silences(media, folder)
    pieces = load_subtitle_words(subtitles)
    snippets = []
    for start, end in split(data["duration"], [tuple(s) for s in data["silences"]]):
        text = " ".join("".join(t for time, t in pieces if start <= time < end).split())
        if text:
            snippets.append({"start": round(start, 3), "end": round(end, 3), "text": text})
    return snippets
