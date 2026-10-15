import Dexie, { type EntityTable } from 'dexie'
import type { Card } from 'ts-fsrs'

// Sentence and vocab ids are repo refs ("deu/der-tisch"), see data/repo.
export type SentenceRow = { id: string; text: string; translation: string; vocabIds: string[]; topicIds: string[] }
export type VocabRow = { id: string; word: string; translation: string }
export type SentenceCardRow = Card & { id: string; lastAnswerCorrect: boolean }
export type VocabCardRow = Card & { id: string; level: 1 | 2 | 3 | 4; initialSentence: string }
export type SelectedTopicRow = { id: string }

export const db = new Dexie('germanFlow') as Dexie & {
  sentences: EntityTable<SentenceRow, 'id'>
  vocab: EntityTable<VocabRow, 'id'>
  sentenceCards: EntityTable<SentenceCardRow, 'id'>
  vocabCards: EntityTable<VocabCardRow, 'id'>
  selectedTopics: EntityTable<SelectedTopicRow, 'id'>
}

db.version(1).stores({
  sentences: 'id, createdAt',
  vocab: 'id',
  sentenceCards: 'id',
  vocabCards: 'id'
})

// Switch from user-generated to static content: old content and progress are dropped.
db.version(2)
  .stores({
    sentences: 'id, *topicIds',
    vocab: 'id',
    sentenceCards: 'id',
    vocabCards: 'id',
    selectedTopics: 'id'
  })
  .upgrade((tx) =>
    Promise.all(['sentences', 'vocab', 'sentenceCards', 'vocabCards'].map((table) => tx.table(table).clear()))
  )
