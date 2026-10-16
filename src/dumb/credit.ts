// Attribution of third-party content (author, source, license), as required by e.g. CC BY.
export type Credit = { author: string; source: string; sourceUrl?: string; license: string; licenseUrl?: string }

// Compact format rendered by cms/render.py.
export type CreditTuple = [
  author: string,
  source: string,
  sourceUrl: string | null,
  license: string,
  licenseUrl: string | null
]

export function decodeCredits(tuples: CreditTuple[]): Credit[] {
  return tuples.map(([author, source, sourceUrl, license, licenseUrl]) => ({
    author,
    source,
    sourceUrl: sourceUrl ?? undefined,
    license,
    licenseUrl: licenseUrl ?? undefined
  }))
}
