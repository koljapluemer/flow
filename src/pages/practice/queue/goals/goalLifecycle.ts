import type { GoalRow } from '@/db/db'
import { logger } from '@/dumb/log'
import { deleteGoals, getGoals, putGoal } from '@/entities/goal/goal'
import { isIntroduced, relatedOf, type QueueState } from '../queueState'
import { MAX_GOALS, P_SPAWN_REPAIR } from '../tuning'
import { introduceProgress, introduceWanted, isIntroduceDone, pickIntroduceTarget } from './introduceGoal'
import { repairWanted } from './repairGoal'

const log = logger('goal')

export function wantedGestalts(goal: GoalRow, state: QueueState): string[] {
  return goal.kind === 'introduce' ? introduceWanted(goal, state) : repairWanted(goal, state)
}

function isGoalDone(goal: GoalRow, state: QueueState): boolean {
  if (!state.context.gestalts.has(goal.target)) return true
  if (goal.kind === 'repair') return repairWanted(goal, state).length === 0
  return isIntroduced(state, goal.target) || isIntroduceDone(goal, state)
}

function logProgress(goal: GoalRow, state: QueueState): void {
  if (goal.kind === 'introduce') {
    const { ready, total } = introduceProgress(goal, state)
    log('%s: %d/%d related ready', goal.id, ready, total)
  } else {
    log('%s: %d related left', goal.id, repairWanted(goal, state).length)
  }
}

// Removes finished goals (also those whose target is no longer available).
// Returns the targets that are to be introduced now.
export async function settleGoals(state: QueueState): Promise<string[]> {
  state.goals.forEach((goal) => logProgress(goal, state))
  const done = state.goals.filter((goal) => isGoalDone(goal, state))
  if (done.length === 0) return []
  done.forEach((goal) => log('%s: done', goal.id))
  await deleteGoals(done.map((goal) => goal.id))
  state.goals = state.goals.filter((goal) => !done.includes(goal))
  return done
    .filter((goal) => goal.kind === 'introduce' && state.context.gestalts.has(goal.target))
    .filter((goal) => !isIntroduced(state, goal.target))
    .map((goal) => goal.target)
}

// Spawns introduce goals until all goal slots are taken or nothing is left to introduce.
export async function fillIntroduceGoals(state: QueueState): Promise<void> {
  while (state.goals.length < MAX_GOALS) {
    const target = pickIntroduceTarget(state)
    if (!target) return
    const goal = await putGoal('introduce', target, state.now)
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
