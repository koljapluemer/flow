Implement the possibility of having explanatory videos.
They are still of type video, but model is a boolean whether they are immersion content (ie. the existing kind of videos, which get introduced snippet-wise and so on) and whether they are explanatory (two booleans, both can be true also, or both false, which effectively deactivates the video).


For everything to work, ensure practice works as follows:

- the learner may have an arbitrary number of topics activated
- goals and exercises may be picked from any of the active topics
- the algo chases two goals at any given time (except cases in which none are left)
- 70% of the time, the algo prefers picking an exercise that is goal-related, the rest of the time it prefers picking a random already-practiced exercise that is in need of repeating (all of this follows the gestalt/exercise dual step ofc)

Explanatory videos get a very simple goal-chasing behavior: they are simply loaded, without any prerequisites.
On this video player page, have 3 buttons on the bottom and persist the answer.
- Not Interested
- Already Knew This 
- Got It
- Show Again Later

Clicking any at any time auto-loads the next exercise.

the first three simply deactivate the video from showing up again (the semantic difference will perhaps be used later to analyze how much a video is liked or something) . 
for the third option to work, we need to track also a due date and a nr of times the video has been shown. 
After 1st watch, set due in 2 days, then in 3 days, then week, 2 weeks, month, 3 month, year (this is the maximum, time range does not go up after this).

Keep doc/ up to date and split it out from a big god file into sensible units that explain different parts of the practice flow, gestalts, algo high-level, algo low-level, etc.

Add a preview debug route where we can look at an exercise as a dev to check it out.
