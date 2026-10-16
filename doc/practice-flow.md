# Practice flow

1. On `/topics` (`src/pages/topics/`) the learner selects any number of topics.
2. `/` (`src/pages/practice/`) is one endless queue over the content of all selected topics. It shows one exercise at a time.
3. The learner finishes the exercise:
   - flashcards (vocab, sentences): reveal, then rate Again / Hard / Good / Easy,
   - video snippets: watch, then Next,
   - explanatory videos: watch, then one of Not interested / Already knew this / Got it / Show again later. A button can be clicked at any time, also while the video plays.
4. The answer is stored and the next exercise loads right away.

If no topic is selected, the page links to `/topics`. If nothing can be shown, it says "Nothing due."

Content of selected topics is synced on every visit of `/` and stays available offline. Video exercises are skipped while offline.
