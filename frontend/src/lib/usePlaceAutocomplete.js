import { useEffect, useState } from 'react'
import { autocomplete, geocode } from './api'
import { setLocation } from './location'

/** Debounced place suggestions (300 ms) backed by Nest /places. */
export function usePlaceAutocomplete(initialQuery = '') {
  const [query, setQuery] = useState(initialQuery)
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 3) {
      setSuggestions([])
      return undefined
    }
    const timer = setTimeout(async () => {
      setLoading(true)
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

  async function selectSuggestion(suggestion) {
    try {
      const coords = await geocode(suggestion.placeId)
      setLocation({
        lat: coords.lat,
        lng: coords.lng,
        label: suggestion.description,
        placeId: suggestion.placeId,
      })
      setQuery(suggestion.description)
      setSuggestions([])
      return { ...coords, label: suggestion.description }
    } catch {
      return null
    }
  }

  return { query, setQuery, suggestions, loading, selectSuggestion }
}
