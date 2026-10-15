import { fetchJson } from '@/dumb/fetchJson'

export type TopicSummary = { id: string; title: string }

export function fetchTopicCatalog(): Promise<TopicSummary[]> {
  return fetchJson<TopicSummary[]>('/data/topics.json')
}
