import { db, type SnippetRow } from '../../db/db'

// Compact format rendered by cms/render.py; vocab is referenced by index into the topic's vocab list.
type SnippetTuple = [
  start: number,
  end: number,
  text: string,
  translation: string,
  vocabIndexes: number[],
  coreIndexes: number[]
]
export type VideoTuple = [id: string, youtubeId: string, snippets: SnippetTuple[]]

export function decodeVideos(tuples: VideoTuple[], vocabIds: string[]): SnippetRow[] {
  return tuples.flatMap(([videoId, youtubeId, snippets]) =>
    snippets.map(([start, end, text, translation, vocabIndexes, coreIndexes], index) => ({
      id: `${videoId}#${index}`,
      videoId,
      index,
      youtubeId,
      start,
      end,
      text,
      translation,
      vocabIds: vocabIndexes.map((vocabIndex) => vocabIds[vocabIndex]),
      coreVocabIds: coreIndexes.map((vocabIndex) => vocabIds[vocabIndex])
    }))
  )
}

export async function getSnippets(): Promise<Map<string, SnippetRow>> {
  const rows = await db.snippets.toArray()
  return new Map(rows.map((row) => [row.id, row]))
}

export async function putSnippets(rows: SnippetRow[]): Promise<void> {
  await db.snippets.bulkPut(rows)
}
