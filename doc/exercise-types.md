# Exercise types (`src/features/`)

An exercise type (`ExerciseType` in `src/entities/exercise/exercise.ts`) lists the variants for a gestalt, scores how well each fits the gestalt's card, resolves a view from stored content, and has a component that takes the `view` prop and emits `done` with an `ExerciseResult`: a grade (FSRS) or an explanation answer. Types are registered in `src/pages/practice/queue/exerciseRegistry.ts`. Types with `requiresOnline` are skipped offline; gestalt kinds without any available type are skipped entirely.

| Type                | Gestalt       | Variant      | Fits when                       | Front                           | Back / result            |
| ------------------- | ------------- | ------------ | ------------------------------- | ------------------------------- | ------------------------ |
| `vocab-practice`    | vocab         | `translated` | new or (re)learning             | word, 3 examples + translations | translation              |
|                     |               | `examples`   | review, stability < 7 days      | word, 3 examples                | translation              |
|                     |               | `bare`       | review, stability ≥ 7 days      | word                            | translation, 3 examples  |
| `sentence-practice` | sentence      | `with-vocab` | new or (re)learning             | sentence, vocab list            | translation              |
|                     |               | `plain`      | review                          | sentence                        | translation, vocab list  |
| `snippet-watch`     | snippet       | `watch`      | always (online only)            | video clip, Next (= Good)       |                          |
| `explanation-watch` | explanation   | `watch`      | always (online only)            | whole video, 4 answer buttons   | the answer               |

Vocab examples are selected sentences containing the vocab.

## Adding a type

1. A feature folder `src/features/<entity>-<action>/` with the type (`<name>.ts`) and its component.
2. Register it in `exerciseRegistry.ts`.
3. A new gestalt kind also needs `GestaltKind` in `src/db/db.ts`, gestalts derived in `src/pages/practice/content/topicGestalts.ts`, and (if not FSRS-scheduled) handling in `isIntroduced` / `isDue` and `rate.ts`.

Check it with the exercise preview (`debugging.md`).
