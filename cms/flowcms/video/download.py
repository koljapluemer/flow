"""Fetches YouTube metadata, audio and subtitles (json3) via yt-dlp. Downloads are cached in the given folder."""

import json
import subprocess
import sys
import time
from pathlib import Path

SUBTITLE_RETRY_WAITS = [30, 90, 180]


def yt_dlp(args: list[str], capture: bool = False) -> str:
    # node instead of the default deno; needed for YouTube signature solving
    proc = subprocess.run(
        [sys.executable, "-m", "yt_dlp", "--js-runtimes", "node", *args],
        check=True,
        capture_output=capture,
        text=True,
    )
    return proc.stdout


def url(video_id: str) -> str:
    return f"https://www.youtube.com/watch?v={video_id}"


def video_info(video_id: str) -> dict:
    return json.loads(yt_dlp(["-J", "--skip-download", url(video_id)], capture=True))


def download_audio(video_id: str, folder: Path) -> Path:
    if not list(folder.glob("audio.*")):
        yt_dlp(["-f", "ba", "-o", str(folder / "audio.%(ext)s"), url(video_id)])
    return next(folder.glob("audio.*"))


def pick_subtitle_track(info: dict, lang: str) -> tuple[str, bool] | None:
    """Returns (track key, is_auto). Manual subs first, then the original ASR track (<lang>-orig);
    plain auto <lang> may be a machine translation, which YouTube rate-limits heavily (429)."""
    manual = info.get("subtitles") or {}
    auto = info.get("automatic_captions") or {}
    if lang in manual:
        return lang, False
    if f"{lang}-orig" in auto:
        return f"{lang}-orig", True
    if lang in auto:
        return lang, True
    return None


def download_subtitles(info: dict, lang: str, folder: Path) -> Path:
    path = folder / f"subtitles.{lang}.json3"
    if path.exists():
        return path
    track = pick_subtitle_track(info, lang)
    if track is None:
        raise SystemExit(f"No '{lang}' subtitles for {info['id']}")
    key, is_auto = track
    print(f"Using {'auto' if is_auto else 'manual'} subtitle track '{key}'", file=sys.stderr)
    args = ["--skip-download", "--write-auto-subs" if is_auto else "--write-subs", "--sub-langs", key]
    args += ["--sub-format", "json3", "-o", str(folder / "subtitles.%(ext)s"), url(info["id"])]
    for wait in [*SUBTITLE_RETRY_WAITS, None]:
        try:
            yt_dlp(args)
            break
        except subprocess.CalledProcessError:
            if wait is None:
                raise
            print(f"Subtitle download failed, retrying in {wait}s", file=sys.stderr)
            time.sleep(wait)
    (folder / f"subtitles.{key}.json3").replace(path)
    return path
