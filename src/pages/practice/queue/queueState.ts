import type {
  ExerciseCardRow,
  ExplanationProgressRow,
  GestaltCardRow,
  GestaltRow,
  GoalRow,
  ShownGestaltRow
} from '@/db/db'
import { getExerciseCards, type ExerciseContext, type GestaltProgress } from '@/entities/exercise/exercise'
import { getExplanationProgress } from '@/entities/explanation/explanation'
import { getGestaltsInTopics } from '@/entities/gestalt/gestalt'
import { getGestaltCards } from '@/entities/gestalt-card/gestaltCard'
import { getGoals } from '@/entities/goal/goal'
import { getSentences } from '@/entities/sentence/sentence'
import { getShownGestalts } from '@/entities/shown-gestalt/shownGestalt'
import { getSnippets } from '@/entities/snippet/snippet'
import { getSentenceIdsInTopics } from '@/entities/topic/topic'
import { getVideos } from '@/entities/video/video'
import { getVocab } from '@/entities/vocab/vocab'
import { isKindAvailable } from './exerciseRegistry'

// Everything one queue step looks at. `context.gestalts` holds only gestalts
// of the selected topics that can currently be practiced.
export type QueueState = {
  now: Date
  online: boolean
  context: ExerciseContext
  gestaltCards: Map<string, GestaltCardRow>
  exerciseCards: Map<string, ExerciseCardRow>
  explanationProgress: Map<string, ExplanationProgressRow>
  shownGestalts: Map<string, ShownGestaltRow>
  goals: GoalRow[]
}

// Selected sentences without the guess-once ones that were not shown yet.
function exampleSentenceIds(
  selectedIds: Set<string>,
  gestalts: Map<string, GestaltRow>,
  shown: Map<string, ShownGestaltRow>
): Set<string> {
  const unguessed = new Set(
    [...gestalts.values()]
      .filter((gestalt) => gestalt.kind === 'challenge' && !shown.has(gestalt.id))
      .map((gestalt) => gestalt.contentId)
  )
  return new Set([...selectedIds].filter((id) => !unguessed.has(id)))
}

export async function loadQueueState(topicIds: string[], online: boolean): Promise<QueueState> {
  const [gestalts, selectedSentenceIds, vocab, sentences, videos, snippets] = await Promise.all([
    getGestaltsInTopics(topicIds),
    getSentenceIdsInTopics(topicIds),
    getVocab(),
    getSentences(),
    getVideos(),
    getSnippets()
  ])
  const [gestaltCards, exerciseCards, explanationProgress, shownGestalts, goals] = await Promise.all([
    getGestaltCards(),
    getExerciseCards(),
    getExplanationProgress(),
    getShownGestalts(),
    getGoals()
  ])
  const available = new Map([...gestalts].filter(([, gestalt]) => isKindAvailable(gestalt.kind, online)))
  return {
    now: new Date(),
    online,
    context: {
      vocab,
      sentences,
      videos,
      snippets,
      gestalts: available,
      exampleSentenceIds: exampleSentenceIds(selectedSentenceIds, gestalts, shownGestalts)
    },
    gestaltCards,
    exerciseCards,
    explanationProgress,
    shownGestalts,
    goals
  }
}

// Explanations are scheduled by their answers, challenges are shown once, all other gestalts are scheduled by
// FSRS cards.
function explanationProgressOf(state: QueueState, gestaltId: string): ExplanationProgressRow | undefined {
  const gestalt = state.context.gestalts.get(gestaltId)
  return gestalt?.kind === 'explanation' ? state.explanationProgress.get(gestalt.contentId) : undefined
}

function isShownChallenge(state: QueueState, gestaltId: string): boolean {
  return state.context.gestalts.get(gestaltId)?.kind === 'challenge' && state.shownGestalts.has(gestaltId)
}

export function isIntroduced(state: QueueState, gestaltId: string): boolean {
  return (
    state.gestaltCards.has(gestaltId) ||
    explanationProgressOf(state, gestaltId) !== undefined ||
    isShownChallenge(state, gestaltId)
  )
}

export function progressOf(state: QueueState, gestaltId: string): GestaltProgress {
  return { card: state.gestaltCards.get(gestaltId), shown: state.shownGestalts.has(gestaltId) }
}

export function isDue(state: QueueState, gestaltId: string): boolean {
  const progress = explanationProgressOf(state, gestaltId)
  if (progress) return progress.answer === 'later' && progress.due <= state.now
  const card = state.gestaltCards.get(gestaltId)
  return card !== undefined && card.due <= state.now
}

// Related gestalts that are currently available.
export function relatedOf(state: QueueState, gestaltId: string): string[] {
  const related = state.context.gestalts.get(gestaltId)?.relatedIds ?? []
  return related.filter((id) => state.context.gestalts.has(id))
}
