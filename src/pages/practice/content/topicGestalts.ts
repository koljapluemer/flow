import type { GestaltKind, GestaltRow, SentenceMode, SentenceRow, SnippetRow, VideoRow, VocabRow } from '@/db/db'
import { gestaltId } from '@/entities/gestalt/gestalt'

export type TopicContent = {
  vocab: VocabRow[]
  sentences: SentenceRow[]
  sentenceModes: Map<string, SentenceMode[]>
  videos: VideoRow[]
  snippets: SnippetRow[]
}

function gestalt(kind: GestaltKind, contentId: string, topicId: string, relatedVocabIds: string[]): GestaltRow {
  return {
    id: gestaltId(kind, contentId),
    kind,
    contentId,
    topicIds: [topicId],
    relatedIds: relatedVocabIds.map((id) => gestaltId('vocab', id))
  }
}

// Flashcard sentences become sentence gestalts, guess-once sentences challenges; example sentences none.
function sentenceGestalts(content: TopicContent, topicId: string): GestaltRow[] {
  return content.sentences.flatMap((row) => {
    const modes = content.sentenceModes.get(row.id) ?? []
    return [
      ...(modes.includes('flashcard') ? [gestalt('sentence', row.id, topicId, row.vocabIds)] : []),
      ...(modes.includes('guess-once') ? [gestalt('challenge', row.id, topicId, row.vocabIds)] : [])
    ]
  })
}

// Sentences and challenges build on all their vocab, snippets only on their core vocab, explanations on nothing.
export function topicGestalts(content: TopicContent, topicId: string): GestaltRow[] {
  return [
    ...content.vocab.map((row) => gestalt('vocab', row.id, topicId, [])),
    ...sentenceGestalts(content, topicId),
    ...content.snippets.map((row) => gestalt('snippet', row.id, topicId, row.coreVocabIds)),
    ...content.videos.filter((row) => row.explanatory).map((row) => gestalt('explanation', row.id, topicId, []))
  ]
}

// A gestalt shared by several topics is stored once, listing all of them.
export function mergeGestalts(rows: GestaltRow[]): GestaltRow[] {
  const merged = new Map<string, GestaltRow>()
  for (const row of rows) {
    const existing = merged.get(row.id)
    merged.set(row.id, { ...row, topicIds: [...(existing?.topicIds ?? []), ...row.topicIds] })
  }
  return [...merged.values()]
}
