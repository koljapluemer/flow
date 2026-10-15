import { db, type GoalRow } from '../../db/db'

export function getGoals(): Promise<GoalRow[]> {
  return db.goals.toArray()
}

export async function putGoal(kind: GoalRow['kind'], target: string, now = new Date()): Promise<GoalRow> {
  const goal = { id: `${kind}:${target}`, kind, target, createdAt: now }
  await db.goals.put(goal)
  return goal
}

export async function deleteGoals(ids: string[]): Promise<void> {
  await db.goals.bulkDelete(ids)
}
