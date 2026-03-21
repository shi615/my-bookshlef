/** Strip all hyphens and spaces from an ISBN string. */
function stripFormatting(isbn: string): string {
  return isbn.replace(/[-\s]/g, '')
}

/** Validate an ISBN-10 check digit. */
function isValidIsbn10(digits: string): boolean {
  if (!/^\d{9}[\dX]$/.test(digits)) return false
  const sum = digits
    .split('')
    .reduce((acc, ch, i) => acc + (ch === 'X' ? 10 : Number(ch)) * (10 - i), 0)
  return sum % 11 === 0
}

/** Validate an ISBN-13 check digit (EAN-13). */
function isValidIsbn13(digits: string): boolean {
  if (!/^\d{13}$/.test(digits)) return false
  const sum = digits
    .split('')
    .reduce((acc, ch, i) => acc + Number(ch) * (i % 2 === 0 ? 1 : 3), 0)
  return sum % 10 === 0
}

/**
 * Returns true if the input is a syntactically and check-digit-valid ISBN-10 or ISBN-13.
 * Hyphens and spaces are ignored.
 */
export function validateIsbn(input: string): boolean {
  const clean = stripFormatting(input)
  if (clean.length === 10) return isValidIsbn10(clean)
  if (clean.length === 13) return isValidIsbn13(clean)
  return false
}

/**
 * Convert an ISBN-10 or ISBN-13 to a canonical ISBN-13 string (no hyphens).
 * Throws if the input is not a valid ISBN.
 */
export function normaliseIsbn(input: string): string {
  const clean = stripFormatting(input)

  if (clean.length === 13) {
    if (!isValidIsbn13(clean)) throw new Error(`Invalid ISBN-13: ${input}`)
    return clean
  }

  if (clean.length === 10) {
    if (!isValidIsbn10(clean)) throw new Error(`Invalid ISBN-10: ${input}`)
    // Prepend "978" and recalculate check digit
    const base = '978' + clean.slice(0, 9)
    const checksum =
      (10 -
        (base
          .split('')
          .reduce((acc, ch, i) => acc + Number(ch) * (i % 2 === 0 ? 1 : 3), 0) %
          10)) %
      10
    return base + String(checksum)
  }

  throw new Error(`Not a valid ISBN: ${input}`)
}
