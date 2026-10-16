# Data

Content is static (see the root `README.md`) and copied into Dexie; progress is stored per user in Dexie (`src/db/db.ts`).

| Table                 | Key         | Content                                                          |
| --------------------- | ----------- | ---------------------------------------------------------------- |
| `vocab`               | repo ref    | `word`, `translation`                                            |
| `sentences`           | repo ref    | `text`, `translation`, `vocabIds`                                |
| `videos`              | repo ref    | `title`, `platform`, `platformId`, `explanatory`                 |
| `snippets`            | `<ref>#<n>` | `videoId`, `index`, `start`, `end`, `text`, `translation`, `vocabIds`, `coreVocabIds` |
| `gestalts`            | gestalt id  | `kind`, `contentId`, `topicIds`, `relatedIds`                    |
| `gestaltCards`        | gestalt id  | FSRS card                                                        |
| `exerciseCards`       | exercise id | FSRS card                                                        |
| `explanationProgress` | video ref   | `answer`, `shownCount`, `due`                                    |
| `goals`               | goal id     | `kind` (`introduce` / `repair`), `target`, `createdAt`           |
| `selectedTopics`      | topic id    |                                                                  |

Content tables, `gestalts` and `selectedTopics` describe what can be practiced; the card, progress and goal tables are the learner's progress.

## Sync

On every visit of `/` (and of the exercise preview), the selected topics are fetched from `public/data/topics/<id>.json` and stored (`src/pages/practice/content/syncTopics.ts`). `topicGestalts.ts` derives the gestalts: one per vocab item, sentence and snippet, and one per explanatory video. A gestalt in several topics is stored once with all their ids. If fetching fails (offline), stored content is used.

Snippets are only rendered for immersion videos, so non-immersion videos produce no snippet gestalts.
