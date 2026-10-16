# Credits

Third-party content (e.g. Tatoeba sentences under CC BY) must be attributed. Sentences, vocab and videos take optional `credits` in `data/repo/` (`schema/credit.schema.json`):

```yaml
credits:
- author: carlosalberto
  source: Tatoeba
  source_url: https://tatoeba.org
  license: CC BY 2.0 FR
  license_url: https://creativecommons.org/licenses/by/2.0/fr/
```

`render.py` renders them as `[author, source, source url, license, license url]` tuples; they are stored on the content rows in Dexie.

`src/dumb/CreditList.vue` is the one way to show credits: one small line "source · author · license" per credit, with links where URLs exist. It is shown with every sentence (on the back), vocab example, challenge (after reveal) and video that has credits.
