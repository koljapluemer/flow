import type { ExerciseType } from '@/entities/exercise/exercise'
import { parseExerciseId } from '@/entities/exercise/exercise'
import { gestaltId } from '@/entities/gestalt/gestalt'
import { syncSelectedTopics } from '../practice/content/syncTopics'
import { exerciseTypeByName } from '../practice/queue/exerciseRegistry'
import { loadQueueState } from '../practice/queue/queueState'

export type Preview = { type: ExerciseType; view: unknown }

// Resolves an exercise by id against the content of the selected topics, outside the queue.
export async function loadPreview(exerciseId: string): Promise<Preview | string> {
  const { type: typeName, variant, contentId } = parseExerciseId(exerciseId)
  const type = exerciseTypeByName(typeName)
  if (!type) return `Unknown exercise type "${typeName}".`
  const topicIds = await syncSelectedTopics()
  const state = await loadQueueState(topicIds, true)
  const gestalt = gestaltId(type.gestaltKind, contentId)
  if (!state.context.gestalts.has(gestalt)) return `${gestalt} is not in the selected topics.`
  const exercise = { id: exerciseId, type: typeName, variant, contentId, gestaltIds: [gestalt] }
  return { type, view: type.resolve(exercise, state.context) }
}
