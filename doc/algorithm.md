# Algorithm (high level)

The queue (`src/pages/practice/queue/`) picks one exercise per step, in two stages: first a **gestalt**, then one of its **exercises**. Everything in the selected topics is eligible, no matter how many topics are selected.

## Goals

The queue chases two goals at a time (fewer only if nothing is left to introduce):

- **introduce**: introduce a new composite gestalt (sentence, snippet). First its related gestalts are practiced until enough of them are introduced, then the gestalt itself is shown. Explanations have no related gestalts, so an explanation goal shows its video right away.
- **repair**: after a composite gestalt was rated Again or Hard, practice each of its related gestalts once.
- **challenge**: show a guess-once sentence once. First each of its vocab is practiced until it was last rated Good/Easy and is not due; at least 2 of them are practiced during the goal. Then the sentence is shown.

A goal is replaced by a new goal as soon as it is done: a challenge goal if the new target is a guess-once sentence, an introduce goal otherwise.

## Picking the gestalt

- 70% of steps chase a goal: a gestalt that a random goal wants.
- The other 30% repeat: a random introduced gestalt that is due.
- If the chosen way finds nothing, the other is used.
- The gestalt shown last is never shown again right away.

## Picking the exercise

A gestalt chased for a challenge goal is practiced guess-once style (vocab: memorize/understand, then recall); every other pick uses flashcard style. Each exercise type scores how well its variants fit the gestalt's current state, e.g. flashcards with translations for new vocab, without once it is stable. The best fitting variant is shown, preferring ones not seen yet or due.

## Rating

Flashcard, recall and snippet exercises are rated with a grade: the exercise and its gestalts get the same FSRS review. Vocab intros and challenges are only recorded as shown. Explanatory videos store the learner's answer instead (`gestalts.md`).

Details: `algorithm-details.md`.
