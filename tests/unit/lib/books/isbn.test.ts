import { describe, it, expect } from 'vitest'
import { normaliseIsbn, validateIsbn } from '@/lib/books/isbn'

describe('validateIsbn', () => {
  it('accepts a valid ISBN-13', () => {
    expect(validateIsbn('9784101092058')).toBe(true)
  })

  it('accepts a valid ISBN-13 with hyphens', () => {
    expect(validateIsbn('978-4-10-109205-8')).toBe(true)
  })

  it('accepts a valid ISBN-10', () => {
    expect(validateIsbn('4101092052')).toBe(true)
  })

  it('accepts a valid ISBN-10 with hyphens', () => {
    expect(validateIsbn('4-10-109205-2')).toBe(true)
  })

  it('accepts an ISBN-10 with X check digit', () => {
    expect(validateIsbn('0306406152')).toBe(true)
  })

  it('rejects a string that is too short', () => {
    expect(validateIsbn('123456')).toBe(false)
  })

  it('rejects an ISBN-13 with wrong check digit', () => {
    expect(validateIsbn('9784101092059')).toBe(false)
  })

  it('rejects an ISBN-10 with wrong check digit', () => {
    expect(validateIsbn('4101092051')).toBe(false)
  })

  it('rejects a non-numeric string', () => {
    expect(validateIsbn('abcdefghijk')).toBe(false)
  })

  it('rejects an empty string', () => {
    expect(validateIsbn('')).toBe(false)
  })
})

describe('normaliseIsbn', () => {
  it('returns ISBN-13 unchanged (stripped of hyphens)', () => {
    expect(normaliseIsbn('978-4-10-109205-8')).toBe('9784101092058')
  })

  it('converts ISBN-10 to ISBN-13', () => {
    // ISBN-10: 4101092052 → ISBN-13: 9784101092058
    expect(normaliseIsbn('4101092052')).toBe('9784101092058')
  })

  it('converts ISBN-10 with hyphens to ISBN-13', () => {
    expect(normaliseIsbn('4-10-109205-2')).toBe('9784101092058')
  })

  it('throws on invalid ISBN', () => {
    expect(() => normaliseIsbn('123456')).toThrow()
  })
})
