jest.mock('./supabase', () => ({
  supabase: {},
}))

import { selectUniqueItems } from './queries'

describe('selectUniqueItems', () => {
  it('keeps only unseen items and respects the requested limit', () => {
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]
    const seen = new Set([1, 3])

    const result = selectUniqueItems(items, 2, seen)

    expect(result).toHaveLength(2)
    expect(result.every((item) => !seen.has(item.id))).toBe(true)
    expect(result.every((item) => [1, 2, 3, 4].includes(item.id))).toBe(true)
  })
})
