import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  apiTabForRoute,
  becauseYouSearchedLabel,
  dishGroupMenuPath,
  menuQueryFromSearch,
  parseDiscoverySearch,
  restaurantMenuPath,
  searchDishAddPlan,
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

describe('searchDishAddPlan', () => {
  it('keeps a plain dish on the results page', () => {
    assert.deepEqual(searchDishAddPlan({ id: '1', name: 'Biryani' }, null), { type: 'add' })
    assert.deepEqual(
      searchDishAddPlan({ id: '1', customisable: false }, { variants: [{ id: 'size' }] }),
      { type: 'add' },
    )
  })

  it('sends a customisable dish to the menu when no choice groups are known', () => {
    assert.deepEqual(
      searchDishAddPlan({ id: '9', customisable: true }, { id: '9', name: 'Cached' }),
      { type: 'menu' },
    )
    assert.deepEqual(searchDishAddPlan({ id: '9', customisable: true }, null), { type: 'menu' })
  })

  it('opens customise when the search hit already has choice groups', () => {
    const dish = { id: '9', customisable: true, addons: [{ id: 'sauce' }] }
    assert.deepEqual(searchDishAddPlan(dish, null), { type: 'customise', dish })
  })

  it('opens customise when the menu cache already has choice groups', () => {
    const cached = { id: '9', variants: [{ id: 'size' }], addons: [] }
    const plan = searchDishAddPlan({ id: '9', customisable: true }, cached)
    assert.equal(plan.type, 'customise')
    assert.equal(plan.dish, cached)
  })
})

describe('menu query hydration', () => {
  it('reads the menu query param and builds the searched-for label', () => {
    assert.equal(menuQueryFromSearch({ query: '  chicken biryani  ' }), 'chicken biryani')
    assert.equal(menuQueryFromSearch({ q: 'biryani' }), '')
    assert.equal(becauseYouSearchedLabel('biryani'), 'Because you searched for “biryani”')
    assert.equal(becauseYouSearchedLabel('  '), '')
  })
})
