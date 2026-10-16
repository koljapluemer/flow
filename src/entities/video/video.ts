import { decodeCredits, type CreditTuple } from '../../dumb/credit'
import { db, type VideoRow } from '../../db/db'

// Compact format rendered by cms/render.py.
export type VideoTuple = [
  id: string,
  title: string,
  platform: VideoRow['platform'],
  platformId: string,
  explanatory: boolean,
  credits: CreditTuple[]
]

export function decodeVideos(tuples: VideoTuple[]): VideoRow[] {
  return tuples.map(([id, title, platform, platformId, explanatory, credits]) => ({
    id,
    title,
    platform,
    platformId,
    explanatory,
    credits: decodeCredits(credits)
  }))
}

export async function getVideos(): Promise<Map<string, VideoRow>> {
  const rows = await db.videos.toArray()
  return new Map(rows.map((row) => [row.id, row]))
}

export async function putVideos(rows: VideoRow[]): Promise<void> {
  await db.videos.bulkPut(rows)
}
