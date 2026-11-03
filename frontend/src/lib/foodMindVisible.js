/** First paint on mobile: 2 rows × 3 columns. */
export const FOOD_MIND_COLLAPSED_LIMIT = 6

export function shouldShowFoodMindMore(total) {
  return Number(total) > FOOD_MIND_COLLAPSED_LIMIT
}

export function visibleFoodMindCount(total, expanded) {
  const n = Math.max(0, Number(total) || 0)
  if (expanded) return n
  return Math.min(n, FOOD_MIND_COLLAPSED_LIMIT)
}
