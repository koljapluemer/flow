import type { GoalRow } from '@/db/db'
import { logger } from '@/dumb/log'
import { deleteGoals, getGoals, putGoal } from '@/entities/goal/goal'
import { isIntroduced, relatedOf, type QueueState } from '../queueState'
import { MAX_GOALS, P_SPAWN_REPAIR } from '../tuning'
import { challengeProgress, challengeWanted } from './challengeGoal'
import { introduceProgress, introduceWanted, isIntroduceDone, pickNewTarget } from './introduceGoal'
import { repairWanted } from './repairGoal'

const log = logger('goal')

export function wantedGestalts(goal: GoalRow, state: QueueState): string[] {
  if (goal.kind === 'introduce') return introduceWanted(goal, state)
  if (goal.kind === 'challenge') return challengeWanted(goal, state)
  return repairWanted(goal, state)
}

function isGoalDone(goal: GoalRow, state: QueueState): boolean {
  if (!state.context.gestalts.has(goal.target)) return true
  if (goal.kind === 'repair') return repairWanted(goal, state).length === 0
  if (isIntroduced(state, goal.target)) return true
  return goal.kind === 'challenge' ? challengeWanted(goal, state).length === 0 : isIntroduceDone(goal, state)
}

function logProgress(goal: GoalRow, state: QueueState): void {
  if (goal.kind === 'repair') {
    log('%s: %d related left', goal.id, repairWanted(goal, state).length)
    return
  }
  const { ready, total } = goal.kind === 'challenge' ? challengeProgress(goal, state) : introduceProgress(goal, state)
  log('%s: %d/%d related ready, %d wanted', goal.id, ready, total, wantedGestalts(goal, state).length)
}

// Removes finished goals (also those whose target is no longer available).
// Returns the targets that are to be introduced (or, for challenges, shown) now.
export async function settleGoals(state: QueueState): Promise<string[]> {
  state.goals.forEach((goal) => logProgress(goal, state))
  const done = state.goals.filter((goal) => isGoalDone(goal, state))
  if (done.length === 0) return []
  done.forEach((goal) => log('%s: done', goal.id))
  await deleteGoals(done.map((goal) => goal.id))
  state.goals = state.goals.filter((goal) => !done.includes(goal))
  return done
    .filter((goal) => goal.kind !== 'repair' && state.context.gestalts.has(goal.target))
    .filter((goal) => !isIntroduced(state, goal.target))
    .map((goal) => goal.target)
}

// Spawns goals for new targets until all goal slots are taken or nothing is left:
// challenge goals for challenges, introduce goals for everything else.
export async function fillGoals(state: QueueState): Promise<void> {
  while (state.goals.length < MAX_GOALS) {
    const target = pickNewTarget(state)
    if (!target) return
    const goal = await putGoal(target.kind === 'challenge' ? 'challenge' : 'introduce', target.id, state.now)
    state.goals.push(goal)
    log('%s: spawned', goal.id)
  }
}

// Called after the given gestalts were rated Again/Hard.
export async function maybeSpawnRepairGoals(state: QueueState, gestaltIds: string[], now: Date): Promise<void> {
  const goals = await getGoals()
  for (const id of gestaltIds) {
    const isComposite = state.context.gestalts.get(id)?.kind !== 'vocab' && relatedOf(state, id).length > 0
    if (!isComposite || goals.length >= MAX_GOALS || Math.random() >= P_SPAWN_REPAIR) continue
    goals.push(await putGoal('repair', id, now))
    log('repair:%s: spawned', id)
  }
}
