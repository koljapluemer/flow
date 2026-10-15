// Knobs of the practice queue, see doc/practice.md.
export const MAX_GOALS = 2
// Chance per step to spawn an introduce goal while a goal slot is free.
export const P_SPAWN_INTRODUCE = 0.3
// Chance to spawn a repair goal when a composite gestalt is rated Again/Hard.
export const P_SPAWN_REPAIR = 0.5
// Chance per step to chase a goal instead of picking a random due gestalt.
export const P_CHASE = 0.7
// Share of a target's related gestalts that must be introduced and not due before the target is introduced.
export const INTRODUCE_THRESHOLD = 0.5
