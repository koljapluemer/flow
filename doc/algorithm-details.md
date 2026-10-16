# Algorithm (details)

All files are in `src/pages/practice/queue/`. Each step loads a `QueueState` (`queueState.ts`): stored content, the gestalts of the selected topics whose kind has an exercise type available (offline: no video types), cards, explanation progress and goals. `isIntroduced` and `isDue` there hide whether a gestalt is scheduled by FSRS or by explanation progress.

## Queue step (`usePracticeQueue.ts`)

1. **Settle goals** (`goals/goalLifecycle.ts`): finished goals are removed, as are goals whose target is not available (deselected topic, offline). If an introduce goal finished, its target is shown next and the step ends.
2. **Fill goals**: free goal slots (up to `MAX_GOALS`) are filled with introduce goals.
3. **Pick a gestalt** (`pickGestalt.ts`): with chance `P_CHASE`, a gestalt wanted by a random goal; otherwise a random due gestalt; if that finds nothing, the other way. Never the gestalt shown last. If nothing can be picked: "Nothing due."
4. **Pick an exercise** (`pickExercise.ts`): all variants of the exercise types for the gestalt's kind, scored by `fit`. Among those with fit > 0, unseen or due exercises are preferred, then the highest fit, then random.
5. **Record the result** (`rate.ts`): a grade reviews the exercise and all its gestalts with FSRS; if a composite gestalt is rated Again/Hard, a repair goal for it is spawned with chance `P_SPAWN_REPAIR` while a goal slot is free. An explanation answer is stored in `explanationProgress`.

## Goals

| Goal        | Spawned                                    | Wants                                                    | Done when                                                       |
| ----------- | ------------------------------------------ | -------------------------------------------------------- | --------------------------------------------------------------- |
| `introduce` | step 2, for a random not introduced composite or explanation (random kind first) | related gestalts that are not introduced, or due         | target introduced, or `INTRODUCE_THRESHOLD` of related are introduced and not due (always for explanations) |
| `repair`    | step 5                                     | related gestalts not reviewed since the goal was created | nothing is wanted                                               |

Snippets of a video are introduced in order: only the first not introduced snippet of each video can be an introduce target. Explanations answered with anything are introduced and never targeted again; "Show again later" brings them back through step 3 once due.

## Tuning (`tuning.ts`)

| Knob                  | Value | Meaning                                                              |
| --------------------- | ----- | -------------------------------------------------------------------- |
| `MAX_GOALS`           | 2     | goals chased at once                                                 |
| `P_CHASE`             | 0.7   | chance per step to chase a goal instead of repeating a due gestalt   |
| `P_SPAWN_REPAIR`      | 0.5   | chance to spawn a repair goal after Again/Hard                       |
| `INTRODUCE_THRESHOLD` | 0.5   | share of related gestalts ready before a target is introduced        |

The "Show again later" intervals are in `src/entities/explanation/explanation.ts`.
