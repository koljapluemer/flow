I want to move the repo away from user-triggered learning material to static data, deployed into public.
This should happen in three stages:

1. `data/in`: gitignored, fairly simply, hacky, bespoke data format spontaneously defined, scripted into more useful stuff with scripts like `/cms/misc_scripts/000_generate-sentence-vocab.py`
2. `data/repo`: the source of truth for data, should use yaml so it's quickly human editable but also parseable and lintable by a machine
3. `public/data`: "rendered" data in optimized JSON, preferring tight data formats to minimize loading. Not edited, emergent from data/repo.

For now, let's do a simple test:

- parse the simple sentence format in `data/in/sentences`
- do basically what is now done on the fly after user inputs a topic, but as a cms function: split sentences into their vocab, ensure each vocab item has at least 3 example sentences
- remove user-based topic adding flow
- I'm not yet sure how to cluster topics/lessons/whatever. For now, create two "Basic German" and "Basic Vietnamese" which just contain all sentences
- User should in a screen be able to select which topics interest them, and exercises should be then appropriately generated based on the data