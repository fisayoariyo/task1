import { useEffect, useState } from 'react'
import { autocomplete, geocode } from './api'
import { setLocation } from './location'

/** Debounced place suggestions (300 ms) backed by Nest /places. */
export function usePlaceAutocomplete(initialQuery = '') {
  const [query, setQueryState] = useState(initialQuery)
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)

  function setQuery(next) {
    setQueryState(next)
    if (String(next || '').trim().length > 0) setPanelOpen(true)
    else setPanelOpen(false)
  }

  function onInputFocus() {
    if (query.trim().length > 0) setPanelOpen(true)
  }

  function dismissPanel() {
    setPanelOpen(false)
  }

  useEffect(() => {
    const q = query.trim()
    if (q.length < 3) {
      setSuggestions([])
      return undefined
    }
    const timer = setTimeout(async () => {
      setLoading(true)
      setPanelOpen(true)
      try {
        setSuggestions(await autocomplete(q))
      } catch {
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    if (!panelOpen) return undefined
    function onPointerDown(e) {
      // Mark wrappers with data-place-search (desktop + mobile can both use this).
      if (e.target.closest('[data-place-search]')) return
      setPanelOpen(false)
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') setPanelOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [panelOpen])

  async function selectSuggestion(suggestion) {
    try {
      const coords = await geocode(suggestion.placeId)
      // Prefer short main + secondary for the saved label (not the mega OSM string).
      const label =
        suggestion.mainText && suggestion.secondaryText
          ? `${suggestion.mainText}, ${suggestion.secondaryText}`
          : suggestion.mainText || suggestion.description
      setLocation({
        lat: coords.lat,
        lng: coords.lng,
        label,
        placeId: suggestion.placeId,
      })
      setQueryState(label)
      setSuggestions([])
      setPanelOpen(false)
      return { ...coords, label }
    } catch {
      return null
    }
  }

  // Callers should treat a null return as “location did not change”.

  return {
    query,
    setQuery,
    suggestions,
    loading,
    selectSuggestion,
    panelOpen,
    onInputFocus,
    dismissPanel,
  }
}
