import type { GestaltKind } from '@/db/db'
import type { ExerciseType } from '@/entities/exercise/exercise'
import { explanationWatch } from '@/features/explanation-watch/explanationWatch'
import { sentencePractice } from '@/features/sentence-practice/sentencePractice'
import { snippetWatch } from '@/features/snippet-watch/snippetWatch'
import { vocabPractice } from '@/features/vocab-practice/vocabPractice'

const exerciseTypes: ExerciseType[] = [vocabPractice, sentencePractice, snippetWatch, explanationWatch]

export function exerciseTypeByName(name: string): ExerciseType | undefined {
  return exerciseTypes.find((type) => type.type === name)
}

export function exerciseTypesFor(kind: GestaltKind, online: boolean): ExerciseType[] {
  return exerciseTypes.filter((type) => type.gestaltKind === kind && (online || !type.requiresOnline))
}

export function isKindAvailable(kind: GestaltKind, online: boolean): boolean {
  return exerciseTypesFor(kind, online).length > 0
}
