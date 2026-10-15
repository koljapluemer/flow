export async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Loading ${url} failed (${response.status})`)
  return (await response.json()) as T
}
