import Dexie, { type EntityTable } from 'dexie'
import type { Card, Grade } from 'ts-fsrs'
import type { Credit } from '../dumb/credit'
import type { VideoPlatform } from '../dumb/video/videoPlatforms'

// Content ids are repo refs ("deu/der-tisch"); snippet ids are "<video ref>#<index>".
export type VocabRow = { id: string; word: string; translation: string; credits: Credit[] }
export type SentenceRow = { id: string; text: string; translation: string; vocabIds: string[]; credits: Credit[] }
// How a set has a sentence practiced: repeated flashcards, guessed once after its vocab, or only as a vocab example.
export type SentenceMode = 'flashcard' | 'guess-once' | 'example'
export type VideoRow = {
  id: string
  title: string
  platform: VideoPlatform
  platformId: string
  explanatory: boolean
  credits: Credit[]
}
export type SnippetRow = {
  id: string
  videoId: string
  index: number
  start: number
  end: number
  text: string
  translation: string
  vocabIds: string[]
  coreVocabIds: string[]
}

// Gestalt ids are "<kind>:<content id>". `relatedIds` link composites to the gestalts they build on.
// A `challenge` is a guess-once sentence.
export type GestaltKind = 'vocab' | 'sentence' | 'challenge' | 'snippet' | 'explanation'
export type GestaltRow = { id: string; kind: GestaltKind; contentId: string; topicIds: string[]; relatedIds: string[] }
// `lastRating` is missing on cards reviewed before it was tracked.
export type GestaltCardRow = Card & { id: string; lastRating?: Grade }
export type ExerciseCardRow = Card & { id: string }
// Gestalts shown by an exercise without a grade (vocab intros, challenges).
export type ShownGestaltRow = { id: string; shownAt: Date }
export type GoalRow = { id: string; kind: 'introduce' | 'repair' | 'challenge'; target: string; createdAt: Date }
export type SelectedTopicRow = { id: string }
// All sentences of a topic, whatever their mode, as of its last sync.
export type TopicSentencesRow = { id: string; sentenceIds: string[] }
// Progress of an explanatory video, keyed by video ref. Only `later` brings it back, when due.
export type ExplanationAnswer = 'notInterested' | 'knewIt' | 'gotIt' | 'later'
export type ExplanationProgressRow = { id: string; answer: ExplanationAnswer; shownCount: number; due: Date }

export const db = new Dexie('germanFlow') as Dexie & {
  vocab: EntityTable<VocabRow, 'id'>
  sentences: EntityTable<SentenceRow, 'id'>
  videos: EntityTable<VideoRow, 'id'>
  snippets: EntityTable<SnippetRow, 'id'>
  gestalts: EntityTable<GestaltRow, 'id'>
  gestaltCards: EntityTable<GestaltCardRow, 'id'>
  exerciseCards: EntityTable<ExerciseCardRow, 'id'>
  goals: EntityTable<GoalRow, 'id'>
  selectedTopics: EntityTable<SelectedTopicRow, 'id'>
  explanationProgress: EntityTable<ExplanationProgressRow, 'id'>
  shownGestalts: EntityTable<ShownGestaltRow, 'id'>
  topicSentences: EntityTable<TopicSentencesRow, 'id'>
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

// Videos get their own table and can be explanatory; snippets lose their YouTube id and are re-synced.
db.version(4)
  .stores({ videos: 'id', explanationProgress: 'id' })
  .upgrade((tx) => tx.table('snippets').clear())

// Content gets credits; guess-once sentences and their ungraded showings get tables.
db.version(5)
  .stores({ shownGestalts: 'id', topicSentences: 'id' })
  .upgrade((tx) =>
    Promise.all(['vocab', 'sentences', 'videos'].map((table) => tx.table(table).toCollection().modify({ credits: [] })))
  )
