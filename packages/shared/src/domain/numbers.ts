/**
 * Parses a non-negative decimal typed by a person, accepting either "," or "." as the
 * decimal separator (Spanish keyboards emit ","). Returns null for empty or invalid input.
 */
export function parseDecimal(input: string): number | null {
  const normalized = input.trim().replace(',', '.')
  if (!/^\d*\.?\d+$|^\d+\.$/.test(normalized)) return null
  return Number(normalized)
}
