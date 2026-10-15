# Practice

The practice page (`src/pages/practice/`) is one endless queue over the content of the topics the user selected (`src/pages/topics/`). Content is static (see `README.md`) and copied into Dexie; progress is stored per user in Dexie.

## Model

- **Gestalt**: a learnable unit: a vocab item, a sentence, a video snippet. Id `<kind>:<content id>`, e.g. `vocab:deu/nett`, `snippet:arz/ZoYMAQgRMUw#3`.
  - `relatedIds`: what a composite gestalt builds on. A sentence is related to all its vocab, a snippet to its core vocab.
  - `topicIds`: the topics it is in. Gestalts outside the selected topics are paused.
- **Exercise**: one way to practice gestalts, e.g. a vocab flashcard with translated examples. It belongs to one or more gestalts (`gestaltIds`). Exercises are derived from gestalts by exercise types and are not stored.
- **Cards**: gestalts and exercises each get an FSRS card on their first review (`gestaltCards`, `exerciseCards`). A gestalt without a card is not introduced yet.
- **Goal**: something the queue works towards, at most `MAX_GOALS` at once (`goals`).

## Data (`src/db/db.ts`)

| Table            | Key         | Content                                                    |
| ---------------- | ----------- | ---------------------------------------------------------- |
| `vocab`          | repo ref    | `word`, `translation`                                      |
| `sentences`      | repo ref    | `text`, `translation`, `vocabIds`                          |
| `snippets`       | `<ref>#<n>` | `youtubeId`, `start`, `end`, `text`, `translation`, `vocabIds`, `coreVocabIds` |
| `gestalts`       | gestalt id  | `kind`, `contentId`, `topicIds`, `relatedIds`              |
| `gestaltCards`   | gestalt id  | FSRS card                                                  |
| `exerciseCards`  | exercise id | FSRS card                                                  |
| `goals`          | goal id     | `kind` (`introduce` / `repair`), `target`, `createdAt`     |
| `selectedTopics` | topic id    |                                                            |

On page load, the selected topics are fetched from `public/data/topics/` and stored (`content/syncTopics.ts`). If that fails (offline), stored content is used.

## Queue step (`queue/`)

1. **Settle goals** (`goals/goalLifecycle.ts`): finished goals are removed, as are goals whose target is not available (deselected topic, offline). If an introduce goal finished, its target is shown next.
2. **Maybe spawn an introduce goal**: with chance `P_SPAWN_INTRODUCE` while a goal slot is free.
3. **Pick a gestalt** (`pickGestalt.ts`): with chance `P_CHASE`, a gestalt wanted by a random goal; otherwise a random due gestalt; if nothing is due, a wanted gestalt. Never the gestalt shown last. If nothing can be picked, an introduce goal is spawned regardless of chance and picking is retried; then "Nothing due."
4. **Pick an exercise** (`pickExercise.ts`): all variants of the exercise types for the gestalt's kind, scored by `fit`. Among those with fit > 0, unseen or due exercises are preferred, then the highest fit, then random.
5. **Rate** (`rate.ts`): the exercise and all its gestalts get the same FSRS review. If a composite gestalt is rated Again/Hard, a repair goal for it is spawned with chance `P_SPAWN_REPAIR`.

### Goals

| Goal        | Spawned                                         | Wants                                                      | Done when                                                   |
| ----------- | ----------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------- |
| `introduce` | step 2, for a random not introduced composite (random kind first) | related gestalts that are not introduced, or due           | `INTRODUCE_THRESHOLD` of related are introduced and not due |
| `repair`    | step 5                                          | related gestalts not reviewed since the goal was created   | nothing is wanted                                           |

Snippets of a video are introduced in order: only the first not introduced snippet of each video can be an introduce target.

All knobs are in `queue/tuning.ts`.

## Exercise types (`src/features/`)

An exercise type (`ExerciseType` in `src/entities/exercise/exercise.ts`) lists the variants for a gestalt, scores how well each fits the gestalt's card, resolves a view from stored content, and has a component that emits `done` with a grade. Types are registered in `queue/exerciseRegistry.ts`. Types with `requiresOnline` are skipped offline; gestalt kinds without any available type are skipped entirely.

| Type                | Gestalt  | Variant      | Fits when                       | Front                           | Back                     |
| ------------------- | -------- | ------------ | ------------------------------- | ------------------------------- | ------------------------ |
| `vocab-practice`    | vocab    | `translated` | new or (re)learning             | word, 3 examples + translations | translation              |
|                     |          | `examples`   | review, stability < 7 days      | word, 3 examples                | translation              |
|                     |          | `bare`       | review, stability ≥ 7 days      | word                            | translation, 3 examples  |
| `sentence-practice` | sentence | `with-vocab` | new or (re)learning             | sentence, vocab list            | translation              |
|                     |          | `plain`      | review                          | sentence                        | translation, vocab list  |
| `snippet-watch`     | snippet  | `watch`      | always (online only)            | YouTube clip, Next (= Good)     |                          |

Vocab examples are selected sentences containing the vocab.

## Logging

The queue logs via [`debug`](https://www.npmjs.com/package/debug) (`src/dumb/log.ts`), off by default. In the browser console:

```js
localStorage.debug = 'flow:*' // or e.g. 'flow:queue,flow:goal'
```

then reload. `localStorage.removeItem('debug')` turns it off.

| Namespace       | Logs                                                         |
| --------------- | ------------------------------------------------------------ |
| `flow:sync`     | per topic, number of items per kind                          |
| `flow:goal`     | per step, progress of each goal; spawned, done               |
| `flow:queue`    | per step, active goals, number due, picked gestalt and why   |
| `flow:exercise` | variants with fit and whether unseen/due, chosen exercise    |
| `flow:rate`     | exercise, grade, new due dates of the reviewed gestalts      |
