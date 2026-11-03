import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  FOOD_MIND_COLLAPSED_LIMIT,
  shouldShowFoodMindMore,
  visibleFoodMindCount,
} from './foodMindVisible.js'

describe('foodMindVisible', () => {
  it('collapsed limit is 6 (2 rows × 3)', () => {
    assert.equal(FOOD_MIND_COLLAPSED_LIMIT, 6)
  })

  it('hides Show more when total ≤ 6', () => {
    assert.equal(shouldShowFoodMindMore(0), false)
    assert.equal(shouldShowFoodMindMore(6), false)
  })

  it('shows Show more when total > 6', () => {
    assert.equal(shouldShowFoodMindMore(7), true)
    assert.equal(shouldShowFoodMindMore(12), true)
  })

  it('collapsed view caps at 6', () => {
    assert.equal(visibleFoodMindCount(12, false), 6)
    assert.equal(visibleFoodMindCount(3, false), 3)
  })

  it('expanded view shows all', () => {
    assert.equal(visibleFoodMindCount(12, true), 12)
    assert.equal(visibleFoodMindCount(6, true), 6)
  })
})
