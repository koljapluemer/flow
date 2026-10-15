import type { SentenceCardRow, SentenceRow, VocabCardRow } from '@/db/db'

export type VocabDueItem = { kind: 'vocab'; id: string; card: VocabCardRow }
export type SentenceDueItem = { kind: 'sentence'; id: string; card: SentenceCardRow }
export type DueItem = VocabDueItem | SentenceDueItem

function isVocabDue(card: VocabCardRow, now: Date): boolean {
  return card.level < 4 || card.due <= now
}

function isVocabMastered(card: VocabCardRow | undefined, now: Date): boolean {
  return card !== undefined && card.level === 4 && card.due > now
}

function isSentenceDue(card: SentenceCardRow, vocabCards: (VocabCardRow | undefined)[], now: Date): boolean {
  if (card.due > now) return false
  return !card.lastAnswerCorrect || vocabCards.every((vocabCard) => isVocabMastered(vocabCard, now))
}

// Only cards of the given (selected) sentences and their vocab are considered.
export function buildDuePool(
  sentences: Map<string, SentenceRow>,
  vocabCards: Map<string, VocabCardRow>,
  sentenceCards: Map<string, SentenceCardRow>,
  now: Date
): DueItem[] {
  const pool: DueItem[] = []
  const activeVocabIds = new Set([...sentences.values()].flatMap((sentence) => sentence.vocabIds))

  for (const card of vocabCards.values()) {
    if (activeVocabIds.has(card.id) && isVocabDue(card, now)) pool.push({ kind: 'vocab', id: card.id, card })
  }

  for (const card of sentenceCards.values()) {
    const sentence = sentences.get(card.id)
    if (!sentence) continue
    const containedCards = sentence.vocabIds.map((id) => vocabCards.get(id))
    if (isSentenceDue(card, containedCards, now)) pool.push({ kind: 'sentence', id: card.id, card })
  }

  return pool
}
