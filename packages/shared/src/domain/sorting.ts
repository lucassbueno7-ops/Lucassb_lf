export function sortByPosition<T extends { position: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.position - b.position)
}

export function nextPosition(items: Array<{ position: number }>): number {
  return items.length === 0 ? 0 : Math.max(...items.map((i) => i.position)) + 1
}
