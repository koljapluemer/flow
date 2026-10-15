import Dexie, { type EntityTable } from 'dexie'
import type { Card } from 'ts-fsrs'

// Content ids are repo refs ("deu/der-tisch"); snippet ids are "<video ref>#<index>".
export type VocabRow = { id: string; word: string; translation: string }
export type SentenceRow = { id: string; text: string; translation: string; vocabIds: string[] }
export type SnippetRow = {
  id: string
  videoId: string
  index: number
  youtubeId: string
  start: number
  end: number
  text: string
  translation: string
  vocabIds: string[]
  coreVocabIds: string[]
}

// Gestalt ids are "<kind>:<content id>". `relatedIds` link composites to the gestalts they build on.
export type GestaltKind = 'vocab' | 'sentence' | 'snippet'
export type GestaltRow = { id: string; kind: GestaltKind; contentId: string; topicIds: string[]; relatedIds: string[] }
export type GestaltCardRow = Card & { id: string }
export type ExerciseCardRow = Card & { id: string }
export type GoalRow = { id: string; kind: 'introduce' | 'repair'; target: string; createdAt: Date }
export type SelectedTopicRow = { id: string }

export const db = new Dexie('germanFlow') as Dexie & {
  vocab: EntityTable<VocabRow, 'id'>
  sentences: EntityTable<SentenceRow, 'id'>
  snippets: EntityTable<SnippetRow, 'id'>
  gestalts: EntityTable<GestaltRow, 'id'>
  gestaltCards: EntityTable<GestaltCardRow, 'id'>
  exerciseCards: EntityTable<ExerciseCardRow, 'id'>
  goals: EntityTable<GoalRow, 'id'>
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

// Switch to gestalts and exercises: old content and progress are dropped, topic selection is kept.
db.version(3)
  .stores({
    vocab: 'id',
    sentences: 'id',
    snippets: 'id',
    gestalts: 'id, *topicIds',
    gestaltCards: 'id',
    exerciseCards: 'id',
    goals: 'id',
    selectedTopics: 'id',
    sentenceCards: null,
    vocabCards: null
  })
  .upgrade((tx) => Promise.all(['sentences', 'vocab'].map((table) => tx.table(table).clear())))
