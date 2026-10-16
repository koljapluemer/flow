# Exercise types (`src/features/`)

An exercise type (`ExerciseType` in `src/entities/exercise/exercise.ts`) lists the variants for a gestalt, scores how well each fits the gestalt's progress (card, shown) and the content, resolves a view from stored content, and has a component that takes the `view` prop and emits `done` with an `ExerciseResult`: a grade (FSRS), `shown` (no grade) or an explanation answer. Its `style` says which flow it serves: `flashcard`, `guess-once` or `any` (`algorithm.md`). Types are registered in `src/pages/practice/queue/exerciseRegistry.ts`. Types with `requiresOnline` are skipped offline; gestalt kinds without any available type are skipped entirely.

| Type                 | Gestalt       | Variant      | Fits when                       | Front                           | Back / result            |
| -------------------- | ------------- | ------------ | ------------------------------- | ------------------------------- | ------------------------ |
| `vocab-practice`     | vocab         | `translated` | new or (re)learning             | word, 3 examples + translations | translation              |
|                     |               | `examples`   | review, stability < 7 days      | word, 3 examples                | translation              |
|                     |               | `bare`       | review, stability ≥ 7 days      | word                            | translation, 3 examples  |
| `vocab-prepare`      | vocab         | `memorize`   | no card, not shown              | word + translation for 5s       | `shown`                  |
|                      |               | `understand` | no card, not shown, ≥2 examples | word, 3 examples + translations | translation, `shown`     |
|                      |               | `recall`     | card or shown                   | word                            | translation, grade       |
| `sentence-practice` | sentence      | `with-vocab` | new or (re)learning             | sentence, vocab list            | translation              |
|                     |               | `plain`      | review                          | sentence                        | translation, vocab list  |
| `sentence-challenge` | challenge    | `once`       | always                          | sentence, reveal after 2s       | translation, `shown`     |
| `snippet-watch`     | snippet       | `watch`      | always (online only)            | video clip, Next (= Good)       |                          |
| `explanation-watch` | explanation   | `watch`      | always (online only)            | whole video, 4 answer buttons   | the answer               |

Styles: `vocab-practice` is `flashcard`, `vocab-prepare` is `guess-once`, all others `any`.

Vocab examples are selected sentences (of any mode) containing the vocab, except guess-once sentences not shown yet, which they would give away. Credits are shown with every sentence, example and video that has them (`credits.md`).

## Adding a type

1. A feature folder `src/features/<entity>-<action>/` with the type (`<name>.ts`) and its component.
2. Register it in `exerciseRegistry.ts`.
3. A new gestalt kind also needs `GestaltKind` in `src/db/db.ts`, gestalts derived in `src/pages/practice/content/topicGestalts.ts`, and (if not FSRS-scheduled) handling in `isIntroduced` / `isDue` (`queueState.ts`) and `rate.ts`.

Check it with the exercise preview (`debugging.md`).
