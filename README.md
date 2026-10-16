# german-flow

Spaced-repetition practice for sentences and vocab, grouped into topics. Content is static, built by the CMS (`cms/`) and served from `public/data/`. Progress is stored per user in Dexie. How practice works: `doc/README.md`.

## Local development

```sh
npm install
npm run dev
```

## Content

Content moves through three stages:

1. `data/in/` — gitignored raw input in ad-hoc formats, e.g. `data/in/sentences/<lang>.txt` (`"English": "Target"` per line) or `data/in/videos/<name>.yaml` (see `001_import-video.py`).
2. `data/repo/` — source of truth, YAML, edit by hand. Topic-first:
   - `topics.yaml`, `sets.yaml`, `sentences.yaml`, `vocab.yaml`, `videos.yaml`: flat lists of refs.
   - `topics/<id>.yaml`: title + set ids and video refs, in any languages.
   - `sets/<id>.yaml`: title + sentence refs, each with a mode: `flashcard` (repeated flashcards), `guess-once` (vocab first, then the sentence is guessed once) or `example` (only a vocab example). See `doc/practice-flow.md`.
   - `sentences/<lang>/<slug>.yaml`, `vocab/<lang>/<slug>.yaml`: one file per item; its ref is `<lang>/<slug>`. Sentences, vocab and videos take optional `credits` (`doc/credits.md`).
   - `videos/<lang>/<platform id>.yaml`: title, platform (`youtube`, `tiktok`) and platform id, the flags `immersion` and `explanatory`, and for immersion videos snippets (start, end, text, translation, vocab, core vocab). See `doc/videos.md`.
   - `schema/`: JSON Schemas for each item type (editors pick them up via the header comment).
3. `public/data/` — compact JSON rendered from `data/repo/`. Never edit by hand.

The CMS needs [uv](https://docs.astral.sh/uv/) and `OPENAI_API_KEY` in `.env` (`cp .env.example .env`). Video import also needs `ffmpeg` and `node` (for yt-dlp).

```sh
cd cms
uv run misc_scripts/000_generate-sentence-vocab.py deu   # data/in → data/repo (OpenAI: vocab split, example sentences)
uv run misc_scripts/001_import-video.py ../data/in/videos/<name>.yaml   # YouTube video → snippets, vocab, example sentences
uv run misc_scripts/002_import-infinitesentences.py fra  # infinite-sentences export → guess-once sentences, vocab
uv run render.py                                         # validate data/repo → public/data
```

`000_generate-sentence-vocab.py` skips sentences already in the repo and adds generated example sentences until every vocab item has at least 3 sentences. `001_import-video.py` downloads audio and subtitles, splits the audio at speaking pauses into 5–15s snippets, and has OpenAI translate each snippet and split it into vocab (marked core or not); it adds example sentences the same way. `002_import-infinitesentences.py` reads `data/in/infinitesentences/eng-<lang>.json` (copied from sam-learns-things' `public/data/infinitesentences/sentences/`), keeps its split (each sentence part is a vocab item), adds at most 1000 sentences with their Tatoeba credits to the set and topic "General <Language>" (sentences as guess-once, usage examples as examples) and generates nothing; French and Italian need no minimum of examples. `render.py` fails with a list of problems if the repo is invalid (schema errors, unlisted or missing files, unknown refs, overlapping snippets, immersion videos without snippets, too few examples).

## Deployment (Netlify)

Commit `public/data/` after rendering; Netlify only runs `npm run build`.
