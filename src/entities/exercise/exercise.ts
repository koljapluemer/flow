import type { Component } from 'vue'
import { createEmptyCard, fsrs, type Grade } from 'ts-fsrs'
import {
  db,
  type ExerciseCardRow,
  type ExplanationAnswer,
  type GestaltCardRow,
  type GestaltKind,
  type GestaltRow,
  type SentenceRow,
  type SnippetRow,
  type VideoRow,
  type VocabRow
} from '../../db/db'

// An exercise belongs to one or more gestalts; rating it reviews all of them.
export type Exercise = { id: string; type: string; variant: string; contentId: string; gestaltIds: string[] }

// What an exercise emits when done: a grade for FSRS, the answer to an explanatory video,
// or `shown` for an exercise without a grade.
export type ExerciseResult = Grade | ExplanationAnswer | 'shown'

// The flow a gestalt is practiced in: regular flashcards, or preparing a guess-once sentence.
export type ExerciseStyle = 'flashcard' | 'guess-once'

// Stored content plus the gestalts of the selected topics. `exampleSentenceIds` are their sentences that
// may illustrate vocab: all but guess-once sentences not guessed yet, which examples would give away.
export type ExerciseContext = {
  vocab: Map<string, VocabRow>
  sentences: Map<string, SentenceRow>
  videos: Map<string, VideoRow>
  snippets: Map<string, SnippetRow>
  gestalts: Map<string, GestaltRow>
  exampleSentenceIds: Set<string>
}

// The learner's progress on a gestalt, as far as exercises care.
export type GestaltProgress = { card: GestaltCardRow | undefined; shown: boolean }

// One kind of exercise. `component` takes a `view` prop and emits `done` with an `ExerciseResult`.
export type ExerciseType<View = unknown> = {
  type: string
  gestaltKind: GestaltKind
  // The flow the type serves; `any` serves both.
  style: ExerciseStyle | 'any'
  requiresOnline: boolean
  variants: (gestalt: GestaltRow) => Exercise[]
  // How appropriate a variant is for the gestalt's current state; 0 = not at all.
  fit: (exercise: Exercise, progress: GestaltProgress, context: ExerciseContext) => number
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

// Inverse of the id built by `makeExercise`.
export function parseExerciseId(id: string): { type: string; variant: string; contentId: string } {
  const [type = '', variant = '', ...rest] = id.split(':')
  return { type, variant, contentId: rest.join(':') }
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
