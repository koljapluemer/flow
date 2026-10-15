# Practice

The practice page (`src/pages/practice/`) is an endless spaced-repetition flow over the sentences and vocab of the topics the user selected (`src/pages/topics/`). Content is static (see `README.md`) and copied into Dexie; progress is stored per user in Dexie.

## Data (`src/db/db.ts`)

| Table           | Key                 | Content                                                  |
| --------------- | ------------------- | -------------------------------------------------------- |
| `sentences`     | repo ref            | `text`, `translation`, `vocabIds`, `topicIds`            |
| `vocab`         | repo ref            | `word`, `translation`                                    |
| `sentenceCards` | sentence id         | FSRS card + `lastAnswerCorrect`                          |
| `vocabCards`    | vocab id            | FSRS card + `level` (1–4) + `initialSentence`            |
| `selectedTopics`| topic id            |                                                          |

Content (`sentences`, `vocab`) and progress (`*Cards`) are separate. A sentence or vocab item without a card has not been seen yet. Ids are repo refs like `deu/der-tisch`.

## Flow (`queue/`)

On page load, the content of all selected topics is fetched from `public/data/topics/` and stored in Dexie (`content/syncTopics.ts`). If that fails (offline), stored content is used.

Only sentences of selected topics and their vocab take part; cards of deselected topics are paused. Each step, `usePracticeQueue` picks one item:

1. Build the due pool (`duePool.ts`), excluding the item shown last (never show the same item back-to-back):
   - vocab level 1–3: always due
   - vocab level 4: due when FSRS says so
   - sentence, last answer wrong: due when FSRS says so
   - sentence, last answer correct: due when FSRS says so **and** all its vocab is level 4 and not due
2. Pool empty → introduce an unseen stored sentence (`newSentencePicker.ts`), preferring the most overlap with vocab already being learned. This creates its sentence card and cards for any new vocab (`initialSentence` = this sentence).
3. No unseen sentences left → "Nothing due." (or a link to the topic page if no topics are selected).

## Cards (`resolveCandidate.ts`, `card/`)

Example sentences for vocab are other stored sentences containing that vocab.

| Item                   | Front                                                  | Back                                   |
| ---------------------- | ------------------------------------------------------ | -------------------------------------- |
| vocab level 1          | word, initial sentence + 2 examples, with translations | translation                            |
| vocab level 2          | word, 3 examples (not initial), with translations      | translation                            |
| vocab level 3          | word, 3 examples, without translations                 | translation                            |
| vocab level 4          | word                                                   | translation, 3 examples                |
| sentence, last wrong   | sentence, vocab list                                   | translation                            |
| sentence, last correct | sentence                                               | translation, vocab list                |

## Rating

Standard FSRS grades (Again / Hard / Good / Easy), plus:

- vocab: Good/Easy → level +1, Again → level −1 (clamped to 1–4)
- sentence: `lastAnswerCorrect` = Good/Easy
- sentence previously correct, now Again/Hard → due date of all its vocab set to now (no FSRS review simulated)
