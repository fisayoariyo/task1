import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  shouldShowFoodMindMore,
  visibleFoodMindCount,
} from '../lib/foodMindVisible'
import { Icon } from './Icon'

const MOBILE_MQ = '(max-width: 767px)'

function useIsMobileGrid() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(MOBILE_MQ).matches : false,
  )

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ)
    const onChange = () => setIsMobile(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return isMobile
}

/**
 * Food-category rail: horizontal + prev/next on desktop;
 * 3-col expandable grid on small screens (API tiles only).
 */
export function FoodMindRail({ loading = false, items = [], activeName = 'All', onSelect }) {
  const rowRef = useRef(null)
  const [edge, setEdge] = useState({ left: false, right: false, overflow: false })
  const [expanded, setExpanded] = useState(false)
  const isMobileGrid = useIsMobileGrid()

  const updateEdges = useCallback(() => {
    const el = rowRef.current
    if (!el) return
    // Grid mode does not scroll horizontally — skip overflow chrome.
    if (window.matchMedia(MOBILE_MQ).matches) {
      setEdge({ left: false, right: false, overflow: false })
      return
    }
    const max = el.scrollWidth - el.clientWidth
    const overflow = max > 4
    setEdge({
      overflow,
      left: overflow && el.scrollLeft > 2,
      right: overflow && el.scrollLeft < max - 2,
    })
  }, [])

  useEffect(() => {
    const el = rowRef.current
    if (!el) return undefined
    updateEdges()
    el.addEventListener('scroll', updateEdges, { passive: true })
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateEdges) : null
    ro?.observe(el)
    window.addEventListener('resize', updateEdges)
    return () => {
      el.removeEventListener('scroll', updateEdges)
      ro?.disconnect()
      window.removeEventListener('resize', updateEdges)
    }
  }, [updateEdges, loading, items.length, expanded, isMobileGrid])

  function scrollByDir(dir) {
    const el = rowRef.current
    if (!el) return
    const step = Math.max(Math.round(el.clientWidth * 0.7), 220)
    el.scrollBy({ left: dir * step, behavior: 'smooth' })
  }

  const showMoreControl =
    isMobileGrid && !loading && shouldShowFoodMindMore(items.length)

  const visibleItems = useMemo(() => {
    if (loading) return []
    if (!isMobileGrid) return items
    const count = visibleFoodMindCount(items.length, expanded)
    return items.slice(0, count)
  }, [loading, items, expanded, isMobileGrid])

  return (
    <div
      className={`food-mind food-mind--responsive ${edge.overflow ? 'food-mind--scrollable' : ''} ${edge.right ? 'has-more' : ''} ${edge.left ? 'has-prev' : ''} ${expanded ? 'is-expanded' : ''}`}
      aria-busy={loading || undefined}
    >
      {edge.overflow ? (
        <div className="food-mind__nav" role="group" aria-label="Food categories">
          <button
            type="button"
            className="food-mind__nav-btn"
            aria-label="Show previous categories"
            disabled={!edge.left}
            onClick={() => scrollByDir(-1)}
          >
            <Icon name="back" size={18} />
          </button>
          <button
            type="button"
            className="food-mind__nav-btn"
            aria-label="Show more categories"
            disabled={!edge.right}
            onClick={() => scrollByDir(1)}
          >
            <Icon name="chevron" size={18} />
          </button>
        </div>
      ) : null}

      <div className="food-mind__row" ref={rowRef} role="list">
        {loading
          ? Array.from({ length: isMobileGrid ? 6 : 8 }, (_, i) => (
              <div key={`sk-${i}`} className="food-mind__item food-mind__item--skeleton" role="presentation">
                <span className="food-mind__media">
                  <span className="food-mind__img food-mind__img--skeleton" />
                </span>
                <span className="food-mind__label food-mind__label--skeleton" />
              </div>
            ))
          : visibleItems.map((c) => {
              const on = activeName === c.name
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`food-mind__item ${on ? 'is-active' : ''}`}
                  role="listitem"
                  aria-pressed={on}
                  onClick={() => onSelect?.(on ? 'All' : c)}
                >
                  <span className="food-mind__media">
                    <img className="food-mind__img" src={c.imageUrl} alt="" loading="lazy" />
                    <span className="food-mind__veil" aria-hidden="true" />
                  </span>
                  <span className="food-mind__label">{c.name}</span>
                </button>
              )
            })}
      </div>

      {showMoreControl ? (
        <button
          type="button"
          className="food-mind__more"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      ) : null}
    </div>
  )
}
