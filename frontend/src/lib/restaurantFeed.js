/**
 * Pure Swiggy-style restaurant list feed (cursor pages).
 * Discovery owns React state + IO; this module owns merge / hasMore rules.
 */

/** Stop after this many consecutive append batches with 0 new restaurants. */
export const EMPTY_BATCH_GIVE_UP = 3

/** Prefetch until the raw feed reaches this many unique cards. */
export const INITIAL_FILL_MIN = 40

export function createFeedState() {
  return {
    restaurants: [],
    nextOffset: null,
    widgetOffset: null,
    hasMore: true,
    emptyBatches: 0,
    seenIds: new Set(),
  }
}

function normalizeCards(page) {
  if (Array.isArray(page?.restaurants)) return page.restaurants
  if (Array.isArray(page)) return page
  return []
}

function cursorFromPage(page) {
  const nextOffset =
    typeof page?.nextOffset === 'string' && page.nextOffset.trim()
      ? page.nextOffset
      : null
  const widgetOffset =
    page?.widgetOffset && typeof page.widgetOffset === 'object'
      ? page.widgetOffset
      : null
  const apiHasMore = page?.hasMore === true && Boolean(nextOffset)
  return { nextOffset, widgetOffset, apiHasMore }
}

/**
 * Apply one API page onto feed state.
 * @param {ReturnType<typeof createFeedState>} state
 * @param {object} page — BFF `{ restaurants, nextOffset, widgetOffset, hasMore }`
 * @param {{ append: boolean }} opts
 */
export function applyFeedPage(state, page, { append }) {
  const cards = normalizeCards(page)
  const { nextOffset, widgetOffset, apiHasMore } = cursorFromPage(page)

  if (!append) {
    const seenIds = new Set(cards.map((r) => String(r.id)))
    return {
      restaurants: cards,
      nextOffset,
      widgetOffset,
      hasMore: apiHasMore,
      emptyBatches: 0,
      seenIds,
    }
  }

  const seenIds = new Set(state.seenIds)
  const fresh = cards.filter((r) => {
    const id = String(r.id)
    if (!id || seenIds.has(id)) return false
    seenIds.add(id)
    return true
  })

  let emptyBatches = state.emptyBatches
  let nextOffsetOut = nextOffset
  let widgetOffsetOut = widgetOffset
  let canContinue = apiHasMore

  if (fresh.length) {
    emptyBatches = 0
  } else {
    emptyBatches += 1
    // Empty/dupe with no cursor is often a flaky repeat of the same offset —
    // keep the previous cursor so scroll can retry a few times.
    if (!apiHasMore) {
      nextOffsetOut = state.nextOffset
      widgetOffsetOut = state.widgetOffset
      canContinue = Boolean(state.nextOffset)
    }
  }

  const giveUp = emptyBatches >= EMPTY_BATCH_GIVE_UP

  return {
    restaurants: fresh.length
      ? [...state.restaurants, ...fresh]
      : state.restaurants,
    nextOffset: nextOffsetOut,
    widgetOffset: widgetOffsetOut,
    hasMore: canContinue && !giveUp,
    emptyBatches,
    seenIds,
  }
}

export function shouldPrefetchMore(state, minCount = INITIAL_FILL_MIN) {
  return Boolean(state?.hasMore && state.nextOffset && state.restaurants.length < minCount)
}
