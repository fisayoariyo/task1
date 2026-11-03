/**
 * Pure feed merge tests — run: npm test
 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  applyFeedPage,
  createFeedState,
  shouldPrefetchMore,
} from './restaurantFeed.js'

function page(ids, { nextOffset = null, hasMore } = {}) {
  const restaurants = ids.map((id) => ({ id, name: `R${id}` }))
  const next = nextOffset === null && hasMore !== false && ids.length
    ? `cursor-after-${ids[ids.length - 1]}`
    : nextOffset
  return {
    restaurants,
    nextOffset: next,
    widgetOffset: next ? { collectionV5RestaurantListWidget_SimRestoRelevance_food_seo: '9' } : null,
    hasMore: hasMore !== undefined ? hasMore : Boolean(next),
  }
}

describe('restaurantFeed', () => {
  it('createFeedState starts empty with hasMore true', () => {
    const s = createFeedState()
    assert.equal(s.restaurants.length, 0)
    assert.equal(s.hasMore, true)
    assert.equal(s.nextOffset, null)
  })

  it('first page replaces list and keeps cursor', () => {
    let s = createFeedState()
    s = applyFeedPage(s, page(['a', 'b', 'c']), { append: false })
    assert.deepEqual(
      s.restaurants.map((r) => r.id),
      ['a', 'b', 'c'],
    )
    assert.equal(s.hasMore, true)
    assert.ok(s.nextOffset)
  })

  it('append adds only fresh ids', () => {
    let s = applyFeedPage(createFeedState(), page(['a', 'b']), { append: false })
    s = applyFeedPage(s, page(['b', 'c', 'd']), { append: true })
    assert.deepEqual(
      s.restaurants.map((r) => r.id),
      ['a', 'b', 'c', 'd'],
    )
    assert.equal(s.hasMore, true)
  })

  it('does not kill hasMore on one empty batch when cursor remains', () => {
    let s = applyFeedPage(createFeedState(), page(['a', 'b']), { append: false })
    const cursor = s.nextOffset
    s = applyFeedPage(
      s,
      {
        restaurants: [],
        nextOffset: 'still-more',
        widgetOffset: { x: '1' },
        hasMore: true,
      },
      { append: true },
    )
    assert.equal(s.restaurants.length, 2)
    assert.equal(s.hasMore, true)
    assert.equal(s.nextOffset, 'still-more')
    assert.notEqual(s.nextOffset, cursor)
  })

  it('keeps prior cursor after one empty page with no nextOffset (flaky repeat)', () => {
    let s = applyFeedPage(createFeedState(), page(['a', 'b']), { append: false })
    const cursor = s.nextOffset
    s = applyFeedPage(
      s,
      { restaurants: [], nextOffset: null, widgetOffset: null, hasMore: false },
      { append: true },
    )
    assert.equal(s.restaurants.length, 2)
    assert.equal(s.hasMore, true)
    assert.equal(s.nextOffset, cursor)
  })

  it('gives up after 3 consecutive empty/dupe batches', () => {
    let s = applyFeedPage(createFeedState(), page(['a', 'b', 'c']), { append: false })
    const dupe = page(['a', 'b'], { nextOffset: 'c1', hasMore: true })
    s = applyFeedPage(s, dupe, { append: true })
    s = applyFeedPage(s, { ...dupe, nextOffset: 'c2' }, { append: true })
    s = applyFeedPage(s, { ...dupe, nextOffset: 'c3' }, { append: true })
    assert.equal(s.hasMore, false)
  })

  it('shouldPrefetchMore is true while under min and hasMore', () => {
    let s = applyFeedPage(createFeedState(), page(['1', '2']), { append: false })
    assert.equal(shouldPrefetchMore(s, 40), true)
    s = applyFeedPage(createFeedState(), page(Array.from({ length: 45 }, (_, i) => String(i))), {
      append: false,
    })
    assert.equal(shouldPrefetchMore(s, 40), false)
  })
})
