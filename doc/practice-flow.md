# Practice flow

1. On `/topics` (`src/pages/topics/`) the learner selects any number of topics.
2. `/` (`src/pages/practice/`) is one endless queue over the content of all selected topics. It shows one exercise at a time.
3. The learner finishes the exercise:
   - flashcards (vocab, sentences): reveal, then rate Again / Hard / Good / Easy,
   - preparing vocab of a guess-once sentence: memorize (word and translation for 5s, or Next) or understand (word with examples, guess, reveal, Next) once, then recall flashcards until rated Good or Easy,
   - guess-once sentence: "Can you understand this?", reveal possible after 2s, then Next. Shown once only,
   - video snippets: watch, then Next,
   - explanatory videos: watch, then one of Not interested / Already knew this / Got it / Show again later. A button can be clicked at any time, also while the video plays.
4. The answer is stored and the next exercise loads right away.

## Sentence modes

A set (`data/repo/sets/`) gives each of its sentences a mode:

- `flashcard`: the sentence is introduced once enough of its vocab is known, then repeated as a flashcard (FSRS).
- `guess-once`: all of its vocab is prepared first (at least 2 of them practiced, even if known), then the sentence is guessed once and never shown again.
- `example`: the sentence only illustrates its vocab.

The same vocab can come up in both flows: prepared while chasing a guess-once sentence, as regular flashcards otherwise.

If no topic is selected, the page links to `/topics`. If nothing can be shown, it says "Nothing due."

Content of selected topics is synced on every visit of `/` and stays available offline. Video exercises are skipped while offline.
