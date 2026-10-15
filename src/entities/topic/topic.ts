import { db } from '../../db/db'

export async function getSelectedTopicIds(): Promise<string[]> {
  return db.selectedTopics.toCollection().primaryKeys()
}

export async function setTopicSelected(id: string, selected: boolean): Promise<void> {
  if (selected) await db.selectedTopics.put({ id })
  else await db.selectedTopics.delete(id)
}
