import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  apiTabForRoute,
  dishGroupMenuPath,
  parseDiscoverySearch,
  restaurantMenuPath,
} from './discoverySearch.js'

describe('parseDiscoverySearch', () => {
  it('defaults an omitted tab to dishes and maps the API tab to dish', () => {
    const parsed = parseDiscoverySearch({ q: '  biryani  ' })
    assert.equal(parsed.query, 'biryani')
    assert.equal(parsed.routeTab, 'dishes')
    assert.equal(parsed.apiTab, 'dish')
    assert.equal(parsed.ready, true)
  })

  it('selects restaurants only when tab=restaurants is explicit', () => {
    const parsed = parseDiscoverySearch({ q: 'Meghana', tab: 'restaurants' })
    assert.equal(parsed.routeTab, 'restaurants')
    assert.equal(parsed.apiTab, 'restaurant')
    assert.equal(apiTabForRoute('restaurants'), 'restaurant')
    assert.equal(apiTabForRoute('dishes'), 'dish')
  })

  it('treats free-text and the singular API value as dishes', () => {
    assert.equal(parseDiscoverySearch({ q: 'biryani', tab: 'food' }).routeTab, 'dishes')
    assert.equal(parseDiscoverySearch({ q: 'biryani', tab: 'restaurant' }).apiTab, 'dish')
    assert.equal(parseDiscoverySearch({ q: 'biryani', tab: '' }).routeTab, 'dishes')
    assert.equal(parseDiscoverySearch({ q: 'biryani', tab: 'Dishes' }).routeTab, 'dishes')
  })

  it('is not ready until the trimmed query is at least 3 characters', () => {
    assert.equal(parseDiscoverySearch({ q: ' bi ' }).ready, false)
    assert.equal(parseDiscoverySearch({ q: '  ' }).query, '')
    assert.equal(parseDiscoverySearch({ q: 'bir' }).ready, true)
  })
})

describe('search result links', () => {
  it('opens a restaurant card menu without the search query', () => {
    const path = restaurantMenuPath('99')
    assert.equal(path, '/restaurant/99')
    assert.equal(path.includes('query'), false)
  })

  it('opens a dish group menu with the encoded search query', () => {
    assert.equal(
      dishGroupMenuPath('42', 'chicken biryani'),
      '/restaurant/42?query=chicken%20biryani',
    )
  })
})
