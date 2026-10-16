# Gestalts, exercises, cards, goals

- **Gestalt**: a learnable unit. Id `<kind>:<content id>`, e.g. `vocab:deu/nett`, `snippet:arz/ZoYMAQgRMUw#3`, `explanation:arz/7495810055649004802`.

  | Kind          | Content                        | `relatedIds`          |
  | ------------- | ------------------------------ | --------------------- |
  | `vocab`       | a vocab item                   | none                  |
  | `sentence`    | a flashcard sentence           | all its vocab         |
  | `challenge`   | a guess-once sentence          | all its vocab         |
  | `snippet`     | a clip of an immersion video   | its core vocab        |
  | `explanation` | a whole explanatory video      | none                  |

  Sentences, challenges and snippets are **composite**: they build on their related gestalts. `topicIds` lists the topics a gestalt is in; gestalts outside the selected topics are paused.
- **Exercise**: one way to practice a gestalt, e.g. a vocab flashcard with translated examples. Id `<type>:<variant>:<content id>`. Exercises are derived from gestalts by exercise types (`exercise-types.md`) and are not stored.
- **Introduced**: a gestalt is introduced once it was practiced the first time. A challenge is introduced once shown, and is never due.
- **Due**: an introduced gestalt that should be practiced again now.
- **Cards**: vocab, sentence and snippet gestalts and their exercises are scheduled by FSRS. Each gets a card on its first review (`gestaltCards`, `exerciseCards`); having a card means introduced, the card's due date says when it is due. A gestalt card also keeps its last rating; Good and Easy count as remembered.
- **Shown**: exercises without a grade (vocab intros, challenges) record their gestalts as shown (`shownGestalts`).
- **Explanation progress**: explanations are not scheduled by FSRS but by the learner's answer (`explanationProgress`):

  | Answer             | Effect                                  |
  | ------------------ | --------------------------------------- |
  | Not interested     | never shown again                       |
  | Already knew this  | never shown again                       |
  | Got it             | never shown again                       |
  | Show again later   | due again after an interval, see below  |

  The three final answers are kept apart for later analysis. Every answer counts as one showing (`shownCount`). After the n-th showing, "Show again later" makes it due in 2 days, 3 days, 1 week, 2 weeks, 1 month, 3 months, then 1 year for every further showing (`src/entities/explanation/explanation.ts`).
- **Goal**: something the queue works towards, see `algorithm.md`.
