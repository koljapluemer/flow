import type { GestaltKind } from '@/db/db'
import type { ExerciseStyle, ExerciseType } from '@/entities/exercise/exercise'
import { explanationWatch } from '@/features/explanation-watch/explanationWatch'
import { sentenceChallenge } from '@/features/sentence-challenge/sentenceChallenge'
import { sentencePractice } from '@/features/sentence-practice/sentencePractice'
import { snippetWatch } from '@/features/snippet-watch/snippetWatch'
import { vocabPractice } from '@/features/vocab-practice/vocabPractice'
import { vocabPrepare } from '@/features/vocab-prepare/vocabPrepare'

const exerciseTypes: ExerciseType[] = [
  vocabPractice,
  vocabPrepare,
  sentencePractice,
  sentenceChallenge,
  snippetWatch,
  explanationWatch
]

export function exerciseTypeByName(name: string): ExerciseType | undefined {
  return exerciseTypes.find((type) => type.type === name)
}

export function exerciseTypesFor(kind: GestaltKind, online: boolean): ExerciseType[] {
  return exerciseTypes.filter((type) => type.gestaltKind === kind && (online || !type.requiresOnline))
}

// The types for the kind that serve the style.
export function exerciseTypesInStyle(kind: GestaltKind, online: boolean, style: ExerciseStyle): ExerciseType[] {
  return exerciseTypesFor(kind, online).filter((type) => type.style === style || type.style === 'any')
}

export function isKindAvailable(kind: GestaltKind, online: boolean): boolean {
  return exerciseTypesFor(kind, online).length > 0
}
