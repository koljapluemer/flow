import { db, type ExplanationAnswer, type ExplanationProgressRow } from '../../db/db'

// Days until a video answered `later` is shown again, by how often it was shown; the last one repeats.
const LATER_INTERVAL_DAYS = [2, 3, 7, 14, 30, 90, 365]
const DAY_MS = 24 * 60 * 60 * 1000

function laterInterval(shownCount: number): number {
  return LATER_INTERVAL_DAYS[Math.min(shownCount, LATER_INTERVAL_DAYS.length) - 1] * DAY_MS
}

export async function getExplanationProgress(): Promise<Map<string, ExplanationProgressRow>> {
  const rows = await db.explanationProgress.toArray()
  return new Map(rows.map((row) => [row.id, row]))
}

export async function answerExplanation(videoId: string, answer: ExplanationAnswer, now = new Date()): Promise<void> {
  const shownCount = ((await db.explanationProgress.get(videoId))?.shownCount ?? 0) + 1
  const due = new Date(now.getTime() + laterInterval(shownCount))
  await db.explanationProgress.put({ id: videoId, answer, shownCount, due })
}
