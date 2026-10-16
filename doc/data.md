# Data

Content is static (see the root `README.md`) and copied into Dexie; progress is stored per user in Dexie (`src/db/db.ts`).

| Table                 | Key         | Content                                                          |
| --------------------- | ----------- | ---------------------------------------------------------------- |
| `vocab`               | repo ref    | `word`, `translation`, `credits`                                 |
| `sentences`           | repo ref    | `text`, `translation`, `vocabIds`, `credits`                     |
| `videos`              | repo ref    | `title`, `platform`, `platformId`, `explanatory`, `credits`      |
| `snippets`            | `<ref>#<n>` | `videoId`, `index`, `start`, `end`, `text`, `translation`, `vocabIds`, `coreVocabIds` |
| `gestalts`            | gestalt id  | `kind`, `contentId`, `topicIds`, `relatedIds`                    |
| `topicSentences`      | topic id    | `sentenceIds` (all modes)                                        |
| `gestaltCards`        | gestalt id  | FSRS card, `lastRating`                                          |
| `exerciseCards`       | exercise id | FSRS card                                                        |
| `explanationProgress` | video ref   | `answer`, `shownCount`, `due`                                    |
| `shownGestalts`       | gestalt id  | `shownAt` (first ungraded showing)                               |
| `goals`               | goal id     | `kind` (`introduce` / `repair` / `challenge`), `target`, `createdAt` |
| `selectedTopics`      | topic id    |                                                                  |

Content tables, `topicSentences`, `gestalts` and `selectedTopics` describe what can be practiced; the card, progress, shown and goal tables are the learner's progress.

## Sync

On every visit of `/` (and of the exercise preview), the selected topics are fetched from `public/data/topics/<id>.json` and stored (`src/pages/practice/content/syncTopics.ts`). A topic's sentences are those of its sets, each with the modes the sets give it. `topicGestalts.ts` derives the gestalts: one per vocab item and snippet, a `sentence` per flashcard sentence, a `challenge` per guess-once sentence, none for example sentences, and one per explanatory video. A gestalt in several topics is stored once with all their ids. If fetching fails (offline), stored content is used.

Snippets are only rendered for immersion videos, so non-immersion videos produce no snippet gestalts.
