import type { GestaltKind, GestaltRow, SentenceRow, SnippetRow, VideoRow, VocabRow } from '@/db/db'
import { gestaltId } from '@/entities/gestalt/gestalt'

export type TopicContent = { vocab: VocabRow[]; sentences: SentenceRow[]; videos: VideoRow[]; snippets: SnippetRow[] }

function gestalt(kind: GestaltKind, contentId: string, topicId: string, relatedVocabIds: string[]): GestaltRow {
  return {
    id: gestaltId(kind, contentId),
    kind,
    contentId,
    topicIds: [topicId],
    relatedIds: relatedVocabIds.map((id) => gestaltId('vocab', id))
  }
}

// Sentences build on all their vocab, snippets only on their core vocab, explanations on nothing.
export function topicGestalts(content: TopicContent, topicId: string): GestaltRow[] {
  return [
    ...content.vocab.map((row) => gestalt('vocab', row.id, topicId, [])),
    ...content.sentences.map((row) => gestalt('sentence', row.id, topicId, row.vocabIds)),
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
