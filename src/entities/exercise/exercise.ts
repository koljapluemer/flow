import type { Component } from 'vue'
import { createEmptyCard, fsrs, type Grade } from 'ts-fsrs'
import {
  db,
  type ExerciseCardRow,
  type GestaltCardRow,
  type GestaltKind,
  type GestaltRow,
  type SentenceRow,
  type SnippetRow,
  type VocabRow
} from '../../db/db'

// An exercise belongs to one or more gestalts; rating it reviews all of them.
export type Exercise = { id: string; type: string; variant: string; contentId: string; gestaltIds: string[] }

// Stored content plus the gestalts of the selected topics.
export type ExerciseContext = {
  vocab: Map<string, VocabRow>
  sentences: Map<string, SentenceRow>
  snippets: Map<string, SnippetRow>
  gestalts: Map<string, GestaltRow>
}

// One kind of exercise. `component` takes a `view` prop and emits `done` with a grade.
export type ExerciseType<View = unknown> = {
  type: string
  gestaltKind: GestaltKind
  requiresOnline: boolean
  variants: (gestalt: GestaltRow) => Exercise[]
  // How appropriate a variant is for the gestalt's current state; 0 = not at all.
  fit: (exercise: Exercise, gestaltCard: GestaltCardRow | undefined) => number
  resolve: (exercise: Exercise, context: ExerciseContext) => View
  component: Component
}

export function makeExercise(type: string, variant: string, gestalt: GestaltRow): Exercise {
  return {
    id: `${type}:${variant}:${gestalt.contentId}`,
    type,
    variant,
    contentId: gestalt.contentId,
    gestaltIds: [gestalt.id]
  }
}

const scheduler = fsrs()

export async function getExerciseCards(): Promise<Map<string, ExerciseCardRow>> {
  const rows = await db.exerciseCards.toArray()
  return new Map(rows.map((row) => [row.id, row]))
}

export async function reviewExerciseCard(id: string, rating: Grade, now = new Date()): Promise<void> {
  const existing = await db.exerciseCards.get(id)
  await db.exerciseCards.put({ ...scheduler.next(existing ?? createEmptyCard(now), now, rating).card, id })
}
