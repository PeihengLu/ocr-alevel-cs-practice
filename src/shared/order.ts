/** Order labels such as "1. …", "2. …", "10. …" by the leading number. */
export function compareNumberedTitles(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
}

export function byNumberedTitle<T extends { title: string }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => compareNumberedTitles(a.title, b.title))
}
