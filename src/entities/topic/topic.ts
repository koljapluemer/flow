import { db, type TopicSentencesRow } from '../../db/db'

export async function getSelectedTopicIds(): Promise<string[]> {
  return db.selectedTopics.toCollection().primaryKeys()
}

export async function setTopicSelected(id: string, selected: boolean): Promise<void> {
  if (selected) await db.selectedTopics.put({ id })
  else await db.selectedTopics.delete(id)
}

export async function putTopicSentences(rows: TopicSentencesRow[]): Promise<void> {
  await db.topicSentences.bulkPut(rows)
}

// Ids of all sentences in the given topics.
export async function getSentenceIdsInTopics(topicIds: string[]): Promise<Set<string>> {
  const rows = await db.topicSentences.bulkGet(topicIds)
  return new Set(rows.flatMap((row) => row?.sentenceIds ?? []))
}
